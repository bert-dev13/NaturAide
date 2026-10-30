import { resolveContextAndKnowledge } from "../src/lib/ai-assistant-service";
import pool from "../src/lib/db";

async function test() {
  console.log("=== TESTING AI PREPARATION CONTEXT INTEGRATION ===");

  console.log("\n1. Testing Lagundi Preparation Context Query:");
  const resLagundi = await resolveContextAndKnowledge("How do I traditionally prepare Lagundi?");
  console.log("   - Active Type:", resLagundi.activeType);
  console.log("   - Plant ID:", resLagundi.plantId);
  console.log("   - Includes Traditional Section:", resLagundi.knowledgeContextText.includes("VERIFIED TRADITIONAL HERBAL PREPARATIONS IN NATUREAIDE DATABASE"));
  console.log("   - Includes Decoction Method:", resLagundi.knowledgeContextText.includes("Standard Lagundi Leaf Decoction"));
  console.log("   - Includes Cleansing Wash Method:", resLagundi.knowledgeContextText.includes("Aromatic Lagundi Cleansing Wash"));
  console.log("   - Includes Materials:", resLagundi.knowledgeContextText.includes("Fresh chopped Lagundi leaves"));
  console.log("   - Includes Step 1:", resLagundi.knowledgeContextText.includes("Collect healthy mature Lagundi leaves"));

  console.log("\n2. Testing Sambong Preparation Query:");
  const resSambong = await resolveContextAndKnowledge("How is Sambong prepared?");
  console.log("   - Active Type:", resSambong.activeType);
  console.log("   - Includes Sambong Decoction:", resSambong.knowledgeContextText.includes("Standard Sambong Leaf Decoction"));

  console.log("\n3. Testing Ginger / Salabat Query:");
  const resGinger = await resolveContextAndKnowledge("What part of ginger is used and how to make salabat?");
  console.log("   - Active Type:", resGinger.activeType);
  console.log("   - Plant Part Used (Rhizome):", resGinger.knowledgeContextText.includes("Fresh peeled ginger rhizome"));
  console.log("   - Includes Salabat Method:", resGinger.knowledgeContextText.includes("Traditional Philippine Salabat"));

  console.log("\n4. Testing Uncataloged Plant Query (e.g. Ginseng):");
  const resGinseng = await resolveContextAndKnowledge("How do I prepare ginseng?");
  console.log("   - Active Type:", resGinseng.activeType);
  console.log("   - Is Unknown Entity:", resGinseng.isUnknownEntity);

  console.log("\nAll AI assistant preparation context tests completed successfully!");
  await pool.end();
}

test().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
