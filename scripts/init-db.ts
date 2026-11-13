import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

async function initDatabase() {
  console.log("Connecting to MySQL database...");
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "natureaide_db",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();

  try {
    console.log("Creating/verifying database tables...");

    // 1. Users table (ensure exists)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(191) DEFAULT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'COMMUNITY',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY email_unique (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. User Profiles table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        preferredLanguage VARCHAR(50) DEFAULT 'English',
        healthInterests VARCHAR(255) DEFAULT 'Everyday Wellness, Digestion, Respiratory Comfort',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_profile_unique (userId),
        CONSTRAINT fk_user_profile_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Plants table - check if columns exist or alter
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plants (
        id VARCHAR(191) NOT NULL,
        commonName VARCHAR(191) NOT NULL,
        scientificName VARCHAR(191) NOT NULL,
        category VARCHAR(191) NOT NULL,
        simpleUse TEXT NOT NULL,
        badge VARCHAR(191) NOT NULL,
        preparation TEXT DEFAULT NULL,
        safetyNote TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if imageUrl and slug exist in plants
    const [plantCols]: any = await conn.query("SHOW COLUMNS FROM plants");
    const colNames = plantCols.map((c: any) => c.Field);

    if (!colNames.includes("imageUrl")) {
      await conn.query("ALTER TABLE plants ADD COLUMN imageUrl VARCHAR(255) DEFAULT NULL AFTER badge");
      console.log("Added imageUrl column to plants table.");
    }
    if (!colNames.includes("slug")) {
      await conn.query("ALTER TABLE plants ADD COLUMN slug VARCHAR(191) DEFAULT NULL AFTER id");
      console.log("Added slug column to plants table.");
    }

    const plantImageColumns: Array<[string, string]> = [
      ["local_image_path", "VARCHAR(500) NULL"],
      ["original_image_url", "VARCHAR(1000) NULL"],
      ["image_source", "VARCHAR(255) NULL"],
      ["image_author", "VARCHAR(500) NULL"],
      ["image_license", "VARCHAR(255) NULL"],
      ["image_attribution", "TEXT NULL"],
      ["image_verified_at", "DATETIME(3) NULL"],
    ];
    for (const [name, definition] of plantImageColumns) {
      if (!colNames.includes(name)) {
        await conn.query(`ALTER TABLE plants ADD COLUMN ${name} ${definition}`);
      }
    }

    // 4. Plant Guides table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plant_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        plantId VARCHAR(191) NOT NULL,
        about TEXT NOT NULL,
        traditionalUses TEXT NOT NULL,
        whatResearchSays TEXT NOT NULL,
        commonPreparation TEXT NOT NULL,
        safetyInformation TEXT NOT NULL,
        whoShouldBeCareful TEXT NOT NULL,
        medicineInteractions TEXT NOT NULL,
        whenToConsultDoctor TEXT NOT NULL,
        verifiedBy VARCHAR(191) DEFAULT 'Philippine Traditional & Scientific Review Panel',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY plant_guide_plant (plantId),
        CONSTRAINT fk_plant_guide_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Preparation Guides table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preparation_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(191) NOT NULL,
        category VARCHAR(100) NOT NULL,
        plantId VARCHAR(191) DEFAULT NULL,
        description TEXT NOT NULL,
        whatYouNeed TEXT NOT NULL,
        preparationSteps TEXT NOT NULL,
        importantReminders TEXT NOT NULL,
        storageGuidance TEXT NOT NULL,
        safetyInformation TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_prep_category (category),
        KEY idx_prep_plantId (plantId),
        CONSTRAINT fk_prep_guide_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Saved Plants table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS saved_plants (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        notes TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_plant_unique (userId, plantId),
        KEY idx_saved_userId (userId),
        KEY idx_saved_plantId (plantId),
        CONSTRAINT fk_saved_plants_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_saved_plants_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Saved Preparation Guides table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS saved_preparation_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        guideId INT(11) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_guide_unique (userId, guideId),
        KEY idx_saved_prep_userId (userId),
        KEY idx_saved_prep_guideId (guideId),
        CONSTRAINT fk_saved_prep_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_saved_prep_guide FOREIGN KEY (guideId) REFERENCES preparation_guides(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Recently Viewed table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        viewedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_recent_unique (userId, plantId),
        KEY idx_recent_userId (userId),
        KEY idx_recent_viewedAt (viewedAt),
        CONSTRAINT fk_recent_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_recent_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Conversations table (for Ask NatureAide)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        title VARCHAR(191) NOT NULL DEFAULT 'Herbal Educational Chat',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_conv_user (userId),
        CONSTRAINT fk_conv_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Messages table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT(11) NOT NULL AUTO_INCREMENT,
        conversationId INT(11) NOT NULL,
        sender ENUM('USER', 'ASSISTANT') NOT NULL DEFAULT 'USER',
        content TEXT NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_msg_conv (conversationId),
        CONSTRAINT fk_msg_conv FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Community Health Screenings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS community_health_screenings (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        ruleVersion VARCHAR(50) NOT NULL DEFAULT 'v1.0-community-safety',
        ageGroup VARCHAR(50) DEFAULT NULL,
        healthConcern VARCHAR(255) DEFAULT NULL,
        currentMedications TEXT DEFAULT NULL,
        knownAllergies TEXT DEFAULT NULL,
        isPregnantOrLactating TINYINT(1) NOT NULL DEFAULT 0,
        hasSevereSymptoms TINYINT(1) NOT NULL DEFAULT 0,
        hasOrganFailure TINYINT(1) NOT NULL DEFAULT 0,
        responsesJson LONGTEXT NOT NULL,
        evaluationResult ENUM('ELIGIBLE_TO_CONTINUE', 'PROFESSIONAL_GUIDANCE_REQUIRED') NOT NULL,
        reasonSummary TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_screening_user (userId),
        KEY idx_screening_result (evaluationResult),
        CONSTRAINT fk_screening_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("All tables verified and created successfully.");

    // ==========================================
    // SEED DEMO ACCOUNTS
    // ==========================================
    console.log("Seeding demo accounts...");
    const saltRounds = 10;
    const defaultPassword = "NatureAide123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Role-labeled demo accounts only — no hardcoded doctor personal names.
    const demoAccounts = [
      {
        email: "community@natureaide.test",
        password: hashedPassword,
        name: "Community Member",
        firstName: "Community",
        lastName: "Member",
        role: "COMMUNITY",
      },
      {
        email: "researcher@natureaide.test",
        password: hashedPassword,
        name: "Lead Researcher",
        firstName: "Lead",
        lastName: "Researcher",
        role: "RESEARCHER",
      },
      {
        email: "reviewer@natureaide.test",
        password: hashedPassword,
        name: "Lead Reviewer",
        firstName: "Lead",
        lastName: "Reviewer",
        role: "REVIEWER",
      },
    ];

    for (const acc of demoAccounts) {
      await conn.query(
        `
        INSERT INTO users (email, password, name, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          name = VALUES(name),
          role = VALUES(role),
          updatedAt = CURRENT_TIMESTAMP(3)
      `,
        [acc.email, acc.password, acc.name, acc.role]
      );

      // Get user id
      const [rows]: any = await conn.query("SELECT id FROM users WHERE email = ?", [acc.email]);
      const userId = rows[0]?.id;

      if (userId) {
        await conn.query(
          `
          INSERT INTO user_profiles (userId, firstName, lastName, preferredLanguage)
          VALUES (?, ?, ?, 'English')
          ON DUPLICATE KEY UPDATE
            firstName = VALUES(firstName),
            lastName = VALUES(lastName),
            updatedAt = CURRENT_TIMESTAMP(3)
        `,
          [userId, acc.firstName, acc.lastName]
        );
      }
    }
    console.log("4 Demo accounts successfully seeded.");

    // ==========================================
    // SEED SAMPLE MEDICINAL PLANTS
    // ==========================================
    console.log("Seeding verified medicinal plant catalog...");

    const plantsData = [
      {
        id: "lagundi",
        slug: "lagundi",
        commonName: "Lagundi",
        scientificName: "Vitex negundo",
        category: "Cough & Colds",
        simpleUse: "Traditional five-leaved shrub officially endorsed by the Philippine Department of Health (DOH-PITAHC) for soothing coughs, mild bronchial asthma symptoms, and chest congestion.",
        badge: "Expert Reviewed",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Boil chopped clean leaves in 2 glasses of water for 15 minutes (decoction) until half the liquid remains.",
        safetyNote: "Safe for general adult use. Consult a physician before administering to children under 2 years or during pregnancy.",
      },
      {
        id: "sambong",
        slug: "sambong",
        commonName: "Sambong",
        scientificName: "Blumea balsamifera",
        category: "Everyday Wellness",
        simpleUse: "Aromatic shrub recognized in Philippine herbal pharmacopeia for its mild diuretic properties, promoting urinary flow and natural body fluid balance.",
        badge: "Expert Reviewed",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Boil dried or fresh leaves in water for 15 minutes. Drink in divided doses throughout the day as advised.",
        safetyNote: "Acts as a diuretic. People with severe kidney insufficiency or cardiac edema must consult their doctor first.",
      },
      {
        id: "tsaang-gubat",
        slug: "tsaang-gubat",
        commonName: "Tsaang Gubat",
        scientificName: "Carmona retusa",
        category: "Digestion",
        simpleUse: "Widely cherished herbal tea plant used traditionally to soothe mild stomach aches, abdominal cramps, and diarrhea.",
        badge: "Expert Reviewed",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Steep clean chopped leaves in freshly boiled water for 10 minutes like a standard restorative tea.",
        safetyNote: "Gentle and well-tolerated. If acute abdominal pain persists beyond 24 hours, seek immediate medical care.",
      },
      {
        id: "yerba-buena",
        slug: "yerba-buena",
        commonName: "Yerba Buena",
        scientificName: "Clinopodium douglasii",
        category: "Everyday Wellness",
        simpleUse: "Aromatic Philippine mint traditionally prepared as a soothing infusion for mild headaches, toothaches, joint aches, and general physical tiredness.",
        badge: "Traditional Favorite",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Crush fresh leaves and steep in warm water for a soothing tea, or apply gently as a cool herbal compress.",
        safetyNote: "Generally very gentle. Avoid contact with eyes when handling fresh aromatic mint leaves.",
      },
      {
        id: "turmeric",
        slug: "turmeric",
        commonName: "Turmeric",
        scientificName: "Curcuma longa",
        category: "Everyday Wellness",
        simpleUse: "Golden rhizome packed with curcuminoids, traditionally taken to soothe stiff joints, ease mild inflammatory discomfort, and support healthy digestion.",
        badge: "Evidence Backed",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Boil sliced fresh ginger-like rhizome in water for 10 minutes, or brew powdered root with a pinch of black pepper.",
        safetyNote: "May enhance blood-thinning medications. Avoid large medicinal amounts if diagnosed with bile duct obstruction.",
      },
      {
        id: "ginger",
        slug: "ginger",
        commonName: "Ginger (Luya)",
        scientificName: "Zingiber officinale",
        category: "Digestion",
        simpleUse: "Warming, aromatic root prized for easing motion sickness, settling morning nausea, warming the chest during chills, and supporting post-meal digestion.",
        badge: "Evidence Backed",
        imageUrl: "/images/plants/placeholder.svg",
        preparation: "Crush fresh peeled root and simmer in hot water with honey and calamansi for the classic soothing 'Salabat' tea.",
        safetyNote: "Very safe for culinary and tea use. Excessive intake may cause mild heartburn in individuals prone to acid reflux.",
      },
    ];

    for (const p of plantsData) {
      await conn.query(
        `
        INSERT INTO plants (id, slug, commonName, scientificName, category, simpleUse, badge, imageUrl, preparation, safetyNote)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          slug = VALUES(slug),
          commonName = VALUES(commonName),
          scientificName = VALUES(scientificName),
          category = VALUES(category),
          simpleUse = VALUES(simpleUse),
          badge = VALUES(badge),
          imageUrl = IF(
            imageUrl LIKE '/images/plants/%' AND imageUrl NOT LIKE '%placeholder.svg',
            imageUrl,
            '/images/plants/placeholder.svg'
          ),
          preparation = VALUES(preparation),
          safetyNote = VALUES(safetyNote),
          updatedAt = CURRENT_TIMESTAMP(3)
      `,
        [p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl, p.preparation, p.safetyNote]
      );
    }
    console.log("6 Core medicinal plants seeded.");

    // ==========================================
    // SEED PLANT GUIDES (Detailed Profiles)
    // ==========================================
    console.log("Seeding detailed plant guides...");

    const plantGuides: any[] = [
      {
        plantId: "lagundi",
        about: "Lagundi (Vitex negundo) is one of the ten clinically endorsed herbal medicines by the Department of Health (DOH) in the Philippines. It is a large branched shrub with 5-fingered leaves found in open grassland and backyards across tropical Asia.",
        traditionalUses: "For generations, Philippine rural communities have brewed Lagundi leaves into warm decoctions to relieve colds, fever, persistent dry coughs, phlegm, and bronchial discomfort.",
        whatResearchSays: "Modern pharmacognosy studies have identified key flavonoids (such as chrysoplenol D and casticin) and iridoid glycosides that provide bronchodilator, anti-inflammatory, and mild analgesic properties without the sedative effects of synthetic cough suppressants.",
        commonPreparation: "Standard Decoction: Wash 4 tablespoons of chopped fresh leaves (or 2 tablespoons dried). Boil in 2 glasses of water for 15 minutes without covering the pot. Let it cool, strain, and drink 1/3 glass three times a day after meals.",
        safetyInformation: "Lagundi has a high margin of safety established in clinical trials. Do not exceed the recommended daily amount. Keep preparations in a clean covered glass container.",
        whoShouldBeCareful: "Pregnant or lactating mothers, children under 2 years of age, and individuals taking chronic asthma prescription inhalers should consult their doctor before regular use.",
        medicineInteractions: "No severe interactions reported, but it is best taken at least 1 hour apart from prescription pharmaceuticals.",
        whenToConsultDoctor: "If your cough lasts longer than 7 days, produces yellow-green foul-smelling phlegm, or is accompanied by high fever or shortness of breath, consult a healthcare professional immediately.",
      },
      {
        plantId: "sambong",
        about: "Sambong (Blumea balsamifera) is an aromatic medicinal herb growing up to 3 meters high. It has rough, serrated leaves that give off a characteristic camphor scent when crushed.",
        traditionalUses: "Traditional Filipino folk medicine utilizes Sambong as a cleansing tea for urinary discomfort, kidney support, mild hypertension, and post-partum recovery.",
        whatResearchSays: "Scientific research spearheaded by the National Integrated Research Program on Medicinal Plants (NIRPROMP) confirmed Sambong's diuretic action. It helps promote mild fluid excretion and is clinically recognized in the management of small urinary stones.",
        commonPreparation: "Decoction: Clean fresh leaves thoroughly. Boil 1 cup of chopped leaves in 2 cups of water for 15 minutes. Cool and strain. Sip warm throughout the day.",
        safetyInformation: "Always drink plenty of pure water while taking Sambong tea to prevent dehydration. Do not use as a substitute for prescribed prescription blood pressure medication without medical guidance.",
        whoShouldBeCareful: "Patients suffering from severe kidney failure, acute heart failure with edema, or pregnant women.",
        medicineInteractions: "May potentiate prescription diuretics (water pills) and blood pressure medications. Always inform your physician.",
        whenToConsultDoctor: "If you experience sharp flank pain, blood in urine, severe swelling in ankles, or inability to urinate, visit a healthcare facility immediately.",
      },
      {
        plantId: "tsaang-gubat",
        about: "Tsaang Gubat (Carmona retusa), also known as Forest Tea or Wild Tea, is an attractive evergreen shrub with dark green, glossy leaves and small white flowers.",
        traditionalUses: "Historically consumed as a calming daily digestive tea across the Philippine archipelago to settle stomach spasms, abdominal colic, and acute diarrhea.",
        whatResearchSays: "Studies indicate the presence of triterpenes (notably microphyllone) that exhibit antispasmodic and antibacterial effects against common enteric organisms, relieving smooth muscle contractions in the gut.",
        commonPreparation: "Herbal Infusion: Place 2 tablespoons of freshly washed, torn leaves in a cup. Pour freshly boiled water over the leaves, cover, and let steep for 10 minutes. Drink while comfortably warm.",
        safetyInformation: "Very mild on the gastrointestinal tract. Can be taken 2 to 3 times a day as needed for digestive comfort.",
        whoShouldBeCareful: "Individuals suffering from unexplained chronic abdominal distension or persistent vomiting.",
        medicineInteractions: "Does not interfere with common dietary vitamins or minerals.",
        whenToConsultDoctor: "If diarrhea persists for more than 48 hours, is accompanied by blood, high fever, or signs of dehydration, consult a medical doctor promptly.",
      },
      {
        plantId: "yerba-buena",
        about: "Yerba Buena (Clinopodium douglasii) is a creeping, perennial aromatic herb in the mint family with tender oval leaves and a delightful refreshing fragrance.",
        traditionalUses: "Traditionally steeped into tea to alleviate tension headaches, toothaches, menstrual cramps, joint stiffness, and fatigue after manual labor.",
        whatResearchSays: "Contains rich amounts of pulegone, menthol, and rosmarinic acid which act locally on pain receptor pathways to produce soothing cooling and analgesic sensations.",
        commonPreparation: "Infusion / Compress: Steep 2 tablespoons of clean crushed leaves in 1 cup of boiling water for 10 minutes. For tension, dip a clean cloth into the warm liquid and place on temples or forehead.",
        safetyInformation: "Safe for both internal tea sipping and external topical compress application.",
        whoShouldBeCareful: "Persons sensitive to mint herbs or those suffering from severe acid reflux.",
        medicineInteractions: "Generally compatible with normal diets. Minimal pharmacologic interaction.",
        whenToConsultDoctor: "Seek clinical care if severe head pain is accompanied by blurred vision, nausea, or stiff neck.",
      },
      {
        plantId: "turmeric",
        about: "Turmeric (Curcuma longa) is a perennial herbaceous plant with large oblong leaves and subterranean yellowish-orange rhizomes that have been treasured for millennia in Asian traditional medicine.",
        traditionalUses: "Long revered as a golden elixir for vitality, easing painful joints, rejuvenating the liver, and settling uncomfortable bloating after heavy meals.",
        whatResearchSays: "Extensive worldwide pharmacological research demonstrates curcumin's potent antioxidant properties. Adding a pinch of black pepper (piperine) enhances curcumin absorption by up to 2000%.",
        commonPreparation: "Golden Milk / Tea: Grate 1 thumb-sized fresh root into 2 cups of water or warm milk with a pinch of black pepper. Simmer for 10 minutes. Sweeten lightly with honey if desired.",
        safetyInformation: "High safety profile when consumed in typical food and beverage portions.",
        whoShouldBeCareful: "People with gallstones, bile duct obstructions, bleeding disorders, or scheduled for upcoming surgery within two weeks.",
        medicineInteractions: "May interact with anticoagulant/antiplatelet drugs (such as warfarin or aspirin) when taken in concentrated supplemental doses.",
        whenToConsultDoctor: "Consult your doctor if you experience persistent joint swelling, fever, or skin yellowing (jaundice).",
      },
      {
        plantId: "ginger",
        about: "Ginger (Zingiber officinale) is an essential tropical kitchen and medicinal rhizome with fibrous flesh and a sharp, spicy aroma derived from natural gingerols.",
        traditionalUses: "A household staple across generations for easing pregnancy morning sickness, calming travel nausea, dispelling cold chills, and soothing irritated throats.",
        whatResearchSays: "Gingerols and shogaols stimulate digestive saliva and gastric secretions, accelerate stomach emptying, and act upon serotonin receptors in the gut to counteract nausea.",
        commonPreparation: "Traditional Salabat: Crush 2 thumbs of fresh washed peeled ginger. Simmer in 4 cups of water for 15 minutes. Serve warm with freshly squeezed calamansi and honey.",
        safetyInformation: "Exceptionally gentle. Safe for most pregnant individuals in moderate dietary amounts (up to 1 gram of dried ginger equivalent per day).",
        whoShouldBeCareful: "Patients with acute heartburn, active stomach ulcers, or gallstones should moderate intake.",
        medicineInteractions: "May slightly affect blood clotting in very large supplemental amounts.",
        whenToConsultDoctor: "Contact your clinic if vomiting is uncontrollable, prevents hydration, or lasts longer than 24 hours.",
      },
    ];

    for (const g of plantGuides) {
      await conn.query(
        `
        INSERT INTO plant_guides (
          plantId, about, traditionalUses, whatResearchSays, commonPreparation,
          safetyInformation, whoShouldBeCareful, medicineInteractions, whenToConsultDoctor, verifiedBy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          about = VALUES(about),
          traditionalUses = VALUES(traditionalUses),
          whatResearchSays = VALUES(whatResearchSays),
          commonPreparation = VALUES(commonPreparation),
          safetyInformation = VALUES(safetyInformation),
          whoShouldBeCareful = VALUES(whoShouldBeCareful),
          medicineInteractions = VALUES(medicineInteractions),
          whenToConsultDoctor = VALUES(whenToConsultDoctor),
          verifiedBy = VALUES(verifiedBy),
          updatedAt = CURRENT_TIMESTAMP(3)
      `,
        [
          g.plantId,
          g.about,
          g.traditionalUses,
          g.whatResearchSays,
          g.commonPreparation,
          g.safetyInformation,
          g.whoShouldBeCareful,
          g.medicineInteractions,
          g.whenToConsultDoctor,
          g.verifiedBy,
        ]
      );
    }
    console.log("6 Detailed plant guides seeded.");

    // ==========================================
    // SEED PREPARATION GUIDES (Step-by-step)
    // ==========================================
    console.log("Seeding step-by-step preparation guides...");

    const prepGuides = [
      {
        title: "Traditional Herbal Tea (Infusion)",
        category: "Tea / Infusion",
        plantId: "tsaang-gubat",
        description: "The gentlest method for delicate botanical leaves and blossoms. Preserves fragile aromatic oils and water-soluble herbal virtues.",
        whatYouNeed: "1. 2 to 3 tablespoons of clean, freshly harvested leaves (or 1 tablespoon dried)\n2. 1 cup (250ml) freshly boiled water\n3. Ceramic or glass teapot / mug with cover\n4. Fine tea strainer\n5. Optional: Pure honey or slice of calamansi",
        preparationSteps: "1. Rinse herbal leaves under cool running tap water to remove all surface dust.\n2. Gently bruise or chop leaves with your fingers to release beneficial herbal oils.\n3. Place the leaves into your clean ceramic cup or teapot.\n4. Pour freshly boiled water directly over the leaves.\n5. Cover immediately with a lid or saucer to prevent aromatic vapors from escaping.\n6. Let steep for 10 to 15 minutes.\n7. Strain the tea into a warm mug and sip slowly while warm.",
        importantReminders: "• Always cover during steeping to trap volatile herbal essences.\n• Avoid using iron or aluminum cookware, which can react with natural plant tannins.\n• Prepare fresh for each serving.",
        storageGuidance: "Consume immediately after brewing. Do not store brewed infusions for more than 12 hours. Discard if liquid becomes cloudy.",
        safetyInformation: "Suitable for everyday wellness. Avoid adding excess sugar. Test a small sip first if trying a new herb for the first time.",
      },
      {
        title: "Standard Medicinal Decoction (Boiling Method)",
        category: "Decoction",
        plantId: "lagundi",
        description: "The time-tested Philippine preparation method for hard leaves, roots, bark, and sturdy stems to extract deeper phytochemicals.",
        whatYouNeed: "1. 4 tablespoons of chopped fresh clean leaves (or 2 tablespoons dried)\n2. 2 standard drinking glasses of clean water\n3. Clay pot (palayok), enamel, or stainless steel pot (no aluminum)\n4. Strainer and clean glass container",
        preparationSteps: "1. Wash the herbal leaves thoroughly under running water.\n2. Coarsely chop the leaves and place into your pot.\n3. Add 2 glasses of water.\n4. Bring to a boil over medium heat without covering the pot.\n5. Once boiling, lower heat and let simmer until the liquid reduces to 1 glass (approximately 15 minutes).\n6. Remove pot from heat, let cool to lukewarm temperature.\n7. Strain into a clean glass pitcher or mug.",
        importantReminders: "• Traditional guidance recommends keeping the pot UNCOVERED while boiling decoctions.\n• Do not let the pot boil dry.\n• Use gentle, moderate heat.",
        storageGuidance: "Decoctions may be stored in a covered clean glass bottle inside the refrigerator for up to 24 hours. Reheat gently before drinking.",
        safetyInformation: "Adhere to the recommended serving (usually 1/3 glass 3 times a day after meals). Never drink excessively concentrated decoctions.",
      },
      {
        title: "Fresh Herbal Salabat (Root Decoction)",
        category: "Decoction",
        plantId: "ginger",
        description: "Classic warming beverage made from fresh rhizomes, ideal for morning digestive comfort, chills, and soothing throat irritation.",
        whatYouNeed: "1. 2 to 3 medium thumbs of fresh ginger root\n2. 4 cups of filtered water\n3. Stainless steel or glass saucepan\n4. 1 to 2 fresh calamansi or lemon wedges\n5. 1 teaspoon raw wild honey (optional)",
        preparationSteps: "1. Wash ginger thoroughly and peel thin skin with the edge of a spoon.\n2. Crush or bruise the ginger thumbs using a mortar or flat edge of a knife.\n3. Place crushed ginger into the pot with 4 cups of water.\n4. Bring to a rolling boil, then reduce to a gentle simmer for 15 to 20 minutes.\n5. The liquid will turn a warm golden-amber hue with a fragrant spicy aroma.\n6. Pour through a strainer into mugs.\n7. Squeeze fresh calamansi juice and stir in honey to taste.",
        importantReminders: "• Bruising the rhizome breaks cell walls and yields richer gingerols.\n• Simmering longer increases spiciness and warmth.",
        storageGuidance: "Keeps well in the refrigerator for up to 48 hours in a sealed glass bottle. Can be enjoyed warm or chilled.",
        safetyInformation: "Very gentle. If you have active stomach ulcers, drink diluted or pair with light food.",
      },
      {
        title: "Fresh Herbal Poultice / Compress",
        category: "Fresh Preparation",
        plantId: "yerba-buena",
        description: "External topical method using freshly bruised botanical leaves applied directly to soothe minor aches, tension, or insect irritations.",
        whatYouNeed: "1. Handful of fresh, pest-free herbal leaves\n2. Clean mortar and pestle (or clean flat stone)\n3. Clean cotton gauze or linen cloth\n4. Lukewarm water for washing",
        preparationSteps: "1. Wash leaves very carefully to remove any soil or debris.\n2. Pat leaves dry with a clean cloth.\n3. Pound leaves in a clean mortar until they form a soft, moist paste with released juices.\n4. Spread the crushed leaves gently onto a piece of clean gauze.\n5. Apply the wrapped poultice directly over the affected area (forehead for headaches, or sore joint).\n6. Leave in place for 20 to 30 minutes while resting comfortably.",
        importantReminders: "• Never apply to open wounds, bleeding cuts, or infected skin.\n• Always test a small area of intact skin for 10 minutes to verify no allergic reaction occurs.",
        storageGuidance: "Prepare fresh immediately before application. Discard used herbal residue after single use.",
        safetyInformation: "External use only. Avoid contact with eyes and sensitive mucous membranes.",
      },
    ];

    for (const pg of prepGuides) {
      await conn.query(
        `
        INSERT INTO preparation_guides (
          title, category, plantId, description, whatYouNeed, preparationSteps,
          importantReminders, storageGuidance, safetyInformation, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
      `,
        [
          pg.title,
          pg.category,
          pg.plantId,
          pg.description,
          pg.whatYouNeed,
          pg.preparationSteps,
          pg.importantReminders,
          pg.storageGuidance,
          pg.safetyInformation,
        ]
      );
    }
    console.log("4 Step-by-step preparation guides seeded.");

    // ==========================================
    // SEED SAMPLE RECENTLY VIEWED & SAVED FOR COMMUNITY DEMO ACCOUNT
    // ==========================================
    const [commUser]: any = await conn.query("SELECT id FROM users WHERE email = 'community@natureaide.test'");
    const commUserId = commUser[0]?.id;

    if (commUserId) {
      // Save Lagundi and Turmeric for the community demo account
      await conn.query(`
        INSERT INTO saved_plants (userId, plantId, notes)
        VALUES 
          (${commUserId}, 'lagundi', 'Helpful for seasonal cough and chest congestion.'),
          (${commUserId}, 'turmeric', 'Great morning tea for knee and joint comfort.')
        ON DUPLICATE KEY UPDATE notes = VALUES(notes)
      `);

      // Add recently viewed records
      await conn.query(`
        INSERT INTO recently_viewed (userId, plantId)
        VALUES 
          (${commUserId}, 'lagundi'),
          (${commUserId}, 'sambong'),
          (${commUserId}, 'ginger')
        ON DUPLICATE KEY UPDATE viewedAt = CURRENT_TIMESTAMP(3)
      `);

      // Save a preparation guide
      const [guides]: any = await conn.query("SELECT id FROM preparation_guides LIMIT 2");
      if (guides.length > 0) {
        for (const g of guides) {
          await conn.query(`
            INSERT INTO saved_preparation_guides (userId, guideId)
            VALUES (${commUserId}, ${g.id})
            ON DUPLICATE KEY UPDATE createdAt = CURRENT_TIMESTAMP(3)
          `);
        }
      }

      // Seed a starter educational conversation for Ask NatureAide
      await conn.query(`
        INSERT INTO conversations (id, userId, title)
        VALUES (1, ${commUserId}, 'General Herbal Questions')
        ON DUPLICATE KEY UPDATE title = VALUES(title)
      `);

      await conn.query(`
        INSERT INTO messages (conversationId, sender, content)
        VALUES 
          (1, 'USER', 'What is ginger traditionally used for?'),
          (1, 'ASSISTANT', 'Ginger (Zingiber officinale) is traditionally cherished across Filipino and Asian households as a warming remedy. It is commonly prepared as Salabat to ease motion sickness, settle mild digestive upset, and soothe morning nausea.\\n\\n*Safety Note:* Ginger is very gentle for everyday culinary use. If you have severe acid reflux or are taking prescription blood thinners, consult your healthcare provider.')
      `);
      console.log("Seeded initial saved plants, recent views, and chat for community@natureaide.test.");
    }

    console.log("Database initialization and demo seeding completed successfully!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

initDatabase();
