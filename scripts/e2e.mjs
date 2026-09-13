/**
 * scripts/e2e.mjs — browser invariants that unit tests cannot reach.
 *
 * Every check here exists because a real defect got through: the timing contract clauses the room
 * must never break, and the reward-layer rules the advisor loops found broken (ceremonies over
 * gameplay, a 3D slot overflowing its ceremony card, the expedition CTA hidden under the tab bar).
 *
 *   node scripts/e2e.mjs [baseUrl]        # exits non-zero on the first failed invariant
 *
 * Requires a running dev server (default http://localhost:5173) and the preinstalled Chromium.
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:5173';
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PHONE = { width: 390, height: 844 };

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * Click until the expected element appears. The server-rendered markup exists before React
 * hydrates, and a click landing in that window is silently dropped, so one click is not reliable.
 */
const clickUntil = async (locator, expected, timeout = 8000, attempts = 6) => {
  await locator.waitFor({ state: 'visible', timeout: 20000 });
  for (let i = 0; i < attempts; i++) {
    // `force` skips the actionability wait but still clicks the element's own centre point, so a
    // control parked under the fixed launch bar would hand the tap to the bar instead. Scroll first.
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    if (await locator.isEnabled().catch(() => true)) await locator.click({ force: true });
    try {
      await locator.page().waitForSelector(expected, { timeout });
      return;
    } catch {
      await locator.page().waitForTimeout(700);
    }
  }
  await locator.page().waitForSelector(expected, { timeout });
};

/** Run one group of invariants; a thrown error fails that group instead of aborting the gate. */
const section = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    let state = '';
    try {
      state = JSON.stringify(
        await page.evaluate(() => ({
          h1: document.querySelector('h1')?.textContent?.slice(0, 40),
          alert: document.querySelector('[role="alert"]')?.textContent?.slice(0, 80) ?? null,
        })),
      );
    } catch {
      /* page may be gone */
    }
    try {
      await page.screenshot({ path: `e2e-failure-${name}.png` });
    } catch {
      /* page may be gone */
    }
    check(`${name} (could not be exercised)`, false, `${String(e).split('\n')[0].slice(0, 90)} ${state}`);
  }
};

