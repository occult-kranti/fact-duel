/**
 * app/ops/types.ts — the wire shape of `POST /api/stats { action: 'overview' }`.
 *
 * Mirrors the three-shape contract in lib/server/stats-service.mjs. A panel narrows with
 * `panelState()` and renders numbers ONLY in the `ok` branch; the other two branches carry no
 * figures at all, which is what makes "never a placeholder number" a type-level fact here.
 */

export type NotConnected = { readonly connected: false; readonly secret: string; readonly reason: string };
export type Failed = { readonly connected: true; readonly asOf: number; readonly error: string };
export type Source<T> = NotConnected | Failed | (T & { readonly connected: true; readonly asOf: number });

export type TrafficRow = { day: string; requests: number; pageViews: number; bytes: number; uniques: number };
export type Traffic = {
  days: number;
  series: TrafficRow[];
  countries: { country: string; requests: number; bytes: number }[];
  totals: { requests: number; pageViews: number; bytes: number; peakUniques: number };
};

export type SearchRow = { day: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchKeyed = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type Search = {
  days: number;
  series: SearchRow[];
  queries: SearchKeyed[];
  pages: SearchKeyed[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  lastReportedDay: string | null;
};

export type AdsenseRow = { day: string; earnings: number; pageViews: number; impressions: number; rpm: number; clicks: number };
export type AdsenseCountry = { country: string; earnings: number; pageViews: number; impressions: number; rpm: number; clicks: number };
export type Adsense = {
  days: number;
  currency: string | null;
  series: AdsenseRow[];
  countries: AdsenseCountry[];
  totals: { earnings: number; pageViews: number; impressions: number; clicks: number; rpm: number };
};

export type GameRow = { day: string; guests: number; rooms: number; ads: number; coins: number };
export type HeartbeatRun = {
  kind: string;
  runId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  ok: boolean;
  detail: string | null;
  ageMs: number | null;
  stale: boolean;
  stuck: boolean;
  everRan: boolean;
};
export type Game = {
  days: number;
  series: GameRow[];
  totals: {
    guests: number;
    rooms: number;
    ads: number;
    coins: number;
    principalsAllTime: number;
    roomsLive: number;
    issuedAllTime: number;
    treasuryOpened: boolean;
  };
  heartbeat: { now: number; staleAfterMs: number; intervalMs: number; runs: HeartbeatRun[]; healthy: boolean };
};

export type Overview = {
  days: number;
  asOf: number;
  traffic: Source<Traffic>;
  search: Source<Search>;
  adsense: Source<Adsense>;
  game: Source<Game>;
};

export type PanelState<T> =
  | { kind: 'not-connected'; secret: string; reason: string }
  | { kind: 'error'; error: string; asOf: number }
  | { kind: 'ok'; data: T & { asOf: number } };

/** The one place a source is narrowed, so every panel makes the same three-way decision. */
export function panelState<T>(source: Source<T>): PanelState<T> {
  if (!source.connected) return { kind: 'not-connected', secret: source.secret, reason: source.reason };
  if ('error' in source) return { kind: 'error', error: source.error, asOf: source.asOf };
  return { kind: 'ok', data: source };
}
