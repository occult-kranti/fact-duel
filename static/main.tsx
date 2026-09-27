/**
 * GitHub Pages SPA. The same JHK arena keeps local learning, while its isolated live desk uses
 * the configured server. A practice-only notice appears when no JHK server URL is configured.
 * The optional legacy APP_URL hand-off and asset base-path adaptation are retained.
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

/** Clearly label a build whose human backend is not connected. */
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
      const [{ default: Arena }, { OFFLINE_BUILD, OFFLINE_NOTICE }, { jhkOnline }] = await Promise.all([
        import('../app/arena'),
        import('../lib/duel-client-static'),
        import('../lib/jhk-online/runtime'),
      ]);
      root.render(
        <>
          {OFFLINE_BUILD && !jhkOnline.configured && <PreviewNote notice={{ title: 'Practice build', body: 'Human duels need the shared server connection. Practice games and progress are available on this device.' }} />}
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