// Deliberately the default renderer: forcing software WebGL destabilises the duel flow in headless
// Chromium, and the room invariant below is about which canvases mount, not about GPU output.
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: PHONE, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 160)));
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 160)));

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  // A leftover seat credential would restore a room on load and hide the nav.
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await section('room', async () => {
    // --- a live room must never mount a renderer, and the question card must not animate in ---
    await page.waitForSelector('[data-nav="arena"]', { timeout: 20000 });
    await clickUntil(page.locator('[data-nav="arena"]').first(), 'button:has-text("Play Quick Draw")');
    const launch = page.locator('button', { hasText: /Play Quick Draw/i }).first();
    await clickUntil(launch, '.question-card, .fd-qcard', 12000);
    await page.waitForTimeout(400);

    const room = await page.evaluate(() => {
      const card = document.querySelector('.question-card, .fd-qcard');
      const cs = card ? getComputedStyle(card) : null;
      const track = document.querySelector('.timer-track, .fd-timer-track, [class*="timer-track"]');
      // The only canvas allowed in a room is the 2D particle layer; a scene canvas here would
      // mean a renderer was mounted during live play.
      const canvases = [...document.querySelectorAll('canvas')];
      const sceneCanvases = canvases.filter((c) => !c.classList.contains('fx-canvas')).length;
      return {
        cardAnimation: cs?.animationName ?? null,
        cardTransform: cs?.transform ?? null,
        trackTransition: track ? getComputedStyle(track).transitionProperty : null,
        canvases: canvases.length,
        sceneCanvases,
        ceremonies: document.querySelectorAll('.fx-ceremony-card').length,
        options: [...document.querySelectorAll('.answer-button, .fd-answer')].map((b) =>
          b.textContent?.trim().slice(0, 18),
        ),
      };
    });
    check(
      'room: question card has no entrance animation',
      room.cardAnimation === 'none',
      `animationName=${room.cardAnimation}`,
    );
    check(
      'room: question card is not transformed',
      room.cardTransform === 'none' || room.cardTransform === null,
      `transform=${room.cardTransform}`,
    );
    check(
      'room: timer track has no transition',
      room.trackTransition === 'none',
      `transitionProperty=${room.trackTransition}`,
    );
    check(
      'room: no scene canvas is mounted in a room',
      room.sceneCanvases === 0,
      `${room.sceneCanvases} scene canvases of ${room.canvases} total`,
    );
    check('room: no ceremony opens over a live question', room.ceremonies === 0, `${room.ceremonies} open`);
    check(
      'room: four answer options are present',
      room.options.length === 4,
      `${room.options.length} options`,
    );

    // answering must not reorder the options, and the result must not be styled before it settles
    const before = room.options.join('|');
    await page.locator('.answer-button, .fd-answer').first().click({ force: true });
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => ({
      options: [...document.querySelectorAll('.answer-button, .fd-answer')].map((b) =>
        b.textContent?.trim().slice(0, 18),
      ),
      ceremonies: document.querySelectorAll('.fx-ceremony-card').length,
    }));
    check(
      'room: option order is fixed across the reveal',
      after.options.join('|') === before,
      after.options.join('|') === before ? '' : 'order changed',
    );
    check('room: no ceremony opens over the reveal', after.ceremonies === 0, `${after.ceremonies} open`);
  });

  await section('auto-advance', async () => {
    // --- a multi-round match must reach round 2 with no click at all ---
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-nav="arena"]', { timeout: 20000 });
    await clickUntil(page.locator('[data-nav="arena"]').first(), 'button:has-text("Play Quick Draw")');
    await clickUntil(
      page.locator('[role="radio"]', { hasText: /Triple Threat/i }).first(),
      'button:has-text("Play Triple Threat")',
    );
    const timer = await page.evaluate(
      () => document.querySelector('.fd-launch-terms')?.textContent?.match(/(\d+)s/)?.[1] ?? null,
    );
    check('auto-advance: Triple Threat opens on its own 7s clock', timer === '7', `timer=${timer}s`);
    await clickUntil(
      page.locator('button', { hasText: /Play Triple Threat/i }).first(),
      '.question-card, .fd-qcard',
      15000,
    );
    await page.locator('.answer-button, .fd-answer').first().click({ force: true });
    await page.waitForSelector('.fd-auto', { timeout: 25000 });
    const cta = (await page.locator('.fd-cta-label').first().textContent())?.trim() ?? '';
    check('auto-advance: the between-round CTA reads as optional', /start now/i.test(cta), `cta="${cta}"`);
    // Nothing is clicked from here. Round 2 has to arrive by itself.
    await page.waitForFunction(
      () => document.querySelector('.fd-room-chip')?.getAttribute('data-round') === '2',
      undefined,
      { timeout: 30000 },
    );
    check('auto-advance: round 2 starts without a click', true);
    await page.waitForSelector('.question-card, .fd-qcard', { timeout: 25000 });
    check('auto-advance: the round 2 question is served', true);
  });

  await section('expeditions', async () => {
    // --- the expedition CTA must be tappable, not covered by the bottom tab bar ---
    // Drop the seat credential first, or the app restores the room on load and hides the nav.
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-nav="journeys"]', { timeout: 20000 });
    await clickUntil(page.locator('[data-nav="journeys"]').first(), 'button:has-text("World Cup folklore")');
    await clickUntil(
      page.locator('button', { hasText: /World Cup folklore|Istanbul/i }).first(),
      'button:has-text("Begin chapter 1")',
    );
    await clickUntil(
      page.locator('button', { hasText: /Begin chapter 1/i }).first(),
      '.fd-exp-answer, .fd-answer',
    );
    await page.locator('.fd-exp-answer, .fd-answer').first().click({ force: true });
    await page.waitForTimeout(1400);
    const cta = await page.evaluate(() => {
      const btn = document.querySelector('.fd-exp-next');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { height: Math.round(r.height), reachable: hit === btn || !!hit?.closest?.('.fd-exp-next') };
    });
    check(
      'expeditions: the Next button is tappable, not under the tab bar',
      !!cta?.reachable,
      cta ? `hit=${cta.reachable}` : 'button missing',
    );
  });

  await section('ceremony', async () => {
    // --- a ceremony's 3D slot must stay inside its hero circle ---
    await page.goto(`${BASE}/fx-lab`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const slotBtn = page.locator('button', { hasText: /custom slot/i }).first();
    if (await slotBtn.count()) {
      await slotBtn.click({ force: true });
      await page.waitForTimeout(1500);
      const fits = await page.evaluate(() => {
        const hero = document.querySelector('.fx-ceremony-hero');
        const card = document.querySelector('.fx-ceremony-card');
        if (!hero || !card) return null;
        const h = hero.getBoundingClientRect();
        const inner = [...hero.children].map((c) => c.getBoundingClientRect());
        const cont = [...card.querySelectorAll('button')].pop();
        const r = cont?.getBoundingClientRect();
        const hit = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        return {
          overflow: inner.some((r2) => r2.height > h.height + 1 || r2.width > h.width + 1),
          continueReachable: !!hit?.closest?.('button'),
        };
      });
      check('ceremony: the hero slot never overflows its circle', fits ? !fits.overflow : false);
      check('ceremony: Continue stays clickable', !!fits?.continueReachable);
    }
  });

  check(
    'no console errors during the run',
    consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | '),
  );
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} invariants held`);
process.exit(failed.length ? 1 : 0);
