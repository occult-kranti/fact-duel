/**
 * vite.config.static.ts — the server-free build (`pnpm build:static` → `dist-static/`).
 *
 * The game's UI is already a client app, so this config bundles `static/main.tsx` (which mounts
 * `app/arena.tsx`) with three aliases that remove the only server-shaped dependencies:
 *   `@/lib/duel-client`   → `lib/duel-client-static.ts` (dispatch in-process, no `/api/duel`)
 *   `@/lib/wallet-client` → `lib/wallet-client-static.ts` (device wallet only, no `/api/wallet`)
 *   `@/lib/presence-client` → `lib/presence-client-static.ts` (never polls, so no live counts)
 *   `next/dynamic`        → `static/next-dynamic-shim.tsx` (React.lazy + Suspense)
 * Everything else — screens, hooks, CSS, the three.js scenes — is imported unchanged.
 *
 * `base` defaults to `/fact-duel/` for a GitHub Pages project site and can be overridden with the
 * `STATIC_BASE` env var (e.g. `STATIC_BASE=/ pnpm build:static` for a user/organisation site).
 *
 * `APP_URL` is the hand-off: once the server build is live somewhere, set it at build time and the
 * bundle stops being the game. `static/main.tsx` then renders `app/redirect-notice.tsx` — a card
 * that names the new host and sends the visitor there — instead of mounting the arena. Unset (the
 * default) it is the empty string and this build behaves exactly as before.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const rawBase = process.env.STATIC_BASE ?? '/fact-duel/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const publicDir = path.join(repoRoot, 'public');

/**
 * Where the live game runs, frozen into the bundle as `import.meta.env.VITE_APP_URL`. Empty when
 * the variable is absent, which is the "there is no live site yet" case the static build was
 * written for; the workflow passes the repo variable through, so an unset repo variable is empty
 * here too rather than the string "undefined".
 */
const appUrl = (process.env.APP_URL ?? '').trim();

/** Everything in `public/` except the 7.6 MB of product documentation, which no screen loads. */
const SKIP_PUBLIC = new Set(['product']);

function publicFiles(dir = publicDir, prefix = ''): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (SKIP_PUBLIC.has(name)) return [];
    return entry.isDirectory() ? publicFiles(path.join(dir, entry.name), name) : [name];
  });
}

/**
 * Emits the public assets the app actually references and injects the head tags `app/layout.tsx`
 * sets. Both have to know the deployment base: `public/fonts/fonts.css` points at `/fonts/*.woff2`,
 * which is only correct at the site root, so its URLs are rewritten as it is copied.
 */
function staticAssets(): Plugin {
  return {
    name: 'fd-static-assets',
    apply: 'build',
    generateBundle() {
      for (const name of publicFiles()) {
        const source = fs.readFileSync(path.join(publicDir, name));
        this.emitFile({
          type: 'asset',
          fileName: name,
          source:
            name === 'fonts/fonts.css'
              ? source.toString('utf8').replaceAll('url(/fonts/', `url(${base}fonts/`)
              : source,
        });
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        const preload = (file: string) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: 'anonymous',
            href: `${base}fonts/${file}`,
          },
          injectTo: 'head' as const,
        });
        return [
          {
            tag: 'link',
            attrs: { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` },
            injectTo: 'head' as const,
          },
          preload('bricolage-grotesque-latin-normal-500-800.woff2'),
          preload('instrument-sans-latin-normal-400-700.woff2'),
          {
            tag: 'link',
            attrs: { rel: 'stylesheet', href: `${base}fonts/fonts.css` },
            injectTo: 'head' as const,
          },
        ];
      },
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: path.join(repoRoot, 'static'),
  base,
  // Assets are emitted by `staticAssets()` during a build; the dev server can serve them directly.
  publicDir: mode === 'production' ? false : publicDir,
  envDir: repoRoot,
  css: { postcss: repoRoot },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
    __STATIC_BASE__: JSON.stringify(base),
    'import.meta.env.VITE_APP_URL': JSON.stringify(appUrl),
  },
  resolve: {
    alias: [
      { find: /^@\/lib\/duel-client$/, replacement: path.join(repoRoot, 'lib/duel-client-static.ts') },
      { find: /^@\/lib\/wallet-client$/, replacement: path.join(repoRoot, 'lib/wallet-client-static.ts') },
      { find: /^@\/lib\/presence-client$/, replacement: path.join(repoRoot, 'lib/presence-client-static.ts') },
      { find: /^next\/dynamic$/, replacement: path.join(repoRoot, 'static/next-dynamic-shim.tsx') },
      { find: /^@\//, replacement: `${repoRoot}/` },
    ],
  },
  plugins: [react(), staticAssets()],
  build: {
    outDir: path.join(repoRoot, 'dist-static'),
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
}));
