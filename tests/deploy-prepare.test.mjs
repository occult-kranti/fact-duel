/**
 * The deploy manifest: what `scripts/deploy-prepare.mjs` changes in the generated
 * `dist/server/wrangler.json` and, just as much, what it leaves alone.
 *
 * The fixture is the manifest `pnpm build` produced on 2026-09-17 (vinext 1.0.0-beta.5, wrangler
 * 4.92.0), trimmed to the keys that matter plus a few it must not touch. `main`, the assets
 * directory and the `nodejs_compat` flag come from the build and must survive untouched; the
 * name, the database and the route are the deploy's to set. The placeholder database id is the
 * one `vite.config.ts` writes for local dev, and pinning that it is refused is the point: a deploy
 * that binds the placeholder would come up with no tables and no error.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ASSET_IGNORES,
  ASSETS_IGNORE_FILE,
  DEFAULT_DATABASE_NAME,
  DEFAULT_MIGRATIONS_DIR,
  DEFAULT_WORKER_NAME,
  DEPLOY_CONFIG,
  DEPLOY_FILE,
  GENERATED_CONFIG,
  PLACEHOLDER_DATABASE_ID,
  loadFileConfig,
  main,
  mergeConfig,
  prepare,
  readFileConfig,
  summarise,
} from '../scripts/deploy-prepare.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoFile = (relative) => readFileSync(path.join(repoRoot, relative), 'utf8');

const generated = () => ({
  topLevelName: 'site-creator-vinext-starter',
  dev: { ip: 'localhost', local_protocol: 'http', upstream_protocol: 'http', enable_containers: true },
  name: 'site-creator-vinext-starter',
  compatibility_date: '2026-05-15',
  compatibility_flags: ['nodejs_compat'],
  vars: {},
  durable_objects: { bindings: [] },
  kv_namespaces: [],
  queues: { producers: [], consumers: [] },
  r2_buckets: [],
  d1_databases: [
    { binding: 'DB', database_name: 'site-creator-d1', database_id: PLACEHOLDER_DATABASE_ID },
  ],
  legacy_env: true,
  main: 'index.js',
  migrations: [],
  triggers: {},
  rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
  build: { watch_dir: './src' },
  no_bundle: true,
  assets: { directory: '../client' },
  observability: { enabled: true },
});

const ID = '2f1c9a7e-5b3d-4c8e-9a1f-6d2b8c4e0a13';
const env = (extra = {}) => ({ CF_D1_DATABASE_ID: ID, ...extra });

test('a minimal env names the worker and the database and binds the real id', () => {
  const out = prepare(generated(), env());
  assert.equal(out.name, DEFAULT_WORKER_NAME);
  assert.deepEqual(out.d1_databases, [
    { binding: 'DB', database_name: DEFAULT_DATABASE_NAME, database_id: ID, migrations_dir: DEFAULT_MIGRATIONS_DIR },
  ]);
  assert.equal('routes' in out, false, 'no custom domain means no routes key at all');
  assert.equal(out.compatibility_date, '2026-05-15', "the build's own date is kept");
});

test('every key the build owns is preserved byte for byte', () => {
  const source = generated();
  const out = prepare(source, env());
  // Put the two deploy-owned keys back and the result must equal the input exactly.
  assert.deepEqual({ ...out, name: source.name, d1_databases: source.d1_databases }, source);
  assert.equal(out.main, 'index.js');
  assert.deepEqual(out.assets, { directory: '../client' });
  assert.deepEqual(out.compatibility_flags, ['nodejs_compat']);
  assert.deepEqual(out.triggers, {}, 'the manifest still has no cron slot; the sweep stays on Actions');
});

test('prepare is pure: the generated manifest is not mutated', () => {
  const source = generated();
  const before = JSON.stringify(source);
  prepare(source, env({ CF_CUSTOM_DOMAIN: 'play.example.com', CF_WORKER_NAME: 'x' }));
  assert.equal(JSON.stringify(source), before);
});

test('the custom domain becomes a single custom_domain route', () => {
  const out = prepare(generated(), env({ CF_CUSTOM_DOMAIN: 'play.example.com' }));
  assert.deepEqual(out.routes, [{ pattern: 'play.example.com', custom_domain: true }]);
});

test('a pasted URL or an upper-case domain is normalised to the bare hostname', () => {
  for (const raw of ['https://Play.Example.com/', 'PLAY.EXAMPLE.COM', 'play.example.com.', ' play.example.com ']) {
    const out = prepare(generated(), env({ CF_CUSTOM_DOMAIN: raw }));
    assert.deepEqual(out.routes, [{ pattern: 'play.example.com', custom_domain: true }], raw);
  }
});

test('an apex domain is accepted', () => {
  const out = prepare(generated(), env({ CF_CUSTOM_DOMAIN: 'example.com' }));
  assert.deepEqual(out.routes, [{ pattern: 'example.com', custom_domain: true }]);
});

test('a bad domain is refused rather than deployed as a route', () => {
  for (const bad of ['localhost', 'play', 'play_example.com', '-play.example.com', 'a b.example.com']) {
    assert.throws(() => prepare(generated(), env({ CF_CUSTOM_DOMAIN: bad })), /CF_CUSTOM_DOMAIN/, bad);
  }
});

test('an empty CF_CUSTOM_DOMAIN is the same as none', () => {
  assert.deepEqual(prepare(generated(), env({ CF_CUSTOM_DOMAIN: '' })), prepare(generated(), env()));
  assert.deepEqual(prepare(generated(), env({ CF_CUSTOM_DOMAIN: '   ' })), prepare(generated(), env()));
});

test('a missing, blank or malformed database id throws, and so does the local placeholder', () => {
  assert.throws(() => prepare(generated(), {}), /CF_D1_DATABASE_ID is required/);
  assert.throws(() => prepare(generated(), { CF_D1_DATABASE_ID: '   ' }), /CF_D1_DATABASE_ID is required/);
  assert.throws(() => prepare(generated(), { CF_D1_DATABASE_ID: 'not-a-uuid' }), /CF_D1_DATABASE_ID is not valid/);
  assert.throws(
    () => prepare(generated(), { CF_D1_DATABASE_ID: PLACEHOLDER_DATABASE_ID }),
    /placeholder/,
    'the id vite.config.ts writes for local dev must never reach production',
  );
});

test('the worker and database names are overridable and validated', () => {
  const out = prepare(generated(), env({ CF_WORKER_NAME: 'jhk-staging', CF_D1_DATABASE_NAME: 'jhk_staging' }));
  assert.equal(out.name, 'jhk-staging');
  assert.equal(out.d1_databases[0].database_name, 'jhk_staging');
  assert.throws(() => prepare(generated(), env({ CF_WORKER_NAME: 'Has Spaces' })), /CF_WORKER_NAME/);
  assert.throws(() => prepare(generated(), env({ CF_WORKER_NAME: '-leading' })), /CF_WORKER_NAME/);
  assert.throws(() => prepare(generated(), env({ CF_D1_DATABASE_NAME: 'no/slash' })), /CF_D1_DATABASE_NAME/);
});

test('the compatibility date and migrations dir can be pinned from the env', () => {
  const out = prepare(generated(), env({ CF_COMPATIBILITY_DATE: '2026-09-01', CF_D1_MIGRATIONS_DIR: '../.openai/drizzle' }));
  assert.equal(out.compatibility_date, '2026-09-01');
  assert.equal(out.d1_databases[0].migrations_dir, '../.openai/drizzle');
  assert.throws(() => prepare(generated(), env({ CF_COMPATIBILITY_DATE: 'yesterday' })), /CF_COMPATIBILITY_DATE/);
  assert.throws(() => prepare(generated(), env({ CF_D1_MIGRATIONS_DIR: '../x;rm -rf' })), /CF_D1_MIGRATIONS_DIR/);
});

test('other D1 bindings, if any appear, are carried through untouched', () => {
  const source = generated();
  source.d1_databases.push({ binding: 'ANALYTICS', database_name: 'stats', database_id: ID.replace('2f1c', 'aaaa') });
  const out = prepare(source, env());
  assert.deepEqual(out.d1_databases[1], source.d1_databases[1]);
  assert.equal(out.d1_databases[0].database_id, ID);
});

test('a manifest with no DB binding or no main is refused', () => {
  const noDb = generated();
  noDb.d1_databases = [];
  assert.throws(() => prepare(noDb, env()), /no D1 binding named DB/);
  const noMain = generated();
  delete noMain.main;
  assert.throws(() => prepare(noMain, env()), /no `main`/);
  assert.throws(() => prepare(null, env()), /not an object/);
  assert.throws(() => prepare([], env()), /not an object/);
});

test('idempotent: preparing a prepared manifest changes nothing', () => {
  for (const e of [env(), env({ CF_CUSTOM_DOMAIN: 'play.example.com', CF_WORKER_NAME: 'jhk' })]) {
    const once = prepare(generated(), e);
    const twice = prepare(once, e);
    assert.deepEqual(twice, once);
    assert.deepEqual(prepare(JSON.parse(JSON.stringify(once)), e), once, 'and after a JSON round trip');
  }
});

test('re-preparing with a different env replaces, never accumulates', () => {
  const withDomain = prepare(generated(), env({ CF_CUSTOM_DOMAIN: 'play.example.com' }));
  const withoutDomain = prepare(withDomain, env());
  assert.equal('routes' in withoutDomain, false, 'dropping the domain drops the route');
  const other = prepare(withDomain, env({ CF_CUSTOM_DOMAIN: 'duel.example.com' }));
  assert.deepEqual(other.routes, [{ pattern: 'duel.example.com', custom_domain: true }]);
});

test('the summary never prints the whole database id', () => {
  const out = prepare(generated(), env({ CF_CUSTOM_DOMAIN: 'play.example.com' }));
  const summary = summarise(out);
  assert.equal(summary.includes(ID), false);
  assert.match(summary, /2f1c9a7e…/);
  assert.match(summary, /jaanta-hai-kya/);
  assert.match(summary, /play\.example\.com/);
  assert.match(summary, /\.\.\/client/);
  assert.match(summarise(prepare(generated(), env())), /workers\.dev only/);
});

const builtTree = () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'deploy-prepare-'));
  mkdirSync(path.join(cwd, 'dist/server'), { recursive: true });
  mkdirSync(path.join(cwd, 'dist/client/product/compliance'), { recursive: true });
  writeFileSync(path.join(cwd, 'dist/client/product/compliance/checklist.site.html'), '<p>internal</p>');
  const original = `${JSON.stringify(generated())}\n`;
  writeFileSync(path.join(cwd, GENERATED_CONFIG), original);
  return { cwd, original };
};

test('main reads the generated file and writes the sibling deploy file, leaving the original alone', () => {
  const { cwd, original } = builtTree();
  const { target } = main(env({ CF_CUSTOM_DOMAIN: 'play.example.com' }), cwd);
  assert.equal(target, path.join(cwd, DEPLOY_CONFIG));
  assert.equal(readFileSync(path.join(cwd, GENERATED_CONFIG), 'utf8'), original, 'the generated file is untouched');
  const written = JSON.parse(readFileSync(target, 'utf8'));
  assert.deepEqual(written, prepare(generated(), env({ CF_CUSTOM_DOMAIN: 'play.example.com' })));
  assert.equal(written.assets.directory, '../client', 'the assets path is still relative to dist/server');
});

test('main writes .assetsignore next to the assets so public/product never reaches the domain', () => {
  const { cwd } = builtTree();
  const { ignoreFile } = main(env(), cwd);
  assert.equal(ignoreFile, path.join(cwd, 'dist/client', ASSETS_IGNORE_FILE));
  const lines = readFileSync(ignoreFile, 'utf8').split('\n').filter(Boolean);
  assert.deepEqual(lines, [...ASSET_IGNORES]);
  assert.ok(lines.includes('product/'), 'the compliance checklist lives under product/');
  assert.ok(
    existsSync(path.join(cwd, 'dist/client/product/compliance/checklist.site.html')),
    'the file itself is left on disk; only the upload skips it',
  );
});

test('main says to build first when the generated file or the assets directory is missing', () => {
  const empty = mkdtempSync(path.join(tmpdir(), 'deploy-prepare-'));
  assert.throws(() => main(env(), empty), /run `pnpm build` first/);
  const noAssets = mkdtempSync(path.join(tmpdir(), 'deploy-prepare-'));
  mkdirSync(path.join(noAssets, 'dist/server'), { recursive: true });
  writeFileSync(path.join(noAssets, GENERATED_CONFIG), JSON.stringify(generated()));
  assert.throws(() => main(env(), noAssets), /assets directory .* is missing/);
});

/* -------------------------------------------------------------------------------------------
 * deploy.config.json — the committed, non-secret account facts, so a fresh clone deploys with
 * two secrets and no repository variables. The environment always wins; the file fills gaps.
 * ---------------------------------------------------------------------------------------- */

