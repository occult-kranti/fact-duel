/**
 * components/fx/overlay-budget.ts — the pop-up budget.
 *
 * One scheduler decides when an overlay is allowed on screen, so the player is never buried by a
 * reward burst. It is a pure module: no React, no DOM, no `Date.now()` of its own (the clock and
 * the timer are injected, which is how the tests drive it).
 *
 * The rules, all of them:
 *  - CAPACITY: at most `OVERLAY_CAPACITY` (2) weight units are on screen. A toast weighs 1, a
 *    ceremony weighs 2 — so a ceremony fills the budget and nothing else can open beside it.
 *  - NEVER AT ONCE: two overlays never arrive in the same instant. A grant waits `OVERLAY_GAP_MS`
 *    (1200 ms) after the previous grant *or* the previous release, whichever is later. The first
 *    overlay after an idle stretch opens straight away, and so does a ceremony that has the whole
 *    screen to itself (see below).
 *  - PRIORITY, THEN FIFO: a ceremony outranks a toast, so a ceremony asked for behind three queued
 *    toasts opens FIRST; inside one rank the order is the order things were asked for. A ceremony
 *    belongs to the moment that raised it (a stamp, a level-up) and is full-screen, so making it
 *    queue behind toasts lands it on a screen the player has already walked away from.
 *  - PREEMPTION: when a ceremony is at the head and only toasts are on screen, those toasts go
 *    BACK to the front of the queue and open again once the ceremony closes — nothing is dropped,
 *    and the ceremony does not wait for them to time out. An open ceremony is never preempted.
 *  - A CEREMONY NEVER WAITS ON AN EMPTY SCREEN: the gap exists so two overlays do not arrive on
 *    top of each other; with nothing on screen there is nothing to arrive on top of. A ceremony at
 *    the head opens the instant the budget is empty (this is what keeps the expedition stamp at
 *    ~280 ms after the finish screen instead of four seconds later, on another screen).
 *  - MERGE: toasts of the same `mergeKey` asked for within `OVERLAY_MERGE_WINDOW_MS` (800 ms) of
 *    the group's first item, and still waiting, collapse into ONE grant carrying every payload.
 *    The scheduler only groups them; the words ("+3 quests · 140 XP") are written by whoever owns
 *    the copy — see `app/screens/use-progression-feedback.tsx`.
 *  - QUIET: `setQuiet(true)` stops new grants dead (this is what "nothing opens while a question
 *    is live" hangs off). Already-open overlays stay; the queue resumes when quiet lifts.
 *  - NOTHING IS DROPPED: the queue has no ceiling and no eviction. Every request is eventually
 *    granted or merged into one that is. Only `release`/`clear` remove anything.
 *
 * Usage:
 *   const budget = createOverlayBudget<Payload>();
 *   const id = budget.request({ type: 'toast', mergeKey: 'quest', payload });
 *   budget.subscribe(render);            // fires whenever the snapshot changes
 *   budget.getSnapshot().active          // what may be on screen right now
 *   budget.release(id);                  // dismissed → frees the slot, starts the 1200 ms gap
 */

/** A toast weighs 1; a ceremony fills the whole budget. */
export type OverlayType = 'toast' | 'ceremony';

/** Weight units allowed on screen at once. */
export const OVERLAY_CAPACITY = 2;

/** Cost of each overlay type against the capacity. */
export const OVERLAY_WEIGHT: Record<OverlayType, number> = { toast: 1, ceremony: 2 };

/**
 * Who is served first. Higher wins; ties fall back to the ask order, so this is priority-then-FIFO.
 * A ceremony is the moment itself and belongs to the screen that raised it; a toast is a footnote
 * that reads the same ten seconds later.
 */
export const OVERLAY_PRIORITY: Record<OverlayType, number> = { toast: 0, ceremony: 1 };

/** Quiet time between one overlay settling and the next one opening. */
export const OVERLAY_GAP_MS = 1200;

/** Same-kind toasts asked for inside this window of the group's first item merge into it. */
export const OVERLAY_MERGE_WINDOW_MS = 800;

/** Opaque timer handle; whatever the injected clock hands back. */
export type OverlayTimer = unknown;

/** The two bits of ambient state the scheduler needs, injectable so tests can fake both. */
export interface OverlayClock {
  now: () => number;
  setTimer: (fn: () => void, ms: number) => OverlayTimer;
  clearTimer: (timer: OverlayTimer) => void;
}

