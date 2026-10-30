import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLatestUserScreening } from "@/lib/safety-server";
import {
  executeChatWithFallback,
  resolveContextAndKnowledge,
  buildSystemPrompt,
  MANDATORY_DISCLAIMER,
  ChatMessageParam,
} from "@/lib/ai-assistant-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plantParam = searchParams.get("plant");
    const productParam = searchParams.get("product");
    const prepParam = searchParams.get("preparation");

    // Get active (non-archived) conversation for user
    let [convs]: any = await pool.query(
      "SELECT id, title, currentPlantId, currentProductId, currentPreparationId, activeContextType FROM conversations WHERE userId = ? AND isArchived = 0 ORDER BY updatedAt DESC LIMIT 1",
      [session.id]
    );

    let convId: number;
    let currentPlantId = null;
    let currentProductId = null;
    let currentPreparationId = null;
    let activeContextType = "NONE";

    if (convs.length === 0) {
      const [insertRes]: any = await pool.query(
        "INSERT INTO conversations (userId, title, isArchived) VALUES (?, 'Herbal Educational Chat', 0)",
        [session.id]
      );
      convId = insertRes.insertId;
    } else {
      convId = convs[0].id;
      currentPlantId = convs[0].currentPlantId;
      currentProductId = convs[0].currentProductId;
      currentPreparationId = convs[0].currentPreparationId;
      activeContextType = convs[0].activeContextType || "NONE";
    }

    // Handle Page -> Chat context query parameters
    if (plantParam) {
      const [plants]: any = await pool.query(
        "SELECT id, slug, commonName, scientificName FROM plants WHERE id = ? OR slug = ? LIMIT 1",
        [plantParam, plantParam]
      );
      if (plants.length > 0) {
        currentPlantId = plants[0].id;
        currentProductId = null;
        currentPreparationId = null;
        activeContextType = "PLANT";
        await pool.query(
          "UPDATE conversations SET currentPlantId = ?, currentProductId = NULL, currentPreparationId = NULL, activeContextType = 'PLANT', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [currentPlantId, convId]
        );
      }
    } else if (productParam) {
      const [products]: any = await pool.query(
        "SELECT id, slug, name, brandName FROM herbal_products WHERE id = ? OR slug = ? LIMIT 1",
        [productParam, productParam]
      );
      if (products.length > 0) {
        currentProductId = products[0].id;
        currentPlantId = null;
        currentPreparationId = null;
        activeContextType = "PRODUCT";
        await pool.query(
          "UPDATE conversations SET currentProductId = ?, currentPlantId = NULL, currentPreparationId = NULL, activeContextType = 'PRODUCT', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [currentProductId, convId]
        );
      }
    } else if (prepParam) {
      const [preps]: any = await pool.query(
        "SELECT id, plant_id, title FROM traditional_preparations WHERE id = ? LIMIT 1",
        [prepParam]
      );
      if (preps.length > 0) {
        currentPreparationId = preps[0].id;
        currentPlantId = preps[0].plant_id;
        currentProductId = null;
        activeContextType = "PREPARATION";
        await pool.query(
          "UPDATE conversations SET currentPreparationId = ?, currentPlantId = ?, currentProductId = NULL, activeContextType = 'PREPARATION', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [currentPreparationId, currentPlantId, convId]
        );
      }
    }

    // Resolve active context details for the frontend
    let activeContext: any = null;
    if ((activeContextType === "PLANT" || activeContextType === "PREPARATION") && currentPlantId) {
      const [pRows]: any = await pool.query(
        "SELECT id, slug, commonName, scientificName, simpleUse FROM plants WHERE id = ? LIMIT 1",
        [currentPlantId]
      );
      if (pRows.length > 0) {
        activeContext = {
          type: activeContextType,
          id: pRows[0].id,
          slug: pRows[0].slug,
          name: pRows[0].commonName,
          scientificName: pRows[0].scientificName,
          simpleUse: pRows[0].simpleUse,
        };
      }
    } else if (activeContextType === "PRODUCT" && currentProductId) {
      const [prRows]: any = await pool.query(
        "SELECT id, slug, name, brandName, manufacturer, dosageForm FROM herbal_products WHERE id = ? LIMIT 1",
        [currentProductId]
      );
      if (prRows.length > 0) {
        activeContext = {
          type: "PRODUCT",
          id: prRows[0].id,
          slug: prRows[0].slug,
          name: prRows[0].name,
          brandName: prRows[0].brandName,
          manufacturer: prRows[0].manufacturer,
          dosageForm: prRows[0].dosageForm,
        };
      }
    }

    // Fetch messages for active conversation
    const [messages]: any = await pool.query(
      "SELECT id, sender, content, metadata, createdAt FROM messages WHERE conversationId = ? ORDER BY createdAt ASC",
      [convId]
    );

    const formattedMessages = messages.map((m: any) => {
      let card = null;
      if (m.metadata) {
        try {
          card = typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata;
        } catch {
          card = null;
        }
      }
      return {
        id: m.id,
        sender: m.sender,
        content: m.content,
        card,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      conversationId: convId,
      activeContext,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, plantId, productId, preparationId } = await request.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userText = message.trim();

    // Verify or find active conversation
    let convId = conversationId;
    let currentPlantId = null;
    let currentProductId = null;
    let currentPreparationId = null;
    let activeContextType = "NONE";

    if (!convId) {
      const [convs]: any = await pool.query(
        "SELECT id, currentPlantId, currentProductId, currentPreparationId, activeContextType FROM conversations WHERE userId = ? AND isArchived = 0 ORDER BY updatedAt DESC LIMIT 1",
        [session.id]
      );
      if (convs.length > 0) {
        convId = convs[0].id;
        currentPlantId = convs[0].currentPlantId;
        currentProductId = convs[0].currentProductId;
        currentPreparationId = convs[0].currentPreparationId;
        activeContextType = convs[0].activeContextType || "NONE";
      } else {
        const [insertRes]: any = await pool.query(
          "INSERT INTO conversations (userId, title, isArchived) VALUES (?, 'Herbal Educational Chat', 0)",
          [session.id]
        );
        convId = insertRes.insertId;
      }
    } else {
      const [convs]: any = await pool.query(
        "SELECT id, currentPlantId, currentProductId, currentPreparationId, activeContextType FROM conversations WHERE id = ? AND userId = ? LIMIT 1",
        [convId, session.id]
      );
      if (convs.length > 0) {
        currentPlantId = convs[0].currentPlantId;
        currentProductId = convs[0].currentProductId;
        currentPreparationId = convs[0].currentPreparationId;
        activeContextType = convs[0].activeContextType || "NONE";
      }
    }

    // Explicit overrides from client if passed
    if (plantId) {
      currentPlantId = plantId;
      currentProductId = null;
      activeContextType = "PLANT";
    } else if (productId) {
      currentProductId = productId;
      currentPlantId = null;
      activeContextType = "PRODUCT";
    } else if (preparationId) {
      currentPreparationId = preparationId;
      activeContextType = "PREPARATION";
    }

    // Save user message to MySQL
    const [userMsgRes]: any = await pool.query(
      "INSERT INTO messages (conversationId, sender, content) VALUES (?, 'USER', ?)",
      [convId, userText]
    );

    // 1. Check user screening status
    const screening = await getLatestUserScreening(session.id);
    const screeningOutcome = !screening
      ? "NO_SCREENING"
      : screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED"
      ? "PROFESSIONAL_GUIDANCE_REQUIRED"
      : "ELIGIBLE_TO_CONTINUE";

    // 2. Resolve conversational context and query grounded knowledge from MySQL
    const resolution = await resolveContextAndKnowledge(userText, {
      currentPlantId,
      currentProductId,
      currentPreparationId,
      activeContextType,
    });

    // 3. Persist updated context in conversation record in MySQL
    if (resolution.activeType !== "NONE") {
      currentPlantId = resolution.plantId;
      currentProductId = resolution.productId;
      currentPreparationId = resolution.preparationId || null;
      activeContextType = resolution.activeType;
      await pool.query(
        "UPDATE conversations SET currentPlantId = ?, currentProductId = ?, currentPreparationId = ?, activeContextType = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [currentPlantId, currentProductId, currentPreparationId, activeContextType, convId]
      );
    } else {
      await pool.query("UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [convId]);
    }

    // 4. Build concise system prompt with strict grounding
    const systemPrompt = buildSystemPrompt(
      screeningOutcome,
      resolution.knowledgeContextText,
      resolution.isUnknownEntity
    );

    // 5. Retrieve recent conversation history
    const [recentMsgs]: any = await pool.query(
      "SELECT sender, content FROM messages WHERE conversationId = ? ORDER BY id DESC LIMIT 6",
      [convId]
    );
    const history = (recentMsgs || []).reverse();

    const formattedMessages: ChatMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.sender === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
    ];

    if (formattedMessages[formattedMessages.length - 1]?.content !== userText) {
      formattedMessages.push({ role: "user", content: userText });
    }

    // 6. Execute chat with grounded fallback
    const result = await executeChatWithFallback(formattedMessages, resolution.groundedFallbackAnswer);
    const assistantResponse = result.content;

    // 7. Save assistant response with structured card metadata to MySQL
    const cardMetadataJson = resolution.cardData ? JSON.stringify(resolution.cardData) : null;
    const [asstMsgRes]: any = await pool.query(
      "INSERT INTO messages (conversationId, sender, content, metadata) VALUES (?, 'ASSISTANT', ?, ?)",
      [convId, assistantResponse, cardMetadataJson]
    );

    return NextResponse.json({
      success: true,
      userMessage: {
        id: userMsgRes.insertId,
        sender: "USER",
        content: userText,
      },
      assistantMessage: {
        id: asstMsgRes.insertId,
        sender: "ASSISTANT",
        content: assistantResponse,
        card: resolution.cardData,
      },
      activeContext: {
        type: resolution.activeType,
        plantId: resolution.plantId,
        productId: resolution.productId,
        name: resolution.activeEntityName,
        slug: resolution.activeEntitySlug,
      },
      modelUsed: result.modelUsed,
      fallbackCount: result.fallbackCount,
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all existing non-archived conversations as archived
    await pool.query(
      "UPDATE conversations SET isArchived = 1, updatedAt = CURRENT_TIMESTAMP(3) WHERE userId = ? AND isArchived = 0",
      [session.id]
    );

    // Create a fresh active conversation
    const [insertRes]: any = await pool.query(
      "INSERT INTO conversations (userId, title, isArchived) VALUES (?, 'Herbal Educational Chat', 0)",
      [session.id]
    );

    return NextResponse.json({
      success: true,
      conversationId: insertRes.insertId,
      message: "Conversation successfully cleared",
    });
  } catch (error) {
    console.error("Chat DELETE error:", error);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}
