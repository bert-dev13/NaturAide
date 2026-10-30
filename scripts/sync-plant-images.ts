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

const PLANT_PLACEHOLDER = "/images/plants/placeholder.svg";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

type PlantRow = RowDataPacket & {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
};

type CommonsFile = {
  title: string;
  url: string;
  mime: string;
  width: number;
  height: number;
  description: string;
  categories: string;
  author: string;
  license: string;
  pageUrl: string;
};

type VerifiedPlantImage = {
  fileUrl: string;
  pageUrl: string;
  author: string;
  license: string;
  category: string;
  allowedNames: string[];
};

type ReportRow = {
  slug: string;
  scientificName: string;
  status: "verified" | "placeholder";
  detail: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function taxonNames(entity: Record<string, unknown>): string[] {
  const claims = entity.claims as Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>> | undefined;
  return (claims?.P225 || [])
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value): value is string => typeof value === "string");
}

function entityNames(entity: Record<string, unknown>): string[] {
  const labels = entity.labels as { en?: { value?: string } } | undefined;
  const aliases = entity.aliases as { en?: Array<{ value?: string }> } | undefined;
  return [labels?.en?.value, ...(aliases?.en || []).map((alias) => alias.value), ...taxonNames(entity)].filter(
    (value): value is string => Boolean(value)
  );
}

function claimString(entity: Record<string, unknown>, property: string): string | null {
  const claims = entity.claims as Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>> | undefined;
  const value = claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function commonsCategory(entity: Record<string, unknown>): string | null {
  return claimString(entity, "P373");
}

function wikidataImage(entity: Record<string, unknown>): string | null {
  return claimString(entity, "P18");
}

function namesMatch(entity: Record<string, unknown>, scientificName: string): boolean {
  const target = scientificName.trim().toLowerCase();
  return entityNames(entity).some((name) => name.trim().toLowerCase() === target);
}

async function wikidataEntity(scientificName: string): Promise<Record<string, unknown> | null> {
  const searchUrl = `${WIKIDATA_API}?${new URLSearchParams({
    action: "wbsearchentities",
    search: scientificName,
    language: "en",
    type: "item",
    format: "json",
    limit: "8",
  })}`;
  const search = await fetchText(searchUrl);
  if (!search) return null;
  const payload = JSON.parse(search.html) as { search?: Array<{ id?: string }> };
  const ids = (payload.search || []).map((item) => item.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return null;

  const entityUrl = `${WIKIDATA_API}?${new URLSearchParams({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "claims|labels|aliases",
    languages: "en",
    format: "json",
  })}`;
  const entityResponse = await fetchText(entityUrl);
  if (!entityResponse) return null;
  const entities = (JSON.parse(entityResponse.html) as { entities?: Record<string, Record<string, unknown>> }).entities || {};

  const matches = Object.values(entities).filter((entity) => namesMatch(entity, scientificName));
  matches.sort((a, b) => scoreEntity(b, scientificName) - scoreEntity(a, scientificName));
  return matches[0] || null;
}

function scoreEntity(entity: Record<string, unknown>, scientificName: string): number {
  const target = scientificName.toLowerCase();
  let score = 0;
  if (taxonNames(entity).some((name) => name.toLowerCase() === target)) score += 5;
  const label = ((entity.labels as { en?: { value?: string } } | undefined)?.en?.value || "").toLowerCase();
  if (label === target) score += 3;
  if (commonsCategory(entity)) score += 2;
  return score;
}

async function categoryExists(category: string): Promise<boolean> {
  const url = `${COMMONS_API}?${new URLSearchParams({
    action: "query",
    titles: `Category:${category}`,
    format: "json",
  })}`;
  const response = await fetchText(url);
  if (!response) return false;
  const pages = (JSON.parse(response.html) as { query?: { pages?: Record<string, { pageid?: number }> } }).query?.pages || {};
  return Object.values(pages).some((page) => typeof page.pageid === "number");
}

async function fileByTitle(title: string): Promise<CommonsFile | null> {
  const url = `${COMMONS_API}?${new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
    format: "json",
  })}`;
  const response = await fetchText(url);
  if (!response) return null;
  const pages = (JSON.parse(response.html) as { query?: { pages?: Record<string, CommonsPage> } }).query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page?.title || page.title.startsWith("File:") === false) return null;
  return toCommonsFile(page);
}

async function categoryFiles(category: string): Promise<CommonsFile[]> {
  const url = `${COMMONS_API}?${new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: `Category:${category}`,
    gcmtype: "file",
    gcmlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
    format: "json",
  })}`;
  const response = await fetchText(url);
  if (!response) return [];
  const pages = (JSON.parse(response.html) as { query?: { pages?: Record<string, CommonsPage> } }).query?.pages || {};
  return Object.values(pages).map(toCommonsFile).filter((file): file is CommonsFile => Boolean(file));
}

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    mime?: string;
    size?: number;
    width?: number;
    height?: number;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }>;
};

