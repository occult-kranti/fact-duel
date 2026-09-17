'use client';
/**
 * `/ops` — the founder's one-page read of what the business is doing.
 *
 * Four panels, four sources, one rule: a number appears only when its source answered. The page
 * is gated by the same `OPS_TOKEN` as `/api/ops`; the token is typed in here and kept in
 * `sessionStorage` only, so closing the tab forgets it and nothing about it is ever in a URL.
 *
 * One filter row (the window in days) scopes every panel; a refetch holds the previous render at
 * reduced opacity rather than flashing a skeleton. The server caches an overview for 60 s, so
 * the 60 s auto-refresh here costs the vendors exactly one call a minute however many tabs are
 * open.
 */
import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Activity, Gauge, KeyRound, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import './ops.css';
import { Caveat, DOCS_URL, Panel } from './panel';
import { LineChart } from './line-chart';
import { Tiles } from './tiles';
import { DataTable } from './data-table';
import { ago, bytes, compact, money, pathOf, percent, stampUtc } from './format';
import {
  panelState,
  type Adsense,
  type Game,
  type Overview,
  type Search as SearchData,
  type Source,
  type Traffic,
} from './types';

const TOKEN_KEY = 'fact-duel-ops-token';
const WINDOWS = [7, 30, 90] as const;
const REFRESH_MS = 60_000;

/* ---------- the token, as an external store so the server render never guesses ---------- */

const listeners = new Set<() => void>();
const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const writeToken = (value: string | null) => {
  try {
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the token lives for this render only */
  }
  for (const fn of listeners) fn();
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
};
/** '' on the server: "not hydrated yet" rather than "no token", so the form does not flash. */
const useToken = () => useSyncExternalStore(subscribe, () => readToken() ?? '', () => '');

/* ---------- the read ---------- */

/**
 * Every read remembers the `key` (token, window, refresh tick) it answered for; "busy" is simply
 * "the current key has no answer yet". That keeps the loading state derived rather than set from
 * inside the effect, and means a stale answer can never be mistaken for the current one.
 */
type Read =
  | { status: 'idle'; key: string }
  | { status: 'ok'; key: string; overview: Overview; at: number }
  | { status: 'unauthorized'; key: string }
  | { status: 'unset'; key: string }
  | { status: 'failed'; key: string; message: string };

async function fetchOverview(key: string, token: string, days: number, signal: AbortSignal): Promise<Read> {
  const response = await fetch('/api/stats', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'overview', days }),
    signal,
  });
  if (response.status === 401) return { status: 'unauthorized', key };
  if (response.status === 503) return { status: 'unset', key };
  if (!response.ok) return { status: 'failed', key, message: `The stats route answered ${response.status}.` };
  const overview = (await response.json()) as Overview;
  return { status: 'ok', key, overview, at: Date.now() };
}

