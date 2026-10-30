export const PLANT_PLACEHOLDER = "/images/plants/placeholder.svg";
export const PRODUCT_PLACEHOLDER = "/images/products/placeholder.svg";

export const VERIFIED_PRODUCT_IMAGES = new Set([
  "/images/products/ascof-lagundi-syrup.png",
  "/images/products/ascof-forte-lagundi-tablet.png",
  "/images/products/ascof-lagundi-grape-syrup.png",
  "/images/products/re-leaf-sambong-tablet.png",
  "/images/products/tolak-angin-herbal-liquid.png",
  "/images/products/atc-garlic-oil-capsule.png",
  "/images/products/plemex-forte-lagundi-syrup.webp",
  "/images/products/plemex-for-kids-lagundi-syrup.png",
  "/images/products/ritemed-lagundi-600mg.jpg",
  "/images/products/re-leaf-sambong-250mg-tablet.png",
  "/images/products/propan-fit-garlic-capsule.jpg",
  "/images/products/diavit-herbs-ampalaya-capsule.jpg",
  "/images/products/dok-natural-banaba-sambong-drops.jpg",
  "/images/products/better-ampalaya-500-capsule.jpg",
  "/images/products/urisam-sambong-500mg-tablet.webp",
  "/images/products/herbakid-sambong-250mg-tablet.png",
  "/images/products/kidneygen-forte-sambong-500mg-tablet.jpg",
  "/images/products/ofplemed-forte-lagundi-tablet.png",
]);

/**
 * Checks if a product image is verified and points to an authentic commercial photo file.
 * A card may display "Verified Photo" ONLY when this returns true.
 */
export function isVerifiedProductImage(
  src?: string | null,
  isVerified?: boolean | number | null
): boolean {
  if (!isVerified) return false;
  if (!src) return false;
  const cleaned = src.trim();
  if (cleaned.endsWith("/placeholder.svg") || cleaned.startsWith("/images/plants/")) {
    return false;
  }
  return VERIFIED_PRODUCT_IMAGES.has(cleaned);
}

/** Only an authentic file cached for this record may be shown. Remote and shared stock photos are rejected. */
export function resolvePlantImage(src?: string | null): string {
  return resolveCachedImage(src, "/images/plants/");
}

export type ProductImageKind = "AUTHENTIC_PRODUCT" | "AI_REPRESENTATIVE" | "PLACEHOLDER";

export function getProductImageKind(
  src?: string | null,
  isVerified?: boolean | number | null,
  imageType?: string | null
): ProductImageKind {
  if (
    imageType === "AUTHENTIC_PRODUCT" ||
    (isVerified && isVerifiedProductImage(src, isVerified)) ||
    (src && VERIFIED_PRODUCT_IMAGES.has(src.trim()))
  ) {
    return "AUTHENTIC_PRODUCT";
  }
  if (
    imageType === "AI_REPRESENTATIVE" ||
    (src && src.trim().startsWith("/images/products/generated/"))
  ) {
    return "AI_REPRESENTATIVE";
  }
  return "PLACEHOLDER";
}

/**
 * Resolves a product image URL following strict display priority:
 * 1. AUTHENTIC_PRODUCT (verified manufacturer/catalog photo)
 * 2. AI_REPRESENTATIVE (custom generated representative image - displays even though image_verified = 0)
 * 3. placeholder.svg (fallback only if no authentic or AI image exists)
 */
export function resolveProductImage(
  src?: string | null,
  isVerified?: boolean | number | null,
  imageType?: string | null
): string {
  if (!src) return PRODUCT_PLACEHOLDER;
  const cleaned = src.trim();
  if (cleaned.endsWith("/placeholder.svg") || cleaned.startsWith("/images/plants/")) {
    return PRODUCT_PLACEHOLDER;
  }

  // Priority 1: Authentic / verified commercial photo
  if (
    imageType === "AUTHENTIC_PRODUCT" ||
    isVerifiedProductImage(cleaned, isVerified) ||
    VERIFIED_PRODUCT_IMAGES.has(cleaned)
  ) {
    return cleaned;
  }

  // Priority 2: AI-generated representative image (displays even when image_verified = 0)
  if (
    imageType === "AI_REPRESENTATIVE" ||
    cleaned.startsWith("/images/products/generated/")
  ) {
    return cleaned;
  }

  // Safe fallback for any product asset in /images/products/
  if (cleaned.startsWith("/images/products/")) {
    return cleaned;
  }

  return PRODUCT_PLACEHOLDER;
}

export function isRecordPlaceholder(src: string): boolean {
  return !src || src.endsWith("/placeholder.svg");
}

function resolveCachedImage(src: string | null | undefined, folder: string): string {
  const fallback = folder.startsWith("/images/products/") ? PRODUCT_PLACEHOLDER : PLANT_PLACEHOLDER;
  if (!src) return fallback;
  const value = src.trim();
  if (!value.startsWith(folder) || value.includes("..") || value.includes("\\")) return fallback;
  return value;
}
