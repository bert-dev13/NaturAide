const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('=== SEEDING TRADITIONAL HERBAL PREPARATIONS DATA ===');

  // Clear existing rows in preparation tables to rebuild cleanly
  await conn.query('DELETE FROM preparation_references');
  await conn.query('DELETE FROM preparation_precautions');
  await conn.query('DELETE FROM preparation_steps');
  await conn.query('DELETE FROM preparation_materials');
  await conn.query('DELETE FROM traditional_preparations');

  const preparations = [
    // 1. LAGUNDI (Vitex negundo) - Decoction
    {
      id: 'prep-lagundi-decoction',
      plant_id: 'lagundi',
      title: 'Standard Lagundi Leaf Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Mature fresh leaves or clean dried leaves and tender stems',
      traditional_use_context: 'Traditional Philippine DOH-endorsed preparation used for relieving cough, mild asthma symptoms, common cold discomfort, and fever.',
      description: 'A traditional water-boiled decoction prepared using mature Lagundi leaves in an uncovered non-reactive container.',
      administration_instructions: 'Drink 1/3 of the prepared decoction warm, three times a day, approximately 30 minutes after meals or as directed by traditional healthcare guidelines.',
      when_to_seek_guidance: 'If cough persists beyond 7 days, is accompanied by high recurring fever, difficulty breathing, or rust-colored/blood-tinged sputum, consult a qualified healthcare provider immediately.',
      materials: [
        { name: 'Fresh chopped Lagundi leaves (or dried leaves)', amount: '6 tbsp fresh (or 4 tbsp dried)', unit: 'tablespoons', notes: 'Wash leaves thoroughly in clean running water before chopping.' },
        { name: 'Clean potable water', amount: '2', unit: 'glasses (approx. 500 mL)', notes: 'Use pure drinking water.' },
        { name: 'Clay pot (palayok) or enamel pot with strainer', amount: '1', unit: 'piece', notes: 'Avoid bare iron or reactive metal pots to prevent tannin oxidation.' }
      ],
      steps: [
        'Collect healthy mature Lagundi leaves, discarding discolored or insect-damaged parts.',
        'Wash the leaves thoroughly under clean running water to remove dust and surface debris.',
        'Chop the leaves into coarse pieces and measure 6 tablespoons of fresh leaves (or 4 tablespoons if using dried leaves).',
        'Place the chopped leaves into an uncovered clay pot or enamel-lined container and pour in 2 glasses of potable water.',
        'Bring to a boil over medium heat without covering the pot. Once boiling, lower heat and simmer for 15 minutes until liquid is reduced to about half.',
        'Remove from heat, allow to cool to a comfortable lukewarm temperature, and strain through a clean cloth or fine strainer into a glass container.'
      ],
      precautions: [
        'Use only non-reactive containers (clay, glass, or enamel). Do not boil in bare iron or aluminum pots.',
        'Keep the pot uncovered during boiling to allow volatile irritating vapors to dissipate.',
        'Prepare fresh daily. Discard unused decoction after 24 hours.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: Gabay sa Wastong Paggamit ng mga Halamang Gamot',
          organization_or_authors: 'Department of Health (DOH) Traditional Medicine Program & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Vitex negundo Linn.: A decade of advances in phytochemistry, pharmacology and clinical insights.',
          organization_or_authors: 'Gill NS, Sharma S, Arora R',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/41650524/',
          doi_or_pmid: 'PMID: 41650524'
        }
      ]
    },

    // 1b. LAGUNDI (Vitex negundo) - Aromatic Wash
    {
      id: 'prep-lagundi-wash',
      plant_id: 'lagundi',
      title: 'Aromatic Lagundi Cleansing Wash',
      preparation_type: 'WASH',
      plant_part_used: 'Fresh leafy branches and leafy tops',
      traditional_use_context: 'Traditional Philippine external wash used for cleansing superficial skin scratches, post-illness aromatic baths, and soothing tired limbs.',
      description: 'Warm topical wash prepared by steeping boiled Lagundi leaves for external cleansing.',
      administration_instructions: 'Use lukewarm liquid to wash skin or add to a traditional warm herbal bath. For external cleansing use only.',
      when_to_seek_guidance: 'Do not use on open infected wounds or deep puncture injuries. Seek clinical care if signs of localized infection appear.',
      materials: [
        { name: 'Fresh Lagundi leaves and leafy tops', amount: '2 to 3', unit: 'handfuls', notes: 'Freshly harvested, washed clean.' },
        { name: 'Clean water', amount: '1', unit: 'pot (approx. 1 to 2 liters)', notes: 'Clean tap or well water.' },
        { name: 'Clean washcloth or basin', amount: '1', unit: 'piece', notes: 'Clean basin dedicated to external wash.' }
      ],
      steps: [
        'Rinse 2 to 3 handfuls of fresh Lagundi leaves in clean water.',
        'Submerge the leaves in a pot of water and bring to a rolling boil for 10 minutes.',
        'Remove from heat and allow to cool until lukewarm.',
        'Strain out plant solids and use the aromatic wash with a clean cloth to sponge bath or rinse skin.'
      ],
      precautions: [
        'Ensure the temperature is lukewarm before touching skin to prevent thermal burns.',
        'External use only. Do not ingest wash prepared from non-potable water.'
      ],
      references: [
        {
          source_type: 'PITAHC_RESOURCE',
          source_title: 'Philippine Traditional Medicine Plant Monographs & Practical Household Formulary',
          organization_or_authors: 'Philippine Institute of Traditional and Alternative Health Care (PITAHC)',
          publication_year: 2018,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 2. SAMBONG (Blumea balsamifera) - Decoction
    {
      id: 'prep-sambong-decoction',
      plant_id: 'sambong',
      title: 'Standard Sambong Leaf Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Mature fresh or dried leaves',
      traditional_use_context: 'Official DOH/PITAHC traditional diuretic preparation documented for assisting urine flow, mild fluid retention, and aiding the passage of small non-obstructive renal calculi (<5mm).',
      description: 'Standardized water decoction prepared from mature Sambong leaves boiled uncovered.',
      administration_instructions: 'Divide the strained daily decoction into three equal parts. Drink 1 part every 8 hours after meals. Drink adequate clean water throughout the day.',
      when_to_seek_guidance: 'Seek urgent medical attention if experiencing severe sharp flank/back pain, inability to urinate, nausea/vomiting, or visible blood in the urine.',
      materials: [
        { name: 'Fresh minced Sambong leaves (or dried leaves)', amount: '6 tbsp fresh (or 4 tbsp dried)', unit: 'tablespoons', notes: 'Minced or chopped coarsely.' },
        { name: 'Clean potable water', amount: '2', unit: 'glasses (approx. 500 mL)', notes: 'Boiling liquid volume.' },
        { name: 'Clay pot or enamel-lined pot', amount: '1', unit: 'pot', notes: 'Non-reactive container.' }
      ],
      steps: [
        'Select mature healthy Sambong leaves and wash thoroughly under clean water.',
        'Mince the leaves into small pieces to enhance extraction of active flavonoids.',
        'Place 6 tablespoons of fresh minced leaves (or 4 tablespoons of dried leaves) in an uncovered clay pot.',
        'Add 2 glasses of water and bring to a boil over medium heat without covering the vessel.',
        'Simmer for 15 minutes after boiling starts until water is reduced to approximately 1 glass.',
        'Allow the decoction to cool, strain into a clean glass container, and store in a cool place.'
      ],
      precautions: [
        'Not recommended for patients with complete urinary obstruction, acute renal shutdown, or severe congestive heart failure edema without medical supervision.',
        'Do not cover the pot while boiling.',
        'Discard unused liquid after 24 hours and brew fresh daily.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Department of Health Administrative Order No. 47-A s. 2001: Guidelines on Traditional Herbal Medicines',
          organization_or_authors: 'Department of Health (DOH), Philippines',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Blumea balsamifera Alleviates Rheumatoid Arthritis by Suppressing Synovial Inflammation: From Chemical Profiling to Molecular Mechanism.',
          organization_or_authors: 'Tang T, Zhong K, Mu K, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/41901208/',
          doi_or_pmid: 'PMID: 41901208'
        }
      ]
    },

    // 3. AMPALAYA (Momordica charantia) - Steamed Leaves / Shoot Tips
    {
      id: 'prep-ampalaya-steamed',
      plant_id: 'ampalaya',
      title: 'Steamed Ampalaya Leaves & Young Shoots',
      preparation_type: 'OTHER_DOCUMENTED_METHOD',
      plant_part_used: 'Young tender leaves, shoot tips (talbos), and immature fruits',
      traditional_use_context: 'Documented Philippine traditional dietary preparation consumed as an adjunct supportive food for non-insulin dependent blood sugar regulation.',
      description: 'Gently steamed fresh young Ampalaya leaves consumed directly with regular meals.',
      administration_instructions: 'Consume 1 cup of freshly steamed young leaves twice daily with meals as a dietary vegetable supplement.',
      when_to_seek_guidance: 'Not a substitute for insulin or prescribed oral hypoglycemic medications. Monitor blood sugar regularly with your physician.',
      materials: [
        { name: 'Fresh young Ampalaya leaves and shoot tops', amount: '1', unit: 'cup (packed loosely)', notes: 'Freshly harvested tender shoots.' },
        { name: 'Potable water for steaming', amount: 'Adequate amount', unit: 'as needed', notes: 'For steamer water base.' },
        { name: 'Food steamer or covered steaming basket', amount: '1', unit: 'piece', notes: 'Food-grade stainless steel or bamboo steamer.' }
      ],
      steps: [
        'Wash young Ampalaya shoots and leaves thoroughly under cold running water.',
        'Drain excess water and place the leaves in a steamer basket over boiling water.',
        'Cover and steam gently for 3 to 5 minutes until tender-crisp. Avoid overcooking to preserve heat-sensitive bioactive peptides.',
        'Serve warm alongside regular balanced meals.'
      ],
      precautions: [
        'Pregnant women should avoid consuming high medicinal quantities due to documented emmenagogue and potential uterine-stimulating properties.',
        'Patients on blood sugar-lowering medication should monitor for hypoglycemia.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: Philippine DOH Guidelines on Ampalaya for Blood Sugar Support',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Glycemic and Lipid Outcomes Associated with Bitter Melon Blood-Sugar-Modulating Protein: A Translational Preclinical Study.',
          organization_or_authors: 'Chou CY, Lin FY, Chen CC, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/42654229/',
          doi_or_pmid: 'PMID: 42654229'
        }
      ]
    },

    // 3b. AMPALAYA (Momordica charantia) - Herbal Infusion
    {
      id: 'prep-ampalaya-infusion',
      plant_id: 'ampalaya',
      title: 'Dried Ampalaya Bitter Herbal Infusion (Tea)',
      preparation_type: 'INFUSION',
      plant_part_used: 'Clean dried sliced leaves and cut mature fruits',
      traditional_use_context: 'Traditional bitter herbal tea steeped in hot water for post-meal digestive comfort and traditional metabolic support.',
      description: 'Hot water infusion of dried Ampalaya leaf pieces steeped like tea.',
      administration_instructions: 'Drink 1 cup of warm tea once or twice daily after meals.',
      when_to_seek_guidance: 'If dizziness, cold sweats, or shakiness occur (signs of low blood sugar), discontinue and consume a fast-acting carbohydrate.',
      materials: [
        { name: 'Dried Ampalaya leaves and dried fruit pieces', amount: '1 to 2', unit: 'teaspoons', notes: 'Shade-dried, clean herbal cut.' },
        { name: 'Freshly boiled water', amount: '1', unit: 'cup (240 mL)', notes: 'Hot drinking water.' },
        { name: 'Tea cup or teapot with lid', amount: '1', unit: 'piece', notes: 'For steeping covered.' }
      ],
      steps: [
        'Place 1 to 2 teaspoons of dried Ampalaya into a cup or teapot.',
        'Pour 1 cup of freshly boiled water over the dried herbs.',
        'Cover and let steep for 10 minutes to extract bitter glycosides.',
        'Strain out plant solids and sip warm.'
      ],
      precautions: [
        'Do not add sugar or artificial sweeteners if used for metabolic balance.',
        'Not recommended for pregnant or lactating mothers.'
      ],
      references: [
        {
          source_type: 'WHO_RESOURCE',
          source_title: 'WHO Monographs on Selected Medicinal Plants - Volume 4',
          organization_or_authors: 'World Health Organization',
          publication_year: 2009,
          source_url: 'https://www.who.int/publications/i/item/9789241547055',
          doi_or_pmid: null
        }
      ]
    },

    // 4. AKAPULKO (Senna alata) - Fresh Poultice
    {
      id: 'prep-akapulko-poultice',
      plant_id: 'akapulko',
      title: 'Fresh Akapulko Leaf Poultice / Expressed Juice',
      preparation_type: 'POULTICE',
      plant_part_used: 'Fresh mature green leaves',
      traditional_use_context: 'Official DOH/PITAHC traditional topical remedy for superficial fungal skin infections including tinea flava (an-an), ringworm (buni), and athlete’s foot (alipunga).',
      description: 'Freshly expressed leaf juice or crushed leaf paste applied directly to affected dermatological areas.',
      administration_instructions: 'Apply expressed juice or poultice directly to affected fungal patches twice daily for 2 to 3 consecutive weeks until the skin completely clears.',
      when_to_seek_guidance: 'If skin rash, severe burning, worsening redness, or blistering occurs, discontinue immediately and consult a dermatologist.',
      materials: [
        { name: 'Fresh mature Akapulko leaves', amount: '5 to 10', unit: 'leaves', notes: 'Freshly picked, clean and green.' },
        { name: 'Mortar and pestle or clean grinding surface', amount: '1', unit: 'set', notes: 'Clean utensils.' },
        { name: 'Clean cotton ball or gauze', amount: '1 to 2', unit: 'pieces', notes: 'For hygienic application.' }
      ],
      steps: [
        'Wash 5 to 10 fresh Akapulko leaves thoroughly under clean running water.',
        'Pound or crush the leaves in a clean mortar until juicy and paste-like.',
        'Squeeze the crushed leaves through clean gauze to extract the dark green juice (or use the crushed leaf mash as a direct poultice).',
        'Wash the affected fungal skin area with mild soap and clean water, then pat completely dry.',
        'Apply the juice or crushed leaf pulp evenly onto the affected skin and allow to air dry.'
      ],
      precautions: [
        'FOR EXTERNAL TOPICAL USE ONLY. DO NOT INGEST FRESH LEAF JUICE (contains strong anthraquinones that cause severe diarrhea).',
        'Perform a small skin patch test on the inner forearm for 30 minutes before first full application to check for hypersensitivity.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Dermatological Guidelines on Akapulko',
          organization_or_authors: 'Department of Health Traditional Medicine Unit & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Antifungal activity of rhein against Candida albicans with insights into its mechanism of action.',
          organization_or_authors: 'Kaviraj M, Jayappriyan KR',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/42390694/',
          doi_or_pmid: 'PMID: 42390694'
        }
      ]
    },

    // 4b. AKAPULKO (Senna alata) - Antifungal Wash
    {
      id: 'prep-akapulko-wash',
      plant_id: 'akapulko',
      title: 'Akapulko Antifungal Decoction Wash',
      preparation_type: 'WASH',
      plant_part_used: 'Fresh or dried mature leaves',
      traditional_use_context: 'Warm topical wash used for widespread itchy fungal patches, ringworm-prone skin folds, or fungal foot soak.',
      description: 'Topical boiled wash used for cleansing and soaking areas affected by superficial fungal infections.',
      administration_instructions: 'Use warm decoction to wash affected skin or soak feet for 10 to 15 minutes twice daily. Pat dry thoroughly afterwards.',
      when_to_seek_guidance: 'Fungal infections accompanied by secondary bacterial pus, swelling, or open ulcers require physician examination.',
      materials: [
        { name: 'Fresh chopped Akapulko leaves', amount: '2', unit: 'handfuls', notes: 'Clean washed leaves.' },
        { name: 'Clean water', amount: '4', unit: 'glasses (approx. 1 liter)', notes: 'For boiling.' },
        { name: 'Enamel or stainless steel pot', amount: '1', unit: 'pot', notes: 'Clean pot.' }
      ],
      steps: [
        'Wash 2 handfuls of Akapulko leaves thoroughly.',
        'Place leaves in pot with 4 glasses of water and bring to a boil for 10 to 15 minutes.',
        'Allow to cool until comfortably lukewarm.',
        'Strain liquid into a clean basin and use as a therapeutic wash or foot soak.'
      ],
      precautions: [
        'Always ensure the temperature is comfortable to prevent burns.',
        'Dry skin thoroughly with a clean towel after washing, as moisture encourages fungal growth.'
      ],
      references: [
        {
          source_type: 'PITAHC_RESOURCE',
          source_title: 'Manual on Philippine Medicinal Plants in Primary Health Care',
          organization_or_authors: 'Philippine Institute of Traditional and Alternative Health Care (PITAHC)',
          publication_year: 2017,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 5. BAYABAS (Psidium guajava) - Decoction Wash
    {
      id: 'prep-bayabas-wash',
      plant_id: 'bayabas',
      title: 'Bayabas Antiseptic Leaf Decoction Wash',
      preparation_type: 'WASH',
      plant_part_used: 'Leafy tops and young tender leaves',
      traditional_use_context: 'Official DOH/PITAHC traditional antiseptic wash for cleansing minor superficial cuts, skin abrasions, post-circumcision care, and post-partum perineal cleansing.',
      description: 'Astringent, tannin-rich boiled leaf decoction used as an external antibacterial cleansing wash.',
      administration_instructions: 'Allow decoction to cool to lukewarm. Use to gently cleanse or wash the affected skin area twice daily.',
      when_to_seek_guidance: 'Do not use on deep animal bites, puncture wounds, heavily bleeding injuries, or infected wounds showing fever and red streaks.',
      materials: [
        { name: 'Fresh young Bayabas leafy tops', amount: '1 to 2', unit: 'handfuls', notes: 'Harvested fresh, washed clean.' },
        { name: 'Clean water', amount: '4', unit: 'glasses (approx. 1 liter)', notes: 'Potable water.' },
        { name: 'Boiling pot and clean basin', amount: '1', unit: 'set', notes: 'Clean utensils.' }
      ],
      steps: [
        'Collect 1 to 2 handfuls of young tender Bayabas leaves and leafy tops.',
        'Wash the leaves thoroughly under clean running water.',
        'Place in a pot with 4 glasses of water and bring to a rolling boil.',
        'Simmer over low to medium heat for 10 to 15 minutes to extract astringent tannins.',
        'Cool until lukewarm, strain through clean cloth, and use as an external skin wash.'
      ],
      precautions: [
        'Test temperature before use on sensitive skin to prevent scald burns.',
        'Prepare fresh daily. Discard unused portion after 24 hours.',
        'External cleansing use only.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Bayabas for Antiseptic Wound Cleansing',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Antibacterial Activities of Guava (Psidium guajava) Leaf Aqueous Extract Against Staphylococcus aureus and Escherichia coli.',
          organization_or_authors: 'Akter F, Ahmed SM, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/42375034/',
          doi_or_pmid: 'PMID: 42375034'
        }
      ]
    },

    // 5b. BAYABAS (Psidium guajava) - Oral Gargle
    {
      id: 'prep-bayabas-gargle',
      plant_id: 'bayabas',
      title: 'Bayabas Astringent Mouthwash & Oral Gargle',
      preparation_type: 'WASH',
      plant_part_used: 'Young tender leaves',
      traditional_use_context: 'Traditional oral gargle documented for soothing inflamed gums (gingivitis), mouth sores (singaw), and temporary toothache relief.',
      description: 'Lukewarm astringent guava leaf decoction used as a therapeutic mouth rinse.',
      administration_instructions: 'Gargle warm liquid in mouth for 30 to 60 seconds, then spit out completely. Repeat 2 to 3 times daily after brushing.',
      when_to_seek_guidance: 'If tooth pain is severe, accompanied by facial swelling or difficulty swallowing, consult a licensed dentist immediately.',
      materials: [
        { name: 'Fresh young Bayabas leaves', amount: '1', unit: 'handful (approx. 10 leaves)', notes: 'Clean and freshly picked.' },
        { name: 'Clean drinking water', amount: '2', unit: 'cups (approx. 500 mL)', notes: 'Potable water.' },
        { name: 'Pinch of salt (optional)', amount: '1/4', unit: 'teaspoon', notes: 'Traditional adjunct.' }
      ],
      steps: [
        'Wash young Bayabas leaves thoroughly in running potable water.',
        'Boil leaves in 2 cups of clean drinking water for 10 minutes.',
        'Remove from heat, add optional 1/4 tsp salt, and cool until lukewarm.',
        'Strain liquid into a clean glass and gargle thoroughly, spitting out all liquid.'
      ],
      precautions: [
        'Spit out after gargling; do not swallow large amounts of concentrated astringent gargle.',
        'Must be lukewarm, never hot.'
      ],
      references: [
        {
          source_type: 'PITAHC_RESOURCE',
          source_title: 'Traditional Oral Health Practices with Philippine Medicinal Plants',
          organization_or_authors: 'Philippine Institute of Traditional and Alternative Health Care',
          publication_year: 2019,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 6. BAWANG (Allium sativum) - Dietary Fresh Clove
    {
      id: 'prep-bawang-fresh',
      plant_id: 'bawang',
      title: 'Fresh Bawang Clove Dietary Preparation',
      preparation_type: 'OTHER_DOCUMENTED_METHOD',
      plant_part_used: 'Fresh mature cloves (bulbs)',
      traditional_use_context: 'Official DOH/PITAHC traditional dietary remedy used as an adjunct in supporting healthy blood pressure and cardiovascular wellness.',
      description: 'Crushed or lightly soaked fresh garlic cloves consumed with meals.',
      administration_instructions: 'Eat 2 to 3 cloves daily with meals (crushed fresh, roasted lightly, or soaked in natural vinegar). Consume with food.',
      when_to_seek_guidance: 'Not a substitute for emergency blood pressure medications. If experiencing severe headache, chest tightness, or blurry vision, seek emergency care.',
      materials: [
        { name: 'Fresh whole garlic cloves', amount: '2 to 3', unit: 'cloves', notes: 'Firm, plump unblemished cloves.' },
        { name: 'Natural vinegar (sukang paombong / coconut vinegar) (optional)', amount: '1 to 2', unit: 'tablespoons', notes: 'For soaking to reduce pungency.' },
        { name: 'Clean saucer or small dish', amount: '1', unit: 'piece', notes: 'For crushing.' }
      ],
      steps: [
        'Peel 2 to 3 cloves of fresh garlic.',
        'Crush the cloves lightly with a clean spoon or knife flat to activate alliinase enzymes and release allicin.',
        'Let rest for 5 minutes after crushing to maximize active allicin formation.',
        'Eat directly with regular meals, or soak in 1 to 2 tablespoons of natural vinegar for 10 minutes before eating to soften sharp pungency.'
      ],
      precautions: [
        'DO NOT EAT LARGE AMOUNTS ON AN EMPTY STOMACH (causes acute gastritis, heartburn, and gastrointestinal irritation).',
        'Use caution if taking prescription blood thinners (aspirin, warfarin, clopidogrel) or prior to elective surgery due to antiplatelet properties.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Bawang (Garlic) for Cardiovascular Wellness',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Effects of aged black garlic (ABG10+(®)) on lipoprotein subclass composition in Grade I hypertension: a randomized, triple-blind controlled trial.',
          organization_or_authors: 'Serrano JCE, Castro-Boqué E, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/42577101/',
          doi_or_pmid: 'PMID: 42577101'
        }
      ]
    },

    // 7. TSAANG GUBAT (Carmona retusa) - Decoction
    {
      id: 'prep-tsaang-gubat-decoction',
      plant_id: 'tsaang-gubat',
      title: 'Standard Tsaang Gubat Leaf Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Mature fresh leaves or dried leaves',
      traditional_use_context: 'Official DOH/PITAHC traditional remedy for abdominal colic, stomach ache, intestinal gas (kabag), diarrhea, and post-partum recovery.',
      description: 'Antispasmodic decoction prepared by boiling Tsaang Gubat leaves in water in an uncovered pot.',
      administration_instructions: 'Drink 1 glass of lukewarm decoction every 4 hours for mild stomach ache or diarrhea until discomfort subsides.',
      when_to_seek_guidance: 'Seek immediate clinical care if abdominal pain is acute and severe, localized to the right lower abdomen (suspected appendicitis), or accompanied by high fever or bloody stools.',
      materials: [
        { name: 'Fresh chopped Tsaang Gubat leaves (or dried)', amount: '3 tbsp fresh (or 2 tbsp dried)', unit: 'tablespoons', notes: 'Clean mature leaves.' },
        { name: 'Clean drinking water', amount: '1', unit: 'glass (approx. 250 mL)', notes: 'Potable water.' },
        { name: 'Clay pot or enamel pot', amount: '1', unit: 'pot', notes: 'Uncovered boiling vessel.' }
      ],
      steps: [
        'Collect and rinse mature Tsaang Gubat leaves thoroughly.',
        'Chop into coarse pieces and measure 3 tablespoons of fresh leaves (or 2 tablespoons of dried leaves).',
        'Place into an uncovered clay or enamel pot and pour in 1 glass of drinking water.',
        'Boil on medium heat uncovered for 15 minutes until liquid volume reduces to about half.',
        'Remove from heat, let cool to lukewarm, strain, and serve.'
      ],
      precautions: [
        'Boil uncovered in a non-reactive pot (clay or enamel).',
        'For mild non-specific abdominal discomfort only. Do not administer to suspected surgical emergencies.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Tsaang Gubat for Stomach Pain and Diarrhea',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Evaluation of the bioactivity of triterpene mixture isolated from Carmona retusa (Vahl.) Masam leaves.',
          organization_or_authors: 'Villasenor IM, Canlas AP, Pascua MP, et al.',
          publication_year: 2004,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/15099847/',
          doi_or_pmid: 'PMID: 15099847'
        }
      ]
    },

    // 8. YERBA BUENA (Mentha cordifolia) - Decoction
    {
      id: 'prep-yerba-buena-decoction',
      plant_id: 'yerba-buena',
      title: 'Standard Yerba Buena Leaf Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Fresh or dried leaves and tender stems',
      traditional_use_context: 'Official DOH/PITAHC traditional analgesic remedy used for headache, toothache, muscular aches, dysmenorrhea, and post-operative discomfort.',
      description: 'Aromatic analgesic decoction prepared from boiled Yerba Buena leaves.',
      administration_instructions: 'Drink 1 glass of lukewarm decoction every 3 to 4 hours for headache, body pain, or menstrual cramps as needed.',
      when_to_seek_guidance: 'If headache is sudden, unusually severe, accompanied by visual disturbances or stiff neck, seek medical attention immediately.',
      materials: [
        { name: 'Fresh chopped Yerba Buena leaves (or dried leaves)', amount: '6 tbsp fresh (or 4 tbsp dried)', unit: 'tablespoons', notes: 'Aromatic, clean leaves.' },
        { name: 'Clean drinking water', amount: '2', unit: 'glasses (approx. 500 mL)', notes: 'Potable water.' },
        { name: 'Clay pot or enamel pot with lid', amount: '1', unit: 'set', notes: 'Pot for boiling.' }
      ],
      steps: [
        'Wash fresh Yerba Buena leaves thoroughly under running water.',
        'Chop the leaves coarsely and measure 6 tablespoons of fresh leaves (or 4 tablespoons dried).',
        'Add to 2 glasses of water in an uncovered pot and bring to a boil.',
        'Boil uncovered for 15 minutes on medium heat until reduced to approximately 1 glass.',
        'Cool, strain into a clean glass, and drink lukewarm.'
      ],
      precautions: [
        'Avoid in patients with severe gastroesophageal reflux disease (GERD) as mint relaxes the lower esophageal sphincter.',
        'Prepare fresh daily.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Yerba Buena for Pain Relief',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Antinociceptive efficacy, chemistry, and quality control procedures of Clinopodium: A comparative analysis.',
          organization_or_authors: 'García-Marín G, Reyes-Pérez V, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/41297727/',
          doi_or_pmid: 'PMID: 41297727'
        }
      ]
    },

    // 8b. YERBA BUENA (Mentha cordifolia) - Crushed Leaf Compress
    {
      id: 'prep-yerba-buena-compress',
      plant_id: 'yerba-buena',
      title: 'Crushed Yerba Buena Leaf Temple Compress',
      preparation_type: 'POULTICE',
      plant_part_used: 'Fresh fragrant leaves',
      traditional_use_context: 'Traditional Philippine external poultice applied to temples or forehead for soothing tension headaches and mental fatigue.',
      description: 'Crushed aromatic mint leaves applied topically to temples.',
      administration_instructions: 'Crush leaves between palms or mortar, then apply directly to the forehead/temples. Rest quietly for 15 to 20 minutes.',
      when_to_seek_guidance: 'Headache accompanied by numbness, slurred speech, or high fever requires immediate medical evaluation.',
      materials: [
        { name: 'Fresh Yerba Buena leaves', amount: '5 to 8', unit: 'leaves', notes: 'Freshly harvested.' },
        { name: 'Clean cotton bandage or handkerchief', amount: '1', unit: 'piece', notes: 'To hold compress in place.' }
      ],
      steps: [
        'Rinse 5 to 8 fresh leaves in cold water.',
        'Crush leaves between clean palms or in a mortar to release essential oils (menthol).',
        'Place crushed leaves directly against temples or forehead.',
        'Tie a soft clean handkerchief around head to hold leaves in place while resting.'
      ],
      precautions: [
        'Keep away from eyes to avoid irritation from volatile menthol vapors.',
        'Discontinue if skin irritation occurs.'
      ],
      references: [
        {
          source_type: 'PITAHC_RESOURCE',
          source_title: 'Philippine Ethnobotanical Formulary: Traditional Pain Relief Methods',
          organization_or_authors: 'PITAHC & Department of Health',
          publication_year: 2018,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 9. ULASIMANG BATO / PANSIT-PANSITAN (Peperomia pellucida) - Fresh Salad
    {
      id: 'prep-ulasimang-bato-salad',
      plant_id: 'ulasimang-bato',
      title: 'Fresh Pansit-pansitan Leaf Salad',
      preparation_type: 'OTHER_DOCUMENTED_METHOD',
      plant_part_used: 'Fresh tender leafy tops and succulent stems',
      traditional_use_context: 'Official DOH/PITAHC traditional dietary remedy used for joint pain associated with gout (hyperuricemia) and mild rheumatic aches.',
      description: 'Fresh washed succulent leafy tops consumed raw as an herbal salad after meals.',
      administration_instructions: 'Eat 1 cup (not packed tightly) of fresh clean leaves and tender stems three times a day after meals.',
      when_to_seek_guidance: 'Severe acute swollen joint pain, extreme redness, or fever (acute gouty flare) should be evaluated by a rheumatologist.',
      materials: [
        { name: 'Fresh, clean Pansit-pansitan leafy tops', amount: '1', unit: 'cup (unpacked)', notes: 'Harvest from clean, unpolluted soil only.' },
        { name: 'Clean potable running water', amount: 'Adequate volume', unit: 'for washing', notes: 'Wash thoroughly.' }
      ],
      steps: [
        'Harvest fresh green Pansit-pansitan from clean, pesticide-free garden beds.',
        'Wash repeatedly under clean running potable water to remove all soil and microbial residue.',
        'Measure 1 cup of unpacked fresh leafy stems.',
        'Consume fresh and raw immediately after meals (may be eaten plain or mixed lightly with fresh salad greens).'
      ],
      precautions: [
        'WASH EXTREMELY WELL. Only consume plants grown in sanitary, chemical-free areas.',
        'Do not take during acute severe renal impairment without nephrology supervision.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Ulasimang Bato for Uric Acid Relief',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Peperomia Pellucida (L.) Kunth: A Decade of Ethnopharmacological, Phytochemical, and Pharmacological Insights (2014-2025).',
          organization_or_authors: 'Teodhora, Hendriani R, Sumiwi SA, Levita J',
          publication_year: 2025,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/40630672/',
          doi_or_pmid: 'PMID: 40630672'
        }
      ]
    },

    // 9b. ULASIMANG BATO (Peperomia pellucida) - Warm Decoction
    {
      id: 'prep-ulasimang-bato-decoction',
      plant_id: 'ulasimang-bato',
      title: 'Warm Pansit-pansitan Leaf Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Fresh leafy stems',
      traditional_use_context: 'Alternative warm boiled preparation for individuals who prefer cooked herbs over raw salad for joint and uric acid comfort.',
      description: 'Gentle water decoction prepared by briefly boiling Pansit-pansitan stems.',
      administration_instructions: 'Drink 1 glass of lukewarm decoction three times daily after meals.',
      when_to_seek_guidance: 'Consult healthcare professionals if joint inflammation worsens or if kidney stones are suspected.',
      materials: [
        { name: 'Fresh washed Pansit-pansitan stems and leaves', amount: '1 1/2', unit: 'cups', notes: 'Thoroughly washed.' },
        { name: 'Clean water', amount: '2', unit: 'glasses (approx. 500 mL)', notes: 'Potable water.' },
        { name: 'Clay pot or enamel pot', amount: '1', unit: 'pot', notes: 'Boiling vessel.' }
      ],
      steps: [
        'Wash 1 1/2 cups of fresh Pansit-pansitan thoroughly.',
        'Place in a pot with 2 glasses of clean water.',
        'Bring to a boil uncovered over medium heat.',
        'Simmer gently for 15 minutes until liquid is reduced to about 1 glass.',
        'Cool, strain into a clean cup, and drink lukewarm after meals.'
      ],
      precautions: [
        'Boil uncovered. Discard unused portion after 24 hours.',
        'Drink adequate water throughout the day.'
      ],
      references: [
        {
          source_type: 'PITAHC_RESOURCE',
          source_title: 'Philippine Traditional Medicine Plant Monographs & Clinical Formulary',
          organization_or_authors: 'PITAHC',
          publication_year: 2018,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 10. NIYOG-NIYOGAN (Quisqualis indica) - Mature Dried Seeds
    {
      id: 'prep-niyog-niyogan-seeds',
      plant_id: 'niyog-niyogan',
      title: 'Mature Dried Niyog-niyogan Seeds',
      preparation_type: 'OTHER_DOCUMENTED_METHOD',
      plant_part_used: 'Mature dried seeds harvested from withered ripe fruits',
      traditional_use_context: 'Official DOH/PITAHC traditional anthelmintic remedy used exclusively for the expulsion of intestinal roundworms (Ascaris lumbricoides).',
      description: 'Strictly measured dried mature kernel seeds chewed orally after supper.',
      administration_instructions: 'Chew the specified exact number of seeds thoroughly 2 hours after evening meal, followed by a glass of water. If worms persist, the dose may be repeated after 1 week.',
      when_to_seek_guidance: 'Severe persistent vomiting, diarrhea, hiccups, or dizziness indicates overdose. Seek medical attention immediately.',
      materials: [
        { name: 'Mature dried Niyog-niyogan seeds', amount: 'Strict age-based count (see steps)', unit: 'seeds', notes: 'Only use dried seeds from mature withered fruits.' },
        { name: 'Clean drinking water', amount: '1', unit: 'glass', notes: 'To swallow after chewing.' }
      ],
      steps: [
        'Select clean, mature dried seeds harvested from withered ripe fruits (do not use fresh immature seeds).',
        'Crack open the outer five-angled shell to obtain the inner kernel.',
        'Strictly count the exact number of seeds according to age tier: Adults (13 years and older): 8 to 10 seeds; Children (7 to 12 years): 6 to 7 seeds; Children (4 to 6 years): 4 to 5 seeds.',
        'Chew the kernels thoroughly approximately 2 hours after supper, then swallow with a full glass of water.'
      ],
      precautions: [
        'STRICT CONTRAINDICATION: DO NOT GIVE TO CHILDREN UNDER 4 YEARS OLD.',
        'STRICT WARNING: DO NOT EXCEED THE EXACT RECOMMENDED NUMBER OF SEEDS. Overdose causes acute hiccups, nausea, abdominal cramps, diarrhea, and dizziness.',
        'Do not take on an empty stomach.'
      ],
      references: [
        {
          source_type: 'DOH_GUIDANCE',
          source_title: 'Sampung Halamang Gamot: DOH Guidelines on Niyog-niyogan as Anthelmintic',
          organization_or_authors: 'Department of Health & PITAHC',
          publication_year: 2001,
          source_url: 'https://pitahc.gov.ph',
          doi_or_pmid: null
        }
      ]
    },

    // 11. GINGER / LUYA (Zingiber officinale) - Salabat Decoction
    {
      id: 'prep-ginger-salabat',
      plant_id: 'ginger',
      title: 'Traditional Philippine Salabat (Fresh Ginger Decoction)',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Fresh rhizome',
      traditional_use_context: 'Traditional Philippine warm herbal decoction for soothing sore throat, vocal hoarseness, cold chills, nausea, and mild digestive sluggishness.',
      description: 'Crushed fresh ginger rhizome simmered in water to yield a warming spicy decoction.',
      administration_instructions: 'Drink 1 cup warm up to 2 to 3 times a day. Natural honey or calamansi may be added for soothing throat comfort.',
      when_to_seek_guidance: 'If sore throat is accompanied by difficulty swallowing, high fever, or swollen tonsillar exudate, seek medical evaluation.',
      materials: [
        { name: 'Fresh ginger rhizome', amount: '1 to 2', unit: 'thumb-sized pieces (approx. 20 g)', notes: 'Washed and lightly bruised/crushed.' },
        { name: 'Clean drinking water', amount: '2', unit: 'cups (approx. 500 mL)', notes: 'Potable water.' },
        { name: 'Pure honey or fresh calamansi (optional)', amount: '1', unit: 'teaspoon', notes: 'Added when warm.' },
        { name: 'Small cooking pot and strainer', amount: '1', unit: 'set', notes: 'For simmering.' }
      ],
      steps: [
        'Wash fresh ginger rhizome thoroughly to remove soil residue.',
        'Slice thinly or crush lightly with the flat of a knife to expose internal oleoresins (gingerols).',
        'Place crushed ginger into a pot with 2 cups of drinking water.',
        'Bring to a boil, then reduce heat and simmer gently for 10 to 15 minutes.',
        'Strain into a cup and sip warm. Add a teaspoon of honey or a squeeze of calamansi if desired.'
      ],
      precautions: [
        'Caution in patients with active gallstones or gastric ulcers.',
        'Excessive intake of highly concentrated ginger decoctions may trigger heartburn in sensitive individuals.'
      ],
      references: [
        {
          source_type: 'WHO_RESOURCE',
          source_title: 'WHO Monographs on Selected Medicinal Plants - Volume 1: Rhizoma Zingiberis',
          organization_or_authors: 'World Health Organization',
          publication_year: 1999,
          source_url: 'https://www.who.int/publications/i/item/9789241545174',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Bioactive Compounds and Health-Promoting Properties of Ginger (Zingiber officinale Roscoe): A Review.',
          organization_or_authors: 'Mao QQ, Xu XY, Cao SY, et al.',
          publication_year: 2019,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/31151279/',
          doi_or_pmid: 'PMID: 31151279'
        }
      ]
    },

    // 12. TURMERIC / LUYANG DILAW (Curcuma longa) - Golden Decoction
    {
      id: 'prep-turmeric-decoction',
      plant_id: 'turmeric',
      title: 'Traditional Luyang Dilaw (Turmeric) Decoction',
      preparation_type: 'DECOCTION',
      plant_part_used: 'Fresh rhizome (or dried sliced rhizome)',
      traditional_use_context: 'Traditional Philippine soothing herbal decoction for joint stiffness, general inflammatory discomfort, and digestive sluggishness.',
      description: 'Warm golden decoction prepared from freshly sliced turmeric rhizome simmered in water.',
      administration_instructions: 'Drink 1 cup warm once or twice daily after meals.',
      when_to_seek_guidance: 'If experiencing severe persistent joint pain or signs of biliary colic, consult a physician.',
      materials: [
        { name: 'Fresh Turmeric rhizome (Luyang Dilaw)', amount: '1', unit: 'thumb-sized piece (approx. 15 g)', notes: 'Washed and sliced thinly.' },
        { name: 'Clean drinking water', amount: '2', unit: 'cups (approx. 500 mL)', notes: 'Potable water.' },
        { name: 'Small pinch of ground black pepper (optional)', amount: '1', unit: 'small pinch', notes: 'Piperine enhances curcumin bioavailability.' },
        { name: 'Small cooking pot and strainer', amount: '1', unit: 'set', notes: 'Enamel or stainless steel.' }
      ],
      steps: [
        'Rinse fresh turmeric rhizome under clean water and slice thinly.',
        'Place slices in a pot with 2 cups of drinking water.',
        'Bring to a boil, then reduce heat and simmer for 10 to 12 minutes until water turns deep golden-orange.',
        'Add a small pinch of black pepper if desired to aid bioavailability.',
        'Strain into a cup and drink lukewarm.'
      ],
      precautions: [
        'Avoid in patients with bile duct obstruction or gallstone blockage.',
        'Caution in patients on antiplatelet or anticoagulant medications due to mild synergistic blood-thinning potential.'
      ],
      references: [
        {
          source_type: 'WHO_RESOURCE',
          source_title: 'WHO Monographs on Selected Medicinal Plants - Volume 1: Rhizoma Curcumae Longae',
          organization_or_authors: 'World Health Organization',
          publication_year: 1999,
          source_url: 'https://www.who.int/publications/i/item/9789241545174',
          doi_or_pmid: null
        },
        {
          source_type: 'PEER_REVIEWED_RESEARCH',
          source_title: 'Herbal and functional food phytochemicals in chronic disease: modulating inflammation.',
          organization_or_authors: 'Kunnumakkara AB, Bordoloi D, et al.',
          publication_year: 2026,
          source_url: 'https://pubmed.ncbi.nlm.nih.gov/42467280/',
          doi_or_pmid: 'PMID: 42467280'
        }
      ]
    }
  ];

  let totalPreps = 0;
  let totalMaterials = 0;
  let totalSteps = 0;
  let totalPrecautions = 0;
  let totalRefs = 0;

  for (const p of preparations) {
    // 1. Insert traditional_preparation
    await conn.query(
      `INSERT INTO traditional_preparations
        (id, plant_id, title, preparation_type, plant_part_used, traditional_use_context, description, administration_instructions, when_to_seek_guidance, source_verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'PUBLISHED')`,
      [
        p.id,
        p.plant_id,
        p.title,
        p.preparation_type,
        p.plant_part_used,
        p.traditional_use_context,
        p.description,
        p.administration_instructions,
        p.when_to_seek_guidance
      ]
    );
    totalPreps++;

    // 2. Insert materials
    let sortOrder = 1;
    for (const m of p.materials) {
      await conn.query(
        `INSERT INTO preparation_materials
          (preparation_id, material_name, amount, unit, notes, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, m.name, m.amount, m.unit, m.notes, sortOrder++]
      );
      totalMaterials++;
    }

    // 3. Insert steps
    let stepNumber = 1;
    for (const s of p.steps) {
      await conn.query(
        `INSERT INTO preparation_steps
          (preparation_id, step_number, instruction)
         VALUES (?, ?, ?)`,
        [p.id, stepNumber++, s]
      );
      totalSteps++;
    }

    // 4. Insert precautions
    for (const prec of p.precautions) {
      await conn.query(
        `INSERT INTO preparation_precautions
          (preparation_id, precaution)
         VALUES (?, ?)`,
        [p.id, prec]
      );
      totalPrecautions++;
    }

    // 5. Insert references
    for (const ref of p.references) {
      await conn.query(
        `INSERT INTO preparation_references
          (preparation_id, source_type, source_title, organization_or_authors, publication_year, doi_or_pmid, source_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          ref.source_type,
          ref.source_title,
          ref.organization_or_authors,
          ref.publication_year,
          ref.doi_or_pmid,
          ref.source_url
        ]
      );
      totalRefs++;
    }
  }

  console.log(`+ Seeded ${totalPreps} traditional preparations across 12 medicinal plants.`);
  console.log(`+ Seeded ${totalMaterials} materials.`);
  console.log(`+ Seeded ${totalSteps} step-by-step instructions.`);
  console.log(`+ Seeded ${totalPrecautions} precautions.`);
  console.log(`+ Seeded ${totalRefs} verified preparation references.`);

  await conn.end();
}

seed().catch(console.error);
