/** Stadium candidate checks: real browser interactions, viewport emulation, no live-ad clicks. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { BANTER_STORAGE_KEY } from '../lib/stadium-banter.mjs';

process.env.VITE_JHK_SERVER_URL ||= 'https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game';
const pass = process.env.STADIUM_PASS || 'candidate';
const out = path.resolve('docs/stadium-redesign/verification', pass);
await fs.mkdir(out, { recursive: true });
const server = await createServer({ configFile: path.resolve('vite.config.static.ts'), server: { host: '127.0.0.1', port: 5196, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/tmp/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const checks = [], errors = [], scenarioErrors = [], overflow = [];
let adRequests = 0;
const url = 'http://127.0.0.1:5196/fact-duel/';
function check(name, result, detail) { checks.push({ name, pass: !!result, ...(detail === undefined ? {} : { detail }) }); console.log(`${result ? 'PASS' : 'FAIL'} ${name}`); }
async function scenario(name, run) {
  if (process.env.STADIUM_ONLY && name !== process.env.STADIUM_ONLY) return;
  try { await run(); } catch (error) { scenarioErrors.push({ name, error: error.stack || String(error) }); check(name, false, error.message); }
}
async function context(viewport = { width: 390, height: 844 }, motion = 'reduce') {
  const value = await browser.newContext({ viewport, reducedMotion: motion });
  value.on('page', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/googlesyndication|doubleclick|googleads/.test(request.url())) adRequests++; });
  });
  return value;
}
const start = page => page.locator('[data-stadium-start="cricket"]');
const spicy = page => page.locator('[data-stadium-start="spicy"]');
const locker = page => page.locator('[data-stadium-open="locker"]');
async function home(page) { await page.goto(url); await start(page).waitFor({ timeout: 20000 }); await page.evaluate(() => document.fonts.ready); }
async function fit(page, name) {
  const detail = await page.evaluate(() => ({ fit: document.documentElement.scrollWidth <= innerWidth, nodes: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 8).map(el => ({ tag: el.tagName, class: String(el.className), text: el.textContent?.slice(0, 70), width: el.getBoundingClientRect().width })) }));
  if (!detail.fit) overflow.push({ name, nodes: detail.nodes });
  check(name, detail.fit);
}
async function capture(page, name) { if (process.env.STADIUM_NO_SCREENSHOTS) return;
  if (process.env.STADIUM_NO_SCREENSHOTS === '1') return;
  // Full-page captures keep fixed chrome at the viewport's current scroll offset. Reset it so the
  // artifact represents the page's top rather than a synthetic header across the middle of a card.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
async function readyQuestion(page) { await page.locator('.fd-answer:not(:disabled)').first().waitFor({ timeout: 20000 }); }
async function readableClub(page, name) {
  const ratio = await page.locator('.sc-heading h2').evaluate(el => {
    const parse = value => { const values = value.match(/[\d.]+/g)?.map(Number) || []; return values.slice(0, 3); };
    const luminance = rgb => rgb.map(value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((total, value, i) => total + value * [.2126, .7152, .0722][i], 0);
    const ink = parse(getComputedStyle(el).color);
    let target = el, paper;
    while (target) { const background = getComputedStyle(target).backgroundColor; if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') { paper = parse(background); break; } target = target.parentElement; }
    paper ||= [255, 255, 255];
    const a = luminance(ink), b = luminance(paper);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  check(name, ratio >= 4.5, { contrastRatio: Number(ratio.toFixed(2)) });
}
async function correctAnswer(page) {
  const prompt = await page.locator('.fd-qcard h1').textContent();
  const item = QUESTIONS.find(question => question.question === prompt);
  assert.ok(item, 'The rendered prompt must belong to the served source bank');
  // The dealt question shuffles its options. Select the source answer's text in the rendered
  // choices rather than assuming the editorial bank's index survives dealing.
  const answer = item.options[item.correctIndex];
  const choices = await page.locator('.fd-answer-text').allTextContents();
  const index = choices.findIndex(text => text.trim() === answer);
  assert.ok(index >= 0, 'The rendered choices must contain the source answer');
  await page.locator('.fd-answer').nth(index).click();
}

try {
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 1000 }]) {
    await scenario(`viewport ${size.width}`, async () => {
      const c = await context(size), p = await c.newPage();
      try {
        await home(p);
        await fit(p, `${size.width} daytime home fits`);
        check(`${size.width} first play visible without scrolling`, await start(p).evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
        check(`${size.width} no startup dialog`, await p.locator('[role="dialog"]:visible').count() === 0);
        check(`${size.width} first play touch target`, await start(p).evaluate(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
        await capture(p, `day-home-${size.width}`);
        await p.getByRole('button', { name: 'Switch to night match' }).click();
        await fit(p, `${size.width} night home fits`);
        await capture(p, `night-home-${size.width}`);
        await p.reload(); await start(p).waitFor();
        check(`${size.width} night preference survives reload`, await p.locator('html').getAttribute('data-cricket-theme') === 'floodlights');
        await p.getByRole('button', { name: 'Switch to day match' }).click();
        if (size.width === 320 || size.width === 390) {
          await start(p).click(); await readyQuestion(p);
          check(`${size.width} one click starts a four-choice match`, await p.locator('.fd-answer').count() === 4);
          check(`${size.width} practice identity remains explicit`, await p.locator('.cr-practice-label').isVisible());
          check(`${size.width} answer touch targets`, await p.locator('.fd-answer').evaluateAll(nodes => nodes.every(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })));
          await fit(p, `${size.width} question fits`);
          await capture(p, `question-${size.width}`);
        }
      } finally { await c.close(); }
    });
  }

  await scenario('atomic launch and answer', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p);
      await start(p).evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
      await readyQuestion(p);
      check('rapid launch opens exactly one match', await p.locator('.fd-room').count() === 1 && await p.locator('.fd-answer').count() === 4);
      check('reading timer remains thirty seconds', /30s/.test(await p.locator('.fd-hud-format').textContent()));
      const labels = await p.locator('.fd-answer').allTextContents();
      await p.locator('.fd-answer').first().focus(); await p.keyboard.press('Enter');
      check('answer lock gives status keyboard focus', await p.locator('.fd-status').evaluate(el => el === document.activeElement));
      await p.locator('.fd-answer').first().evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
      check('repeat answer taps keep all four answers locked', await p.locator('.fd-answer:disabled').count() === 4);
      check('answer order stays stable through lock', JSON.stringify(labels) === JSON.stringify(await p.locator('.fd-answer').allTextContents()));
    } finally { await c.close(); }
  });

  await scenario('Spicy one-tap category', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p); await spicy(p).click(); await readyQuestion(p);
      check('Spicy starts from one click', await p.locator('.fd-answer').count() === 4);
      check('Spicy category reaches the actual question', /Spicy/i.test(await p.locator('.fd-qtopic').textContent()));
      await fit(p, 'Spicy question fits mobile'); await capture(p, 'spicy-question-390');
    } finally { await c.close(); }
  });

  await scenario('missing art and offline after load', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await p.route('**/art/stadium-*.webp', route => route.abort()); await home(p);
      await c.setOffline(true); await start(p).click(); await readyQuestion(p);
      check('loaded practice survives offline and missing stadium art', await p.locator('.fd-answer').count() === 4);
    } finally { await c.close(); }
  });

  await scenario('unavailable browser storage', async () => {
    const c = await context({ width: 320, height: 568 });
    await c.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
    const p = await c.newPage();
    try { await home(p); await start(p).click(); await readyQuestion(p); check('blocked local storage preserves gameplay', await p.locator('.fd-answer').count() === 4); } finally { await c.close(); }
  });

  await scenario('enlarged text and localized chrome', async () => {
    const c = await context({ width: 320, height: 568 }), p = await c.newPage();
    try {
      await home(p); await p.addStyleTag({ content: 'html{font-size:200% !important}' });
      await fit(p, '200 percent text home reflows'); await start(p).click(); await readyQuestion(p);
      await fit(p, '200 percent text question reflows');
    } finally { await c.close(); }
    const hi = await context({ width: 320, height: 568 });
    await hi.addInitScript(() => { try { localStorage.setItem('fd-locale', 'hi'); } catch {} });
    const hp = await hi.newPage();
    try { await home(hp); await fit(hp, 'Hindi home reflows'); await capture(hp, 'hindi-home-320'); await start(hp).click(); await readyQuestion(hp); await fit(hp, 'Hindi question reflows'); } finally { await hi.close(); }
  });

  await scenario('earned collection purchase and expiry', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p); await locker(p).click(); await p.locator('.sc-locker').waitFor();
      check('fresh club balance is zero', await p.getByTestId('club-balance').textContent() === '0');
      check('unaffordable pavilion cannot be purchased', await p.locator('[data-item-id="stand-pavilion"] button').isDisabled());
      await fit(p, 'club fits390'); await readableClub(p, 'day club heading has readable contrast'); await capture(p, 'club-empty-390');
      await p.getByRole('button', { name: 'Switch to night match' }).click(); await readableClub(p, 'night club heading has readable contrast'); await capture(p, 'club-night-390');
      await p.getByRole('button', { name: 'Switch to day match' }).click();
      await p.locator('[data-nav="home"]').click();
      for (let i = 0; i < 2; i++) {
        await p.locator('[data-stadium-start="quick"]').click(); await readyQuestion(p); await correctAnswer(p);
        await p.locator('.fd-finish').waitFor({ timeout: 40000 });
        await p.locator('.fd-finish-secondary button').last().click(); await start(p).waitFor();
      }
      await locker(p).click();
      await p.waitForFunction(() => Number(document.querySelector('[data-testid="club-balance"]')?.textContent) >= 60);
      const before = Number(await p.getByTestId('club-balance').textContent());
      check('two completed matches earn actual club points', before >= 60 && before <= 66);
      await p.locator('.sc-categories').getByRole('button', { name: 'Titles', exact: true }).click();
      await p.locator('[data-item-id="title-menace"] button').evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
      await p.waitForFunction(value => Number(document.querySelector('[data-testid="club-balance"]')?.textContent) === value, before - 45);
      check('rapid title purchase debits exactly once', Number(await p.getByTestId('club-balance').textContent()) === before - 45);
      check('purchased title is actually equipped on card', /Matchday menace/.test(await p.getByTestId('club-card').textContent()));
      await capture(p, 'club-earned-390');
      await p.reload(); await start(p).waitFor(); await locker(p).click();
      await p.getByTestId('club-card').getByText('Matchday menace', { exact: true }).waitFor();
      check('title and balance survive reload without another reward', Number(await p.getByTestId('club-balance').textContent()) === before - 45);
      check('actual win displays a time-bound badge', await p.locator('.sc-active-badge').count() === 1);
      await p.clock.setFixedTime(new Date(Date.now() + 25 * 60 * 60 * 1000));
      await p.evaluate(() => window.dispatchEvent(new Event('focus')));
      await p.locator('.sc-active-badge').waitFor({ state: 'detached' });
      check('expired badge leaves the player card', await p.locator('.sc-active-badge').count() === 0);
      check('badge expiry does not spend earned points', Number(await p.getByTestId('club-balance').textContent()) === before - 45);
      await p.setViewportSize({ width: 320, height: 568 }); await fit(p, 'equipped club fits320'); await capture(p, 'club-earned-320');
    } finally { await c.close(); }
  });

  await scenario('optional physics with reduced motion', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p); await p.getByRole('button', { name: /^Net practice/ }).click();
      await p.locator('.st-nets > summary').click();
      const slider = p.getByRole('slider', { name: 'Shot timing' });
      await slider.focus(); await p.keyboard.press('End'); for (let i = 0; i < 35; i++) await p.keyboard.press('ArrowLeft');
      await p.getByRole('button', { name: 'Play shot', exact: true }).click();
      check('reduced-motion shot remains playable', /SIX/.test(await p.locator('.st-nets-result').textContent()));
      check('reduced-motion stadium has no transform animation', await p.locator('.st-scene-art').evaluate(el => getComputedStyle(el).transform === 'none'));
      await fit(p, 'net practice fits390'); await capture(p, 'nets-reduced-390');
      await p.locator('.st-nets > summary').click();
      await p.waitForFunction(() => document.querySelector('.st-scene')?.getAttribute('data-shot') === 'ready');
      check('closing net practice resets its state', await p.locator('.st-scene').first().getAttribute('data-shot') === 'ready');
      await p.locator('[data-nav="passport"]').click(); await p.locator('.sc-locker').waitFor();
      check('warm-up shots award no quiz points', await p.getByTestId('club-balance').textContent() === '0');
    } finally { await c.close(); }
  });

  await scenario('optional physics honors active preference changes', async () => {
    const c = await context({ width: 390, height: 844 }, 'no-preference'), p = await c.newPage();
    try {
      await home(p); await p.getByRole('button', { name: /^Net practice/ }).click(); await p.locator('.st-nets > summary').click();
      await p.getByRole('button', { name: 'Start delivery', exact: true }).click();
      check('timed delivery enters a physical shot state', await p.locator('.st-scene').first().getAttribute('data-shot') === 'delivery');
      await p.evaluate(() => { document.documentElement.dataset.motion = 'off'; });
      await p.getByRole('slider', { name: 'Shot timing' }).waitFor();
      check('changing motion off cancels an active delivery', await p.locator('.st-scene').first().getAttribute('data-shot') === 'ready');
    } finally { await c.close(); }
  });

  await scenario('bounded opponent banter', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p); await start(p).click(); await readyQuestion(p);
      check('banter cannot cover a live question', await p.locator('.stadium-banter').count() === 0);
      await correctAnswer(p); await p.locator('.stadium-banter').waitFor({ timeout: 30000 });
      check('all six sticker graphics render as native SVG', await p.locator('[data-sticker] svg').count() === 6);
      await p.locator('[data-sticker="nice-shot"]').evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
      await p.locator('.stadium-banter-speech small').getByText('Practice bot', { exact: true }).waitFor();
      check('practice response is labelled as an automatic bot', /automatic replies/.test(await p.locator('.stadium-banter-scope').textContent()));
      check('rapid reactions remain locked for this break', await p.locator('[data-sticker]:disabled').count() === 6);
      await p.getByRole('button', { name: 'Mute reactions', exact: true }).click();
      check('mute removes reaction controls and visible speech', await p.locator('[data-sticker]').count() === 0 && await p.locator('.stadium-banter-speech').count() === 0);
      check('mute preference is persisted', await p.evaluate(key => localStorage.getItem(key), BANTER_STORAGE_KEY) === 'true');
      await fit(p, 'between-round banter fits390'); await capture(p, 'banter-390');
      await p.locator('.fd-lobby .fd-sticky .fd-cta').click(); await readyQuestion(p);
      check('next timed round hides the whole reaction tray', await p.locator('.stadium-banter').count() === 0);
    } finally { await c.close(); }
  });

  check('disabled ads make zero requests', adRequests === 0);
  check('no browser runtime errors', errors.length === 0, errors);
} finally {
  await fs.writeFile(path.join(out, 'browser-checks.json'), JSON.stringify({ pass, checks, errors, scenarioErrors, overflow, adRequests }, null, 2));
  await browser.close(); await server.close();
}
assert.ok(checks.every(item => item.pass), 'All stadium browser acceptance checks must pass');
console.log(JSON.stringify({ suite: 'stadium-browser', pass, passed: checks.length }));