/** The live database this repo deploys against. A wrong id here is a Worker bound to nothing. */
const LIVE_ID = '2c74ea74-4d0f-492a-9b21-6e29393bfb4b';
const file = (extra = {}) => ({
  workerName: 'jaanta-hai-kya',
  d1: { name: 'jhk-db', id: LIVE_ID },
  notes: 'not a secret',
  ...extra,
});

test('the file alone is enough: an empty environment still binds the real database', () => {
  const out = prepare(generated(), {}, file());
  assert.equal(out.name, 'jaanta-hai-kya');
  assert.deepEqual(out.d1_databases, [
    { binding: 'DB', database_name: 'jhk-db', database_id: LIVE_ID, migrations_dir: DEFAULT_MIGRATIONS_DIR },
  ]);
  assert.equal('routes' in out, false, 'the file carries no domain');
});

test('the environment wins over the file, field by field', () => {
  const out = prepare(
    generated(),
    { CF_D1_DATABASE_ID: ID, CF_D1_DATABASE_NAME: 'jhk_staging', CF_WORKER_NAME: 'jhk-staging' },
    file(),
  );
  assert.equal(out.name, 'jhk-staging');
  assert.equal(out.d1_databases[0].database_id, ID);
  assert.equal(out.d1_databases[0].database_name, 'jhk_staging');
});

