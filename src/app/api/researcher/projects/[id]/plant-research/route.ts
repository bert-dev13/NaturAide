import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolvePlantImage } from "@/lib/record-images";
import {
  getBotanicalPlantRecord,
  VERIFIED_BOTANICAL_REGISTRY,
} from "@/lib/botanical-registry";
import { loadVerifiedPhytochemicals, resolveCanonicalPlantId } from "@/lib/phytochemical-catalog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify ownership or reviewer access
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.category as plantCategory,
             COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl,
             p.botanical_synonyms as plantSynonyms,
             p.local_names as plantLocalNames,
             p.plant_parts_used as plantPartsUsed,
             p.source_organization as plantSourceOrg,
             p.source_url as plantSourceUrl,
             p.source_verified as plantSourceVerified,
             p.simpleUse as plantSimpleUse,
             p.preparation as plantPreparation,
             p.safetyNote as plantSafetyNote
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? ${session.role === "RESEARCHER" ? "AND rp.researcherId = ?" : ""}
      LIMIT 1
      `,
      session.role === "RESEARCHER" ? [projectId, session.id] : [projectId]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];
    if (project.plantImageUrl) {
      project.plantImageUrl = resolvePlantImage(project.plantImageUrl);
    }

    // Resolve botanical registry information
    const canonicalId =
      resolveCanonicalPlantId(project.plantId) ||
      resolveCanonicalPlantId(project.plantScientificName) ||
      resolveCanonicalPlantId(project.plantName) ||
      project.plantId ||
      null;

    const registryRecord = canonicalId ? getBotanicalPlantRecord(canonicalId) : null;

    // Fetch existing research_plant_data record
    const [plantDataRows]: any = await pool.query(
      `SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1`,
      [projectId]
    );

    const existingPd = plantDataRows[0];
    const plantData = existingPd || {
      projectId,
      commonName: project.plantName,
      scientificName: project.plantScientificName || registryRecord?.scientificName || "",
      family: registryRecord?.family || "Not documented",
      localNames: registryRecord?.localNames || project.plantLocalNames || "Not documented",
      partsStudied: registryRecord?.documentedParts ? registryRecord.documentedParts.join(", ") : project.plantPartsUsed || "Leaves",
      traditionalUses: registryRecord?.traditionalUses || project.plantSimpleUse || "Not documented",
      ethnobotanicalNotes: registryRecord?.traditionalPreparations || project.plantPreparation || "Not documented",
      knownConstituents: "",
      researchNotes: "",
      specimenSource: "",
      collectionDate: "",
      collectionLocation: "",
      sampleIdentifier: "",
      authenticationMethod: registryRecord?.suggestedAuthenticationMethod || "Morphological identification & herbarium reference comparison",
      authenticatedBy: "",
      voucherSpecimenNumber: "",
      storageHandlingNotes: "",
      supportingDocumentUrl: null,
      materialType: "Crude Extract",
      extractionMethod: "",
      extractionSolvent: "",
      extractFractionName: "",
      authenticationStatus: "NOT_DOCUMENTED", // Default as per requirements
      selectionRationale: "",
      relevantCharacteristics: "",
      additionalBotanicalNotes: "",
    };

    // Ensure family is populated if available from registry
    if ((!plantData.family || plantData.family === "Not documented") && registryRecord?.family) {
      plantData.family = registryRecord.family;
    }

    const verifiedPhytochemicals = await loadVerifiedPhytochemicals({
      plantId: canonicalId || project.plantId,
      scientificName: project.plantScientificName,
      commonName: project.plantName || project.plantCustomName,
    });

    // Fetch currently selected study compounds for this project
    const [studyCompRows]: any = await pool.query(
      "SELECT id, compoundName, molecularFormula, molecularWeight, compoundClass, pubchemId FROM research_compounds WHERE projectId = ?",
      [projectId]
    );
    const studyCompoundNames = studyCompRows.map((r: any) => r.compoundName);

    // Fetch scientific literature for this plant
    let scientificLiterature: any[] = [];
    const firstCommon = project.plantName.split(" ")[0].replace(/[^a-zA-Z]/g, "");
    const [refRows]: any = await pool.query(
      `SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
              doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
              isExactProductStudied, source_verified, botanical_identity_verified, verification_source, evidence_scope
       FROM scientific_references
       WHERE plantOrIngredientStudied LIKE ? OR plantOrIngredientStudied LIKE ? 
          OR title LIKE ? OR title LIKE ?
       ORDER BY publicationYear DESC, isExactProductStudied DESC`,
      [`%${firstCommon}%`, `%${project.plantScientificName || ""}%`, `%${firstCommon}%`, `%${project.plantScientificName || ""}%`]
    );
    scientificLiterature = refRows;

    // Fetch currently linked literature for this project
    const [linkedRefRows]: any = await pool.query(
      "SELECT id, title, authors, year, journalSource, doiOrUrl, scientificReferenceId, pubmedId FROM literature_references WHERE projectId = ?",
      [projectId]
    );
    const linkedLiteratureIds = linkedRefRows
      .map((r: any) => r.scientificReferenceId || r.pubmedId || r.title)
      .filter(Boolean);

    // Checklist evaluation
    const hasPlantIdentity = Boolean(project.plantName && (project.plantScientificName || registryRecord?.scientificName));
    const hasPartIdentified = Boolean(plantData.partsStudied && plantData.partsStudied.trim().length > 0);

    const checklist = {
      hasPlantIdentity,
      hasPartIdentified,
    };

    const isReadyToComplete = hasPlantIdentity && hasPartIdentified;

    return NextResponse.json({
      success: true,
      project,
      verifiedPlant: {
        id: canonicalId || project.plantId,
        commonName: project.plantName,
        scientificName: project.plantScientificName || registryRecord?.scientificName || "Not documented",
        family: registryRecord?.family || plantData.family || "Not documented",
        synonyms: registryRecord?.botanicalSynonyms || project.plantSynonyms || "Not documented",
        localNames: registryRecord?.localNames || project.plantLocalNames || "Not documented",
        documentedParts: registryRecord?.documentedParts || (project.plantPartsUsed ? [project.plantPartsUsed] : ["Leaves"]),
        traditionalUses: registryRecord?.traditionalUses || project.plantSimpleUse || "Not documented",
        traditionalPreparations: registryRecord?.traditionalPreparations || project.plantPreparation || "Not documented",
        safetyNotes: registryRecord?.safetyNotes || project.plantSafetyNote || "Not documented",
        sourceOrg: registryRecord?.sourceOrganization || project.plantSourceOrg || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
        sourceUrl: registryRecord?.sourceUrl || project.plantSourceUrl || "https://pitahc.gov.ph",
        isPitahc: Boolean(registryRecord?.isPitahc ?? project.plantSourceVerified ?? project.plantId),
        imageUrl: project.plantImageUrl || registryRecord?.imageUrl || "/images/placeholder-plant.jpg",
        pharmacopeiaStatus: registryRecord?.pharmacopeiaStatus || "Philippine Medicinal Flora",
        suggestedAuthenticationMethod: registryRecord?.suggestedAuthenticationMethod || "Morphological verification & herbarium reference comparison",
      },
      plantData,
      verifiedPhytochemicals,
      studyCompoundNames,
      scientificLiterature,
      linkedLiterature: linkedRefRows,
      linkedLiteratureIds,
      checklist,
      isReadyToComplete,
    });
  } catch (error) {
    console.error("Plant research GET error:", error);
    return NextResponse.json({ error: "Failed to load plant research data" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const [pCheck]: any = await pool.query(
      "SELECT id, title, plantId, plantCustomName FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action || "save";

    // -------------------------------------------------------------------------
    // ACTION: TOGGLE STUDY COMPOUND (Section 1 -> Section 2 In-Silico bridge)
    // -------------------------------------------------------------------------
    if (action === "toggle-study-compound") {
      const { compound } = body;
      if (!compound || !compound.compoundName) {
        return NextResponse.json({ error: "Compound information is required." }, { status: 400 });
      }

      const [existing]: any = await pool.query(
        "SELECT id FROM research_compounds WHERE projectId = ? AND compoundName = ? LIMIT 1",
        [projectId, compound.compoundName]
      );

      let isAdded = false;
      if (existing.length > 0) {
        // Remove from research compounds
        await pool.query(
          "DELETE FROM research_compounds WHERE projectId = ? AND compoundName = ?",
          [projectId, compound.compoundName]
        );
        isAdded = false;
      } else {
        // Insert into research compounds
        await pool.query(
          `INSERT INTO research_compounds (
             projectId, compoundName, iupacName, smiles, molecularFormula,
             molecularWeight, pubchemId, sourceProvenance, plantSource,
             sourceReference, selectedForDocking, preparationStatus
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'READY_FOR_DOCKING')`,
          [
            projectId,
            compound.compoundName,
            compound.iupacName || null,
            compound.smiles || null,
            compound.molecularFormula || null,
            compound.molecularWeight || null,
            compound.pubchemId ? String(compound.pubchemId) : null,
            "VERIFIED_PLANT_DATABASE",
            compound.plantCommonName || body.plantName || "Botanical Specimen",
            compound.sourceReference || "Documented botanical constituent",
          ]
        );
        isAdded = true;
      }

      const [allCompRows]: any = await pool.query(
        "SELECT compoundName FROM research_compounds WHERE projectId = ?",
        [projectId]
      );
      const studyCompoundNames = allCompRows.map((r: any) => r.compoundName);

      return NextResponse.json({
        success: true,
        isAdded,
        studyCompoundNames,
        message: isAdded
          ? `Added ${compound.compoundName} to In-Silico study compounds.`
          : `Removed ${compound.compoundName} from study compounds.`,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: TOGGLE SCIENTIFIC LITERATURE CITATION
    // -------------------------------------------------------------------------
    if (action === "toggle-literature-reference") {
      const { reference } = body;
      if (!reference || !reference.title) {
        return NextResponse.json({ error: "Reference information is required." }, { status: 400 });
      }

      const refIdentifier = reference.id || reference.pubmedId || reference.title;
      const [existing]: any = await pool.query(
        `SELECT id FROM literature_references 
         WHERE projectId = ? AND (scientificReferenceId = ? OR pubmedId = ? OR title = ?)
         LIMIT 1`,
        [projectId, refIdentifier, reference.pubmedId || "", reference.title]
      );

      let isLinked = false;
      if (existing.length > 0) {
        await pool.query("DELETE FROM literature_references WHERE id = ?", [existing[0].id]);
        isLinked = false;
      } else {
        await pool.query(
          `INSERT INTO literature_references (
             researcherId, projectId, title, authors, year, journalSource,
             doiOrUrl, studyType, plantOrCompound, keyFindings, sourceType,
             scientificReferenceId, pubmedId, matrixCompleted
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED_DATABASE', ?, ?, 1)`,
          [
            session.id,
            projectId,
            reference.title,
            reference.authors || "Unspecified Authors",
            reference.publicationYear || new Date().getFullYear(),
            reference.journalOrPublisher || "Scientific Publication",
            reference.doi ? `https://doi.org/${reference.doi}` : reference.sourceUrl || null,
            reference.studyType || "Pharmacological & Clinical Study",
            reference.plantOrIngredientStudied || body.plantName || "Botanical Extract",
            reference.shortSummary || "Peer-reviewed scientific evidence.",
            refIdentifier,
            reference.pubmedId ? String(reference.pubmedId) : null,
          ]
        );
        isLinked = true;
      }

      const [linkedRows]: any = await pool.query(
        "SELECT id, title, authors, year, journalSource, doiOrUrl, scientificReferenceId, pubmedId FROM literature_references WHERE projectId = ?",
        [projectId]
      );
      const linkedLiteratureIds = linkedRows
        .map((r: any) => r.scientificReferenceId || r.pubmedId || r.title)
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        isLinked,
        linkedLiterature: linkedRows,
        linkedLiteratureIds,
        message: isLinked
          ? `Linked reference to research project citations.`
          : `Unlinked reference from project citations.`,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: CHANGE PLANT IN PROJECT
    // -------------------------------------------------------------------------
    if (action === "change-plant") {
      const { plantId, commonName, scientificName } = body;
      if (!plantId && !commonName) {
        return NextResponse.json({ error: "Plant ID or name is required." }, { status: 400 });
      }

      const canonicalId = resolveCanonicalPlantId(plantId) || plantId;
      const reg = getBotanicalPlantRecord(canonicalId) || getBotanicalPlantRecord(commonName);

      const finalCommonName = reg?.commonName || commonName || "Unspecified Plant";
      const finalScientificName = reg?.scientificName || scientificName || "";
      const family = reg?.family || "Not documented";
      const localNames = reg?.localNames || "Not documented";
      const traditionalUses = reg?.traditionalUses || "Not documented";
      const ethnobotanicalNotes = reg?.traditionalPreparations || "Not documented";
      const partsStudied = reg?.documentedParts ? reg.documentedParts.join(", ") : "Leaves";

      // Update project record
      await pool.query(
        `UPDATE research_projects 
         SET plantId = ?, plantCustomName = NULL, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [canonicalId, projectId]
      );

      // Upsert research_plant_data while preserving manual specimen authentication fields
      await pool.query(
        `
        INSERT INTO research_plant_data (
          projectId, commonName, scientificName, family, localNames, partsStudied,
          traditionalUses, ethnobotanicalNotes, authenticationMethod, authenticationStatus
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 'NOT_DOCUMENTED'
        )
        ON DUPLICATE KEY UPDATE
          commonName = VALUES(commonName),
          scientificName = VALUES(scientificName),
          family = VALUES(family),
          localNames = VALUES(localNames),
          partsStudied = COALESCE(NULLIF(partsStudied, ''), VALUES(partsStudied)),
          traditionalUses = VALUES(traditionalUses),
          ethnobotanicalNotes = VALUES(ethnobotanicalNotes),
          authenticationMethod = COALESCE(NULLIF(authenticationMethod, ''), VALUES(authenticationMethod)),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          projectId,
          finalCommonName,
          finalScientificName,
          family,
          localNames,
          partsStudied,
          traditionalUses,
          ethnobotanicalNotes,
          reg?.suggestedAuthenticationMethod || "Morphological verification & herbarium comparison",
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Project updated with ${finalCommonName} (${finalScientificName}).`,
        plant: {
          id: canonicalId,
          commonName: finalCommonName,
          scientificName: finalScientificName,
          family,
          localNames,
          traditionalUses,
          ethnobotanicalNotes,
          partsStudied,
        },
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: SAVE BOTANICAL & SPECIMEN DATA (Default Save)
    // -------------------------------------------------------------------------
    if (action === "save") {
      const {
        commonName,
        scientificName,
        family,
        localNames,
        partsStudied,
        traditionalUses,
        ethnobotanicalNotes,
        knownConstituents,
        researchNotes,
        specimenSource,
        collectionDate,
        collectionLocation,
        sampleIdentifier,
        authenticationMethod,
        authenticatedBy,
        voucherSpecimenNumber,
        storageHandlingNotes,
        supportingDocumentUrl,
        materialType,
        extractionMethod,
        extractionSolvent,
        extractFractionName,
        authenticationStatus,
        selectionRationale,
        relevantCharacteristics,
        additionalBotanicalNotes,
        plantId,
      } = body;

      // Update plantId on research_projects if provided
      if (plantId) {
        await pool.query(
          "UPDATE research_projects SET plantId = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [plantId, projectId]
        );
      }

      await pool.query(
        `
        INSERT INTO research_plant_data (
          projectId, commonName, scientificName, family, localNames, partsStudied,
          traditionalUses, ethnobotanicalNotes, knownConstituents, researchNotes,
          specimenSource, collectionDate, collectionLocation, sampleIdentifier,
          authenticationMethod, authenticatedBy, voucherSpecimenNumber,
          storageHandlingNotes, supportingDocumentUrl, materialType,
          extractionMethod, extractionSolvent, extractFractionName,
          authenticationStatus, selectionRationale, relevantCharacteristics,
          additionalBotanicalNotes, plantMaterialMass, solventConcentration,
          solventRatio, extractionTemperature, extractionDuration,
          extractYieldPercent, extractionReferences, isPublishedToCommunity
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, 0
        )
        ON DUPLICATE KEY UPDATE
          commonName = COALESCE(VALUES(commonName), commonName),
          scientificName = COALESCE(VALUES(scientificName), scientificName),
          family = COALESCE(VALUES(family), family),
          localNames = COALESCE(VALUES(localNames), localNames),
          partsStudied = VALUES(partsStudied),
          traditionalUses = COALESCE(VALUES(traditionalUses), traditionalUses),
          ethnobotanicalNotes = COALESCE(VALUES(ethnobotanicalNotes), ethnobotanicalNotes),
          knownConstituents = VALUES(knownConstituents),
          researchNotes = VALUES(researchNotes),
          specimenSource = VALUES(specimenSource),
          collectionDate = VALUES(collectionDate),
          collectionLocation = VALUES(collectionLocation),
          sampleIdentifier = VALUES(sampleIdentifier),
          authenticationMethod = VALUES(authenticationMethod),
          authenticatedBy = VALUES(authenticatedBy),
          voucherSpecimenNumber = VALUES(voucherSpecimenNumber),
          storageHandlingNotes = VALUES(storageHandlingNotes),
          supportingDocumentUrl = VALUES(supportingDocumentUrl),
          materialType = VALUES(materialType),
          extractionMethod = VALUES(extractionMethod),
          extractionSolvent = VALUES(extractionSolvent),
          extractFractionName = VALUES(extractFractionName),
          authenticationStatus = VALUES(authenticationStatus),
          selectionRationale = VALUES(selectionRationale),
          relevantCharacteristics = VALUES(relevantCharacteristics),
          additionalBotanicalNotes = VALUES(additionalBotanicalNotes),
          plantMaterialMass = COALESCE(VALUES(plantMaterialMass), plantMaterialMass),
          solventConcentration = COALESCE(VALUES(solventConcentration), solventConcentration),
          solventRatio = COALESCE(VALUES(solventRatio), solventRatio),
          extractionTemperature = COALESCE(VALUES(extractionTemperature), extractionTemperature),
          extractionDuration = COALESCE(VALUES(extractionDuration), extractionDuration),
          extractYieldPercent = COALESCE(VALUES(extractYieldPercent), extractYieldPercent),
          extractionReferences = COALESCE(VALUES(extractionReferences), extractionReferences),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          projectId,
          commonName || null,
          scientificName || null,
          family || null,
          localNames || null,
          partsStudied || null,
          traditionalUses || null,
          ethnobotanicalNotes || null,
          knownConstituents || null,
          researchNotes || null,
          specimenSource || null,
          collectionDate || null,
          collectionLocation || null,
          sampleIdentifier || null,
          authenticationMethod || null,
          authenticatedBy || null,
          voucherSpecimenNumber || null,
          storageHandlingNotes || null,
          supportingDocumentUrl || null,
          materialType || "Crude Extract",
          extractionMethod || null,
          extractionSolvent || null,
          extractFractionName || null,
          authenticationStatus || "NOT_DOCUMENTED",
          selectionRationale || null,
          relevantCharacteristics || null,
          additionalBotanicalNotes || null,
          body.plantMaterialMass || null,
          body.solventConcentration || null,
          body.solventRatio || null,
          body.extractionTemperature || null,
          body.extractionDuration || null,
          body.extractYieldPercent || null,
          body.extractionReferences || null,
        ]
      );

      // Log activity
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_SAVED', 'Updated botanical specimen & authentication records for Section 1')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Botanical identity and specimen authentication records saved successfully.",
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: COMPLETE STEP 1
    // -------------------------------------------------------------------------
    if (action === "complete-stage") {
      const [dataRows]: any = await pool.query(
        "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      const pd = dataRows[0] || {};

      if (!pd.partsStudied || !pd.partsStudied.trim()) {
        return NextResponse.json({ error: "Plant part being investigated must be identified." }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Plant identity and experimental plant parts verified.",
      });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error) {
    console.error("Plant research POST error:", error);
    return NextResponse.json({ error: "Failed to process plant research action" }, { status: 500 });
  }
}
