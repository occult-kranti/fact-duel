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
 * redirect card and nothing else. An `APP_URL` that does not parse falls back to the preview
 * rather than to a blank page.
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
import Arena from '../app/arena';
import RedirectNotice, { redirectTarget } from '../app/redirect-notice';
import { LocaleProvider } from '../app/use-locale';
import { OFFLINE_BUILD, OFFLINE_NOTICE } from '../lib/duel-client-static';

declare global {
  interface ImportMeta {
    /** Where the live game runs, or '' — defined by vite.config.static.ts from `process.env.APP_URL`. */
    readonly env: { readonly VITE_APP_URL?: string };
  }
}

/** The deployment base path, frozen into the bundle by vite.config.static.ts. */
declare const __STATIC_BASE__: string;
const BASE = __STATIC_BASE__;

/** Non-null once the game is live somewhere: the URL this visitor is being handed off to. */
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
function PreviewNote() {
  return (
    <aside className="fd-offline-note" aria-label={OFFLINE_NOTICE.title}>
      <b>{OFFLINE_NOTICE.title}</b>
      <p>{OFFLINE_NOTICE.body}</p>
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
  createRoot(container).render(
    <>
      {OFFLINE_BUILD && <PreviewNote />}
      <Arena />
    </>,
  );
}
