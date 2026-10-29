/** Trophy-road candidate gate. Browser emulation, never a claim of physical-device testing.
 * Boundary profiles are labelled fixtures; earning, replay, pacing and rotation use real play.
 * Timing uses the normal clock and actual rendered lock transitions: no fake timers or sleeps.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { rotationKey } from '../lib/question-rotation.mjs';
import { emptyProfile } from '../lib/passport.mjs';
import { STORAGE } from '../lib/storage-names.mjs';

process.env.VITE_JHK_SERVER_URL ||= 'https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game';
const pass = process.env.TROPHY_PASS || 'candidate';
const out = path.resolve('docs/trophy-road/verification', pass);
await fs.mkdir(out, { recursive: true });
const server = await createServer({ configFile: path.resolve('vite.config.static.ts'), server: { host: '127.0.0.1', port: 5197, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/tmp/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const url = 'http://127.0.0.1:5197/fact-duel/';
const checks = [], errors = [], scenarios = [], timings = [], observations = [];
let adRequests = 0;
function check(name, value, detail) { checks.push({ name, pass: !!value, ...(detail === undefined ? {} : { detail }) }); console.log(`${value ? 'PASS' : 'FAIL'} ${name}${!value && detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`); }
async function scenario(name, run) {
  if (process.env.TROPHY_ONLY && !process.env.TROPHY_ONLY.split('|').includes(name)) return;
  try { await run(); } catch (error) { scenarios.push({ name, error: error.stack || String(error) }); check(name, false, error.message); }
}
async function context(viewport = { width: 390, height: 844 }, reducedMotion = 'reduce') {
  const c = await browser.newContext({ viewport, reducedMotion });
  c.on('page', p => {
    p.on('pageerror', error => errors.push(error.message));
    p.on('request', request => { if (/googlesyndication|doubleclick|googleads/.test(request.url())) adRequests++; });
  });
  return c;
}
const start = p => p.locator('[data-stadium-start="cricket"]');
const road = p => p.locator('[data-open-trophy-road]').first();
const room = p => p.locator('.fd-room');
async function home(p) { await p.goto(url); await start(p).waitFor({ timeout: 20000 }); await p.evaluate(() => document.fonts.ready); }
async function question(p) { await p.locator('.fd-answer:not(:disabled)').first().waitFor({ timeout: 15000 }); }
async function fit(p, name) {
  const geometry = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 6).map(el => ({ tag: el.tagName, className: String(el.className), text: el.textContent?.slice(0, 50) })) }));
  check(name, geometry.scrollWidth <= geometry.width, geometry.scrollWidth > geometry.width ? geometry : undefined);
}
async function screenshot(p, name) {
  if (process.env.TROPHY_NO_SCREENSHOTS) return;
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  await p.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
async function touch(locator) { return locator.evaluateAll(nodes => nodes.length > 0 && nodes.every(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })); }
async function seedPractice(p, trophies) {
  const fixtures = { 0: [0, 0, 0], 58: [10, 10, 9], 60: [10, 10, 10], 178: [30, 30, 29], 180: [30, 30, 30] };
  assert.ok(fixtures[trophies], 'Only explicit labelled boundary fixtures are accepted');
  const counters = fixtures[trophies], state = emptyProfile('browser-boundary-fixture');
  Object.assign(state.progression.counters, { rounds: counters[0], attemptedRounds: counters[1], correct: counters[2] });
  state.revision = 1;
  await p.evaluate(async ({ state, database }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('profile', 'readwrite');
      tx.objectStore('profile').put(state, 'player');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }), { state, database: STORAGE.playerDb });
  await p.reload(); await start(p).waitFor();
}
async function readDatabase(p, database, store, key) {
  return p.evaluate(async ({ database, store, key }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(store, 'readonly'), read = tx.objectStore(store).get(key);
      read.onerror = () => { db.close(); reject(read.error); };
      read.onsuccess = () => { db.close(); resolve(read.result); };
    };
  }), { database, store, key });
}
async function readProfile(p) { return readDatabase(p, STORAGE.playerDb, 'profile', 'player'); }
async function watchPhases(p) {
  await p.evaluate(() => {
    window.__trophyObserver?.disconnect(); window.__trophyEvents = [];
    let previous;
    const read = () => {
      const el = document.querySelector('.fd-room'); if (!el) return;
      const item = { round: el.dataset.roundId, phase: el.dataset.roomPhase, human: el.dataset.humanLocked, bot: el.dataset.botLocked, stage: el.dataset.stage };
      const key = JSON.stringify(item); if (key === previous) return; previous = key;
      window.__trophyEvents.push({ ...item, at: performance.now() });
    };
    window.__trophyObserver = new MutationObserver(read);
    window.__trophyObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-round-id', 'data-room-phase', 'data-human-locked', 'data-bot-locked', 'data-stage'] });
    read();
  });
}
async function sourceQuestion(p) {
  const prompt = await p.locator('.fd-qcard h1').textContent();
  const item = QUESTIONS.find(q => q.question === prompt);
  assert.ok(item, 'Rendered question must exist in the source bank');
  return item;
}
async function answerCorrect(p, atomic = false) {
  const item = await sourceQuestion(p);
  const choices = await p.locator('.fd-answer-text').allTextContents();
  const index = choices.findIndex(text => text.trim() === item.options[item.correctIndex]);
  assert.ok(index >= 0, 'Find the answer by text after option shuffle');
  if (atomic) await p.locator('.fd-answer').nth(index).evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
  else await p.locator('.fd-answer').nth(index).click();
  return item;
}
async function complete(p, mode, { atomic = false, capture = false } = {}) {
  const dealt = [];
  await watchPhases(p);
  for (let ball = 0; ball < 7; ball++) {
    await question(p);
    const id = await room(p).getAttribute('data-round-id');
    check(`${mode} ball ${ball + 1} bot waits for the human`, await room(p).getAttribute('data-bot-locked') === 'false');
    const q = await answerCorrect(p, atomic && ball === 0); dealt.push(rotationKey(q));
    await p.waitForFunction(() => document.querySelector('.fd-room')?.getAttribute('data-human-locked') === 'true');
    check(`${mode} ball ${ball + 1} all answers lock`, await p.locator('.fd-answer:disabled').count() === 4);
    await p.waitForFunction(() => document.querySelector('.fd-room')?.getAttribute('data-bot-locked') === 'true', null, { timeout: 5000, polling: 25 });
    const time = await p.evaluate(roundId => {
      const values = window.__trophyEvents.filter(e => e.round === roundId);
      const h = values.find(e => e.human === 'true'), b = values.find(e => e.bot === 'true');
      return { roundId, humanAt: h?.at, botAt: b?.at, responseMs: b && h ? b.at - h.at : null };
    }, id);
    timings.push({ mode, ball: ball + 1, ...time });
    check(`${mode} ball ${ball + 1} bot responds in 3–4 seconds`, time.responseMs >= 3000 && time.responseMs <= 4000, time.responseMs);
    // No Next click: the next playable question or finish must arrive by itself.
    await p.waitForFunction(previous => !!document.querySelector('.fd-finish') || (document.querySelector('.fd-room')?.getAttribute('data-round-id') !== previous && !!document.querySelector('.fd-answer:not(:disabled)')), id, { timeout: 5000, polling: 25 });
    const after = await p.evaluate(() => performance.now());
    check(`${mode} ball ${ball + 1} automatic transition stays brief`, after - time.botAt <= 2500, Math.round(after - time.botAt));
    if (await p.locator('.fd-finish').count()) break;
  }
  check(`${mode} completes without manual next-round taps`, await p.locator('.fd-finish').count() === 1);
  check(`${mode} no family repeats within the match`, new Set(dealt).size === dealt.length, dealt);
  const expected = { quick: 1, gauntlet: 5, chase: 3, superover: 6 }[mode];
  if (expected) check(`${mode} actual match length`, dealt.length === expected, dealt.length);
  if (mode === 'chase') check('Chase reaches target using correct answers', await p.locator('.fd-hud-nums b').first().textContent() === '3');
  if (mode === 'superover') check('Super Over six fast correct answers score 36 runs', await p.locator('.fd-hud-nums b').first().textContent() === '36');
  if (capture) await screenshot(p, `${mode}-finish`);
  return dealt;
}
async function done(p) { await p.locator('.fd-finish-secondary button').last().click(); await start(p).waitFor(); }

try {
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 1000 }]) {
    await scenario(`viewport ${size.width}`, async () => {
      const c = await context(size), p = await c.newPage();
      try {
        await home(p); await fit(p, `${size.width} home fits`);
        check(`${size.width} primary Play visible without scroll`, await start(p).evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
        check(`${size.width} primary Play touch target`, await touch(start(p)));
        check(`${size.width} no startup modal`, await p.locator('[role="dialog"]:visible').count() === 0);
        await screenshot(p, `home-${size.width}`);
        await p.getByRole('button', { name: 'Switch to night match' }).click();
        await fit(p, `${size.width} night home fits`); await screenshot(p, `night-home-${size.width}`);
        await p.getByRole('button', { name: 'Switch to day match' }).click();
        await road(p).click(); await p.locator('.tr-road').waitFor(); await fit(p, `${size.width} trophy road fits`);
        check(`${size.width} three map nodes`, await p.locator('[data-road-stage]').count() === 3);
        check(`${size.width} map node touch targets`, await touch(p.locator('[data-road-stage]')));
        await screenshot(p, `road-gully-${size.width}`);
        await p.getByRole('button', { name: 'Switch to night match' }).click();
        await fit(p, `${size.width} night road fits`); await screenshot(p, `night-road-gully-${size.width}`);
        await p.getByRole('button', { name: 'Switch to day match' }).click();
        await p.locator('[data-road-stage="crown"]').click(); await fit(p, `${size.width} Crown preview fits`);
        check(`${size.width} locked Crown previews but cannot launch`, await p.locator('[data-road-play="superover"]').isDisabled());
        await screenshot(p, `road-crown-locked-${size.width}`);
        await p.locator('[data-nav="home"]').click(); await start(p).click(); await question(p);
        check(`${size.width} one home action starts a match`, await p.locator('.fd-answer').count() === 4);
        check(`${size.width} answers have touch targets`, await touch(p.locator('.fd-answer')));
        check(`${size.width} reading pause has touch target`, await touch(p.locator('.fd-flow-pause')));
        check(`${size.width} bot identity explicit`, /bot/i.test(await p.locator('.fd-hud-rival small').textContent()));
        await fit(p, `${size.width} question fits`); await screenshot(p, `question-${size.width}`);
      } finally { await c.close(); }
    });
  }

  await scenario('arena boundary fixtures', async () => {
    for (const trophies of [0, 58, 60, 178, 180]) {
      const c = await context(), p = await c.newPage();
      try {
        await home(p); await seedPractice(p, trophies); await road(p).click();
        await p.getByTestId('road-trophies').waitFor();
        check(`fixture ${trophies} displayed exactly`, await p.getByTestId('road-trophies').textContent() === String(trophies));
        for (const [stage, mode, threshold] of [['gully', 'gauntlet', 0], ['riverside', 'chase', 60], ['crown', 'superover', 180]]) {
          await p.locator(`[data-road-stage="${stage}"]`).click();
          check(`fixture ${trophies} ${stage} gate`, (await p.locator(`[data-road-play="${mode}"]`).isDisabled()) === (trophies < threshold));
          const parent = p.locator(`[data-road-stage="${stage}"]`).locator('..');
          check(`fixture ${trophies} ${stage} semantic unlocked state`, await parent.getAttribute('data-unlocked') === String(trophies >= threshold));
        }
        if (trophies === 180) { await screenshot(p, 'road-crown-earned-fixture'); await p.locator('[data-road-stage="riverside"]').click(); await screenshot(p, 'road-riverside-earned-fixture'); }
        await p.reload(); await start(p).waitFor(); await road(p).click();
        check(`fixture ${trophies} survives ordinary reload`, await p.getByTestId('road-trophies').textContent() === String(trophies));
      } finally { await c.close(); }
    }
  });

  await scenario('real pacing earning replay and rotation', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p);
      await p.locator('[data-stadium-start="quick"]').evaluate(el => { for (let i = 0; i < 12; i++) el.click(); });
      await question(p); check('rapid launch opens one room', await room(p).count() === 1);
      const first = await complete(p, 'quick', { atomic: true, capture: true });
      const profile = await readProfile(p);
      check('one actual answered round earns six practice trophies', profile.progression.counters.attemptedRounds === 1 && profile.progression.counters.correct === 1, profile.progression.counters);
      await p.locator('.fd-finish-actions > button').click(); await question(p);
      check('one replay action returns to playable answers', await p.locator('.fd-answer').count() === 4);
      const second = await complete(p, 'quick');
      check('replay prefers a new question family', !first.includes(second[0]));
      await done(p); await p.reload(); await start(p).waitFor(); await road(p).click();
      check('two real results persist as twelve trophies after reload', await p.getByTestId('road-trophies').textContent() === '12');
      await p.locator('[data-nav="home"]').click(); await p.locator('[data-stadium-start="quick"]').click(); await question(p);
      const q = await sourceQuestion(p);
      check('rotation survives reload', ![...first, ...second].includes(rotationKey(q)), q.id);
    } finally { await c.close(); }
  });

  for (const [stage, mode, trophies] of [['gully', 'gauntlet', 0], ['riverside', 'chase', 60], ['crown', 'superover', 180]]) {
    await scenario(`${mode} mode`, async () => {
      const c = await context(), p = await c.newPage();
      try {
        await home(p); if (trophies) await seedPractice(p, trophies);
        await road(p).click(); await p.locator(`[data-road-stage="${stage}"]`).click(); await p.locator(`[data-road-play="${mode}"]`).click(); await question(p);
        check(`${mode} three road actions start the correct mode`, await p.locator('.fd-hud').getAttribute('data-mode') === mode);
        await fit(p, `${mode} mobile HUD fits`); await screenshot(p, `${mode}-question`);
        await complete(p, mode, { capture: true });
      } finally { await c.close(); }
    });
  }

  await scenario('pause for reading and keyboard', async () => {
    const c = await context(), p = await c.newPage();
    try {
      await home(p); await start(p).click(); await question(p);
      const first = await room(p).getAttribute('data-round-id');
      await p.getByRole('button', { name: 'Pause after this ball', exact: true }).click();
      await p.locator('.fd-answer').first().focus(); await p.keyboard.press('Enter');
      check('keyboard answer locks controls', await p.locator('.fd-answer:disabled').count() === 4);
      check('keyboard answer moves focus to status', await p.locator('.fd-status').evaluate(el => el === document.activeElement));
      await p.locator('.fd-lobby[data-phase="between"]').waitFor({ timeout: 8000 });
      check('optional reading pause keeps the settled round', await room(p).getAttribute('data-round-id') === first);
      await screenshot(p, 'paused-review');
      await p.locator('.fd-lobby .fd-sticky button').click(); await question(p);
      check('reading pause resumes with one action', await room(p).getAttribute('data-round-id') !== first);
      const second = await room(p).getAttribute('data-round-id');
      await answerCorrect(p);
      await p.locator('.stadium-banter').waitFor({ timeout: 6000 });
      await p.locator('.stadium-banter button').first().focus();
      const focusedAt = await p.evaluate(() => performance.now());
      await p.waitForFunction(({ roundId, at }) => performance.now() - at >= 2000 && document.querySelector('.fd-room')?.getAttribute('data-round-id') === roundId, { roundId: second, at: focusedAt }, { timeout: 3500 });
      check('focusing banter prevents automatic advance mid-action', await room(p).getAttribute('data-round-id') === second);
    } finally { await c.close(); }
  });

  await scenario('resilience privacy and reduced motion', async () => {
    const c = await context({ width: 320, height: 568 }), p = await c.newPage();
    try {
      await p.route('**/art/*.webp', route => route.abort()); await home(p);
      await p.addStyleTag({ content: 'html{font-size:200% !important}' });
      await fit(p, '200 percent text home fits'); await road(p).click(); await fit(p, '200 percent text road fits');
      const activeMotion = await p.locator('.tr-road').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length);
      check('reduced-motion road has no running decorative animation', activeMotion === 0, activeMotion);
      const visibleCopy = await p.locator('body').innerText();
      check('road does not display question inventory totals', !/\d+[\d,]*\s+(?:questions? available|facts? available|in (?:the )?bank|questions? in (?:the )?bank)/i.test(visibleCopy));
      const catalogue = await p.evaluate(async moduleUrl => (await import(moduleUrl)).request({ action: 'catalogue' }), `/fact-duel/@fs${path.resolve('lib/duel-client-static.ts')}`);
      const leaks = [];
      const scan = (value, at = '') => { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { if (['count', 'questionCount', 'question_count', 'poolSize', 'poolCount', 'totalQuestions'].includes(key)) leaks.push(`${at}.${key}`); scan(item, `${at}.${key}`); } };
      scan(catalogue); check('public catalogue omits category inventory fields', leaks.length === 0, leaks);
      await c.setOffline(true); await p.locator('[data-road-play="gauntlet"]').click(); await question(p);
      check('loaded offline practice works despite missing art', await p.locator('.fd-answer').count() === 4);
      await fit(p, '200 percent text offline question fits');
      await screenshot(p, 'offline-missing-art-enlarged-text');
    } finally { await c.close(); }
  });

  await scenario('blocked storage and Hindi', async () => {
    const c = await context({ width: 320, height: 568 });
    await c.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
    const p = await c.newPage();
    try { await home(p); await start(p).click(); await question(p); check('blocked localStorage preserves first play', await p.locator('.fd-answer').count() === 4); } finally { await c.close(); }
    const h = await context({ width: 320, height: 568 });
    await h.addInitScript(() => { try { localStorage.setItem('fd-locale', 'hi'); } catch {} });
    const hp = await h.newPage();
    try { await home(hp); await road(hp).click(); await fit(hp, 'Hindi road fits'); await screenshot(hp, 'road-hindi'); await hp.locator('[data-road-play="gauntlet"]').click(); await question(hp); await fit(hp, 'Hindi question fits'); } finally { await h.close(); }
  });

  await scenario('cross-tab rotation and profile epoch', async () => {
    const c = await context(), a = await c.newPage(), b = await c.newPage();
    try {
      await Promise.all([home(a), home(b)]);
      const before = await readProfile(a);
      await Promise.all([start(a).click(), start(b).click()]);
      await Promise.all([question(a), question(b)]);
      const record = await readDatabase(a, STORAGE.questionHistoryDb, 'epochs', before.epoch);
      const decks = Object.values(record.reservations).map(reservation => Object.keys(reservation.history));
      check('concurrent tabs reserve two actual five-question decks', decks.length === 2 && decks.every(deck => deck.length === 5), decks.map(deck => deck.length));
      check('Web Locks prevent overlap across same-profile concurrent decks', decks.length === 2 && !decks[0].some(id => decks[1].includes(id)));
      check('each exposed first question persists in IndexedDB', Object.keys(record.history).length === 2, Object.keys(record.history));
      await b.close(); await a.reload(); await start(a).waitFor();
      const persisted = await readDatabase(a, STORAGE.questionHistoryDb, 'epochs', before.epoch);
      check('question exposures survive a full page reload', JSON.stringify(persisted.history) === JSON.stringify(record.history));
      await seedPractice(a, 0); await start(a).click(); await question(a);
      const nextEpoch = await readDatabase(a, STORAGE.questionHistoryDb, 'epochs', 'browser-boundary-fixture');
      const previousEpoch = await readDatabase(a, STORAGE.questionHistoryDb, 'epochs', before.epoch);
      check('new profile epoch has isolated question memory', Object.keys(nextEpoch.history).length === 1 && Object.keys(previousEpoch.history).length === 2);
      observations.push({ kind: 'actual-browser-concurrency', oldEpochFamilies: Object.keys(previousEpoch.history), newEpochFamilies: Object.keys(nextEpoch.history) });
    } finally { await c.close(); }
  });

  check('no uncaught browser runtime errors', errors.length === 0, errors);
  check('disabled ads make no ad network requests', adRequests === 0, adRequests);
} finally {
  const report = { pass, at: new Date().toISOString(), environment: 'Headless Chromium desktop engine with viewport emulation; not a physical device or a screen-reader test', fixturePolicy: 'Arena boundary tests seed local counters. Earning/replay/rotation and pacing use actual browser play. Odd unreachable practice thresholds 59/179 belong to pure function tests.', checks, timings, errors, scenarios, observations, adRequests };
  await fs.writeFile(path.join(out, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close(); await server.close();
  const failed = checks.filter(c => !c.pass);
  console.log(JSON.stringify({ pass, checks: checks.length, failed: failed.map(c => c.name), out }));
  if (failed.length || scenarios.length || errors.length) process.exitCode = 1;
}