test('the file fills only the gaps the environment leaves', () => {
  const out = prepare(generated(), { CF_WORKER_NAME: 'jhk-staging' }, file());
  assert.equal(out.name, 'jhk-staging', 'from the environment');
  assert.equal(out.d1_databases[0].database_id, LIVE_ID, 'from the file');
  assert.equal(out.d1_databases[0].database_name, 'jhk-db', 'from the file');
});

test('a blank environment value does not shadow the file', () => {
  const out = prepare(generated(), { CF_D1_DATABASE_ID: '   ', CF_WORKER_NAME: '' }, file());
  assert.equal(out.d1_databases[0].database_id, LIVE_ID);
  assert.equal(out.name, 'jaanta-hai-kya');
});

test('neither the environment nor a file: the same error as before', () => {
  const before = 'CF_D1_DATABASE_ID is required: the uuid `wrangler d1 create` printed.';
  assert.throws(() => prepare(generated(), {}), (e) => e.message === before);
  assert.throws(() => prepare(generated(), {}, null), (e) => e.message === before);
  assert.throws(() => prepare(generated(), {}, {}), (e) => e.message === before);
  assert.throws(() => prepare(generated(), {}, { d1: {} }), (e) => e.message === before);
});

test('the placeholder id is refused from the file too, and the message says where to fix it', () => {
  assert.throws(
    () => prepare(generated(), {}, file({ d1: { name: 'jhk-db', id: PLACEHOLDER_DATABASE_ID } })),
    (e) => /placeholder/.test(e.message) && e.message.includes(DEPLOY_FILE),
  );
  assert.throws(
    () => prepare(generated(), { CF_D1_DATABASE_ID: PLACEHOLDER_DATABASE_ID }, file()),
    (e) => /placeholder/.test(e.message) && !e.message.includes(DEPLOY_FILE),
    'an env placeholder must not blame the file',
  );
});

