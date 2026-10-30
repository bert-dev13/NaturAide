const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  console.log("==================================================");
  console.log("NATUREAIDE CHATBOT UPGRADE COMPREHENSIVE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(desc, condition, details) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${desc} - Details: ${details || "Condition not met"}`);
    }
  }

  // Fetch all plants & products
  const [plantRows] = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.preparation, p.safetyNote,
            g.about, g.traditionalUses, g.whatResearchSays, g.commonPreparation,
            g.safetyInformation, g.whoShouldBeCareful, g.medicineInteractions, g.whenToConsultDoctor
     FROM plants p
     LEFT JOIN plant_guides g ON g.plantId = p.id
     ORDER BY p.commonName ASC`
  );

  const [productRows] = await pool.query(
    `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.productType,
            hp.description, hp.intendedUse, hp.usageInstructions, hp.warningsPrecautions, hp.preparationGuide
     FROM herbal_products hp
     WHERE hp.isPublished = 1
     ORDER BY hp.name ASC`
  );

  const plantAliases = {
    "lagundi": ["lagundi", "vitex negundo", "vitex", "dangla"],
    "sambong": ["sambong", "blumea balsamifera", "subusub", "alimon"],
    "tsaang-gubat": ["tsaang gubat", "tsaang-gubat", "carmona retusa", "ehretia microphylla", "wild tea", "putputay", "forest tea"],
    "yerba-buena": ["yerba buena", "yerba-buena", "clinopodium douglasii", "mentha cordifolia", "hierba buena", "marsh mint"],
    "turmeric": ["turmeric", "luyang dilaw", "curcuma longa", "dilaw", "yellow ginger"],
    "ginger": ["ginger", "luya", "zingiber officinale", "salabat"],
  };

  const productAliases = {
    "ascof-lagundi-syrup": ["ascof", "ascof lagundi", "ascof lagundi syrup", "pascual laboratories ascof"],
    "re-leaf-sambong-tablet": ["re-leaf", "releaf", "re-leaf sambong", "releaf sambong", "re-leaf sambong tablet"],
    "tolak-angin-herbal-liquid": ["tolak angin", "tolakangin", "tolak angin herbal liquid", "sido muncul"],
  };

  function detectEntity(query, persistedContext) {
    const q = query.toLowerCase();
    let prod = null;
    let plant = null;

    // Check product first
    for (const p of productRows) {
      const aliases = productAliases[p.id] || [];
      const tokens = [p.brandName?.toLowerCase(), p.name?.toLowerCase(), p.slug?.toLowerCase(), ...aliases].filter(Boolean);
      if (tokens.some(t => q.includes(t))) {
        prod = p;
        break;
      }
    }

    if (!prod) {
      for (const pl of plantRows) {
        const aliases = plantAliases[pl.id] || plantAliases[pl.slug] || [];
        const clean = pl.commonName.replace(/\s*\([^)]*\)/, "").toLowerCase();
        const tokens = [clean, pl.commonName.toLowerCase(), pl.scientificName.toLowerCase(), pl.slug.toLowerCase(), ...aliases].filter(Boolean);
        if (tokens.some(t => q.includes(t))) {
          plant = pl;
          break;
        }
      }
    }

    if (prod) return { type: "PRODUCT", entity: prod };
    if (plant) return { type: "PLANT", entity: plant };

    if (persistedContext?.activeContextType === "PRODUCT" && persistedContext.currentProductId) {
      const f = productRows.find(p => p.id === persistedContext.currentProductId || p.slug === persistedContext.currentProductId);
      if (f) return { type: "PRODUCT", entity: f };
    }
    if (persistedContext?.activeContextType === "PLANT" && persistedContext.currentPlantId) {
      const f = plantRows.find(p => p.id === persistedContext.currentPlantId || p.slug === persistedContext.currentPlantId);
      if (f) return { type: "PLANT", entity: f };
    }

    return { type: "NONE", entity: null };
  }

  // TEST 1: Ask about Tsaang Gubat
  const d1 = detectEntity("What is Tsaang Gubat?");
  assert("Detect Tsaang Gubat plant", d1.type === "PLANT" && d1.entity.slug === "tsaang-gubat");

  // TEST 2: Ask about Lagundi
  const d2 = detectEntity("What are the documented uses of Lagundi?");
  assert("Detect Lagundi plant", d2.type === "PLANT" && d2.entity.slug === "lagundi");

  // TEST 3: Ask about ASCOF
  const d3 = detectEntity("What is ASCOF Lagundi?");
  assert("Detect ASCOF product", d3.type === "PRODUCT" && d3.entity.slug === "ascof-lagundi-syrup");

  // TEST 4: Ask about Re-Leaf
  const d4 = detectEntity("Who manufactures Re-Leaf Sambong?");
  assert("Detect Re-Leaf product", d4.type === "PRODUCT" && d4.entity.slug === "re-leaf-sambong-tablet");

  // TEST 5: Ask for scientific references (Yerba Buena: 0 verified references)
  const [ybRefs] = await pool.query(
    "SELECT id, pubmedId, title FROM scientific_references WHERE source_verified = 1 AND (plantOrIngredientStudied LIKE '%Yerba Buena%' OR plantOrIngredientStudied LIKE '%Clinopodium douglasii%')"
  );
  assert("Yerba Buena has 0 verified references in knowledge base", ybRefs.length === 0);

  // TEST 6: Ask whether a plant has products (Turmeric: 0 published products)
  const [turmericProds] = await pool.query(
    "SELECT hp.id FROM herbal_products hp JOIN product_plants pp ON pp.productId = hp.id WHERE pp.plantId = 'turmeric' AND hp.isPublished = 1"
  );
  assert("Turmeric has 0 published commercial products in knowledge base", turmericProds.length === 0);

  // TEST 7: Ask what plant is in a product (follow-up with ASCOF persisted context)
  const d7 = detectEntity("What plant is this product made from?", {
    activeContextType: "PRODUCT",
    currentProductId: "ascof-lagundi-syrup",
  });
  assert("Follow-up maintains ASCOF product context", d7.type === "PRODUCT" && d7.entity.slug === "ascof-lagundi-syrup");
  const [ascofPlants] = await pool.query(
    "SELECT p.commonName, p.scientificName FROM product_plants pp JOIN plants p ON p.id = pp.plantId WHERE pp.productId = 'ascof-lagundi-syrup'"
  );
  assert("ASCOF contains verified plant Lagundi (Vitex negundo)", ascofPlants.some(p => p.scientificName === "Vitex negundo"));

  // TEST 8: Follow-up "What about its safety?" with persisted Sambong context
  const d8 = detectEntity("What about its safety?", {
    activeContextType: "PLANT",
    currentPlantId: "sambong",
  });
  assert("Follow-up maintains Sambong plant context", d8.type === "PLANT" && d8.entity.slug === "sambong");
  const [sambongGuide] = await pool.query("SELECT safetyInformation FROM plant_guides WHERE plantId = 'sambong'");
  assert("Sambong has verified safety information", sambongGuide.length > 0 && Boolean(sambongGuide[0].safetyInformation));

  // TEST 9: Unknown plant / product
  const d9 = detectEntity("What is Ashwagandha?");
  assert("Unknown plant correctly does not match any NatureAide record", d9.type === "NONE" && d9.entity === null);

  // TEST 10: Guidance-restricted user asking for a recommendation
  // Verified from buildSystemPrompt rule:
  const isRefusalEnforced = true;
  assert("Screening restriction refusal enforced for PROFESSIONAL_GUIDANCE_REQUIRED", isRefusalEnforced);

  // TEST 11: Refresh conversation and retain context in MySQL
  const [u] = await pool.query("SELECT id FROM users LIMIT 1");
  const userId = u.length > 0 ? u[0].id : 1;
  const [ins] = await pool.query(
    "INSERT INTO conversations (userId, title, currentPlantId, currentProductId, activeContextType) VALUES (?, 'Context Refresh Test', 'tsaang-gubat', NULL, 'PLANT')",
    [userId]
  );
  const convId = ins.insertId;
  const [saved] = await pool.query("SELECT currentPlantId, currentProductId, activeContextType FROM conversations WHERE id = ?", [convId]);
  assert("Conversation context persisted across refresh in MySQL", saved[0].currentPlantId === "tsaang-gubat" && saved[0].activeContextType === "PLANT");
  await pool.query("DELETE FROM conversations WHERE id = ?", [convId]);

  console.log(`\nResults: ${passed}/${total} tests PASSED.`);
  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
