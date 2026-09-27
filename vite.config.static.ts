/**
 * GitHub Pages build: local learning plus the optional JHK human-duel backend.
 * Practice transports remain device-local; lib/jhk-online speaks only to JHK_SERVER_URL.
 * STATIC_BASE sets the Pages path. APP_URL is a legacy optional hand-off and must stay empty
 * when this build hosts the game. Public server URL/key values are frozen into the bundle.
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
    'import.meta.env.VITE_JHK_SERVER_URL': JSON.stringify(process.env.JHK_SERVER_URL || process.env.VITE_JHK_SERVER_URL || ''),
    'import.meta.env.VITE_JHK_SUPABASE_ANON_KEY': JSON.stringify(process.env.JHK_SUPABASE_ANON_KEY || process.env.VITE_JHK_SUPABASE_ANON_KEY || ''),
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