test('a malformed value in the file is refused, and the message names the file', () => {
  for (const bad of [{ d1: { name: 'jhk-db', id: 'not-a-uuid' } }, { d1: { id: LIVE_ID, name: 'no/slash' } }]) {
    assert.throws(() => prepare(generated(), {}, { ...file(), ...bad }), (e) => e.message.includes(DEPLOY_FILE));
  }
  assert.throws(() => prepare(generated(), {}, file({ workerName: 'Has Spaces' })), /CF_WORKER_NAME is not valid/);
});

test('readFileConfig: nothing, blanks and odd shapes', () => {
  assert.deepEqual(readFileConfig(null), {});
  assert.deepEqual(readFileConfig(undefined), {});
  assert.deepEqual(readFileConfig({}), {});
  assert.deepEqual(readFileConfig({ workerName: '  ', d1: { id: '', name: null } }), {});
  assert.deepEqual(readFileConfig({ d1: { id: `  ${LIVE_ID}  ` } }), { CF_D1_DATABASE_ID: LIVE_ID });
  assert.deepEqual(readFileConfig(file()), {
    CF_WORKER_NAME: 'jaanta-hai-kya',
    CF_D1_DATABASE_NAME: 'jhk-db',
    CF_D1_DATABASE_ID: LIVE_ID,
  });
  assert.deepEqual(readFileConfig({ notes: 'x', unknown: { deep: 1 } }), {}, 'unknown fields are ignored');
  for (const bad of ['x', 42, []]) assert.throws(() => readFileConfig(bad), /is not an object/);
  assert.throws(() => readFileConfig({ d1: 'jhk-db' }), /d1 must be an object/);
  assert.throws(() => readFileConfig({ d1: { id: 12 } }), /d1\.id must be a string/);
  assert.throws(() => readFileConfig({ workerName: ['x'] }), /workerName must be a string/);
});

