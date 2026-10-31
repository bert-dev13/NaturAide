import assert from "node:assert";
import {
  classifyIntent,
  detectExplicitEntity,
  isContextualFollowUp,
  assessEvidenceLevel,
  normalizeMessage,
  isGreeting,
  isThanks,
  isGeneralQuestion,
} from "../src/lib/community-chat-router";
import { resolveContextAndKnowledge } from "../src/lib/ai-assistant-service";
import pool from "../src/lib/db";

async function runTestSuite() {
  console.log("=== RUNNING ASK NATURAIDE MULTI-TURN TEST SUITE ===\n");

  // 1. Unit Tests on Intent Classification
  console.log("1. Checking Intent Classification...");
  assert.strictEqual(classifyIntent("hi"), "GREETING");
  assert.strictEqual(classifyIntent("hello"), "GREETING");
  assert.strictEqual(classifyIntent("good morning"), "GREETING");
  assert.strictEqual(classifyIntent("kumusta po"), "GREETING");
  assert.strictEqual(classifyIntent("thanks"), "THANKS");
  assert.strictEqual(classifyIntent("thank you so much"), "THANKS");
  assert.strictEqual(classifyIntent("what is medicinal plants"), "GENERAL_QUESTION");
  assert.strictEqual(classifyIntent("what are medicinal plants"), "GENERAL_QUESTION");
  assert.strictEqual(classifyIntent("what is a medicinal plant"), "GENERAL_QUESTION");
  assert.strictEqual(classifyIntent("how is it prepared"), "PREPARATION");
  assert.strictEqual(classifyIntent("what are its precautions"), "SAFETY");
  assert.strictEqual(classifyIntent("what are the verified clinical benefits of sambong for kidney health"), "EVIDENCE");
  assert.strictEqual(classifyIntent("show me lagundi products"), "PRODUCTS");
  console.log("✓ Intent Classification passed.\n");

  // 2. Unit Tests on Follow-up Detection
  console.log("2. Checking Contextual Follow-up Detection...");
  assert.strictEqual(
    isContextualFollowUp("what are its precautions", { type: "PLANT", id: "sambong", name: "Sambong" }, true),
    true
  );
  assert.strictEqual(
    isContextualFollowUp("how do i prepare it", { type: "PLANT", id: "sambong", name: "Sambong" }, true),
    true
  );
  assert.strictEqual(
    isContextualFollowUp("what evidence supports that", { type: "PLANT", id: "sambong", name: "Sambong" }, true),
    true
  );
  // Unrelated messages are NOT follow-ups
  assert.strictEqual(
    isContextualFollowUp("hello", { type: "PLANT", id: "sambong", name: "Sambong" }, true),
    false
  );
  assert.strictEqual(
    isContextualFollowUp("what is medicinal plants", { type: "PLANT", id: "sambong", name: "Sambong" }, true),
    false
  );
  // Broken eligibility disables follow-up
  assert.strictEqual(
    isContextualFollowUp("what are its precautions", { type: "PLANT", id: "sambong", name: "Sambong" }, false),
    false
  );
  console.log("✓ Contextual Follow-up Detection passed.\n");

  // 3. Multi-turn Scenario Tests
  console.log("3. Executing Multi-turn Scenario Tests A through J...\n");

  // TEST A: Greeting after plant
  console.log("-> TEST A: Greeting after plant");
  const resA1 = await resolveContextAndKnowledge("Tell me about Sambong");
  assert.strictEqual(resA1.activeType, "PLANT");
  assert.strictEqual(resA1.plantId, "sambong");

  const resA2 = await resolveContextAndKnowledge("hello", {
    currentPlantId: resA1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: false,
  });
  assert.strictEqual(resA2.intent, "GREETING");
  assert.strictEqual(resA2.activeType, "NONE");
  assert.strictEqual(resA2.plantId, null);
  assert.strictEqual(resA2.cardData, null, "TEST A: Greeting must NOT attach a Sambong card");
  assert.match(resA2.assistantDirectAnswer || "", /Hi!/);
  console.log("✓ TEST A Passed: Greeting after plant returns greeting without plant card.\n");

  // TEST B: Genuine follow-up
  console.log("-> TEST B: Genuine follow-up");
  const resB1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resB2 = await resolveContextAndKnowledge("What are its precautions?", {
    currentPlantId: resB1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resB2.activeType, "PLANT");
  assert.strictEqual(resB2.plantId, "sambong");
  assert.strictEqual(resB2.intent, "SAFETY");
  assert.notStrictEqual(resB2.cardData, null);
  assert.strictEqual(resB2.cardData?.type, "SAFETY");
  console.log("✓ TEST B Passed: Follow-up correctly resolves 'its' to Sambong precautions.\n");

  // TEST C: Entity switch
  console.log("-> TEST C: Entity switch");
  const resC1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resC2 = await resolveContextAndKnowledge("What about Lagundi?", {
    currentPlantId: resC1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resC2.activeType, "PLANT");
  assert.strictEqual(resC2.plantId, "lagundi", "Explicit Lagundi must supersede previous Sambong");

  const resC3 = await resolveContextAndKnowledge("How is it prepared?", {
    currentPlantId: resC2.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resC3.activeType, "PLANT");
  assert.strictEqual(resC3.plantId, "lagundi", "Subsequent follow-up must resolve to Lagundi, NOT Sambong");
  assert.strictEqual(resC3.intent, "PREPARATION");
  console.log("✓ TEST C Passed: Entity switch successfully replaced Sambong with Lagundi.\n");

  // TEST D: General topic
  console.log("-> TEST D: General topic");
  const resD1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resD2 = await resolveContextAndKnowledge("What is a medicinal plant?", {
    currentPlantId: resD1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: false,
  });
  assert.strictEqual(resD2.intent, "GENERAL_QUESTION");
  assert.strictEqual(resD2.activeType, "NONE");
  assert.strictEqual(resD2.cardData, null, "TEST D: General question must NOT attach Sambong card");
  assert.match(resD2.assistantDirectAnswer || "", /Medicinal plants are plants/);
  console.log("✓ TEST D Passed: General question does not inherit Sambong.\n");

  // TEST E: Products
  console.log("-> TEST E: Products for explicit plant");
  const resE1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resE2 = await resolveContextAndKnowledge("Show me Lagundi products", {
    currentPlantId: resE1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resE2.activeType, "PLANT");
  assert.strictEqual(resE2.plantId, "lagundi", "Explicit Lagundi must override previous Sambong context");
  assert.strictEqual(resE2.intent, "PRODUCTS");
  assert.match(resE2.cardData?.title || "", /Lagundi/);
  console.log("✓ TEST E Passed: Explicit Lagundi products returned, not Sambong.\n");

  // TEST F: Thanks
  console.log("-> TEST F: Thanks");
  const resF1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resF2 = await resolveContextAndKnowledge("thanks", {
    currentPlantId: resF1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resF2.intent, "THANKS");
  assert.strictEqual(resF2.activeType, "NONE");
  assert.strictEqual(resF2.cardData, null);
  assert.match(resF2.assistantDirectAnswer || "", /You're welcome/);
  console.log("✓ TEST F Passed: Friendly acknowledgement without plant card.\n");

  // TEST G: Follow-up evidence
  console.log("-> TEST G: Follow-up evidence");
  const resG1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resG2 = await resolveContextAndKnowledge("What evidence supports that?", {
    currentPlantId: resG1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resG2.activeType, "PLANT");
  assert.strictEqual(resG2.plantId, "sambong");
  assert.strictEqual(resG2.intent, "EVIDENCE");
  assert.strictEqual(resG2.cardData?.type, "EVIDENCE");
  console.log("✓ TEST G Passed: Correctly resolved Sambong evidence follow-up.\n");

  // TEST H: Context interruption
  console.log("-> TEST H: Context interruption");
  // Sambong -> hello -> What is a medicinal plant? -> What are its precautions?
  const resH = await resolveContextAndKnowledge("What are its precautions?", {
    currentPlantId: null,
    activeContextType: "NONE",
    isEntityEligible: false,
  });
  assert.strictEqual(resH.activeType, "NONE");
  assert.strictEqual(resH.cardData, null);
  assert.match(resH.assistantDirectAnswer || "", /Which medicinal plant would you like precautions for/);
  console.log("✓ TEST H Passed: Ambiguous follow-up asks for plant disambiguation.\n");

  // TEST I: New plant
  console.log("-> TEST I: New plant");
  const resI1 = await resolveContextAndKnowledge("Tell me about Sambong");
  const resI2 = await resolveContextAndKnowledge("Tell me about Ampalaya", {
    currentPlantId: resI1.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resI2.plantId, "ampalaya");

  const resI3 = await resolveContextAndKnowledge("What are its documented uses?", {
    currentPlantId: resI2.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(resI3.plantId, "ampalaya");
  console.log("✓ TEST I Passed: New plant Ampalaya cleanly replaces Sambong.\n");

  // TEST J: Evidence wording
  console.log("-> TEST J: Evidence wording (no 'clinically proven')");
  const resJ = await resolveContextAndKnowledge(
    "What are the verified clinical benefits of Sambong for kidney health?"
  );
  const textJ = (resJ.groundedFallbackAnswer || "").toLowerCase();
  assert.doesNotMatch(textJ, /clinically proven/, "Must NOT contain 'clinically proven'");
  assert.doesNotMatch(textJ, /proven to dissolve/, "Must NOT claim proven to dissolve kidney stones");
  assert.match(textJ, /preclinical/i, "Must identify evidence as preclinical / monograph");
  console.log("✓ TEST J Passed: Evidence wording accurately notes preclinical status without 'clinically proven'.\n");

  console.log("=== ALL MULTI-TURN REGRESSION TESTS PASSED (10/10) ===\n");

  // 4. Section 24 Conversational AI & Grounding Test Scenarios
  console.log("4. Executing Section 24 Conversational AI & Grounding Scenarios (1 to 17)...\n");

  // SCENARIO 1: Greeting
  console.log("-> SCENARIO 1: 'hi'");
  const sc1 = await resolveContextAndKnowledge("hi");
  assert.strictEqual(sc1.intent, "GREETING");
  assert.strictEqual(sc1.activeType, "NONE");
  assert.strictEqual(sc1.cardData, null);
  assert.match(sc1.assistantDirectAnswer || "", /Hi!/);
  console.log("✓ SCENARIO 1 Passed: 'hi' returns greeting, no card.\n");

  // SCENARIO 2: How are you?
  console.log("-> SCENARIO 2: 'how are you?'");
  const sc2 = await resolveContextAndKnowledge("how are you?");
  assert.strictEqual(sc2.intent, "CONVERSATION");
  assert.strictEqual(sc2.activeType, "NONE");
  assert.strictEqual(sc2.cardData, null);
  assert.match(sc2.assistantDirectAnswer || "", /doing well/i);
  console.log("✓ SCENARIO 2 Passed: 'how are you?' returns friendly response, no card.\n");

  // SCENARIO 3: Thank you
  console.log("-> SCENARIO 3: 'thank you'");
  const sc3 = await resolveContextAndKnowledge("thank you");
  assert.strictEqual(sc3.intent, "THANKS");
  assert.strictEqual(sc3.activeType, "NONE");
  assert.strictEqual(sc3.cardData, null);
  assert.match(sc3.assistantDirectAnswer || "", /welcome/i);
  console.log("✓ SCENARIO 3 Passed: 'thank you' returns polite acknowledgement, no card.\n");

  // SCENARIO 4: Tell me a joke
  console.log("-> SCENARIO 4: 'tell me a joke'");
  const sc4 = await resolveContextAndKnowledge("tell me a joke");
  assert.strictEqual(sc4.intent, "CONVERSATION");
  assert.strictEqual(sc4.activeType, "NONE");
  assert.strictEqual(sc4.cardData, null);
  assert.match(sc4.assistantDirectAnswer || "", /green|doctor|leaf/i);
  console.log("✓ SCENARIO 4 Passed: 'tell me a joke' returns playful joke, no card.\n");

  // SCENARIO 5: What is photosynthesis?
  console.log("-> SCENARIO 5: 'what is photosynthesis?'");
  const sc5 = await resolveContextAndKnowledge("what is photosynthesis?");
  assert.strictEqual(sc5.intent, "GENERAL_KNOWLEDGE");
  assert.strictEqual(sc5.activeType, "NONE");
  assert.strictEqual(sc5.cardData, null);
  assert.match(sc5.assistantDirectAnswer || "", /photosynthesis/i);
  assert.match(sc5.assistantDirectAnswer || "", /chlorophyll|sunlight|glucose/i);
  console.log("✓ SCENARIO 5 Passed: 'what is photosynthesis?' returns clear educational explanation, no card.\n");

  // SCENARIO 6: What are medicinal plants?
  console.log("-> SCENARIO 6: 'what are medicinal plants?'");
  const sc6 = await resolveContextAndKnowledge("what are medicinal plants?");
  assert.strictEqual(sc6.activeType, "NONE");
  assert.strictEqual(sc6.cardData, null);
  assert.match(sc6.assistantDirectAnswer || "", /medicinal plants/i);
  console.log("✓ SCENARIO 6 Passed: 'what are medicinal plants?' returns conceptual overview, no card.\n");

  // SCENARIO 7: What is biodiversity?
  console.log("-> SCENARIO 7: 'what is biodiversity?'");
  const sc7 = await resolveContextAndKnowledge("what is biodiversity?");
  assert.strictEqual(sc7.activeType, "NONE");
  assert.strictEqual(sc7.cardData, null);
  assert.match(sc7.assistantDirectAnswer || "", /biodiversity/i);
  console.log("✓ SCENARIO 7 Passed: 'what is biodiversity?' returns educational definition, no card.\n");

  // SCENARIO 8 & 9: User name memory
  console.log("-> SCENARIO 8 & 9: 'My name is Maria' -> 'what is my name?'");
  const sc8 = await resolveContextAndKnowledge("My name is Maria");
  assert.strictEqual(sc8.intent, "CONVERSATION");
  assert.strictEqual(sc8.cardData, null);
  assert.match(sc8.assistantDirectAnswer || "", /Maria/);

  const sc9 = await resolveContextAndKnowledge("what is my name?", {
    recentMessages: [
      { sender: "USER", content: "My name is Maria" },
      { sender: "ASSISTANT", content: "Nice to meet you, Maria!" },
    ],
  });
  assert.strictEqual(sc9.intent, "CONVERSATION");
  assert.strictEqual(sc9.cardData, null);
  assert.match(sc9.assistantDirectAnswer || "", /Your name is Maria\./);
  console.log("✓ SCENARIOS 8 & 9 Passed: User name introduction and recall works perfectly.\n");

  // SCENARIO 10: Grounded Lagundi query (no marketing fluff)
  console.log("-> SCENARIO 10: 'What is Lagundi used for?'");
  const sc10 = await resolveContextAndKnowledge("What is Lagundi used for?");
  assert.strictEqual(sc10.activeType, "PLANT");
  assert.strictEqual(sc10.plantId, "lagundi");
  assert.notStrictEqual(sc10.cardData, null);
  assert.doesNotMatch(sc10.groundedFallbackAnswer || "", /clinically proven/i, "Must NOT contain 'clinically proven'");
  assert.match(sc10.groundedFallbackAnswer || "", /respiratory|cough/i);
  console.log("✓ SCENARIO 10 Passed: Lagundi query grounded without unverified marketing claims.\n");

  // SCENARIO 11: Follow-up preparation
  console.log("-> SCENARIO 11: 'How is it prepared?' (after Lagundi)");
  const sc11 = await resolveContextAndKnowledge("How is it prepared?", {
    currentPlantId: sc10.plantId,
    activeContextType: "PLANT",
    isEntityEligible: true,
  });
  assert.strictEqual(sc11.activeType, "PLANT");
  assert.strictEqual(sc11.plantId, "lagundi");
  assert.strictEqual(sc11.intent, "PREPARATION");
  assert.strictEqual(sc11.cardData?.type, "PREPARATION");
  console.log("✓ SCENARIO 11 Passed: 'How is it prepared?' correctly resolves to Lagundi.\n");

  // SCENARIO 12: Conversational query after plant context
  console.log("-> SCENARIO 12: 'How are you?' (after Lagundi)");
  const sc12 = await resolveContextAndKnowledge("How are you?", {
    currentPlantId: sc11.plantId,
    activeContextType: "PLANT",
    isEntityEligible: false,
  });
  assert.strictEqual(sc12.intent, "CONVERSATION");
  assert.strictEqual(sc12.activeType, "NONE");
  assert.strictEqual(sc12.cardData, null, "Casual chat must not attach Lagundi card");
  assert.match(sc12.assistantDirectAnswer || "", /doing well/i);
  console.log("✓ SCENARIO 12 Passed: 'How are you?' does not inherit plant context or card.\n");

  // SCENARIO 13: Entity switch to Sambong
  console.log("-> SCENARIO 13: 'Now tell me about Sambong.'");
  const sc13 = await resolveContextAndKnowledge("Now tell me about Sambong.");
  assert.strictEqual(sc13.activeType, "PLANT");
  assert.strictEqual(sc13.plantId, "sambong");
  assert.strictEqual(sc13.cardData?.type, "PLANT");
  console.log("✓ SCENARIO 13 Passed: Entity switch to Sambong succeeds.\n");

  // SCENARIO 14: Products containing plant
  console.log("-> SCENARIO 14: 'What products contain Lagundi?'");
  const sc14 = await resolveContextAndKnowledge("What products contain Lagundi?");
  assert.strictEqual(sc14.activeType, "PLANT");
  assert.strictEqual(sc14.plantId, "lagundi");
  assert.strictEqual(sc14.intent, "PRODUCTS");
  assert.strictEqual(sc14.cardData?.type, "PRODUCT");
  assert.match(sc14.groundedFallbackAnswer || "", /commercial herbal product/i);
  console.log("✓ SCENARIO 14 Passed: Products containing Lagundi returned from database.\n");

  // SCENARIO 15: Exact database count
  console.log("-> SCENARIO 15: 'How many Lagundi studies are stored in NaturAide?'");
  const sc15 = await resolveContextAndKnowledge("How many Lagundi studies are stored in NaturAide?");
  assert.strictEqual(sc15.activeType, "PLANT");
  assert.strictEqual(sc15.plantId, "lagundi");
  assert.strictEqual(sc15.intent, "EVIDENCE");
  assert.match(sc15.groundedFallbackAnswer || "", /indexes exactly \d+ verified scientific reference/i);
  console.log("✓ SCENARIO 15 Passed: Exact database study count reported.\n");

  // SCENARIO 16: Clarifying 0 clinical trials for Sambong
  console.log("-> SCENARIO 16: 'What clinical trials does NaturAide have for Sambong?'");
  const sc16 = await resolveContextAndKnowledge("What clinical trials does NaturAide have for Sambong?");
  assert.strictEqual(sc16.activeType, "PLANT");
  assert.strictEqual(sc16.plantId, "sambong");
  assert.match(sc16.groundedFallbackAnswer || "", /0 human clinical trials/i);
  assert.match(sc16.groundedFallbackAnswer || "", /preclinical/i);
  console.log("✓ SCENARIO 16 Passed: Clarified 0 clinical trials with preclinical/monograph status.\n");

  // SCENARIO 17: Emergency escalation
  console.log("-> SCENARIO 17: 'I have severe difficulty breathing. What herb should I use?'");
  const sc17 = await resolveContextAndKnowledge("I have severe difficulty breathing. What herb should I use?");
  assert.strictEqual(sc17.intent, "EMERGENCY");
  assert.strictEqual(sc17.activeType, "NONE");
  assert.strictEqual(sc17.cardData, null);
  assert.match(sc17.assistantDirectAnswer || "", /EMERGENCY MEDICAL NOTICE/);
  assert.doesNotMatch(sc17.assistantDirectAnswer || "", /take lagundi|drink tea/i, "Must not prescribe herbs during emergency");
  console.log("✓ SCENARIO 17 Passed: Emergency escalation triggered immediately, no herb recommended.\n");

  console.log("=== ALL 17 CONVERSATIONAL UPGRADE SCENARIOS PASSED ===\n");
}

runTestSuite()
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