export function OpsDashboard() {
  const token = useToken();
  const [days, setDays] = useState<number>(WINDOWS[0]);
  const [read, setRead] = useState<Read>({ status: 'idle', key: '' });
  const [last, setLast] = useState<{ overview: Overview; at: number } | null>(null);
  const [draft, setDraft] = useState('');
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  // The token is part of the key but never printed: the key exists only for equality.
  const key = token ? `${token.length}:${days}:${tick}` : '';

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchOverview(key, token, days, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setRead(next);
        if (next.status === 'ok') setLast({ overview: next.overview, at: next.at });
        if (next.status === 'unauthorized') writeToken(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRead({ status: 'failed', key, message: error instanceof Error ? error.message : 'The request failed.' });
      });
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [key, token, days, refresh]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (value) {
      writeToken(value);
      setDraft('');
    }
  };

  const overview = read.status === 'ok' ? read.overview : last?.overview ?? null;
  const busy = Boolean(token) && read.key !== key;

  return (
    <main className="fd-ops" aria-labelledby="fd-ops-title">
      <header className="fd-ops-head">
        <p className="fd-ops-eyebrow">
          <Gauge aria-hidden="true" />
          FOUNDER · LIVE
        </p>
        <h1 id="fd-ops-title">Ops</h1>
        <p className="fd-ops-lede">
          Traffic, search, ad revenue and the game&rsquo;s own counters on one page. Every figure is the
          source&rsquo;s own number for the window you pick. A source that is not connected says so and
          shows nothing.
        </p>
      </header>

      {!token ? (
        <form className="fd-ops-gate" onSubmit={submit}>
          <label htmlFor="fd-ops-token">
            <KeyRound aria-hidden="true" />
            Ops token
          </label>
          <div className="fd-ops-gate-row">
            <input
              id="fd-ops-token"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste OPS_TOKEN"
            />
            <button type="submit" className="fd-ops-btn" disabled={!draft.trim()}>
              Open
            </button>
          </div>
          <p className="fd-ops-gate-note">
            {read.status === 'unauthorized'
              ? 'That token was not accepted. It is kept in this tab only and has been cleared.'
              : 'The same bearer secret as /api/ops. Kept in this tab’s session storage, never in the address bar.'}
          </p>
        </form>
      ) : (
        <div className="fd-ops-bar" role="group" aria-label="Window">
          <div className="fd-ops-seg">
            {WINDOWS.map((n) => (
              <button
                key={n}
                type="button"
                className="fd-ops-seg-btn"
                aria-pressed={days === n}
                onClick={() => setDays(n)}
              >
                {n} days
              </button>
            ))}
          </div>
          <div className="fd-ops-bar-right">
            <span className="fd-ops-asof fd-mono" aria-live="polite">
              {busy ? 'reading…' : last ? `as of ${stampUtc(last.at)}` : ''}
            </span>
            <button type="button" className="fd-ops-btn fd-ops-btn--ghost" onClick={refresh} disabled={busy}>
              <RefreshCw aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              className="fd-ops-btn fd-ops-btn--ghost"
              onClick={() => {
                writeToken(null);
                setLast(null);
                setRead({ status: 'idle', key: '' });
              }}
            >
              Forget token
            </button>
          </div>
        </div>
      )}

      {token && read.status === 'unset' ? (
        <p className="fd-ops-banner" role="alert">
          <ShieldCheck aria-hidden="true" />
          <span>
            This deployment has no <code>OPS_TOKEN</code>, so the stats route refuses every request. Set it with{' '}
            <code>wrangler secret put OPS_TOKEN</code> and reload.
          </span>
        </p>
      ) : null}
      {token && read.status === 'failed' ? (
        <p className="fd-ops-banner" role="alert">
          <ShieldCheck aria-hidden="true" />
          <span>{read.message} The last successful read, if any, is still shown below.</span>
        </p>
      ) : null}

      {token ? (
        <div className="fd-ops-grid" data-busy={busy ? 'on' : undefined}>
          <TrafficPanel source={overview?.traffic ?? null} />
          <SearchPanel source={overview?.search ?? null} />
          <AdsensePanel source={overview?.adsense ?? null} />
          <GamePanel source={overview?.game ?? null} />
        </div>
      ) : null}

      <footer className="fd-ops-foot">
        <a href={DOCS_URL} target="_blank" rel="noreferrer">
          docs/ops-dashboard.md
        </a>{' '}
        explains each credential. This page exists only on the Worker deployment; the static GitHub Pages build has
        no <code>/ops</code>.
      </footer>
    </main>
  );
}

/* ---------- panels ---------- */

