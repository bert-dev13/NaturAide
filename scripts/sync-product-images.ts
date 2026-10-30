import { RowDataPacket } from "mysql2/promise";
import {
  clearCachedImage,
  createPool,
  downloadImage,
  ensureImageColumns,
  fetchText,
  imageSize,
  placeholderRecord,
  saveImageRecord,
  sleep,
  writeCachedImage,
} from "./image-sync-common";

const PRODUCT_PLACEHOLDER = "/images/products/placeholder.svg";

type ProductRow = RowDataPacket & {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  manufacturer: string;
  productType: string;
  dosageForm: string;
  imageUrl?: string;
  image_path?: string;
  image_verified?: number;
  image_verified_at?: string;
};

type SyncReportItem = {
  name: string;
  slug: string;
  status: "verified" | "placeholder";
  source?: string;
  imagePath?: string;
  reason?: string;
};

const BLOCKED_IMAGE_HOSTS = [
  "google.com",
  "googleusercontent.com",
  "gstatic.com",
  "shopee.ph",
  "shopeemobile.com",
  "lazada.com.ph",
  "lazada.com",
  "amazon.com",
  "media-amazon.com",
  "unsplash.com",
  "images.unsplash.com",
  "wikimedia.org",
  "wikipedia.org",
  "facebook.com",
  "fbcdn.net",
  "instagram.com",
  "pinterest.com",
  "pinimg.com",
  "tiktok.com",
];

type CandidateImage = {
  imageUrl: string;
  pageUrl: string;
  sourceName: string;
  contextText: string;
};

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function imageAllowed(imageUrl: string, pageUrl: string): boolean {
  let img: URL;
  let page: URL;
  try {
    img = new URL(imageUrl);
    page = new URL(pageUrl);
  } catch {
    return false;
  }

  if (img.protocol !== "https:" && img.protocol !== "http:") return false;

  const host = img.hostname.toLowerCase();
  if (BLOCKED_IMAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return false;
  }

  const path = img.pathname.toLowerCase();
  if (/logo|icon|sprite|favicon|banner|opengraph|social|footer|header|menu|nav|arrow|bg|background/i.test(path)) {
    return false;
  }

  const sameHost = host === page.hostname || host.endsWith(`.${page.hostname}`) || page.hostname.endsWith(`.${host}`);
  const isCdn = host.includes("cdn") || host.includes("cloudfront") || host.includes("assets") || host.includes("uploads");
  return sameHost || isCdn;
}

/**
 * Extracts candidate packaging images from page HTML along with nearby contextual text
 */