/** `Date.now()` plus the host timers. */
export const systemOverlayClock: OverlayClock = {
  now: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export interface OverlayRequest<P> {
  /** Stable id. Re-requesting a live id replaces that payload instead of queueing a second one. */
  id?: string;
  type: OverlayType;
  /** Toasts sharing this key inside one burst become a single overlay. Ceremonies never merge. */
  mergeKey?: string;
  payload: P;
}

/** One slot's worth of overlay: a single item, or the burst that merged into it. */
export interface OverlayGrant<P> {
  /** The group's handle — the id of its first item. `release(id)` takes this or any member id. */
  id: string;
  type: OverlayType;
  mergeKey?: string;
  /** Every member id, in the order they were asked for. */
  ids: readonly string[];
  /** Every member payload, same order. Length 1 unless the group merged. */
  items: readonly P[];
  /** Monotonic request counter — the stable FIFO order. */
  seq: number;
  queuedAt: number;
  /** When it went on screen; `-1` while it is still waiting. */
  grantedAt: number;
}

export interface OverlaySnapshot<P> {
  /** Bumped on every change; a fresh object is built only when something actually moved. */
  version: number;
  quiet: boolean;
  /** Weight units in use. */
  used: number;
  /** What may be on screen, oldest grant first. */
  active: readonly OverlayGrant<P>[];
  /** What is still waiting, in FIFO order. */
  queued: readonly OverlayGrant<P>[];
}

export interface OverlayBudgetOptions {
  capacity?: number;
  gapMs?: number;
  mergeWindowMs?: number;
  weight?: Partial<Record<OverlayType, number>>;
  clock?: OverlayClock;
  quiet?: boolean;
}

export interface OverlayBudget<P> {
  /** Ask for a slot. Returns the id of the grant this payload will appear under. */
  request: (req: OverlayRequest<P>) => string;
  /** Dismissed or closed: frees the slot and starts the gap. Also cancels a still-queued item. */
  release: (id: string) => boolean;
  /** Drop everything (of one type, or all). Removing something live starts the gap. */
  clear: (type?: OverlayType) => void;
  /** While quiet, nothing new opens. */
  setQuiet: (quiet: boolean) => void;
  isQuiet: () => boolean;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => OverlaySnapshot<P>;
  /** Stop the pending timer and forget the listeners (for unmount). */
  destroy: () => void;
}

interface Entry<P> {
  id: string;
  type: OverlayType;
  mergeKey?: string;
  ids: string[];
  items: P[];
  seq: number;
  queuedAt: number;
  grantedAt: number;
}

export function createOverlayBudget<P>(options: OverlayBudgetOptions = {}): OverlayBudget<P> {
  const capacity = options.capacity ?? OVERLAY_CAPACITY;
  const gapMs = options.gapMs ?? OVERLAY_GAP_MS;
  const mergeWindowMs = options.mergeWindowMs ?? OVERLAY_MERGE_WINDOW_MS;
  const weight: Record<OverlayType, number> = { ...OVERLAY_WEIGHT, ...options.weight };
  const clock = options.clock ?? systemOverlayClock;

  const queued: Entry<P>[] = [];
  const active: Entry<P>[] = [];
  const listeners = new Set<() => void>();

  let quiet = options.quiet ?? false;
  let seq = 0;
  let autoId = 0;
  let version = 0;
  let timer: OverlayTimer = null;
  let destroyed = false;
  // Negative infinity means "no overlay has opened or closed yet", so the first one is immediate.
  let lastGrantAt = Number.NEGATIVE_INFINITY;
  let lastReleaseAt = Number.NEGATIVE_INFINITY;

  const grantOf = (e: Entry<P>): OverlayGrant<P> => ({
    id: e.id,
    type: e.type,
    mergeKey: e.mergeKey,
    ids: e.ids.slice(),
    items: e.items.slice(),
    seq: e.seq,
    queuedAt: e.queuedAt,
    grantedAt: e.grantedAt,
  });

  const used = (): number => active.reduce((n, e) => n + (weight[e.type] ?? 1), 0);

  const rankOf = (type: OverlayType): number => OVERLAY_PRIORITY[type] ?? 0;

  /** Where a NEW entry of this rank goes: behind everything that outranks or ties it (FIFO). */
  const tailOf = (rank: number): number => {
    let i = queued.length;
    while (i > 0 && rankOf(queued[i - 1].type) < rank) i -= 1;
    return i;
  };

  /** Where a PREEMPTED entry goes back: in front of everything of its own rank, behind its betters. */
  const headOf = (rank: number): number => {
    let i = 0;
    while (i < queued.length && rankOf(queued[i].type) > rank) i += 1;
    return i;
  };

  const build = (): OverlaySnapshot<P> => ({
    version,
    quiet,
    used: used(),
    active: active.map(grantOf),
    queued: queued.map(grantOf),
  });

  let snapshot: OverlaySnapshot<P> = build();

  const changed = (): void => {
    version += 1;
    snapshot = build();
    for (const fn of Array.from(listeners)) fn();
  };

  const disarm = (): void => {
    if (timer === null) return;
    clock.clearTimer(timer);
    timer = null;
  };

  const arm = (ms: number): void => {
    disarm();
    if (destroyed) return;
    timer = clock.setTimer(pump, Math.max(0, ms));
  };

  /** Hand out every slot that is due right now; re-arm for the next one that is not. */
  function pump(): void {
    timer = null;
    if (destroyed || quiet) return;
    let moved = false;
    for (;;) {
      const head = queued[0];
      if (!head) break;
      const need = weight[head.type] ?? 1;
      if (used() + need > capacity) {
        // A ceremony is full-screen and belongs to the screen that raised it, so it does not wait
        // for toasts to time out: the toasts go back to the front of the queue (keeping their
        // order and their payloads) and open again once it closes. A live ceremony is never
        // preempted, and neither is anything when the ceremony could not fit even on a clear
        // screen — that would loop forever.
        const preemptable =
          head.type === 'ceremony' &&
          need <= capacity &&
          active.length > 0 &&
          active.every((e) => e.type === 'toast');
        if (!preemptable) break;
        const returning = active.splice(0);
        for (const e of returning) e.grantedAt = -1;
        queued.splice(headOf(rankOf('toast')), 0, ...returning);
        moved = true;
        continue;
      }
      const now = clock.now();
      const earliest = Math.max(lastGrantAt, lastReleaseAt) + gapMs;
      // The gap keeps two overlays from arriving on top of each other. A ceremony with the screen
      // to itself has nothing to arrive on top of, so it opens the moment the budget is empty.
      const waitsOutTheGap = head.type !== 'ceremony' || active.length > 0;
      if (waitsOutTheGap && now < earliest) {
        arm(earliest - now);
        break;
      }
      queued.shift();
      head.grantedAt = now;
      active.push(head);
      lastGrantAt = now;
      moved = true;
    }
    if (moved) changed();
  }

  const schedule = (): void => {
    if (destroyed || quiet) return;
    arm(0);
  };

  const replaceMember = (list: Entry<P>[], id: string, payload: P): Entry<P> | null => {
    for (const e of list) {
      const i = e.ids.indexOf(id);
      if (i === -1) continue;
      e.items[i] = payload;
      return e;
    }
    return null;
  };

  const request = (req: OverlayRequest<P>): string => {
    if (destroyed) return req.id ?? '';
    const now = clock.now();
    const id = req.id ?? `overlay-${(autoId += 1)}`;

    // A repeat of a live id updates that overlay in place — it never takes a second slot.
    const existing = replaceMember(active, id, req.payload) ?? replaceMember(queued, id, req.payload);
    if (existing) {
      changed();
      return existing.id;
    }

    // Merge into the newest waiting group with the same key, if the burst window is still open.
    if (req.type === 'toast' && req.mergeKey) {
      for (let i = queued.length - 1; i >= 0; i -= 1) {
        const e = queued[i];
        if (e.type !== 'toast' || e.mergeKey !== req.mergeKey) continue;
        // Toasts keep their ask order in the queue (a preempted one goes back at the front of its
        // own rank), so anything further back is older still: stop looking.
        if (now - e.queuedAt > mergeWindowMs) break;
        e.ids.push(id);
        e.items.push(req.payload);
        changed();
        schedule();
        return e.id;
      }
    }

    seq += 1;
    // Priority-then-FIFO: a ceremony is spliced in ahead of the toasts, never ahead of a ceremony.
    queued.splice(tailOf(rankOf(req.type)), 0, {
      id,
      type: req.type,
      mergeKey: req.mergeKey,
      ids: [id],
      items: [req.payload],
      seq,
      queuedAt: now,
      grantedAt: -1,
    });
    changed();
    schedule();
    return id;
  };

  /**
   * Drop a still-queued item (or one member of a queued group) without touching the gap. Taking
   * something out of the queue can unblock what was behind it — a cancelled ceremony frees the two
   * units the toasts behind it were waiting for — and `pump` only re-arms itself when the head
   * fits, so every removal ends in a `schedule()` exactly like `release` and `clear` do.
   */
  const cancel = (id: string): boolean => {
    for (let i = 0; i < queued.length; i += 1) {
      const e = queued[i];
      const j = e.ids.indexOf(id);
      if (j !== -1) {
        e.ids.splice(j, 1);
        e.items.splice(j, 1);
        if (e.ids.length === 0) queued.splice(i, 1);
        changed();
        schedule();
        return true;
      }
      if (e.id === id) {
        queued.splice(i, 1);
        changed();
        schedule();
        return true;
      }
    }
    return false;
  };

  const release = (id: string): boolean => {
    if (destroyed) return false;
    const i = active.findIndex((e) => e.id === id || e.ids.includes(id));
    if (i === -1) return cancel(id);
    active.splice(i, 1);
    lastReleaseAt = clock.now();
    changed();
    schedule();
    return true;
  };

  const clear = (type?: OverlayType): void => {
    const keep = (e: Entry<P>) => (type ? e.type !== type : false);
    const liveBefore = active.length;
    const queuedKept = queued.filter(keep);
    const activeKept = active.filter(keep);
    if (queuedKept.length === queued.length && activeKept.length === active.length) return;
    queued.length = 0;
    queued.push(...queuedKept);
    active.length = 0;
    active.push(...activeKept);
    if (activeKept.length < liveBefore) lastReleaseAt = clock.now();
    changed();
    schedule();
  };

  const setQuiet = (next: boolean): void => {
    if (quiet === next) return;
    quiet = next;
    if (quiet) disarm();
    changed();
    if (!quiet) schedule();
  };

  return {
    request,
    release,
    clear,
    setQuiet,
    isQuiet: () => quiet,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    destroy: () => {
      disarm();
      destroyed = true;
      listeners.clear();
    },
  };
}
