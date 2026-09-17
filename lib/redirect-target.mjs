/**
 * lib/redirect-target.mjs — where the retired preview sends a visitor, as a pure function.
 *
 * The GitHub Pages build exists because there was nowhere else to put the game. Once the server
 * build is deployed, `APP_URL` is set at build time and the Pages deployment stops being the game:
 * `static/main.tsx` renders `app/redirect-notice.tsx` instead of the arena, and this module decides
 * where that card points. It lives here, next to the other domain modules, because it is the whole
 * hand-off policy and a `.tsx` file cannot be imported by `node --test`.
 *
 * The rules, in one place:
 *   - an `appUrl` that is empty, unparseable or not http(s) yields null, and the caller keeps
 *     showing the preview rather than stranding the visitor on a card that goes nowhere;
 *   - the visitor keeps the path they asked for, minus the Pages project base (`/fact-duel/`),
 *     which the live host does not have, plus the query and hash they arrived with;
 *   - a target equal to the page the visitor is already on yields null too. `APP_URL` pointing back
 *     at the Pages deployment is a plausible mistake, and without this guard the card would
 *     `location.replace` the same URL every three seconds forever, with no history to go back to.
 */

/**
 * Where the visitor is now — the four fields of `window.location` this policy reads. `origin` is
 * optional only so a caller can ask the path question without one; the self-redirect guard needs it.
 *
 * @typedef {{ origin?: string, pathname: string, search?: string, hash?: string }} Here
 */

/**
 * The live game's URL, parsed, or null when it is not an absolute http(s) URL. A relative or
 * scheme-less value ('jaantahaikya.com') is a mistake, not a destination: it would resolve against
 * the Pages host and send the visitor nowhere useful.
 *
 * @param {string | null | undefined} appUrl
 * @returns {URL | null}
 */
export function parseApp(appUrl) {
  try {
    const url = new URL(String(appUrl ?? '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * The absolute URL to send the visitor to, or null when there is nowhere to send them.
 *
 * @param {string | null | undefined} appUrl where the live game runs (build-time `APP_URL`)
 * @param {string} base this build's deployment base, e.g. `/fact-duel/`
 * @param {Here} here the visitor's current location
 * @returns {string | null}
 */
export function redirectTarget(appUrl, base, here) {
  const app = parseApp(appUrl);
  if (!app) return null;
  const root = app.pathname.endsWith('/') ? app.pathname : `${app.pathname}/`;
  const pathname = here?.pathname ?? '/';
  const prefix = String(base ?? '');
  const path =
    prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.replace(/^\/+/, '');
  const tail = `${here?.search ?? ''}${here?.hash ?? ''}`;
  const target = `${app.origin}${root}${path}${tail}`;
  const current = here?.origin ? `${here.origin}${pathname}${tail}` : null;
  return current === target ? null : target;
}
