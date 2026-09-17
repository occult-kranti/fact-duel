/**
 * static/main.tsx — SPA entry for the server-free (static) build.
 *
 * `app/page.tsx` renders `<Arena/>` and `app/arena.tsx` is `'use client'`, so the whole game is a
 * browser app already: this entry mounts the very same component with `createRoot` and imports the
 * four stylesheets `app/layout.tsx` imports, in the same order. The only additions are the honesty
 * banner (the app screens are untouched) and the base-path patch below.
 *
 * Two builds come out of this file. Without `APP_URL` it is the preview: the arena under a banner
 * that says there is no server here. With `APP_URL` set (vite.config.static.ts freezes it into
 * `import.meta.env.VITE_APP_URL`) the game has moved, and this page is only the hand-off — the
 * redirect card and nothing else. An `APP_URL` that does not parse, or that points back at this
 * very page, falls back to the preview rather than to a blank page or a redirect loop.
 *
 * The arena is behind a dynamic `import()` for that reason: a hand-off page must not download the
 * game it is handing off. `import Arena from '../app/arena'` at module scope put the whole entry
 * chunk — every screen, the question bank, every screen's CSS — in front of a card whose entire
 * content is one sentence and one link, and the three-second countdown only started once all of it
 * had parsed. Now Rollup splits the arena (and the in-page duel service the preview banner's copy
 * comes from) into their own chunks, which the hand-off never asks for.
 *
 * Locale: `<Arena/>` mounts its own LocaleProvider (app/use-locale.tsx), so this build follows the
 * same rule as the Next one — `<html lang>` and the Noto Sans Devanagari stylesheet are set at
 * runtime only while the stored or detected locale is Hindi; static/index.html links no extra font.
 * The hand-off card has no arena under it, so it carries its own provider for the same reason.
 */
import { createRoot } from 'react-dom/client';
import '../app/theme/tokens.css';
import '../app/globals.css';
import '../app/rivalry.css';
import '../app/expeditions.css';
import './static.css';
import RedirectNotice from '../app/redirect-notice';
import { redirectTarget } from '../lib/redirect-target.mjs';
import { LocaleProvider } from '../app/use-locale';

declare global {
  interface ImportMeta {
    /** Where the live game runs, or '' — defined by vite.config.static.ts from `process.env.APP_URL`. */
    readonly env: { readonly VITE_APP_URL?: string };
  }
}

/** The deployment base path, frozen into the bundle by vite.config.static.ts. */
declare const __STATIC_BASE__: string;
const BASE = __STATIC_BASE__;

/** Non-null once the game is live somewhere else: the URL this visitor is being handed off to. */
const HANDOFF = redirectTarget(import.meta.env.VITE_APP_URL ?? '', BASE, window.location);

/**
 * Screens reference their art with root-absolute paths (`/art/rivalry-stage.webp`), which is right
 * for a site served at `/` and wrong under a Pages project path like `/fact-duel/`. Rather than
 * edit app screens (they are not this build's to change), rewrite those URLs as they are set, before
 * the browser requests them: React assigns `img.src` through `setAttribute`, and three.js's
 * ImageLoader through the `src` property, so both doors are covered.
 */
function patchBasePaths(base: string) {
  if (base === '/' || typeof document === 'undefined') return;
  const rebase = (value: unknown) =>
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(base)
      ? base + value.slice(1)
      : value;
  const ATTRS = new Set(['src', 'href', 'poster']);
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    return setAttribute.call(this, name, ATTRS.has(name) ? (rebase(value) as string) : value);
  };
  for (const element of [HTMLImageElement, HTMLSourceElement, HTMLMediaElement]) {
    const descriptor = Object.getOwnPropertyDescriptor(element.prototype, 'src');
    if (!descriptor?.set || !descriptor.get) continue;
    Object.defineProperty(element.prototype, 'src', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value: string) {
        descriptor.set!.call(this, rebase(value));
      },
    });
  }
}

/** Required labelling: this build has no server, and it says so above everything else. */
function PreviewNote({ notice }: { notice: { title: string; body: string } }) {
  return (
    <aside className="fd-offline-note" aria-label={notice.title}>
      <b>{notice.title}</b>
      <p>{notice.body}</p>
    </aside>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

if (HANDOFF) {
  createRoot(container).render(
    <LocaleProvider>
      <RedirectNotice target={HANDOFF} />
    </LocaleProvider>,
  );
} else {
  patchBasePaths(BASE);
  const root = createRoot(container);
  void (async () => {
    try {
      const [{ default: Arena }, { OFFLINE_BUILD, OFFLINE_NOTICE }] = await Promise.all([
        import('../app/arena'),
        import('../lib/duel-client-static'),
      ]);
      root.render(
        <>
          {OFFLINE_BUILD && <PreviewNote notice={OFFLINE_NOTICE} />}
          <Arena />
        </>,
      );
    } catch {
      // A chunk that failed to load must not leave a blank page: say so, plainly, with a retry.
      root.render(
        <main style={{ padding: '24px 16px', font: '16px/1.5 system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '20px', margin: '0 0 8px' }}>Jaanta Hai Kya could not load.</h1>
          <p style={{ margin: '0 0 12px' }}>The connection dropped while the game was loading.</p>
          <button type="button" onClick={() => location.reload()} style={{ minHeight: 44, padding: '0 16px', fontSize: 16 }}>
            Try again
          </button>
        </main>,
      );
    }
  })();
}
