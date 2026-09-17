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
 * The policy (where a visitor is sent, and when nowhere) is `lib/redirect-target.mjs`, pure and
 * tested; this file is only the card. Two rules live here instead:
 *
 *   - the countdown is said out loud. It is an `aria-live` line, not an `aria-hidden` decoration,
 *     and the card leads with an `<h1>`, so a screen-reader visitor is told a timer is running
 *     before it runs out rather than being navigated out from under mid-sentence.
 *   - the countdown stops on the first pointer or keyboard interaction, and there is a control
 *     that says so. WCAG 2.2.1 (Timing Adjustable, level A) fails a timed redirect that cannot be
 *     turned off; technique F40 names this exact pattern. Anyone who is still reading, tabbing or
 *     copying the new address keeps the page. The `<meta http-equiv="refresh">` that covers the
 *     no-JavaScript visitor is inside a `<noscript>` for the same reason: a declarative refresh
 *     cannot be cancelled from script, so it must never be running behind a control that claims
 *     it can be stopped.
 */
import { useEffect, useState } from 'react';
import { useLocale } from './use-locale';
import './redirect-notice.css';

/** The copy, in the two languages the chrome speaks. Not in the shared dictionaries: this card is
 * built into the static bundle only, and the app that reads those dictionaries never shows it. */
const COPY = {
  en: {
    line: (host: string) => `Jaanta Hai Kya now runs at ${host}. Taking you there…`,
    moved: (host: string) => `Jaanta Hai Kya now runs at ${host}.`,
    count: (seconds: number) => `Going in ${seconds} s`,
    stopped: 'Countdown stopped. Use the button when you are ready.',
    go: 'Go now',
    stay: 'Stay on this preview',
  },
  hi: {
    line: (host: string) => `जानता है क्या अब ${host} पर चलता है। आपको वहाँ ले जा रहे हैं…`,
    moved: (host: string) => `जानता है क्या अब ${host} पर चलता है।`,
    count: (seconds: number) => `${seconds} सेकंड में`,
    stopped: 'गिनती रुक गई। तैयार हों तो बटन दबाएँ।',
    go: 'अभी जाएँ',
    stay: 'इसी पेज पर रहें',
  },
} as const;

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
  const host = hostOf(target);
  const [left, setLeft] = useState(Math.max(0, Math.round(seconds)));
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (stopped) return;
    if (left <= 0) {
      window.location.replace(target);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, stopped, target]);

  // The first sign of a visitor doing anything — a tap, a tab, a shortcut — stops the clock. The
  // listeners are capture-phase so a press on "Go now" stops it too before the link takes over.
  useEffect(() => {
    const stop = () => setStopped(true);
    window.addEventListener('pointerdown', stop, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', stop, { capture: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', stop, true);
      window.removeEventListener('keydown', stop, true);
    };
  }, []);

  return (
    <main className="fd-redirect" aria-labelledby="fd-redirect-title">
      <div className="fd-redirect__card">
        <h1 className="fd-redirect__line" id="fd-redirect-title">
          {stopped ? copy.moved(host) : copy.line(host)}
        </h1>
        <p className="fd-redirect__count" aria-live="polite" aria-atomic="true">
          {stopped ? copy.stopped : copy.count(left)}
        </p>
        <a className="fd-redirect__go" href={target}>
          {copy.go}
        </a>
        <button className="fd-redirect__stay" type="button" onClick={() => setStopped(true)}>
          {copy.stay}
        </button>
      </div>
    </main>
  );
}
