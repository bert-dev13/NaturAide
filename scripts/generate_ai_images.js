const fs = require('fs');
const path = require('path');

const targets = [
  {
    slug: 'charantia-ampalaya-capsule',
    prompt: 'Photorealistic commercial product photography of an amber supplement capsule bottle with generic minimalist botanical label, placed next to two herbal capsules containing green ampalaya powder and fresh sliced bitter gourd fruit and green vine leaves, warm cream studio background with soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'charantia-ampalaya-tea',
    prompt: 'Photorealistic commercial product photography of an artisanal herbal tea cardboard box package with generic minimalist botanical label, next to a ceramic teacup filled with steaming amber ampalaya tea, a dry herbal tea pyramid bag, and fresh green ampalaya fruit slices, clean warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'docteurs-choice-ampalaya-banaba-turmeric-garlic-capsule',
    prompt: 'Photorealistic commercial product photography of a premium herbal supplement bottle with generic minimalist botanical label, surrounded by whole garlic bulbs, yellow turmeric root slices, green banaba leaves, and sliced ampalaya bitter melon, with two herbal capsules on a warm cream studio background, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'flavonpro-yerba-buena-caplets',
    prompt: 'Photorealistic commercial product photography of a modern herbal caplet container with generic minimalist botanical label, displayed beside smooth green caplets and aromatic fresh Yerba Buena mint leaves and lagundi foliage on a warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'golden-spoon-lagundi-tea',
    prompt: 'Photorealistic commercial product photography of a premium kraft paper herbal tea pouch with generic minimalist botanical label, placed next to a clear glass cup of golden lagundi herbal tea with steam, dry tea leaves on a bamboo spoon, and fresh green lagundi leaves, warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'guavidone-bayabas-antiseptic-solution',
    prompt: 'Photorealistic commercial product photography of an amber medical dropper bottle with generic minimalist botanical label, beside fresh green bayabas guava leaves and a small ceramic dish containing golden-amber herbal liquid extract, warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'lakapulko-antifungal-lotion',
    prompt: 'Photorealistic commercial product photography of a sleek white herbal pump lotion dispenser bottle with generic minimalist botanical label, accompanied by fresh green Akapulko Cassia alata leaves and vibrant yellow candlebush flower blossoms, smooth lotion swatch, warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'nocof-lagundi-strawberry-syrup',
    prompt: 'Photorealistic commercial product photography of an amber glass pediatric cough syrup bottle with generic minimalist botanical label, next to fresh red strawberries, a small clear medicine measuring cup filled with pink-tinted syrup, and fresh green Lagundi leaves, clean warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'nutra-heal-akapulko-lotion',
    prompt: 'Photorealistic commercial product photography of a minimalist white cosmetic pump lotion bottle with generic botanical label, next to fresh green Akapulko ringworm bush leaves and a gentle dollop of herbal soothing skin lotion, clean warm cream studio background with soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-akapulko-soap',
    prompt: 'Photorealistic commercial product photography of a handcrafted natural botanical herbal bar soap with textured rustic cut, placed on a light wooden soap dish with fresh green Akapulko leaves and gentle botanical lather, clean warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-bayabas-soap',
    prompt: 'Photorealistic commercial product photography of a handmade organic herbal bar soap with generic minimalist botanical label, resting beside fresh green bayabas guava leaves and whole guava fruit slice, rich gentle lather, warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-lagundi-tablet',
    prompt: 'Photorealistic commercial product photography of a clean white pharmaceutical tablet container with generic minimalist botanical label, beside several smooth compressed herbal tablets and fresh vibrant green Lagundi leaves, clean warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-sambong-tablet',
    prompt: 'Photorealistic commercial product photography of a clean amber pharmaceutical bottle with generic minimalist botanical label, beside smooth compressed botanical tablets and aromatic serrated Sambong Blumea balsamifera leaves, clean warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-tsaang-gubat-tablet',
    prompt: 'Photorealistic commercial product photography of a modern minimalist herbal tablet bottle with generic botanical label, alongside small compressed herbal tablets and glossy dark green Tsaang Gubat Carmona retusa leaves, clean warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'pitahc-yerba-buena-tablet',
    prompt: 'Photorealistic commercial product photography of a white herbal health tablet container with generic minimalist botanical label, placed next to compressed herbal tablets and fresh aromatic Yerba Buena Mentha cordifolia peppermint-like leaves, clean warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'rhenalaid-sambong-500mg-tablet',
    prompt: 'Photorealistic commercial product photography of a premium herbal tablet bottle with generic minimalist botanical label, next to a foil blister pack showing round botanical tablets and fresh velvety green Sambong leaves, warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'triherbgi-tsaang-gubat-capsule',
    prompt: 'Photorealistic commercial product photography of an amber supplement capsule bottle with generic minimalist botanical label, surrounded by whole garlic cloves and fresh green Tsaang Gubat leaves with two clear botanical capsules, clean warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'uricare-sambong-250mg-tablet',
    prompt: 'Photorealistic commercial product photography of a compact white herbal tablet bottle with generic minimalist botanical label, next to small pediatric-friendly herbal tablets and fresh green Sambong leaves, clean warm cream studio background, soft natural shadows, centered composition, high clarity, 1:1 square'
  },
  {
    slug: 'wilson-bayabas-tea',
    prompt: 'Photorealistic commercial product photography of an artisanal kraft tea package with generic minimalist botanical label, next to a steaming glass cup of golden guava leaf herbal tea, dried tea leaves, and fresh green Bayabas guava leaves, clean warm cream studio background, soft natural lighting, centered composition, high clarity, 1:1 square'
  }
];

