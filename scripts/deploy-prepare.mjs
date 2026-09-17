/**
 * scripts/deploy-prepare.mjs — turn the generated Worker manifest into a deployable one.
 *
 * `pnpm build` (vinext + @cloudflare/vite-plugin) writes `dist/server/wrangler.json` from
 * `vite.config.ts`, which in turn reads `.openai/hosting.json`. That manifest is correct about the
 * things the build knows — `main`, the `nodejs_compat` flag, the static assets directory, the `DB`
 * D1 binding — and deliberately blank about the things only a real account knows: the Worker's
 * name is the package name, the D1 database is a placeholder id, and there is no route.
 *
 * This script fills those in from the environment and from `deploy.config.json` at the repo root,
 * and writes a SIBLING file,
 * `dist/server/wrangler.deploy.json`. The generated file is never edited in place: it is what
 * `pnpm start` runs locally, and the next build overwrites it anyway. Keeping the two apart means
 * a deploy can never be mistaken for a local run and a local run can never carry a live database
 * id.
 *
 * Nothing here is secret. Secrets (OPS_TOKEN and friends) are set with `wrangler secret put` by
 * the workflow, never written into a config file.
 *
 *   CF_WORKER_NAME        Worker name (default jaanta-hai-kya)
 *   CF_D1_DATABASE_ID     the D1 database's id — REQUIRED unless deploy.config.json carries it
 *   CF_D1_DATABASE_NAME   the D1 database's name (default jhk-db)
 *   CF_CUSTOM_DOMAIN      optional; when set the Worker is published on that Custom Domain
 *   CF_D1_MIGRATIONS_DIR  optional; where `wrangler d1 migrations apply` finds the SQL, relative
 *                         to the deploy config's directory (default ../../drizzle, the repo's own)
 *   CF_COMPATIBILITY_DATE optional YYYY-MM-DD; the build's own date is kept unless this is set
 *
 * `deploy.config.json` at the repo root is the committed answer to the three account-shaped
 * questions, so a fresh clone deploys with two secrets and no repository variables:
 *
 *   { "workerName": "jaanta-hai-kya", "d1": { "name": "jhk-db", "id": "<uuid>" }, "notes": "…" }
 *
 * The environment always wins; the file only fills the gaps. Nothing in it is secret — a database
 * id is a locator and is useless without CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
 *
 * `prepare(config, env, fileConfig)` is pure and exported for `tests/deploy-prepare.test.mjs`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_WORKER_NAME = 'jaanta-hai-kya';
export const DEFAULT_DATABASE_NAME = 'jhk-db';
export const DEFAULT_MIGRATIONS_DIR = '../../drizzle';
export const D1_BINDING = 'DB';
/** The id vite.config.ts writes so local dev has something to bind to. Deploying it is a bug. */
export const PLACEHOLDER_DATABASE_ID = '00000000-0000-4000-8000-000000000000';

export const GENERATED_CONFIG = 'dist/server/wrangler.json';
export const DEPLOY_CONFIG = 'dist/server/wrangler.deploy.json';
/** The committed, non-secret account facts, read from the repo root when it is there. */
export const DEPLOY_FILE = 'deploy.config.json';

/**
 * Paths under the assets directory that must not be uploaded, in `.assetsignore` (gitignore)
 * syntax. The Worker build copies all of `public/` into `dist/client`, and `public/product/` is
 * 7.6 MB of internal documentation that no screen loads — including the compliance checklist that
 * `.github/workflows/pages.yml` deliberately never publishes (its header says why). The static
 * build skips the directory in `vite.config.static.ts`; this is the same rule for the Worker.
 */
export const ASSET_IGNORES = Object.freeze(['product/']);
export const ASSETS_IGNORE_FILE = '.assetsignore';

const WORKER_NAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const DATABASE_NAME = /^[a-z0-9]([a-z0-9-_]{0,61}[a-z0-9])?$/;
const DATABASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const LABEL = '[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?';
const HOSTNAME = new RegExp(`^${LABEL}(\\.${LABEL})+$`);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PATH_LIKE = /^[A-Za-z0-9_./-]+$/;

const read = (env, key) => (typeof env?.[key] === 'string' ? env[key].trim() : '');

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** " Set in deploy.config.json." when that is where a bad value came from, so the fix is obvious. */
const origin = (sources, key) => (sources?.[key] === DEPLOY_FILE ? ` Set in ${DEPLOY_FILE}.` : '');

