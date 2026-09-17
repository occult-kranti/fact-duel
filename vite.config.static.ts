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
 *
 * The hand-off is also written into the HTML, because the served page must not depend on the
 * bundle to do its one job. When `APP_URL` parses, `staticAssets()` rewrites the description (the
 * preview's own description is what a search result or a WhatsApp unfurl would otherwise say about
 * a page that is now only a signpost), adds a canonical link to the live game, puts a plain link
 * inside `#root` so a visitor whose JavaScript never arrives still sees where the game went, and
 * adds a `<meta http-equiv="refresh">` for a visitor with no JavaScript at all. That refresh is
 * inside a `<noscript>` on purpose: a declarative refresh cannot be cancelled from script, and the
 * card offers a control that stops the countdown (WCAG 2.2.1), which would be a lie if a second,
 * uncancellable timer were running behind it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { parseApp } from './lib/redirect-target.mjs';

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

/**
 * The same value, parsed by the same policy the card uses (`lib/redirect-target.mjs`), so the HTML
 * and the bundle can never disagree about whether there is a live game. Null for an empty, junk or
 * non-http(s) `APP_URL`, in which case nothing below is injected and this is the preview build.
 */
const liveApp = parseApp(appUrl);
const liveHref = liveApp
  ? `${liveApp.origin}${liveApp.pathname.endsWith('/') ? liveApp.pathname : `${liveApp.pathname}/`}`
  : '';

const escapeAttr = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeText = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

/**
 * The hand-off, written into the served HTML: the description a share of the retired URL shows,
 * and the card a visitor sees before (or instead of) the bundle. The markup is the card's own, so
 * the styles already in the stylesheet apply and React replaces it with the live, announced,
 * stoppable version the moment it mounts. English only — nothing has read the stored locale yet.
 */
function handoffHtml(html: string): string {
  if (!liveApp) return html;
  const host = liveApp.host;
  const description = `Jaanta Hai Kya now runs at ${host}. This page only sends you there.`;
  const card =
    `<main class="fd-redirect">` +
    `<div class="fd-redirect__card">` +
    `<h1 class="fd-redirect__line">Jaanta Hai Kya now runs at ${escapeText(host)}.</h1>` +
    `<a class="fd-redirect__go" href="${escapeAttr(liveHref)}">Go now</a>` +
    `</div></main>`;

  let replaced = 0;
  const withDescription = html.replace(
    /(<meta\s+name="description"\s+content=)"[^"]*"/,
    (_match, head: string) => {
      replaced += 1;
      return `${head}"${escapeAttr(description)}"`;
    },
  );
  if (replaced !== 1) throw new Error('static/index.html: expected one description meta to rewrite for APP_URL');
  if (!withDescription.includes('<div id="root"></div>'))
    throw new Error('static/index.html: expected an empty #root to hold the hand-off link');
  return withDescription.replace('<div id="root"></div>', `<div id="root">${card}</div>`);
}

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
      handler(html: string) {
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
        const tags: HtmlTagDescriptor[] = [
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
        if (liveApp) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'canonical', href: liveHref },
            injectTo: 'head' as const,
          });
          tags.push({
            tag: 'noscript',
            children: `<meta http-equiv="refresh" content="3;url=${escapeAttr(liveHref)}">`,
            injectTo: 'head' as const,
          });
        }
        return { html: handoffHtml(html), tags };
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
