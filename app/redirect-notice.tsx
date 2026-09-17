'use client';
/**
 * app/redirect-notice.tsx — the hand-off card the static build shows once the game is live.
 *
 * The GitHub Pages build exists because there was nowhere else to put the game. When the server
 * build is deployed, `APP_URL` is set at build time (vite.config.static.ts freezes it into
 * `import.meta.env.VITE_APP_URL`) and `static/main.tsx` renders this instead of the arena: one
 * card that names the new host, counts three seconds down and goes there. Nothing else — no nav,
 * no game, no banner — because this page is not the game any more.
 *
 * `redirectTarget` is the whole policy and it is pure: the visitor keeps the path they asked for
 * (minus the Pages project base, which the new host does not have) and the query and hash they
 * arrived with. A URL that does not parse as http(s) returns null, and the caller keeps showing
 * the preview rather than stranding the visitor on a card that goes nowhere.
 */
import { useEffect, useState } from 'react';
import { useLocale } from './use-locale';
import './redirect-notice.css';

/** The copy, in the two languages the chrome speaks. Not in the shared dictionaries: this card is
 * built into the static bundle only, and the app that reads those dictionaries never shows it. */
const COPY = {
  en: {
    line: (host: string) => `Jaanta Hai Kya now runs at ${host}. Taking you there…`,
    count: (seconds: number) => `Going in ${seconds} s`,
    go: 'Go now',
  },
  hi: {
    line: (host: string) => `जानता है क्या अब ${host} पर चलता है। आपको वहाँ ले जा रहे हैं…`,
    count: (seconds: number) => `${seconds} सेकंड में`,
    go: 'अभी जाएँ',
  },
} as const;

/** Where the visitor is now. The three fields of `window.location` this card reads. */
export type Here = { pathname: string; search: string; hash: string };

function parseApp(appUrl: string): URL | null {
  try {
    const url = new URL(String(appUrl).trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * The absolute URL to send the visitor to, or null when `appUrl` is empty or not an http(s) URL.
 * `base` is the deployment base of this build (`/fact-duel/`), stripped so that a visitor deep in
 * the Pages path lands at the same place under the live host rather than at `/fact-duel/` there.
 */
export function redirectTarget(appUrl: string, base: string, here: Here): string | null {
  const app = parseApp(appUrl);
  if (!app) return null;
  const root = app.pathname.endsWith('/') ? app.pathname : `${app.pathname}/`;
  const path = here.pathname.startsWith(base)
    ? here.pathname.slice(base.length)
    : here.pathname.replace(/^\/+/, '');
  return `${app.origin}${root}${path}${here.search}${here.hash}`;
}

/** The host a card built for `target` names. Safe: `target` always came from a parsed URL. */
function hostOf(target: string): string {
  try {
    return new URL(target).host;
  } catch {
    return target;
  }
}

export default function RedirectNotice({ target, seconds = 3 }: { target: string; seconds?: number }) {
  const { locale } = useLocale();
  const copy = COPY[locale === 'hi' ? 'hi' : 'en'];
  const [left, setLeft] = useState(Math.max(0, Math.round(seconds)));

  useEffect(() => {
    if (left <= 0) {
      window.location.replace(target);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, target]);

  return (
    <main className="fd-redirect">
      <div className="fd-redirect__card">
        <p className="fd-redirect__line">{copy.line(hostOf(target))}</p>
        <p className="fd-redirect__count" aria-hidden="true">
          {copy.count(left)}
        </p>
        <a className="fd-redirect__go" href={target}>
          {copy.go}
        </a>
      </div>
    </main>
  );
}
