/**
 * The offline demo is retired.
 *
 * Two things are checked here, and both are release gates rather than unit tests.
 *
 * Honesty of the label: the server-free build used to call itself an "offline demo", which told a
 * player nothing about which half of the game works. Every string it shows now names the one
 * thing that is missing — a server — and the two features that need one. No source file under
 * `app/` or `lib/` may carry the old wording again (the static twins are the build's own copy and
 * are checked by their strings instead of by grep).
 *
 * The hand-off: with `APP_URL` set at build time the quiz pages' "Play this as a duel" button
 * points at the live game and the static bundle renders the redirect card instead of the arena.
 * With it unset every one of those surfaces is exactly what it was.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BANNED } from '../lib/seo/intents.mjs';
import { buildFiles, renderHub, renderPage } from '../scripts/seo-pages.mjs';
import { INTENTS, UI, playUrl, selectQuestions } from '../lib/seo/intents.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/** The wording this round retired, in both orders it was written. */
const RETIRED = /offline demo|demo offline/i;

/** The sentence the roadmap settled on for every "there is no server here" surface. */
const HONEST = 'This preview has no server: friend duels and finding a rival open on the live site.';

/* ------------------------------------------------------------------ the static client's copy */

test('the static duel client says what is missing, not that it is a demo', async () => {
  const { OFFLINE_BUILD, OFFLINE_NOTICE, request } = await import('../lib/duel-client-static.ts');
  assert.equal(OFFLINE_BUILD, true);

  // The messages the player actually reads, taken from the module rather than from its source.
  const shown = [OFFLINE_NOTICE.title, OFFLINE_NOTICE.body];
  for (const body of [
    { action: 'join' },
    { action: 'create', config: { opponent: 'friend' } },
    { action: 'cohort-ping' },
    { action: 'cohort-report' },
  ]) {
    const error = await request(body).then(
      () => assert.fail(`${body.action} should refuse without a server`),
      (e) => e,
    );
    assert.equal(error.status, 501);
    assert.equal(error.code, 'offline_build', 'the error code is a contract with the worker build');
    shown.push(error.message);
  }

  for (const line of shown) {
    assert.doesNotMatch(line, RETIRED, line);
    assert.doesNotMatch(line, BANNED, line);
    assert.doesNotMatch(line, /!/, line);
  }
  assert.ok(OFFLINE_NOTICE.body.startsWith(HONEST), OFFLINE_NOTICE.body);
  assert.ok(shown[2].startsWith(HONEST), shown[2]);
  assert.match(shown[2], /friend duels/i, 'the room screens match on this phrase');

  // The file itself, comments included: nothing left behind for the next reader to copy.
  assert.doesNotMatch(read('lib/duel-client-static.ts'), RETIRED);
});

/* --------------------------------------------------------------------------- the source grep */

/** Every text file under `dir`, minus the build's own static twins. */
function sources(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      sources(rel, out);
    } else if (/\.(ts|tsx|mjs|js|css|html)$/.test(entry.name) && !/-static\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

test('no screen, module or stylesheet under app/ or lib/ calls this an offline demo', () => {
  const files = [...sources('app'), ...sources('lib')];
  assert.ok(files.length > 200, `expected the whole tree, walked ${files.length} files`);
  const offenders = files.filter((rel) => RETIRED.test(read(rel)));
  assert.deepEqual(offenders, [], `retired wording in: ${offenders.join(', ')}`);
});

/* ------------------------------------------------------------------------------- the hand-off */

const APP = 'https://jaanta-hai-kya.example.workers.dev';
const BASE = 'https://occult-kranti.github.io/fact-duel';
const ctas = (html) => [...html.matchAll(/<a class="cta" href="([^"]+)"/g)].map((m) => m[1]);

test('with APP_URL set every "Play this as a duel" button points at the live game', () => {
  const { files } = buildFiles({ base: BASE, appUrl: APP });
  for (const [rel, html] of Object.entries(files)) {
    if (!rel.endsWith('.html')) continue;
    const hrefs = ctas(html);
    assert.ok(hrefs.length > 0, `${rel}: a CTA`);
    for (const href of hrefs) assert.equal(href, `${APP}/`, rel);
  }

  // One page rendered directly, the way the script does it, with and without the variable.
  const intent = INTENTS[0];
  const selection = selectQuestions(intent, QUESTIONS);
  assert.deepEqual(ctas(renderPage(intent, selection, { base: BASE, appUrl: APP })), [`${APP}/`, `${APP}/`]);
  assert.deepEqual(ctas(renderPage(intent, selection, { base: BASE })), [`${BASE}/`, `${BASE}/`]);
  assert.deepEqual(ctas(renderHub({ base: BASE, appUrl: APP })), [`${APP}/`]);

  // A trailing slash on the variable must not double up.
  assert.equal(playUrl(BASE, `${APP}/`), `${APP}/`);
  assert.equal(playUrl(BASE, '  '), `${BASE}/`);
  assert.equal(playUrl(BASE, undefined), `${BASE}/`);
});

test('the pages, their canonicals and the sitemap do not move when the game does', () => {
  const home = buildFiles({ base: BASE });
  const away = buildFiles({ base: BASE, appUrl: APP });
  assert.equal(away.files['sitemap.xml'], home.files['sitemap.xml']);
  for (const rel of Object.keys(home.files)) {
    if (!rel.endsWith('.html')) continue;
    const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)[1];
    assert.equal(canonical(away.files[rel]), canonical(home.files[rel]), rel);
    const alternates = (html) => [...html.matchAll(/<link rel="alternate"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(alternates(away.files[rel]), alternates(home.files[rel]), rel);
  }
  // The button is the only difference, and only on the pages that carry one.
  for (const rel of Object.keys(home.files))
    if (rel.endsWith('.html'))
      assert.equal(away.files[rel].replaceAll(`${APP}/`, `${BASE}/`), home.files[rel], rel);
});

test('the quiz-page chrome still reads as a duel invitation in every language', () => {
  for (const ui of Object.values(UI)) {
    assert.ok(ui.play && ui.playHint);
    for (const line of [ui.play, ui.playHint]) assert.doesNotMatch(line, RETIRED, line);
  }
});

/* ------------------------------------------------------------- the build wiring, as written */

test('the static build freezes APP_URL in and the workflow passes it to both build steps', () => {
  const config = read('vite.config.static.ts');
  assert.match(config, /const appUrl = \(process\.env\.APP_URL \?\? ''\)\.trim\(\);/);
  assert.match(config, /'import\.meta\.env\.VITE_APP_URL': JSON\.stringify\(appUrl\)/);

  const workflow = read('.github/workflows/pages.yml');
  const steps = workflow.split('      - name: ').filter((s) => /run: pnpm (seo:pages|build:static)/.test(s));
  assert.equal(steps.length, 2, 'the quiz pages step and the static build step');
  for (const step of steps) assert.match(step, /APP_URL: \$\{\{ vars\.APP_URL \}\}/, step.split('\n')[0]);

  // The entry renders the card instead of the arena, and the card is the only thing on the page.
  const main = read('static/main.tsx');
  assert.match(main, /import\.meta\.env\.VITE_APP_URL/);
  assert.match(main, /<RedirectNotice target=\{HANDOFF\} \/>/);
  const notice = read('app/redirect-notice.tsx');
  assert.match(notice, /now runs at \$\{host\}\. Taking you there…/);
  assert.doesNotMatch(notice, RETIRED);
});
