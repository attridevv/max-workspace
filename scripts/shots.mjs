// Screenshot rig — captures every section at desktop + mobile for visual review.
// Usage: node scripts/shots.mjs [url]   (default http://localhost:4321)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:4321';
const out = '/tmp/max-workspace-shots';
mkdirSync(out, { recursive: true });

const sections = [
  ['#top', 'hero'],
  ['#problem', 'problem'],
  ['#method', 'method'],
  ['#why', 'why'],
  ['#philosophy', 'philosophy'],
  ['#start', 'start'],
  ['#example', 'example'],
  ['#companion', 'companion'],
  ['#archive', 'archive'],
  ['#review', 'review'],
  ['#capture', 'capture'],
  ['#privacy', 'privacy'],
  ['#cta', 'cta'],
  ['footer', 'footer'],
];

const browser = await chromium.launch();
const warnings = [];
const errors = [];

async function shootSet(name, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none !important}' });

  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 1200));
  });

  for (const [sel, label] of sections) {
    const el = page.locator(sel).first();
    if (!(await el.count())) {
      warnings.push(`[${name}] not built yet: ${sel}`);
      continue;
    }
    await el.screenshot({ path: `${out}/${name}-${label}.png` });
  }

  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  await ctx.close();
}

await shootSet('desktop', { width: 1440, height: 900 });
await shootSet('mobile', { width: 390, height: 844 });

await browser.close();

if (warnings.length) console.log('WARNINGS:\n' + warnings.join('\n'));
if (errors.length) {
  console.log('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Shots captured, zero console errors. Output: ' + out);