function required(env, key, pattern, describe, sources) {
  const value = read(env, key);
  if (!value) throw new ConfigError(`${key} is required: ${describe}.`);
  if (!pattern.test(value)) throw new ConfigError(`${key} is not valid: ${describe}.${origin(sources, key)}`);
  return value;
}

function optional(env, key, pattern, describe, fallback, sources) {
  const value = read(env, key);
  if (!value) return fallback;
  if (!pattern.test(value)) throw new ConfigError(`${key} is not valid: ${describe}.${origin(sources, key)}`);
  return value;
}

/** Every environment variable this script understands. The file answers the first three. */
export const CONFIG_KEYS = Object.freeze([
  'CF_WORKER_NAME',
  'CF_D1_DATABASE_NAME',
  'CF_D1_DATABASE_ID',
  'CF_D1_MIGRATIONS_DIR',
  'CF_COMPATIBILITY_DATE',
  'CF_CUSTOM_DOMAIN',
]);

/** Where each file field lands in the environment's vocabulary. */
const FILE_FIELDS = Object.freeze([
  ['CF_WORKER_NAME', ['workerName']],
  ['CF_D1_DATABASE_NAME', ['d1', 'name']],
  ['CF_D1_DATABASE_ID', ['d1', 'id']],
]);

/**
 * Pure: `deploy.config.json`'s parsed contents as an env-shaped record. Missing fields and blank
 * strings are simply absent; a field of the wrong type is a ConfigError naming its path, because a
 * silently ignored database id is how a deploy comes up bound to nothing.
 */