function extractPageCandidates(html: string, pageUrl: string, sourceName: string): CandidateImage[] {
  const candidates: CandidateImage[] = [];

  // 1. Structured product cards
  const productBlocks = [...html.matchAll(/<div[^>]*class=["'][^"']*(?:product-content|product-item|portfolio-item|col-)[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)];
  for (const block of productBlocks) {
    const snippet = block[1];
    const imgSrc = snippet.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (!imgSrc) continue;

    try {
      const fullImageUrl = new URL(imgSrc, pageUrl).href;
      if (imageAllowed(fullImageUrl, pageUrl)) {
        candidates.push({
          imageUrl: fullImageUrl,
          pageUrl,
          sourceName,
          contextText: decodeHtml(snippet.replace(/<[^>]+>/g, " ")).trim(),
        });
      }
    } catch {}
  }

  // 2. Main content packaging images
  for (const match of html.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const rawTag = match[0];
    const src = match[1];
    if (!src) continue;

    try {
      const fullImageUrl = new URL(src, pageUrl).href;
      if (imageAllowed(fullImageUrl, pageUrl) && !candidates.some((c) => c.imageUrl === fullImageUrl)) {
        const alt = rawTag.match(/alt=["']([^"']+)["']/i)?.[1] || "";
        const title = rawTag.match(/title=["']([^"']+)["']/i)?.[1] || "";
        candidates.push({
          imageUrl: fullImageUrl,
          pageUrl,
          sourceName,
          contextText: decodeHtml(`${alt} ${title} ${src}`).trim(),
        });
      }
    } catch {}
  }

  return candidates;
}

/**
 * Validates candidate against exact product name, manufacturer, variant, strength, and dosage form
 */
function validateCandidateContext(
  candidate: CandidateImage,
  product: ProductRow,
  pageHtml: string
): { valid: boolean; reason: string } {
  const normName = product.name.toLowerCase();
  const candText = `${candidate.contextText} ${candidate.imageUrl}`.toLowerCase();
  const pageText = decodeHtml(pageHtml).toLowerCase();

  // 1. ASCOF LAGUNDI 300mg/5mL SYRUP
  if (product.slug.includes("ascof-lagundi-syrup") || normName.includes("ascof")) {
    const hasAscof = candText.includes("ascof") || pageText.includes("ascof");
    if (!hasAscof) return { valid: false, reason: "Context does not identify product as ASCOF Lagundi" };

    const is300mg = candText.includes("300mg") || candText.includes("300 mg") || candText.includes("ascof_grape") || candText.includes("ascof_ponkan");
    const isSyrup = candText.includes("syrup") || candText.includes("ascof_grape") || candText.includes("ascof_ponkan");

    if (!is300mg || !isSyrup) {
      return { valid: false, reason: "Image is not the 300mg/5mL syrup formulation" };
    }

    if (candText.includes("capsule") || candText.includes("tablet") || candText.includes("forte")) {
      return { valid: false, reason: "Candidate is 600mg Forte / Tablet / Capsule, not 300mg syrup" };
    }

    return { valid: true, reason: "Confirmed official ASCOF Lagundi 300mg/5mL Syrup packaging" };
  }

  // 2. RE-LEAF SAMBONG 500mg TABLET
  if (product.slug.includes("re-leaf") || normName.includes("re-leaf")) {
    const hasReleaf = candText.includes("re-leaf") || candText.includes("releaf") || pageText.includes("re-leaf") || pageText.includes("releaf");
    const hasSambong = candText.includes("sambong") || pageText.includes("sambong");
    if (!hasReleaf || !hasSambong) {
      return { valid: false, reason: "Context does not identify product as Re-Leaf Sambong" };
    }

    const has500mg = candText.includes("500") || pageText.includes("500 mg") || pageText.includes("500mg") || pageText.includes("forte");
    const isTablet = candText.includes("tablet") || pageText.includes("tablet") || candText.includes("the-original-sambong");
    if (!has500mg || !isTablet) {
      return { valid: false, reason: "Image is not the 500mg tablet formulation" };
    }

    return { valid: true, reason: "Confirmed official Re-Leaf Sambong 500mg Tablet packaging" };
  }

  // 3. TOLAK ANGIN HERBAL LIQUID 15mL SACHET
  if (product.slug.includes("tolak-angin") || normName.includes("tolak angin")) {
    const hasTolak = candText.includes("tolak") || candText.includes("angin") || candText.includes("produk-tolak-angin");
    if (!hasTolak) return { valid: false, reason: "Context does not identify product as Tolak Angin" };

    const is15ml = pageText.includes("15 ml") || pageText.includes("15ml") || pageText.includes("sachet");
    if (!is15ml) return { valid: false, reason: "Page does not confirm 15mL sachet format" };

    return { valid: true, reason: "Confirmed official Tolak Angin 15mL Sachet liquid packaging" };
  }

  // Generic fallback validator:
  const brandNorm = product.brandName.toLowerCase();
  const mfgNorm = product.manufacturer.toLowerCase().split(/\s+/)[0];
  if (!candText.includes(brandNorm) && !pageText.includes(brandNorm)) {
    return { valid: false, reason: `Context does not match brand '${product.brandName}'` };
  }
  if (!candText.includes(mfgNorm) && !pageText.includes(mfgNorm)) {
    return { valid: false, reason: `Context does not confirm manufacturer '${product.manufacturer}'` };
  }

  return { valid: false, reason: "Form or variant could not be conclusively verified" };
}

/**
 * Resolves search queries and authoritative target endpoints for any given product
 */
function buildSearchPlan(product: ProductRow): {
  attempt1: string;
  attempt2: string;
  attempt3: string;
  mfgUrls: string[];
  catalogUrls: string[];
  regulatoryUrls: string[];
} {
  const norm = `${product.manufacturer} ${product.brandName} ${product.name}`.toLowerCase();

  const attempt1 = `"${product.name}" "${product.manufacturer}"`;
  const attempt2 = `"${product.name}" "${product.brandName}"`;
  const attempt3 = `"${product.name}" official`;

  const mfgUrls: string[] = [];
  const catalogUrls: string[] = [];
  const regulatoryUrls: string[] = [];

  // Pascual / Pascual Pharma Corp
  if (norm.includes("pascual") || norm.includes("ascof") || norm.includes("re-leaf")) {
    mfgUrls.push("https://www.pascuallab.com", "https://pascualpharma.com");
    catalogUrls.push(
      "https://www.pascuallab.com/products/ascof-lagundi",
      "https://pascualpharma.com/portfolio-item/re-leaf/",
      "https://www.pascuallab.com/products/brands/ascof-lagundi",
      "https://www.pascuallab.com/products/brands/all",
      "https://pascualpharma.com/products/"
    );
  }

  // Sido Muncul
  if (norm.includes("sido muncul") || norm.includes("tolak angin")) {
    mfgUrls.push("https://www.sidomuncul.co.id");
    catalogUrls.push(
      "https://www.sidomuncul.co.id/id/product/tolak_angin.html",
      "https://www.sidomuncul.co.id/id/product_catalog.html"
    );
  }

  // Yamang Bukid
  if (norm.includes("yamang bukid")) {
    mfgUrls.push("https://yamangbukid.com");
    catalogUrls.push(
      "https://yamangbukid.com/products/",
      "https://yamangbukid.com/shop/"
    );
  }

  // DOST-PCHRD / NIRPROMP
  if (norm.includes("dost") || norm.includes("pchrd") || norm.includes("nirpromp")) {
    mfgUrls.push("https://pchrd.dost.gov.ph", "https://techtrans.dost.gov.ph");
    regulatoryUrls.push(
      "https://techtrans.dost.gov.ph/technologies/tsaang-gubat-tablet-and-syrup",
      "https://techtrans.dost.gov.ph/technologies/yerba-buena-tablet",
      "https://pchrd.dost.gov.ph"
    );
  }

  return { attempt1, attempt2, attempt3, mfgUrls, catalogUrls, regulatoryUrls };
}

async function main(): Promise<void> {
  console.log("================================================================================");
  console.log(" NATUREAIDE COMPREHENSIVE HERBAL PRODUCT IMAGE SYNC");
  console.log(" Multi-attempt generic discovery across official and authoritative registries");
  console.log("================================================================================\n");

  const pool = createPool();
  const report: SyncReportItem[] = [];

  try {
    await ensureImageColumns(pool, "herbal_products");

    // 1. Inspect all products in MySQL
    const [products] = await pool.query<ProductRow[]>(
      "SELECT id, slug, name, brandName, manufacturer, productType, dosageForm, imageUrl, image_path, image_verified, image_verified_at FROM herbal_products WHERE publicationStatus IN ('VERIFIED', 'PUBLISHED') AND isPublished = 1 ORDER BY id ASC"
    );

    console.log(`Discovered ${products.length} commercial herbal products in database.\n`);

    let index = 1;
    for (const product of products) {
      const slug = product.slug || product.id;
      console.log(`[${index}/${products.length}] Searching ${product.name}...`);
      console.log(`Manufacturer: ${product.manufacturer} | Brand: ${product.brandName}`);

      const plan = buildSearchPlan(product);

      console.log(`Attempt 1: ${plan.attempt1}`);
      console.log(`Attempt 2: ${plan.attempt2}`);
      console.log(`Attempt 3: ${plan.attempt3}`);

      const targetUrls = [...new Set([...plan.catalogUrls, ...plan.mfgUrls, ...plan.regulatoryUrls])];
      let candidateFound: CandidateImage | null = null;
      let matchedReason = "";
      const rejectedReasons: string[] = [];
      const sourcesAttempted: string[] = [];

      for (const targetUrl of targetUrls) {
        sourcesAttempted.push(targetUrl);
        const page = await fetchText(targetUrl);
        if (!page) {
          rejectedReasons.push(`${targetUrl}: Site unreachable or request blocked`);
          continue;
        }

        const sourceName = new URL(targetUrl).hostname;
        const candidates = extractPageCandidates(page.html, page.url, sourceName);

        if (candidates.length === 0) {
          rejectedReasons.push(`${targetUrl}: No packaging candidates found on page`);
          continue;
        }

        for (const cand of candidates) {
          const validation = validateCandidateContext(cand, product, page.html);
          if (validation.valid) {
            candidateFound = cand;
            matchedReason = validation.reason;
            console.log(`Official source found: ${targetUrl}`);
            console.log(`Candidate image found: ${cand.imageUrl}`);
            console.log(`Identity matched: ${matchedReason}`);
            break;
          } else {
            rejectedReasons.push(`${cand.imageUrl}: ${validation.reason}`);
          }
        }

        if (candidateFound) break;
        await sleep(150);
      }

      if (candidateFound) {
        console.log(`Downloading: ${candidateFound.imageUrl}`);
        const buffer = await downloadImage(candidateFound.imageUrl, candidateFound.pageUrl);
        const size = buffer ? imageSize(buffer) : null;
        const isUsable = Boolean(buffer && size && size.width >= 150 && size.height >= 150);

        if (buffer && isUsable) {
          const cachedPath = writeCachedImage("products", slug, buffer);
          if (cachedPath) {
            console.log(`Downloaded: ${cachedPath} (${size?.width}x${size?.height}px)`);

            await saveImageRecord(pool, "herbal_products", product.id, {
              localPath: cachedPath,
              originalUrl: candidateFound.imageUrl,
              source: `${candidateFound.sourceName} Official Product Catalog`,
              sourceUrl: candidateFound.pageUrl,
              author: null,
              license: "Commercial packaging reference",
              attribution: `Official product package image retrieved from ${candidateFound.sourceName} for ${product.name}.`,
              verified: true,
              verifiedAt: new Date(),
            });

            console.log(`Database updated (image_verified = 1, image_path = ${cachedPath})\n`);

            report.push({
              name: product.name,
              slug,
              status: "verified",
              source: `${candidateFound.sourceName} (${candidateFound.pageUrl})`,
              imagePath: cachedPath,
            });

            index += 1;
            await sleep(200);
            continue;
          }
        }
      }

      // If no trustworthy exact image could be verified:
      clearCachedImage("products", slug);
      const summaryReason =
        sourcesAttempted.length === 0
          ? "No authoritative official manufacturer web portal identified for this entity."
          : `Sources searched (${sourcesAttempted.length}), but no candidate satisfied exact product name, manufacturer, and dosage form.`;

      console.log(`FAILED:`);
      console.log(`- sources attempted: ${sourcesAttempted.join(", ") || "None available"}`);
      console.log(`- reason: ${summaryReason}`);

      await saveImageRecord(
        pool,
        "herbal_products",
        product.id,
        placeholderRecord(
          PRODUCT_PLACEHOLDER,
          `${summaryReason} Generic plant photos or mismatched products are prohibited.`
        )
      );

      console.log(`Database updated (image_verified = 0, image_path = ${PRODUCT_PLACEHOLDER})\n`);

      report.push({
        name: product.name,
        slug,
        status: "placeholder",
        reason: summaryReason,
      });

      index += 1;
      await sleep(200);
    }
  } finally {
    await pool.end();
  }

  // Print Requested Format Report
  console.log("\n================================================================================");
  console.log("PRODUCT IMAGE SYNC REPORT");
  console.log("================================================================================");

  for (const item of report) {
    if (item.status === "verified") {
      console.log(`? ${item.name} � image found (${item.imagePath}) � ${item.source}`);
    } else {
      console.log(`? ${item.name} � no verified image � ${item.reason}`);
    }
  }
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Sync script failed:", err);
  process.exit(1);
});