test('mergeConfig says where every value came from', () => {
  const { values, sources } = mergeConfig({ CF_WORKER_NAME: 'jhk-staging', CF_CUSTOM_DOMAIN: 'play.example.com' }, file());
  assert.deepEqual(values, {
    CF_WORKER_NAME: 'jhk-staging',
    CF_D1_DATABASE_NAME: 'jhk-db',
    CF_D1_DATABASE_ID: LIVE_ID,
    CF_CUSTOM_DOMAIN: 'play.example.com',
  });
  assert.deepEqual(sources, {
    CF_WORKER_NAME: 'env',
    CF_D1_DATABASE_NAME: DEPLOY_FILE,
    CF_D1_DATABASE_ID: DEPLOY_FILE,
    CF_CUSTOM_DOMAIN: 'env',
  });
  assert.deepEqual(mergeConfig({}, null), { values: {}, sources: {} });
});

test('prepare mutates neither the manifest nor the file config', () => {
  const source = generated();
  const config = file();
  const before = [JSON.stringify(source), JSON.stringify(config)];
  prepare(source, { CF_CUSTOM_DOMAIN: 'play.example.com' }, config);
  assert.deepEqual([JSON.stringify(source), JSON.stringify(config)], before);
});

test('the summary names the fields the file supplied, and stays quiet when it supplied none', () => {
  const env2 = { CF_WORKER_NAME: 'jhk-staging' };
  const { values, sources } = mergeConfig(env2, file());
  const summary = summarise(prepare(generated(), env2, file()), sources);
  assert.match(summary, /from file {6}deploy\.config\.json: CF_D1_DATABASE_ID, CF_D1_DATABASE_NAME/);
  assert.equal(summary.includes(values.CF_D1_DATABASE_ID), false, 'still no whole database id');
  assert.equal(summarise(prepare(generated(), env()), mergeConfig(env(), null).sources).includes('from file'), false);
  assert.equal(summarise(prepare(generated(), env())).includes('from file'), false, 'and with no sources at all');
});

