/**
 * static/main.tsx — SPA entry for the server-free (static) build.
 *
 * `app/page.tsx` renders `<Arena/>` and `app/arena.tsx` is `'use client'`, so the whole game is a
 * browser app already: this entry mounts the very same component with `createRoot` and imports the
 * four stylesheets `app/layout.tsx` imports, in the same order. The only additions are the honesty
 * banner (the app screens are untouched) and the base-path patch below.
 *
 * Locale: `<Arena/>` mounts its own LocaleProvider (app/use-locale.tsx), so this build follows the
 * same rule as the Next one — `<html lang>` and the Noto Sans Devanagari stylesheet are set at
 * runtime only while the stored or detected locale is Hindi; static/index.html links no extra font.
 */
import { createRoot } from 'react-dom/client';
import '../app/theme/tokens.css';
import '../app/globals.css';
import '../app/rivalry.css';
import '../app/expeditions.css';
import './static.css';
import Arena from '../app/arena';
import { OFFLINE_BUILD, OFFLINE_NOTICE } from '../lib/duel-client-static';

/** The deployment base path, frozen into the bundle by vite.config.static.ts. */
declare const __STATIC_BASE__: string;
const BASE = __STATIC_BASE__;

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

/** Required labelling: this build is a demo, and it says so above everything else. */
function OfflineNote() {
  return (
    <aside className="fd-offline-note" aria-label={OFFLINE_NOTICE.title}>
      <b>{OFFLINE_NOTICE.title}</b>
      <p>{OFFLINE_NOTICE.body}</p>
    </aside>
  );
}

patchBasePaths(BASE);

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');
createRoot(container).render(
  <>
    {OFFLINE_BUILD && <OfflineNote />}
    <Arena />
  </>,
);
