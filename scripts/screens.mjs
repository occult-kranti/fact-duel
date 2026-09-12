// Screenshot every top-level screen at phone and desktop widths.
// Usage: node scripts/screens.mjs [outDir] [baseUrl]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] || 'outputs/screens';
const base = process.argv[3] || 'http://localhost:5173/';
const exe = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(out, { recursive: true });

const viewports = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
// Each entry is a [data-nav] id; `via` names a tab whose screen carries that data-nav button
// (collections has no nav tab of its own — the Play screen's "All subjects" button carries it).
const navs = [
  { id: 'home' },
  { id: 'journeys' },
  { id: 'arena' },
  { id: 'passport' },
  { id: 'journal' },
  { id: 'collections', via: 'arena' },
];

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--use-gl=swiftshader'],
});
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: process.env.REDUCED === '1' ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  for (const { id, via } of navs) {
    if (via) {
      await page.locator(`[data-nav="${via}"]`).first().click({ force: true });
      await page.waitForTimeout(600);
    }
    const btn = page.locator(`[data-nav="${id}"]`).first();
    if (await btn.count()) {
      await btn.click({ force: true });
      await page.waitForTimeout(900);
    } else if (id !== 'home') {
      continue;
    }
    await page.screenshot({ path: join(out, `${vp.name}-${id}.png`), fullPage: false });
    await page.screenshot({ path: join(out, `${vp.name}-${id}-full.png`), fullPage: true });
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`${vp.name}: horizontal overflow ${overflow}px; console errors: ${errors.length}`);
  for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 200));
  await ctx.close();
}
await browser.close();
