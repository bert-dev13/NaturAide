import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolvePlantImage } from "@/lib/record-images";

export async function GET(
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

    // Verify ownership and fetch project with linked plant details
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.category as plantCategory,
             p.imageUrl as plantImageUrl,
             p.botanical_synonyms as plantSynonyms,
             p.local_names as plantLocalNames,
             p.plant_parts_used as plantPartsUsed,
             p.source_organization as plantSourceOrg,
             p.source_url as plantSourceUrl,
             p.source_verified as plantSourceVerified
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];
    if (project.plantImageUrl) {
      project.plantImageUrl = resolvePlantImage(project.plantImageUrl);
    }

    // Fetch existing research_plant_data record
    const [plantDataRows]: any = await pool.query(
      `SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1`,
      [projectId]
    );

    const plantData = plantDataRows[0] || {
      projectId,
      commonName: project.plantName,
      scientificName: project.plantScientificName || "",
      family: project.plantFamily || "",
      localNames: project.plantLocalNames || "",
      partsStudied: project.plantPartsUsed || "",
      traditionalUses: "",
      ethnobotanicalNotes: "",
      knownConstituents: "",
      researchNotes: "",
      specimenSource: "",
      collectionDate: "",
      collectionLocation: "",
      sampleIdentifier: "",
      authenticationMethod: "",
      authenticatedBy: "",
      voucherSpecimenNumber: "",
      storageHandlingNotes: "",
      supportingDocumentUrl: null,
      materialType: "Crude Extract",
      extractionMethod: "",
      extractionSolvent: "",
      extractFractionName: "",
      authenticationStatus: "NOT_DOCUMENTED",
      selectionRationale: "",
      relevantCharacteristics: "",
      additionalBotanicalNotes: "",
    };

    // Checklist criteria evaluation
    const hasPlantIdentity = Boolean(project.plantId || project.plantCustomName);
    const hasPartIdentified = Boolean(plantData.partsStudied && plantData.partsStudied.trim().length > 0);
    const hasSpecimenSource = Boolean(plantData.specimenSource && plantData.specimenSource.trim().length > 0);
    const hasMaterialDocumented = Boolean(
      plantData.materialType &&
      (plantData.materialType !== "Crude Extract" && plantData.materialType !== "Fraction"
        ? true
        : Boolean(plantData.extractionMethod?.trim() || plantData.extractionSolvent?.trim() || plantData.extractFractionName?.trim()))
    );
    const hasRequiredNotes = Boolean(
      plantData.selectionRationale?.trim() && plantData.relevantCharacteristics?.trim()
    );

    const checklist = {
      hasPlantIdentity,
      hasPartIdentified,
      hasSpecimenSource,
      hasMaterialDocumented,
      hasRequiredNotes,
    };

    const isReadyToComplete =
      hasPlantIdentity &&
      hasPartIdentified &&
      hasSpecimenSource &&
      hasMaterialDocumented &&
      hasRequiredNotes;

    return NextResponse.json({
      success: true,
      project,
      verifiedPlant: {
        id: project.plantId,
        commonName: project.plantName,
        scientificName: project.plantScientificName,
        family: project.plantFamily,
        synonyms: project.plantSynonyms,
        localNames: project.plantLocalNames,
        partsUsed: project.plantPartsUsed,
        sourceOrg: project.plantSourceOrg || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
        sourceUrl: project.plantSourceUrl,
        isVerified: Boolean(project.plantSourceVerified || project.plantId),
        imageUrl: project.plantImageUrl,
      },
      plantData,
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
      } = body;

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
          additionalBotanicalNotes, isPublishedToCommunity
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, 0
        )
        ON DUPLICATE KEY UPDATE
          commonName = VALUES(commonName),
          scientificName = VALUES(scientificName),
          family = VALUES(family),
          localNames = VALUES(localNames),
          partsStudied = VALUES(partsStudied),
          traditionalUses = VALUES(traditionalUses),
          ethnobotanicalNotes = VALUES(ethnobotanicalNotes),
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
        ]
      );

      // Log activity
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_SAVED', 'Updated botanical specimen & material documentation for Stage 2')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Plant research & specimen documentation saved successfully.",
      });
    }

    if (action === "complete-stage") {
      // Validate checklist
      const [dataRows]: any = await pool.query(
        "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      const pd = dataRows[0] || {};

      if (!pd.partsStudied || !pd.partsStudied.trim()) {
        return NextResponse.json({ error: "Plant part being investigated must be identified." }, { status: 400 });
      }
      if (!pd.specimenSource || !pd.specimenSource.trim()) {
        return NextResponse.json({ error: "Specimen / sample source must be documented." }, { status: 400 });
      }
      if (
        (pd.materialType === "Crude Extract" || pd.materialType === "Fraction") &&
        !pd.extractionMethod?.trim() &&
        !pd.extractionSolvent?.trim() &&
        !pd.extractFractionName?.trim()
      ) {
        return NextResponse.json({ error: "Extraction details (method, solvent, or extract name) are required for extract materials." }, { status: 400 });
      }
      if (!pd.selectionRationale?.trim()) {
        return NextResponse.json({ error: "Plant selection rationale must be documented." }, { status: 400 });
      }
      if (!pd.relevantCharacteristics?.trim()) {
        return NextResponse.json({ error: "Relevant plant characteristics must be documented." }, { status: 400 });
      }

      // Mark Stage 2 COMPLETED
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND stageKey = 'plant-research'
        `,
        [projectId]
      );

      // Set Stage 3 Literature & Evidence to IN_PROGRESS
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = CASE WHEN status = 'NOT_STARTED' THEN 'IN_PROGRESS' ELSE status END,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND stageKey = 'literature'
        `,
        [projectId]
      );

      // Update project currentStage to literature and update progress
      await pool.query(
        `
        UPDATE research_projects
        SET currentStage = 'literature',
            progressPercent = GREATEST(progressPercent, 17),
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [projectId]
      );

      // Log completion activity
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 2: Plant Research & Specimen Authentication and progressed to Stage 3: Literature & Evidence')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Plant Research completed. Continuing to Literature & Evidence.",
        nextStage: "literature",
        redirectUrl: `/researcher/projects/${projectId}/literature`,
      });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error) {
    console.error("Plant research POST error:", error);
    return NextResponse.json({ error: "Failed to process plant research action" }, { status: 500 });
  }
}
