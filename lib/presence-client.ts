'use client';
/**
 * lib/presence-client.ts — how many people are in each format, read from `/api/queue`.
 *
 * WHAT IT IS. One read-only call (`{ action: 'presence' }`) and one polling loop. The call carries
 * no principal, no session cookie and no guest header, because the answer carries no identity: two
 * integers per mode and the server clock they were counted at (lib/server/matchmaking.mjs
 * `presence`). Nothing here can be used to learn who is playing, only how many.
 *
 * HONESTY, WHICH IS THE WHOLE POINT. `readPresence` accepts an answer only when every mode in it
 * is two safe non-negative integers; anything else — a 404 HTML page from a static host, a 503
 * from a worker without a database, a truncated body — is a failure, and a failure never becomes a
 * number. The loop keeps the LAST answer the server gave and says how old it is (`fresh`); it
 * never interpolates, never counts up to a nicer figure and never invents company for an empty
 * lane. Zero is printed as zero.
 *
 * THE CADENCE. `PRESENCE_POLL_MS` (10 s) while the page is visible, nothing at all while it is
 * hidden (Page Visibility API), and `PRESENCE_BACKOFF_MS` (30 s) after
 * `PRESENCE_FAILURES_BEFORE_BACKOFF` consecutive failures, until one succeeds. Becoming visible
 * again polls at once rather than waiting out the interval. A poll older than `PRESENCE_FRESH_MS`
 * (15 s) is stale: the view says so, and the card's live dot goes grey.
 *
 * Everything injectable is (the transport, timers, the clock, the visibility source), so a node
 * test can drive the loop without a DOM. The static build swaps this module for
 * lib/presence-client-static.ts, which has no server and whose `usePresence()` is always null.
 */
import { useEffect, useState } from 'react';

/** Two counts the database can prove, for one format. */
export type ModePresence = Readonly<{ inQueue: number; inGame: number }>;
/** The server's answer: the clock it counted at, and one entry per format. */
export type Presence = Readonly<{ asOf: number; modes: Readonly<Record<string, ModePresence>> }>;
/** What the hook hands a screen: the last good answer, plus how old it is on this device. */
export type PresenceView = Readonly<{
  modes: Readonly<Record<string, ModePresence>>;
  /** The server's clock when it counted. */
  asOf: number;
  /** This device's clock when that answer arrived. */
  at: number;
  /** True while that answer is younger than `PRESENCE_FRESH_MS`. */
  fresh: boolean;
}>;

export const PRESENCE_ENDPOINT = '/api/queue';
/**
 * Whether this build has a server to count with at all. True here, false in the static twin, so a
 * screen can reserve the line's box (and only its box) on a build that will one day fill it, and
 * leave no gap on one that never can.
 */
export const PRESENCE_LIVE = true;
/** The poll interval while the tab is visible. */
export const PRESENCE_POLL_MS = 10_000;
/** The interval after the loop has failed this many times in a row. */
export const PRESENCE_BACKOFF_MS = 30_000;
export const PRESENCE_FAILURES_BEFORE_BACKOFF = 2;
/** Older than this and the last successful poll is no longer called live. */
export const PRESENCE_FRESH_MS = 15_000;
const PRESENCE_TIMEOUT_MS = 8_000;

const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Is an answer taken at `at` still live, judged by this device's clock? */
export const isFresh = (at: number, now: number): boolean => now - at < PRESENCE_FRESH_MS;

/** The three shapes of the line under a format card, as dictionary keys. */
export type PresenceLineKey = 'presence.line' | 'presence.lineYou' | 'presence.lineZero';

/**
 * Which line a format's card prints. A pure copy rule, here rather than in the component so a test
 * can pin it without a DOM.
 *
 * WHY `queuedHere` EXISTS. `inQueue` counts live unpaired queue rows, and the viewer's own row is
 * one of them: the arena writes it the moment "Find a rival" is tapped and a 2 s poll keeps it
 * alive, while the format cards stay on screen for the whole search. Without this, a player alone
 * on the service would watch their own card turn from "nobody in queue" to "1 in queue" and read
 * their own row as company. When the viewer is queued in this format the line says so, exactly the
 * way the launch panel's `launch.inLane` does.
 */
export function presenceLineKey(inQueue: number, queuedHere: boolean): PresenceLineKey {
  if (!(inQueue > 0)) return 'presence.lineZero';
  return queuedHere ? 'presence.lineYou' : 'presence.line';
}

/** Just enough of the arena's rival search to say which format the viewer's own row is in. */
export type QueuedSearch = { phase: string; lane?: { mode: string } | null } | null | undefined;

/**
 * The format the viewer's own live queue row sits in, or null when there is no such row. A search
 * writes its row before the server confirms the lane, so until `lane` arrives the format is the
 * one the search was opened from — the selected card. A `paired` search has already left the queue
 * for a room, so its row is not in `inQueue` and no card claims it.
 */
export function queuedFormat(search: QueuedSearch, selected: string): string | null {
  if (!search || search.phase !== 'searching') return null;
  return search.lane?.mode ?? selected;
}

/**
 * The server's answer, or null. One malformed mode rejects the whole answer: a half-read reply
 * would put a number on screen that nothing counted.
 */
