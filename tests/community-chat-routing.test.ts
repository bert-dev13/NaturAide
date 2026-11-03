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

  // 5. Section 26 Multilingual & Herbal Knowledge Query Tests (26 queries)
  console.log("5. Executing Section 26 Multilingual & Herbal Knowledge Tests (1 to 26)...\n");

  // Query 1: 'I have a cough'
  console.log("-> Query 1: 'I have a cough'");
  const q1 = await resolveContextAndKnowledge("I have a cough");
  assert.strictEqual(q1.intent, "SYMPTOM");
  assert.strictEqual(q1.activeType, "PLANT");
  assert.strictEqual(q1.plantId, "lagundi");
  assert.notStrictEqual(q1.cardData, null);
  assert.doesNotMatch(q1.groundedFallbackAnswer || "", /I can chat with you, explain general nature/);
  console.log("✓ Query 1 Passed: 'I have a cough' resolves to Lagundi without generic message.\n");

  // Query 2: 'Ano ang mga halamang para sa ubo?'
  console.log("-> Query 2: 'Ano ang mga halamang para sa ubo?'");
  const q2 = await resolveContextAndKnowledge("Ano ang mga halamang para sa ubo?");
  assert.strictEqual(q2.intent, "SYMPTOM");
  assert.strictEqual(q2.activeType, "PLANT");
  assert.strictEqual(q2.plantId, "lagundi");
  assert.strictEqual(q2.detectedLanguage, "fil");
  assert.notStrictEqual(q2.cardData, null);
  assert.doesNotMatch(q2.groundedFallbackAnswer || "", /I can chat with you, explain general nature/);
  assert.match(q2.groundedFallbackAnswer || "", /Lagundi|ubo/i);
  console.log("✓ Query 2 Passed: 'Ano ang mga halamang para sa ubo?' resolves to Lagundi in Filipino.\n");

  // Query 3: 'May ubo ako'
  console.log("-> Query 3: 'May ubo ako'");
  const q3 = await resolveContextAndKnowledge("May ubo ako");
  assert.strictEqual(q3.intent, "SYMPTOM");
  assert.strictEqual(q3.plantId, "lagundi");
  console.log("✓ Query 3 Passed: 'May ubo ako' resolves to Lagundi.\n");

  // Query 4: 'Inuubo ako'
  console.log("-> Query 4: 'Inuubo ako'");
  const q4 = await resolveContextAndKnowledge("Inuubo ako");
  assert.strictEqual(q4.intent, "SYMPTOM");
  assert.strictEqual(q4.plantId, "lagundi");
  console.log("✓ Query 4 Passed: 'Inuubo ako' resolves to Lagundi.\n");

  // Query 5: 'Ano ang pwede sa ubo?'
  console.log("-> Query 5: 'Ano ang pwede sa ubo?'");
  const q5 = await resolveContextAndKnowledge("Ano ang pwede sa ubo?");
  assert.strictEqual(q5.intent, "SYMPTOM");
  assert.strictEqual(q5.plantId, "lagundi");
  console.log("✓ Query 5 Passed: 'Ano ang pwede sa ubo?' resolves to Lagundi.\n");

  // Query 6: 'Anong herbal ang pwede sa ubo?'
  console.log("-> Query 6: 'Anong herbal ang pwede sa ubo?'");
  const q6 = await resolveContextAndKnowledge("Anong herbal ang pwede sa ubo?");
  assert.strictEqual(q6.intent, "SYMPTOM");
  assert.strictEqual(q6.plantId, "lagundi");
  console.log("✓ Query 6 Passed: 'Anong herbal ang pwede sa ubo?' resolves to Lagundi.\n");

  // Query 7: 'May herbal medicine ba for cough?'
  console.log("-> Query 7: 'May herbal medicine ba for cough?'");
  const q7 = await resolveContextAndKnowledge("May herbal medicine ba for cough?");
  assert.strictEqual(q7.intent, "SYMPTOM");
  assert.strictEqual(q7.plantId, "lagundi");
  console.log("✓ Query 7 Passed: 'May herbal medicine ba for cough?' resolves to Lagundi.\n");

  // Query 8: 'My stomach hurts'
  console.log("-> Query 8: 'My stomach hurts'");
  const q8 = await resolveContextAndKnowledge("My stomach hurts");
  assert.strictEqual(q8.intent, "SYMPTOM");
  assert.strictEqual(q8.activeType, "PLANT");
  assert.strictEqual(q8.plantId, "tsaang-gubat");
  console.log("✓ Query 8 Passed: 'My stomach hurts' resolves to Tsaang Gubat.\n");

  // Query 9: 'Masakit ang tiyan ko'
  console.log("-> Query 9: 'Masakit ang tiyan ko'");
  const q9 = await resolveContextAndKnowledge("Masakit ang tiyan ko");
  assert.strictEqual(q9.intent, "SYMPTOM");
  assert.strictEqual(q9.plantId, "tsaang-gubat");
  console.log("✓ Query 9 Passed: 'Masakit ang tiyan ko' resolves to Tsaang Gubat.\n");

  // Query 10: 'Masakit ang ulo ko'
  console.log("-> Query 10: 'Masakit ang ulo ko'");
  const q10 = await resolveContextAndKnowledge("Masakit ang ulo ko");
  assert.strictEqual(q10.intent, "SYMPTOM");
  assert.strictEqual(q10.plantId, "yerba-buena");
  console.log("✓ Query 10 Passed: 'Masakit ang ulo ko' resolves to Yerba Buena.\n");

  // Query 11: 'May bato sa kidney'
  console.log("-> Query 11: 'May bato sa kidney'");
  const q11 = await resolveContextAndKnowledge("May bato sa kidney");
  assert.strictEqual(q11.intent, "SYMPTOM");
  assert.strictEqual(q11.plantId, "sambong");
  console.log("✓ Query 11 Passed: 'May bato sa kidney' resolves to Sambong.\n");

  // Query 12: 'Mataas ang asukal sa dugo'
  console.log("-> Query 12: 'Mataas ang asukal sa dugo'");
  const q12 = await resolveContextAndKnowledge("Mataas ang asukal sa dugo");
  assert.strictEqual(q12.intent, "SYMPTOM");
  assert.strictEqual(q12.plantId, "ampalaya");
  console.log("✓ Query 12 Passed: 'Mataas ang asukal sa dugo' resolves to Ampalaya.\n");

  // Query 13: 'Mataas ang uric acid at sumasakit ang kasu-kasuan'
  console.log("-> Query 13: 'Mataas ang uric acid at sumasakit ang kasu-kasuan'");
  const q13 = await resolveContextAndKnowledge("Mataas ang uric acid at sumasakit ang kasu-kasuan");
  assert.strictEqual(q13.intent, "SYMPTOM");
  assert.strictEqual(q13.plantId, "ulasimang-bato");
  console.log("✓ Query 13 Passed: 'Mataas ang uric acid' resolves to Ulasimang Bato.\n");

  // Query 14: 'May buni sa balat'
  console.log("-> Query 14: 'May buni sa balat'");
  const q14 = await resolveContextAndKnowledge("May buni sa balat");
  assert.strictEqual(q14.intent, "SYMPTOM");
  assert.strictEqual(q14.plantId, "akapulko");
  console.log("✓ Query 14 Passed: 'May buni sa balat' resolves to Akapulko.\n");

  // Query 15: 'Nahihirapang huminga ako'
  console.log("-> Query 15: 'Nahihirapang huminga ako'");
  const q15 = await resolveContextAndKnowledge("Nahihirapang huminga ako");
  assert.strictEqual(q15.intent, "EMERGENCY");
  assert.strictEqual(q15.activeType, "NONE");
  assert.match(q15.assistantDirectAnswer || "", /EMERGENCY/);
  console.log("✓ Query 15 Passed: 'Nahihirapang huminga ako' triggers emergency route.\n");

  // Query 16: 'Safe ba ang Lagundi sa bata?'
  console.log("-> Query 16: 'Safe ba ang Lagundi sa bata?'");
  const q16 = await resolveContextAndKnowledge("Safe ba ang Lagundi sa bata?");
  assert.strictEqual(q16.intent, "SAFETY");
  assert.strictEqual(q16.plantId, "lagundi");
  assert.strictEqual(q16.cardData?.type, "SAFETY");
  console.log("✓ Query 16 Passed: 'Safe ba ang Lagundi sa bata?' resolves to Lagundi safety.\n");

  // Query 17: 'Pwede ba sa buntis ang Sambong?'
  console.log("-> Query 17: 'Pwede ba sa buntis ang Sambong?'");
  const q17 = await resolveContextAndKnowledge("Pwede ba sa buntis ang Sambong?");
  assert.strictEqual(q17.intent, "SAFETY");
  assert.strictEqual(q17.plantId, "sambong");
  assert.strictEqual(q17.cardData?.type, "SAFETY");
  console.log("✓ Query 17 Passed: 'Pwede ba sa buntis ang Sambong?' resolves to Sambong safety.\n");

  // Query 18: 'Paano ihanda ang Lagundi?'
  console.log("-> Query 18: 'Paano ihanda ang Lagundi?'");
  const q18 = await resolveContextAndKnowledge("Paano ihanda ang Lagundi?");
  assert.strictEqual(q18.intent, "PREPARATION");
  assert.strictEqual(q18.plantId, "lagundi");
  assert.strictEqual(q18.cardData?.type, "PREPARATION");
  console.log("✓ Query 18 Passed: 'Paano ihanda ang Lagundi?' resolves to Lagundi preparation.\n");

  // Query 19: 'May studies ba sa Sambong?'
  console.log("-> Query 19: 'May studies ba sa Sambong?'");
  const q19 = await resolveContextAndKnowledge("May studies ba sa Sambong?");
  assert.strictEqual(q19.intent, "EVIDENCE");
  assert.strictEqual(q19.plantId, "sambong");
  assert.strictEqual(q19.cardData?.type, "EVIDENCE");
  console.log("✓ Query 19 Passed: 'May studies ba sa Sambong?' resolves to Sambong evidence.\n");

  // Query 20: 'Show me Lagundi products'
  console.log("-> Query 20: 'Show me Lagundi products'");
  const q20 = await resolveContextAndKnowledge("Show me Lagundi products");
  assert.strictEqual(q20.intent, "PRODUCTS");
  assert.strictEqual(q20.plantId, "lagundi");
  assert.strictEqual(q20.cardData?.type, "PRODUCT");
  console.log("✓ Query 20 Passed: 'Show me Lagundi products' resolves to Lagundi products.\n");

  // Query 21: 'Lagundi vs Tsaang Gubat'
  console.log("-> Query 21: 'Lagundi vs Tsaang Gubat'");
  const q21 = await resolveContextAndKnowledge("Lagundi vs Tsaang Gubat");
  assert.strictEqual(q21.intent, "PLANT_COMPARISON");
  assert.strictEqual(q21.plantId, "lagundi");
  assert.strictEqual(q21.secondaryPlantId, "tsaang-gubat");
  assert.match(q21.cardData?.title || "", /Lagundi vs Tsaang Gubat/);
  console.log("✓ Query 21 Passed: 'Lagundi vs Tsaang Gubat' compares both plants.\n");

  // Query 22: 'Ano ang pinagkaiba ng Sambong at Lagundi?'
  console.log("-> Query 22: 'Ano ang pinagkaiba ng Sambong at Lagundi?'");
  const q22 = await resolveContextAndKnowledge("Ano ang pinagkaiba ng Sambong at Lagundi?");
  assert.strictEqual(q22.intent, "PLANT_COMPARISON");
  assert.match(q22.cardData?.title || "", /vs/i);
  console.log("✓ Query 22 Passed: 'Ano ang pinagkaiba ng Sambong at Lagundi?' compares both plants.\n");

  // Query 23: 'What does binding affinity -7.5 kcal/mol mean?'
  console.log("-> Query 23: 'What does binding affinity -7.5 kcal/mol mean?'");
  const q23 = await resolveContextAndKnowledge("What does binding affinity -7.5 kcal/mol mean?");
  assert.strictEqual(q23.intent, "RESEARCH_EXPLANATION");
  assert.match(q23.groundedFallbackAnswer || "", /binding affinity|kcal\/mol/i);
  console.log("✓ Query 23 Passed: 'What does binding affinity -7.5 kcal/mol mean?' explains in-silico concept.\n");

  // Query 24: 'Explain molecular docking in simple terms'
  console.log("-> Query 24: 'Explain molecular docking in simple terms'");
  const q24 = await resolveContextAndKnowledge("Explain molecular docking in simple terms");
  assert.strictEqual(q24.intent, "RESEARCH_EXPLANATION");
  assert.match(q24.groundedFallbackAnswer || "", /docking|simulation|lock/i);
  console.log("✓ Query 24 Passed: 'Explain molecular docking' explains simulation concept.\n");

  // Query 25: 'What medicinal plants do you know?'
  console.log("-> Query 25: 'What medicinal plants do you know?'");
  const q25 = await resolveContextAndKnowledge("What medicinal plants do you know?");
  assert.strictEqual(q25.intent, "GENERAL_QUESTION");
  assert.match(q25.assistantDirectAnswer || "", /10 Philippine medicinal plants|Lagundi|Sambong/i);
  console.log("✓ Query 25 Passed: 'What medicinal plants do you know?' lists the 10 PITAHC plants.\n");

  // Query 26: 'Anong mga halamang gamot ang alam mo?'
  console.log("-> Query 26: 'Anong mga halamang gamot ang alam mo?'");
  const q26 = await resolveContextAndKnowledge("Anong mga halamang gamot ang alam mo?");
  assert.strictEqual(q26.intent, "GENERAL_QUESTION");
  assert.match(q26.assistantDirectAnswer || "", /10 halamang gamot|Lagundi|Sambong/i);
  console.log("✓ Query 26 Passed: 'Anong mga halamang gamot ang alam mo?' lists the 10 PITAHC plants in Filipino.\n");

  console.log("=== ALL 26 MULTILINGUAL & HERBAL KNOWLEDGE TEST QUERIES PASSED ===\n");
}

runTestSuite()
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