test('main reads deploy.config.json from the working directory, and the env still overrides it', () => {
  const { cwd } = builtTree();
  writeFileSync(path.join(cwd, DEPLOY_FILE), `${JSON.stringify(file(), null, 2)}\n`);
  const { target, summary } = main({}, cwd);
  const written = JSON.parse(readFileSync(target, 'utf8'));
  assert.equal(written.name, 'jaanta-hai-kya');
  assert.equal(written.d1_databases[0].database_id, LIVE_ID);
  assert.match(summary, /from file {6}deploy\.config\.json/);

  const overridden = main({ CF_D1_DATABASE_ID: ID, CF_WORKER_NAME: 'jhk-staging' }, cwd);
  const second = JSON.parse(readFileSync(overridden.target, 'utf8'));
  assert.equal(second.d1_databases[0].database_id, ID);
  assert.equal(second.name, 'jhk-staging');
  assert.equal(second.d1_databases[0].database_name, 'jhk-db', 'the file still fills the gap');
});

test('loadFileConfig: absent is not an error, unparseable is', () => {
  const { cwd } = builtTree();
  assert.equal(loadFileConfig(cwd), null);
  assert.throws(() => main({}, cwd), /CF_D1_DATABASE_ID is required/, 'and then the env must carry it');
  writeFileSync(path.join(cwd, DEPLOY_FILE), '{ not json');
  assert.throws(() => loadFileConfig(cwd), /deploy\.config\.json is not valid JSON/);
  assert.throws(() => main(env(), cwd), /deploy\.config\.json is not valid JSON/);
});

test("the repo's own deploy.config.json is the live database and deploys as it stands", () => {
  const parsed = JSON.parse(repoFile(DEPLOY_FILE));
  assert.deepEqual(Object.keys(parsed).sort(), ['d1', 'notes', 'workerName'], 'no room for a secret');
  assert.equal(parsed.workerName, DEFAULT_WORKER_NAME);
  assert.equal(parsed.d1.name, DEFAULT_DATABASE_NAME);
  assert.equal(parsed.d1.id, LIVE_ID);
  assert.equal(typeof parsed.notes, 'string');
  assert.ok(parsed.notes.length > 40, 'the notes say what the file is and why it is not secret');
  const withoutTheId = JSON.stringify(parsed).replaceAll(LIVE_ID, '');
  assert.deepEqual(
    withoutTheId.match(/[A-Za-z0-9_-]{30,}/g) ?? [],
    [],
    'nothing token-shaped belongs in a committed file',
  );

  const out = prepare(generated(), {}, parsed);
  assert.equal(out.name, 'jaanta-hai-kya');
  assert.deepEqual(out.d1_databases[0], {
    binding: 'DB',
    database_name: 'jhk-db',
    database_id: LIVE_ID,
    migrations_dir: DEFAULT_MIGRATIONS_DIR,
  });
});

/* -------------------------------------------------------------------------------------------
 * The workflow: two secrets and a dispatch. Parsed with js-yaml so a broken file fails here
 * rather than in the Actions tab.
 * ---------------------------------------------------------------------------------------- */

const loadYaml = async () => {
  const requireFrom = createRequire(import.meta.url);
  try {
    return requireFrom('js-yaml').load;
  } catch {
    const store = path.join(repoRoot, 'node_modules/.pnpm');
    const dir = readdirSync(store).find((name) => name.startsWith('js-yaml@'));
    assert.ok(dir, 'js-yaml is not installed under node_modules/.pnpm');
    const entry = path.join(store, dir, 'node_modules/js-yaml/dist/js-yaml.mjs');
    const mod = await import(pathToFileURL(entry).href);
    return mod.load ?? mod.default.load;
  }
};

