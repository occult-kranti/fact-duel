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
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ASSET_IGNORES,
  ASSETS_IGNORE_FILE,
  DEFAULT_DATABASE_NAME,
  DEFAULT_MIGRATIONS_DIR,
  DEFAULT_WORKER_NAME,
  DEPLOY_CONFIG,
  GENERATED_CONFIG,
  PLACEHOLDER_DATABASE_ID,
  main,
  prepare,
  summarise,
} from '../scripts/deploy-prepare.mjs';

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
