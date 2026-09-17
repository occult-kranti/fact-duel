/**
 * scripts/deploy-prepare.mjs — turn the generated Worker manifest into a deployable one.
 *
 * `pnpm build` (vinext + @cloudflare/vite-plugin) writes `dist/server/wrangler.json` from
 * `vite.config.ts`, which in turn reads `.openai/hosting.json`. That manifest is correct about the
 * things the build knows — `main`, the `nodejs_compat` flag, the static assets directory, the `DB`
 * D1 binding — and deliberately blank about the things only a real account knows: the Worker's
 * name is the package name, the D1 database is a placeholder id, and there is no route.
 *
 * This script fills those in from the environment and writes a SIBLING file,
 * `dist/server/wrangler.deploy.json`. The generated file is never edited in place: it is what
 * `pnpm start` runs locally, and the next build overwrites it anyway. Keeping the two apart means
 * a deploy can never be mistaken for a local run and a local run can never carry a live database
 * id.
 *
 * Nothing here is secret. Secrets (OPS_TOKEN and friends) are set with `wrangler secret put` by
 * the workflow, never written into a config file.
 *
 *   CF_WORKER_NAME        Worker name (default jaanta-hai-kya)
 *   CF_D1_DATABASE_ID     the D1 database's id — REQUIRED
 *   CF_D1_DATABASE_NAME   the D1 database's name (default jhk-db)
 *   CF_CUSTOM_DOMAIN      optional; when set the Worker is published on that Custom Domain
 *   CF_D1_MIGRATIONS_DIR  optional; where `wrangler d1 migrations apply` finds the SQL, relative
 *                         to the deploy config's directory (default ../../drizzle, the repo's own)
 *   CF_COMPATIBILITY_DATE optional YYYY-MM-DD; the build's own date is kept unless this is set
 *
 * `prepare(config, env)` is pure and exported for `tests/deploy-prepare.test.mjs`.
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

function required(env, key, pattern, describe) {
  const value = read(env, key);
  if (!value) throw new ConfigError(`${key} is required: ${describe}.`);
  if (!pattern.test(value)) throw new ConfigError(`${key} is not valid: ${describe}.`);
  return value;
}

function optional(env, key, pattern, describe, fallback) {
  const value = read(env, key);
  if (!value) return fallback;
  if (!pattern.test(value)) throw new ConfigError(`${key} is not valid: ${describe}.`);
  return value;
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
export function prepare(config, env = {}) {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new ConfigError('The generated wrangler.json is not an object.');
  if (typeof config.main !== 'string' || !config.main)
    throw new ConfigError('The generated wrangler.json has no `main` entry; run `pnpm build` first.');

  const name = optional(env, 'CF_WORKER_NAME', WORKER_NAME, 'lowercase letters, digits and dashes', DEFAULT_WORKER_NAME);
  const databaseId = required(env, 'CF_D1_DATABASE_ID', DATABASE_ID, 'the uuid `wrangler d1 create` printed');
  if (databaseId === PLACEHOLDER_DATABASE_ID)
    throw new ConfigError('CF_D1_DATABASE_ID is the local placeholder id, not a real database.');
  const databaseName = optional(env, 'CF_D1_DATABASE_NAME', DATABASE_NAME, 'lowercase letters, digits, dashes and underscores', DEFAULT_DATABASE_NAME);
  const migrationsDir = optional(env, 'CF_D1_MIGRATIONS_DIR', PATH_LIKE, 'a relative path', DEFAULT_MIGRATIONS_DIR);
  const compatibilityDate = optional(env, 'CF_COMPATIBILITY_DATE', ISO_DATE, 'YYYY-MM-DD', config.compatibility_date);
  if (!compatibilityDate) throw new ConfigError('No compatibility_date in the manifest and none in CF_COMPATIBILITY_DATE.');
  const rawDomain = read(env, 'CF_CUSTOM_DOMAIN');
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
export function summarise(config) {
  const db = (config.d1_databases ?? []).find((d) => d?.binding === D1_BINDING) ?? {};
  const id = typeof db.database_id === 'string' ? `${db.database_id.slice(0, 8)}…` : '(none)';
  const domain = config.routes?.find((r) => r?.custom_domain)?.pattern;
  return [
    `worker         ${config.name}`,
    `main           ${config.main}`,
    `assets         ${config.assets?.directory ?? '(none)'}`,
    `compat date    ${config.compatibility_date}`,
    `d1 ${D1_BINDING}          ${db.database_name} (${id}), migrations from ${db.migrations_dir}`,
    `custom domain  ${domain ?? '(none: workers.dev only)'}`,
  ].join('\n');
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
  const prepared = prepare(JSON.parse(raw), env);
  const target = path.resolve(cwd, DEPLOY_CONFIG);
  writeFileSync(target, `${JSON.stringify(prepared, null, 2)}\n`);
  // The assets directory is relative to the config file, the same way wrangler resolves it.
  const assetsDir = path.resolve(path.dirname(target), prepared.assets?.directory ?? '');
  const ignoreFile = path.join(assetsDir, ASSETS_IGNORE_FILE);
  if (!existsSync(assetsDir))
    throw new ConfigError(`The assets directory ${path.relative(cwd, assetsDir)} is missing; run \`pnpm build\` first.`);
  writeFileSync(ignoreFile, `${ASSET_IGNORES.join('\n')}\n`);
  return { target, ignoreFile, summary: summarise(prepared) };
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