export function readPresence(data: unknown): Presence | null {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  if (!d || !Number.isSafeInteger(d.asOf) || (d.asOf as number) <= 0) return null;
  const raw = d.modes && typeof d.modes === 'object' ? (d.modes as Record<string, unknown>) : null;
  if (!raw) return null;
  const modes: Record<string, ModePresence> = {};
  for (const [mode, value] of Object.entries(raw)) {
    const v = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
    if (!v || !count(v.inQueue) || !count(v.inGame)) return null;
    modes[mode] = Object.freeze({ inQueue: v.inQueue, inGame: v.inGame });
  }
  if (Object.keys(modes).length === 0) return null;
  return Object.freeze({ asOf: d.asOf as number, modes: Object.freeze(modes) });
}

/** One request. Resolves with the parsed body or null; it never rejects and never retries. */
export async function requestPresence(timeoutMs = PRESENCE_TIMEOUT_MS): Promise<Presence | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PRESENCE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'presence' }),
      // The docblock says this call carries no session cookie, and fetch's default for a
      // same-origin URL ('same-origin') would have sent one on every 10 s poll. `omit` is what
      // makes the claim true, and it keeps an anonymous count request unattributable in edge logs.
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return readPresence(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type PresenceDeps = {
  /** The transport. Whatever it resolves with goes through `readPresence` before it is believed. */
  request?: () => Promise<unknown>;
  pollMs?: number;
  backoffMs?: number;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  /** Whether the page is being looked at. Default: `document.visibilityState === 'visible'`. */
  visible?: () => boolean;
  /** Subscribe to visibility changes; returns the unsubscribe. Default: `visibilitychange`. */
  subscribeVisibility?: (listener: () => void) => () => void;
};
export type PresenceHandle = { stop: () => void };

const hasDocument = (): Document | null => (typeof document === 'undefined' ? null : document);
const documentVisible = (): boolean => hasDocument()?.visibilityState === 'visible';
const onVisibilityChange = (listener: () => void): (() => void) => {
  const d = hasDocument();
  if (!d) return () => {};
  d.addEventListener('visibilitychange', listener);
  return () => d.removeEventListener('visibilitychange', listener);
};

/**
 * Poll while visible, back off after repeated failures, and hand every change to `onChange`. The
 * handle's `stop()` is idempotent and drops the timer and the visibility listener.
 */
export function startPresence(onChange: (view: PresenceView | null) => void, deps: PresenceDeps = {}): PresenceHandle {
  const request = deps.request ?? (() => requestPresence());
  const pollMs = deps.pollMs ?? PRESENCE_POLL_MS;
  const backoffMs = deps.backoffMs ?? PRESENCE_BACKOFF_MS;
  const now = deps.now ?? Date.now;
  const schedule = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const unschedule = deps.clearTimeout ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const visible = deps.visible ?? documentVisible;
  const subscribe = deps.subscribeVisibility ?? onVisibilityChange;

  let stopped = false,
    busy = false,
    failures = 0,
    timer: unknown = null,
    view: PresenceView | null = null;

  const clear = () => {
    if (timer !== null) unschedule(timer);
    timer = null;
  };
  /** Re-judge the age of the last answer; emit only when the verdict actually changed. */
  const settle = () => {
    if (!view) return;
    const next = isFresh(view.at, now());
    if (next === view.fresh) return;
    view = Object.freeze({ ...view, fresh: next });
    onChange(view);
  };
  const rearm = () => {
    clear();
    if (stopped || !visible()) return;
    timer = schedule(() => void tick(), failures >= PRESENCE_FAILURES_BEFORE_BACKOFF ? backoffMs : pollMs);
  };
  async function tick() {
    timer = null;
    if (stopped || busy || !visible()) return;
    busy = true;
    let answer: Presence | null = null;
    try {
      // Sanitised HERE and not only in the transport: this is the one gate between a reply and a
      // number on screen, so an injected or future transport cannot route around it.
      answer = readPresence(await request());
    } catch {
      answer = null;
    } finally {
      busy = false;
    }
    if (stopped) return;
    if (answer) {
      failures = 0;
      view = Object.freeze({ modes: answer.modes, asOf: answer.asOf, at: now(), fresh: true });
      onChange(view);
    } else {
      failures += 1;
      settle();
    }
    rearm();
  }
  /** Hidden: stop entirely. Visible again: re-judge the age, then poll at once. */
  const wake = () => {
    if (stopped) return;
    if (!visible()) {
      clear();
      return;
    }
    settle();
    clear();
    void tick();
  };

  const unsubscribe = subscribe(wake);
  if (visible()) void tick();
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      clear();
      unsubscribe();
    },
  };
}

/**
 * The Play screen's live counts. Null until the first answer arrives, so a screen that is still
 * loading prints nothing at all rather than a placeholder number.
 */
export function usePresence(deps: PresenceDeps = {}): PresenceView | null {
  const [view, setView] = useState<PresenceView | null>(null);
  useEffect(() => {
    const handle = startPresence(setView, deps);
    return () => handle.stop();
    // The deps object is a test seam; the loop owns its own lifetime for the screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return view;
}