export function readFileConfig(value) {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new ConfigError(`${DEPLOY_FILE} is not an object.`);
  const out = {};
  for (const [key, fieldPath] of FILE_FIELDS) {
    let node = value;
    for (const part of fieldPath) {
      if (node === null || node === undefined) break;
      if (typeof node !== 'object' || Array.isArray(node))
        throw new ConfigError(`${DEPLOY_FILE}: ${fieldPath[0]} must be an object.`);
      node = node[part];
    }
    if (node === null || node === undefined) continue;
    if (typeof node !== 'string') throw new ConfigError(`${DEPLOY_FILE}: ${fieldPath.join('.')} must be a string.`);
    const trimmed = node.trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

/**
 * Pure: the environment wins, the file fills the gaps. Returns the merged values and, for each
 * one, which of the two it came from — the summary prints that so a log says where a deploy's
 * database id was decided.
 */
export function mergeConfig(env = {}, fileConfig = null) {
  const file = readFileConfig(fileConfig);
  const values = {};
  const sources = {};
  for (const key of CONFIG_KEYS) {
    const fromEnv = read(env, key);
    if (fromEnv) {
      values[key] = fromEnv;
      sources[key] = 'env';
    } else if (file[key]) {
      values[key] = file[key];
      sources[key] = DEPLOY_FILE;
    }
  }
  return { values, sources };
}

/** A hostname, with a stray scheme, path or trailing dot stripped so a pasted URL still works. */
function normaliseDomain(raw) {
  return raw
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/\.$/, '');
}

/**
 * Pure: returns a new manifest and never touches `config`. Applying it twice with the same env
 * yields the same object (the test pins this), so a re-run after a failed deploy is safe.
 */
export function prepare(config, env = {}, fileConfig = null) {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new ConfigError('The generated wrangler.json is not an object.');
  if (typeof config.main !== 'string' || !config.main)
    throw new ConfigError('The generated wrangler.json has no `main` entry; run `pnpm build` first.');

  const { values, sources } = mergeConfig(env, fileConfig);
  const name = optional(values, 'CF_WORKER_NAME', WORKER_NAME, 'lowercase letters, digits and dashes', DEFAULT_WORKER_NAME, sources);
  const databaseId = required(values, 'CF_D1_DATABASE_ID', DATABASE_ID, 'the uuid `wrangler d1 create` printed', sources);
  if (databaseId === PLACEHOLDER_DATABASE_ID)
    throw new ConfigError(`CF_D1_DATABASE_ID is the local placeholder id, not a real database.${origin(sources, 'CF_D1_DATABASE_ID')}`);
  const databaseName = optional(values, 'CF_D1_DATABASE_NAME', DATABASE_NAME, 'lowercase letters, digits, dashes and underscores', DEFAULT_DATABASE_NAME, sources);
  const migrationsDir = optional(values, 'CF_D1_MIGRATIONS_DIR', PATH_LIKE, 'a relative path', DEFAULT_MIGRATIONS_DIR, sources);
  const compatibilityDate = optional(values, 'CF_COMPATIBILITY_DATE', ISO_DATE, 'YYYY-MM-DD', config.compatibility_date, sources);
  if (!compatibilityDate) throw new ConfigError('No compatibility_date in the manifest and none in CF_COMPATIBILITY_DATE.');
  const rawDomain = read(values, 'CF_CUSTOM_DOMAIN');
  const domain = rawDomain ? normaliseDomain(rawDomain) : '';
  if (rawDomain && !HOSTNAME.test(domain))
    throw new ConfigError('CF_CUSTOM_DOMAIN is not valid: a hostname such as play.example.com.');

  const databases = Array.isArray(config.d1_databases) ? config.d1_databases : [];
  const bound = databases.find((d) => d?.binding === D1_BINDING);
  if (!bound)
    throw new ConfigError(`The generated wrangler.json has no D1 binding named ${D1_BINDING}; check .openai/hosting.json.`);
  const d1_databases = databases.map((d) =>
    d === bound
      ? { ...d, database_name: databaseName, database_id: databaseId, migrations_dir: migrationsDir }
      : structuredClone(d),
  );

  const out = structuredClone(config);
  out.name = name;
  out.compatibility_date = compatibilityDate;
  out.d1_databases = d1_databases;
  if (domain) out.routes = [{ pattern: domain, custom_domain: true }];
  else delete out.routes;
  return out;
}

/** What the workflow log shows. The database id is a locator, not a secret, but it still stays short. */
export function summarise(config, sources = null) {
  const db = (config.d1_databases ?? []).find((d) => d?.binding === D1_BINDING) ?? {};
  const id = typeof db.database_id === 'string' ? `${db.database_id.slice(0, 8)}…` : '(none)';
  const domain = config.routes?.find((r) => r?.custom_domain)?.pattern;
  const lines = [
    `worker         ${config.name}`,
    `main           ${config.main}`,
    `assets         ${config.assets?.directory ?? '(none)'}`,
    `compat date    ${config.compatibility_date}`,
    `d1 ${D1_BINDING}          ${db.database_name} (${id}), migrations from ${db.migrations_dir}`,
    `custom domain  ${domain ?? '(none: workers.dev only)'}`,
  ];
  const fromFile = Object.keys(sources ?? {})
    .filter((key) => sources[key] === DEPLOY_FILE)
    .sort();
  if (fromFile.length) lines.push(`from file      ${DEPLOY_FILE}: ${fromFile.join(', ')}`);
  return lines.join('\n');
}

/**
 * The repo root's `deploy.config.json`, parsed, or null when there is none — an absent file is
 * not an error: the environment can still carry everything.
 */
export function loadFileConfig(cwd = process.cwd()) {
  let raw;
  try {
    raw = readFileSync(path.resolve(cwd, DEPLOY_FILE), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ConfigError(`${DEPLOY_FILE} is not valid JSON.`);
  }
}

export function main(env = process.env, cwd = process.cwd()) {
  const source = path.resolve(cwd, GENERATED_CONFIG);
  let raw;
  try {
    raw = readFileSync(source, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw new ConfigError(`${GENERATED_CONFIG} is missing; run \`pnpm build\` first.`);
    throw error;
  }
  const fileConfig = loadFileConfig(cwd);
  const prepared = prepare(JSON.parse(raw), env, fileConfig);
  const target = path.resolve(cwd, DEPLOY_CONFIG);
  writeFileSync(target, `${JSON.stringify(prepared, null, 2)}\n`);
  // The assets directory is relative to the config file, the same way wrangler resolves it.
  const assetsDir = path.resolve(path.dirname(target), prepared.assets?.directory ?? '');
  const ignoreFile = path.join(assetsDir, ASSETS_IGNORE_FILE);
  if (!existsSync(assetsDir))
    throw new ConfigError(`The assets directory ${path.relative(cwd, assetsDir)} is missing; run \`pnpm build\` first.`);
  writeFileSync(ignoreFile, `${ASSET_IGNORES.join('\n')}\n`);
  return { target, ignoreFile, summary: summarise(prepared, mergeConfig(env, fileConfig).sources) };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const { target, ignoreFile, summary } = main();
    console.log(`Wrote ${path.relative(process.cwd(), target)}`);
    console.log(`Wrote ${path.relative(process.cwd(), ignoreFile)} (${ASSET_IGNORES.join(', ')})`);
    console.log(summary);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`deploy-prepare: ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
}
