export interface SavedPlantItem {
  id: string | number;
  slug?: string;
  commonName: string;
  scientificName?: string;
  category?: string;
  simpleUse?: string;
  imageUrl?: string | null;
  savedAt?: string;
}

export interface SavedProductItem {
  id: string | number;
  slug?: string;
  name: string;
  brandName?: string | null;
  manufacturer?: string | null;
  dosageForm?: string | null;
  plantName?: string | null;
  imageUrl?: string | null;
  image_path?: string | null;
  image_type?: "AUTHENTIC_PRODUCT" | "AI_REPRESENTATIVE" | null;
  image_verified?: boolean | number | null;
  productClassification?: string | null;
  savedAt?: string;
}

export interface SavedGuideItem {
  id: string | number;
  title: string;
  category?: string;
  plantId?: string | null;
  plantSlug?: string | null;
  plantName?: string | null;
  description?: string | null;
  whatYouNeed?: string | null;
  preparationSteps?: string | null;
  importantReminders?: string | null;
  storageGuidance?: string | null;
  safetyInformation?: string | null;
  savedAt?: string;
}