function toCommonsFile(page: CommonsPage): CommonsFile | null {
  const info = page.imageinfo?.[0];
  const title = page.title || "";
  if (!info || !title.startsWith("File:")) return null;
  const mime = info.mime || "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return null;
  const metadata = info.extmetadata || {};
  return {
    title,
    url: info.thumburl || info.url || "",
    mime,
    width: info.width || 0,
    height: info.height || 0,
    description: stripHtml(metadata.ImageDescription?.value || metadata.ObjectName?.value || ""),
    categories: stripHtml(metadata.Categories?.value || ""),
    author: stripHtml(metadata.Artist?.value || ""),
    license: stripHtml(metadata.LicenseShortName?.value || ""),
    pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

function licenseOk(license: string): boolean {
  const value = license.toLowerCase();
  if (!value || /non-free|all rights reserved|copyrighted|fair use/.test(value)) return false;
  return /cc0|cc-|cc |creative commons|public domain|gfdl|attribution/.test(value);
}

function binomials(text: string): string[] {
  return text.replace(/_/g, " ").match(/\b[A-Z][a-z]{2,}\s+[a-z]{3,}\b/g) || [];
}

function looksLikeSpeciesEpithet(word: string): boolean {
  const english = new Set([
    "plant", "plants", "field", "fields", "with", "from", "flower", "flowers", "leaf", "leaves",
    "root", "roots", "closeup", "close", "view", "garden", "gardens", "photo", "image", "images",
    "wild", "fresh", "dried", "yellow", "green", "white", "black", "young", "mature", "growing",
    "crop", "crops", "farm", "tree", "trees", "shrub", "herb", "herbs", "bloom", "forest", "park",
  ]);
  if (english.has(word)) return false;
  return word.length >= 4 && /(?:a|um|us|is|ii|ae|ensis|oides|e)$/.test(word);
}

function fileMatchesSpecies(file: CommonsFile, allowedNames: string[]): boolean {
  const caption = `${file.title} ${file.description}`.toLowerCase();
  const categories = file.categories.toLowerCase();
  if (/\b(distribution map|range map|locator map|icon|logo|diagram|molecule|chemical structure|structural formula|coat of arms|illustration|drawing|painting|artwork)\b/.test(caption)) {
    return false;
  }
  if (/distribution map|locator map|range map/.test(categories)) return false;
  if (file.width < 400 || file.height < 300 || !file.url || !licenseOk(file.license)) return false;
  const allowed = new Set(allowedNames.map((name) => name.toLowerCase()));
  for (const binomial of binomials(file.title.replace(/_/g, " "))) {
    const normalized = binomial.toLowerCase();
    const epithet = normalized.split(/\s+/)[1] || "";
    if (!looksLikeSpeciesEpithet(epithet)) continue;
    if (!allowed.has(normalized)) return false;
  }
  return true;
}

async function findVerifiedPlantImage(scientificName: string): Promise<VerifiedPlantImage | null> {
  const entity = await wikidataEntity(scientificName);
  const allowedNames = entity ? Array.from(new Set(entityNames(entity))) : [scientificName];
  if (!allowedNames.some((name) => name.toLowerCase() === scientificName.toLowerCase())) return null;
  const category = entity ? commonsCategory(entity) : null;
  if (category) allowedNames.push(category);

  const candidates = category && (await categoryExists(category)) ? [category] : [];
  if (!candidates.includes(scientificName) && (await categoryExists(scientificName))) {
    candidates.push(scientificName);
  }

  let best: CommonsFile | null = null;
  let bestCategory = candidates[0] || scientificName;
  let bestScore = -1;
  for (const candidate of candidates) {
    const files = (await categoryFiles(candidate)).filter((file) => fileMatchesSpecies(file, allowedNames));
    const named = files.filter((file) =>
      allowedNames.some((name) => file.title.toLowerCase().replace(/_/g, " ").includes(name.toLowerCase()))
    );
    for (const file of named.length > 0 ? named : files) {
      const score = file.width * file.height + (named.includes(file) ? 5_000_000 : 0);
      if (score > bestScore) {
        best = file;
        bestCategory = candidate;
        bestScore = score;
      }
    }
    await sleep(250);
  }

  if (!best && entity && wikidataImage(entity)) {
    const titled = await fileByTitle(`File:${wikidataImage(entity)}`);
    if (titled && fileMatchesSpecies(titled, allowedNames)) {
      best = titled;
      bestCategory = category || scientificName;
    }
  }

  if (!best) return null;
  return {
    fileUrl: best.url,
    pageUrl: best.pageUrl,
    author: best.author || "Author not recorded on Wikimedia Commons",
    license: best.license,
    category: bestCategory,
    allowedNames,
  };
}

async function main(): Promise<void> {
  const pool = createPool();
  const report: ReportRow[] = [];
  try {
    await ensureImageColumns(pool, "plants");
    const [plants] = await pool.query<PlantRow[]>("SELECT id, slug, commonName, scientificName FROM plants ORDER BY commonName");
    const only = process.argv[2]?.toLowerCase();
    const selected = only
      ? plants.filter((plant) => plant.slug.toLowerCase() === only || plant.scientificName.toLowerCase() === only)
      : plants;

    for (const plant of selected) {
      const slug = plant.slug || plant.id;
      try {
        const verified = await findVerifiedPlantImage(plant.scientificName);
        if (!verified) {
          clearCachedImage("plants", slug);
          await saveImageRecord(
            pool,
            "plants",
            plant.id,
            placeholderRecord(
              PLANT_PLACEHOLDER,
              `No species-matched photograph was confirmed for ${plant.scientificName}. NatureAide is showing its botanical placeholder instead of another plant.`
            )
          );
          report.push({ slug, scientificName: plant.scientificName, status: "placeholder", detail: "No species-matched Wikimedia Commons photograph" });
          console.log(`placeholder  ${plant.scientificName}`);
          continue;
        }

        const buffer = await downloadImage(verified.fileUrl);
        const size = buffer ? imageSize(buffer) : null;
        const localPath = buffer && size && size.width >= 400 && size.height >= 300 ? writeCachedImage("plants", slug, buffer) : null;
        if (!localPath) {
          clearCachedImage("plants", slug);
          await saveImageRecord(
            pool,
            "plants",
            plant.id,
            placeholderRecord(PLANT_PLACEHOLDER, `A Commons candidate for ${plant.scientificName} could not be saved as a verified photograph.`)
          );
          report.push({ slug, scientificName: plant.scientificName, status: "placeholder", detail: "Candidate image failed download or size check" });
          console.log(`placeholder  ${plant.scientificName} (download rejected)`);
          continue;
        }

        const attribution = `${verified.author}. ${verified.license}. Species checked against Wikimedia Commons category "${verified.category}" for ${plant.scientificName}. ${verified.pageUrl}`;
        await saveImageRecord(pool, "plants", plant.id, {
          localPath,
          originalUrl: verified.pageUrl,
          source: "Wikimedia Commons",
          author: verified.author,
          license: verified.license,
          attribution,
          verified: true,
          verifiedAt: new Date(),
        });
        report.push({ slug, scientificName: plant.scientificName, status: "verified", detail: localPath });
        console.log(`verified     ${plant.scientificName} -> ${localPath}`);
      } catch (error) {
        clearCachedImage("plants", slug);
        await saveImageRecord(
          pool,
          "plants",
          plant.id,
          placeholderRecord(PLANT_PLACEHOLDER, `Image lookup for ${plant.scientificName} did not return a verified photograph.`)
        );
        const message = error instanceof Error ? error.message : "lookup failed";
        report.push({ slug, scientificName: plant.scientificName, status: "placeholder", detail: message });
        console.log(`placeholder  ${plant.scientificName} (${message})`);
      }
      await sleep(400);
    }
  } finally {
    await pool.end();
  }

  const verified = report.filter((row) => row.status === "verified");
  const placeholders = report.filter((row) => row.status === "placeholder");
  console.log("\nPLANT IMAGE REPORT");
  console.log(`Verified ${verified.length} / Placeholder ${placeholders.length}`);
  for (const row of report) console.log(`- ${row.status}\t${row.slug}\t${row.scientificName}\t${row.detail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
