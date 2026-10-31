export interface CommunityPlantRecord {
  id: number | string;
  slug: string;
  commonName: string;
  scientificName?: string;
  category?: string;
  simpleUse?: string;
  badge?: string;
  imageUrl?: string;
  safetyNote?: string;
}

export interface CommunityProductRecord {
  id: number | string;
  slug: string;
  name: string;
  brandName?: string;
  manufacturer?: string;
  productType?: string;
  dosageForm?: string;
  imageUrl?: string;
  image_path?: string;
  image_type?: string;
  image_verified?: boolean | number;
  plantName?: string;
  plantSlug?: string;
  registrationNumber?: string;
  regulatoryAgency?: string;
}

export interface CommunitySavedGuide {
  id: number | string;
  title: string;
  category?: string;
  plantName?: string;
}