const outDir = path.join(process.cwd(), 'public', 'images', 'products', 'generated');

async function fetchWithRetry(url, maxRetries = 10) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'NatureAide-AI-Catalog/1.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 5000 && buf[0] === 0xff && buf[1] === 0xd8) {
          return buf;
        }
      }
      if (res.status === 402) {
        const bodyText = await res.text();
        const match = bodyText.match(/Retry after (\d+)s/i);
        const waitSec = match ? parseInt(match[1], 10) + 2 : 46;
        console.log(`[Rate Limit] Free limit active. Waiting ${waitSec}s as requested by API...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      console.warn(`Attempt ${attempt} returned status ${res.status}, retrying in 5s...`);
    } catch (err) {
      console.warn(`Attempt ${attempt} failed with ${err.message}, retrying in 5s...`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Failed to download after ${maxRetries} attempts`);
}

async function run() {
  console.log(`Starting generation for ${targets.length} products...`);
  let successCount = 0;

  for (const item of targets) {
    const targetFile = path.join(outDir, `${item.slug}.jpg`);
    if (fs.existsSync(targetFile)) {
      const s = fs.statSync(targetFile);
      if (s.size > 5000) {
        console.log(`[SKIP] Already exists: ${item.slug}.jpg (${s.size} bytes)`);
        successCount++;
        continue;
      }
    }

    const encoded = encodeURIComponent(item.prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?model=sana&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    console.log(`\nGenerating: ${item.slug}...`);
    try {
      const buf = await fetchWithRetry(url, 10);
      fs.writeFileSync(targetFile, buf);
      console.log(`✓ Saved ${item.slug}.jpg (${buf.length} bytes)`);
      successCount++;
      // Wait 46 seconds to avoid 402 rate limit on next product
      console.log(`[Cooldown] Waiting 46s for rate limit quota...`);
      await new Promise(r => setTimeout(r, 46000));
    } catch (err) {
      console.error(`✗ Error generating ${item.slug}:`, err.message);
    }
  }

  console.log(`\nGeneration completed! ${successCount}/${targets.length} generated.`);
}

run();
