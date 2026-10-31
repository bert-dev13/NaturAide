import React from "react";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import CommunityHomeView from "@/components/community/home/CommunityHomeView";
import {
  CommunityPlantRecord,
  CommunityProductRecord,
  CommunitySavedGuide,
} from "@/components/community/home/types";

export const instant = false;

export default async function CommunityHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/community");
  }

  // Check valid health screening in MySQL
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening?force=true");
  }

  if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    redirect("/community/guidance");
  }

  const userId = session.id;
  const firstName = session.firstName || session.name?.split(" ")[0] || "Friend";

  let popularPlants: CommunityPlantRecord[] = [];
  let herbalProducts: CommunityProductRecord[] = [];
  let savedPlants: CommunityPlantRecord[] = [];
  let savedGuides: CommunitySavedGuide[] = [];
  let savedProducts: CommunityProductRecord[] = [];

  try {
    // Fetch popular DOH/PITAHC plants from MySQL
    const [plants] = await pool.query<RowDataPacket[]>(
      `SELECT id, slug, commonName, scientificName, category, simpleUse, badge, imageUrl, safetyNote
       FROM plants WHERE is_pitahc = 1 ORDER BY commonName ASC`
    );
    popularPlants = (plants as unknown as CommunityPlantRecord[]) || [];
  } catch (err) {
    console.error("Error fetching plants for Community Home:", err);
    popularPlants = [];
  }

  try {
    // Fetch published herbal products from MySQL with linked plant and registration info
    const [products] = await pool.query<RowDataPacket[]>(
      `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.dosageForm,
              hp.imageUrl, hp.image_path, hp.image_type, hp.image_verified, hp.image_source,
              lp.plantName, lp.plantSlug,
              prr.registrationNumber, prr.regulatoryAgency
       FROM herbal_products hp
       LEFT JOIN (
         SELECT productId, MIN(registrationNumber) as registrationNumber, MIN(regulatoryAgency) as regulatoryAgency
         FROM product_regulatory_records
         GROUP BY productId
       ) prr ON hp.id = prr.productId
       LEFT JOIN (
         SELECT pp.productId, MIN(pl.commonName) as plantName, MIN(pl.slug) as plantSlug
         FROM product_plants pp
         JOIN plants pl ON pp.plantId = pl.id
         GROUP BY pp.productId
       ) lp ON hp.id = lp.productId
       WHERE hp.publicationStatus = 'PUBLISHED' AND hp.isPublished = 1
       ORDER BY hp.image_verified DESC, hp.name ASC
       LIMIT 6`
    );
    herbalProducts = (products as unknown as CommunityProductRecord[]) || [];
  } catch (err) {
    console.error("Error fetching herbal products for Community Home:", err);
    herbalProducts = [];
  }

  if (userId) {
    try {
      const [savedP] = await pool.query<RowDataPacket[]>(
        `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.badge, p.imageUrl, p.simpleUse
         FROM saved_plants sp
         JOIN plants p ON sp.plantId = p.id
         WHERE sp.userId = ?
         ORDER BY sp.createdAt DESC
         LIMIT 4`,
        [userId]
      );
      savedPlants = (savedP as unknown as CommunityPlantRecord[]) || [];

      const [savedG] = await pool.query<RowDataPacket[]>(
        `SELECT pg.id, pg.title, pg.category, p.commonName as plantName
         FROM saved_preparation_guides spg
         JOIN preparation_guides pg ON spg.guideId = pg.id
         LEFT JOIN plants p ON pg.plantId = p.id
         WHERE spg.userId = ?
         ORDER BY spg.createdAt DESC
         LIMIT 3`,
        [userId]
      );
      savedGuides = (savedG as unknown as CommunitySavedGuide[]) || [];

      const [savedPr] = await pool.query<RowDataPacket[]>(
        `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.dosageForm, hp.imageUrl, hp.image_path, hp.image_type, hp.image_verified
         FROM saved_products sp
         JOIN herbal_products hp ON sp.productId = hp.id
         WHERE sp.userId = ?
         ORDER BY sp.createdAt DESC
         LIMIT 4`,
        [userId]
      );
      savedProducts = (savedPr as unknown as CommunityProductRecord[]) || [];
    } catch (err) {
      console.error("Error fetching user saved guides:", err);
      savedPlants = [];
      savedGuides = [];
      savedProducts = [];
    }
  }

  const totalSavedCount = savedPlants.length + savedGuides.length + savedProducts.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2] text-[#0f2c20]">
      {/* 1. TOP MOBILE-APP HEADER */}
      <MobileAppHeader user={session} />

      {/* 2. MAIN REDESIGNED COMMUNITY HOME VIEW */}
      <main className="flex-1 w-full">
        <CommunityHomeView
          firstName={firstName}
          popularPlants={popularPlants}
          herbalProducts={herbalProducts}
          savedPlants={savedPlants}
          savedGuides={savedGuides}
          savedProducts={savedProducts}
          totalSavedCount={totalSavedCount}
        />
      </main>
    </div>
  );
}