function TrafficPanel({ source }: { source: Source<Traffic> | null }) {
  const state = source ? panelState(source) : null;
  return (
    <Panel<Traffic>
      id="fd-ops-traffic"
      eyebrow="CLOUDFLARE"
      title="Traffic"
      tone="traffic"
      state={state}
      aside="httpRequests1dGroups · UTC days"
    >
      {(t) => (
        <>
          <Tiles
            tiles={[
              { label: 'Page views', value: compact(t.totals.pageViews), note: `${t.days}-day total` },
              { label: 'Requests', value: compact(t.totals.requests), note: `${t.days}-day total` },
              { label: 'Peak daily uniques', value: compact(t.totals.peakUniques), note: 'daily uniques do not add up' },
              { label: 'Bytes served', value: bytes(t.totals.bytes), note: `${t.days}-day total` },
            ]}
          />
          <LineChart
            title="Page views per day"
            rows={t.series.map((r) => ({ day: r.day, value: r.pageViews }))}
            format={compact}
            unit="Page views"
            tone="traffic"
          />
          <DataTable
            caption="Top countries by requests in the window."
            rows={t.countries}
            rowKey={(r) => r.country}
            empty="No country breakdown in this window."
            columns={[
              { header: 'Country', cell: (r) => r.country, key: true },
              { header: 'Requests', cell: (r) => compact(r.requests) },
              { header: 'Bytes', cell: (r) => bytes(r.bytes) },
            ]}
          />
        </>
      )}
    </Panel>
  );
}

function SearchPanel({ source }: { source: Source<SearchData> | null }) {
  const state = source ? panelState(source) : null;
  return (
    <Panel<SearchData>
      id="fd-ops-search"
      eyebrow="GOOGLE SEARCH CONSOLE"
      title="Search"
      tone="search"
      state={state}
      aside="reports run 2–3 days behind"
    >
      {(s) => (
        <>
          <Tiles
            tiles={[
              { label: 'Clicks', value: compact(s.totals.clicks), note: `${s.days}-day total` },
              { label: 'Impressions', value: compact(s.totals.impressions), note: `${s.days}-day total` },
              { label: 'CTR', value: s.totals.impressions > 0 ? percent(s.totals.ctr) : '—', note: 'clicks ÷ impressions' },
              { label: 'Avg position', value: s.totals.impressions > 0 ? s.totals.position.toFixed(1) : '—', note: 'impression-weighted' },
            ]}
          />
          {s.lastReportedDay ? (
            <Caveat>Last day Search Console has reported: {s.lastReportedDay}. Later days show as zero because they are not in yet.</Caveat>
          ) : (
            <Caveat>Search Console returned no rows for this window. Either the site is new to it, or the property URL does not match.</Caveat>
          )}
          <LineChart
            title="Clicks per day"
            rows={s.series.map((r) => ({ day: r.day, value: r.clicks }))}
            format={compact}
            unit="Clicks"
            tone="search"
          />
          <h3 className="fd-ops-sub">Top queries</h3>
          <DataTable
            caption="Top queries by clicks in the window."
            rows={s.queries}
            rowKey={(r) => r.key}
            empty="No queries reported in this window."
            columns={[
              { header: 'Query', cell: (r) => r.key, key: true },
              { header: 'Clicks', cell: (r) => compact(r.clicks) },
              { header: 'Impr.', cell: (r) => compact(r.impressions) },
              { header: 'CTR', cell: (r) => percent(r.ctr) },
              { header: 'Pos.', cell: (r) => r.position.toFixed(1) },
            ]}
          />
          <h3 className="fd-ops-sub">Top pages</h3>
          <DataTable
            caption="Top pages by clicks in the window."
            rows={s.pages}
            rowKey={(r) => r.key}
            empty="No pages reported in this window."
            columns={[
              { header: 'Page', cell: (r) => pathOf(r.key), key: true },
              { header: 'Clicks', cell: (r) => compact(r.clicks) },
              { header: 'Impr.', cell: (r) => compact(r.impressions) },
              { header: 'CTR', cell: (r) => percent(r.ctr) },
              { header: 'Pos.', cell: (r) => r.position.toFixed(1) },
            ]}
          />
        </>
      )}
    </Panel>
  );
}