test('the deploy workflow is valid YAML and redeploys when deploy.config.json changes', async () => {
  const load = await loadYaml();
  const doc = load(repoFile('.github/workflows/deploy-worker.yml'));
  const on = doc.on ?? doc[true];
  assert.ok('workflow_dispatch' in on, 'the founder can run it by hand');
  assert.ok(on.push.paths.includes('deploy.config.json'));
  assert.equal(doc.jobs.deploy.if, "needs.preflight.outputs.configured == 'true'");
});

test('preflight checks out the tree and takes the file as the database id', async () => {
  const load = await loadYaml();
  const doc = load(repoFile('.github/workflows/deploy-worker.yml'));
  const steps = doc.jobs.preflight.steps;
  assert.ok(
    steps.some((step) => typeof step.uses === 'string' && step.uses.startsWith('actions/checkout@')),
    'without a checkout it cannot see deploy.config.json',
  );
  const check = steps.find((step) => step.id === 'check');
  assert.match(check.run, /\[ -f deploy\.config\.json \]/);
  assert.match(check.run, /database_source/);
});

test('the not-configured exit is green and names exactly the two secrets', async () => {
  const load = await loadYaml();
  const doc = load(repoFile('.github/workflows/deploy-worker.yml'));
  const check = doc.jobs.preflight.steps.find((step) => step.id === 'check');
  assert.match(check.run, /configured=false/);
  assert.equal(/exit 1/.test(check.run), false, 'an unconfigured repo never goes red');
  const named = [...new Set(check.run.match(/secrets\.[A-Z_]+/g) ?? [])].sort();
  assert.deepEqual(named, ['secrets.CLOUDFLARE_ACCOUNT_ID', 'secrets.CLOUDFLARE_API_TOKEN']);
  assert.match(check.run, /Ten-minute path/, 'and points at the doc that gets them');
});

test('the prepare step still passes every override the founder may set', async () => {
  const load = await loadYaml();
  const doc = load(repoFile('.github/workflows/deploy-worker.yml'));
  const prepareStep = doc.jobs.deploy.steps.find((step) => step.name === 'Prepare the deploy manifest');
  assert.deepEqual(Object.keys(prepareStep.env).sort(), [
    'CF_CUSTOM_DOMAIN',
    'CF_D1_DATABASE_ID',
    'CF_D1_DATABASE_NAME',
    'CF_WORKER_NAME',
  ]);
});

test('the deploy doc opens with the Ten-minute path and its seven steps', () => {
  const doc = repoFile('docs/deploy-cloudflare.md');
  const lines = doc.split('\n');
  const tenMinute = lines.indexOf('## Ten-minute path');
  assert.ok(tenMinute > 0 && tenMinute < 30, `the section is at the top (line ${tenMinute})`);
  assert.ok(tenMinute < lines.indexOf('## What runs where'));
  const section = lines.slice(tenMinute, lines.indexOf('## What runs where')).join('\n');
  for (const step of [1, 2, 3, 4, 5, 6, 7]) assert.match(section, new RegExp(`\n### ${step}\\. `), `step ${step}`);
  assert.match(section, /Edit Cloudflare Workers/, 'the token template');
  assert.match(section, /\| Account \| D1 \| \*\*Edit\*\* \|/, 'the D1 row the template may not carry');
  assert.match(section, /dash\.cloudflare\.com\/<account-id>/, 'where the account id is');
  assert.match(section, /CLOUDFLARE_API_TOKEN/);
  assert.match(section, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(section, /https:\/\/jaanta-hai-kya\.<your-subdomain>\.workers\.dev/);
  assert.match(section, /`APP_URL`/, 'so the Pages site hands players over');
  assert.match(section, /Cloudflare Registrar/);
  assert.match(section, /CF_CUSTOM_DOMAIN/);
  assert.equal(/\b(bet|wager|odds|jackpot|casino|slots|gamble)\b/i.test(section), false);
});
