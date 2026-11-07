import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolvePlantImage } from "@/lib/record-images";
import {
  getBotanicalPlantRecord,
  getAllBotanicalPlants,
} from "@/lib/botanical-registry";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    const [plants]: any = await pool.query(
      `SELECT id, slug, commonName, scientificName, category, is_pitahc,
              local_names, plant_parts_used, COALESCE(local_image_path, imageUrl) as imageUrl
       FROM plants
       ORDER BY is_pitahc DESC, commonName ASC`
    );

    const plantMap = new Map<string, any>();

    for (const p of plants) {
      const reg = getBotanicalPlantRecord(p.id) || getBotanicalPlantRecord(p.commonName);
      plantMap.set(p.id, {
        id: p.id,
        slug: p.slug || p.id,
        commonName: p.commonName,
        scientificName: p.scientificName,
        family: reg?.family || "Not documented",
        localNames: reg?.localNames || p.local_names || "Not documented",
        category: p.category || reg?.category || "Medicinal Plant",
        isPitahc: Boolean(p.is_pitahc || reg?.isPitahc),
        documentedParts: reg?.documentedParts || (p.plant_parts_used ? [p.plant_parts_used] : ["Leaves"]),
        imageUrl: resolvePlantImage(p.imageUrl || reg?.imageUrl || "/images/placeholder-plant.jpg"),
        botanicalSynonyms: reg?.botanicalSynonyms || "Not documented",
      });
    }

    for (const reg of getAllBotanicalPlants()) {
      if (!plantMap.has(reg.id)) {
        plantMap.set(reg.id, {
          id: reg.id,
          slug: reg.slug,
          commonName: reg.commonName,
          scientificName: reg.scientificName,
          family: reg.family,
          localNames: reg.localNames,
          category: reg.category,
          isPitahc: reg.isPitahc,
          documentedParts: reg.documentedParts,
          imageUrl: resolvePlantImage(reg.imageUrl),
          botanicalSynonyms: reg.botanicalSynonyms,
        });
      }
    }

    let all = Array.from(plantMap.values());

    if (q) {
      all = all.filter((p) => {
        return (
          p.commonName.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          p.localNames.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          p.botanicalSynonyms.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
    }

    return NextResponse.json({ success: true, plants: all });
  } catch (error) {
    console.error("Error fetching researcher plants catalog:", error);
    return NextResponse.json({ error: "Failed to fetch medicinal plants" }, { status: 500 });
  }
}