function AdsensePanel({ source }: { source: Source<Adsense> | null }) {
  const state = source ? panelState(source) : null;
  const currency = state?.kind === 'ok' ? state.data.currency : null;
  return (
    <Panel<Adsense>
      id="fd-ops-adsense"
      eyebrow="GOOGLE ADSENSE"
      title="Ad revenue"
      tone="adsense"
      state={state}
      aside={currency ? `estimated · ${currency}` : 'estimated, before adjustments'}
    >
      {(a) => (
        <>
          <Tiles
            tiles={[
              { label: 'Earnings', value: money(a.totals.earnings, a.currency), note: `${a.days}-day estimate` },
              { label: 'Page RPM', value: money(a.totals.rpm, a.currency), note: 'earnings per 1,000 page views' },
              { label: 'Ad impressions', value: compact(a.totals.impressions), note: `${a.days}-day total` },
              { label: 'Clicks', value: compact(a.totals.clicks), note: `${a.days}-day total` },
            ]}
          />
          <LineChart
            title="Earnings per day"
            rows={a.series.map((r) => ({ day: r.day, value: r.earnings }))}
            format={(n) => money(n, a.currency)}
            unit={`Earnings${a.currency ? ` (${a.currency})` : ''}`}
            tone="adsense"
          />
          <DataTable
            caption="Earnings by country in the window."
            rows={a.countries}
            rowKey={(r) => r.country}
            empty="No country breakdown in this window."
            columns={[
              { header: 'Country', cell: (r) => r.country, key: true },
              { header: 'Earnings', cell: (r) => money(r.earnings, a.currency) },
              { header: 'RPM', cell: (r) => money(r.rpm, a.currency) },
              { header: 'Impr.', cell: (r) => compact(r.impressions) },
              { header: 'Clicks', cell: (r) => compact(r.clicks) },
            ]}
          />
        </>
      )}
    </Panel>
  );
}

function GamePanel({ source }: { source: Source<Game> | null }) {
  const state = source ? panelState(source) : null;
  return (
    <Panel<Game> id="fd-ops-game" eyebrow="D1 · THE GAME" title="Game" tone="game" state={state} aside="counts over the tables">
      {(g) => (
        <>
          <Tiles
            tiles={[
              { label: 'New guests', value: compact(g.totals.guests), note: `${g.days}-day · ${compact(g.totals.principalsAllTime)} all time` },
              { label: 'Rooms created', value: compact(g.totals.rooms), note: `${g.days}-day · ${compact(g.totals.roomsLive)} rows still live` },
              { label: 'Ads redeemed', value: compact(g.totals.ads), note: `${g.days}-day total` },
              { label: 'Coins from ads', value: compact(g.totals.coins), note: `${g.days}-day total` },
              {
                label: 'Coins issued',
                value: g.totals.treasuryOpened ? compact(g.totals.issuedAllTime) : '—',
                note: g.totals.treasuryOpened ? 'all time, off the treasury balance' : 'no treasury account yet',
              },
            ]}
          />
          <Caveat>
            Rooms are counted from rows the sweep has not yet deleted, so a window longer than the room lifetime undercounts.
            Guests and ad redemptions are permanent rows and are exact.
          </Caveat>
          <LineChart
            title="New guests per day"
            rows={g.series.map((r) => ({ day: r.day, value: r.guests }))}
            format={compact}
            unit="New guests"
            tone="game"
          />
          <h3 className="fd-ops-sub">Heartbeat</h3>
          <ul className="fd-ops-runs">
            {g.heartbeat.runs.map((run) => {
              const status = !run.everRan ? 'never' : run.stuck ? 'stuck' : !run.ok ? 'failed' : run.stale ? 'stale' : 'ok';
              return (
                <li key={run.kind} className="fd-ops-run" data-status={status}>
                  <Activity aria-hidden="true" />
                  <div>
                    <p className="fd-ops-run-title">
                      <b>{run.kind}</b> · {status === 'never' ? 'never ran' : status}
                    </p>
                    <p className="fd-ops-run-note">
                      {run.everRan
                        ? `started ${ago(run.ageMs)}${run.finishedAt === null ? ', still open' : ''}${run.detail ? ` · ${run.detail}` : ''}`
                        : 'no row in ops_runs for this kind'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="fd-ops-note">
            <Search aria-hidden="true" />
            Stale after {Math.round(g.heartbeat.staleAfterMs / 3_600_000)} h without a run. Overall:{' '}
            <b>{g.heartbeat.healthy ? 'healthy' : 'needs a look'}</b>.
          </p>
        </>
      )}
    </Panel>
  );
}
