# HISAAB DO — engine guide

For the UI engineers building the edition's screens. This covers what the engine gives you, how to
drive it, and what not to break. The charter (`CHARTER.md`) takes precedence over this file.

**Status (engine scaffold, lane 1.12).** The edition builds as its own site (`dist-hisaab/`) and runs the
JHK engine unchanged with the civics bank. A placeholder UI (`editions/hisaab/app/dev-shell.tsx`)
exercises everything end to end: routes, a route card, a bot Quick Draw to its verdict, level + label,
today's five, and an in-page P2P self-test. Replace it with the real screens, and swap its import in
`editions/hisaab/main.tsx`.

---

## 1. Run it

| command | what it does |
|---|---|
| `pnpm dev:hisaab` | Vite dev server at `http://localhost:5173/fact-duel/hisaab/` |
| `pnpm build:hisaab` | production build into `dist-hisaab/` (gitignored) |
| `pnpm preview:hisaab` | serves `dist-hisaab/` at the base path, e.g. `--port 4174` |
| `HISAAB_BASE=/ pnpm build:hisaab` | build for a site root instead of `/fact-duel/hisaab/` |
| `node --test tests/hisaab-*.test.mjs` | the edition's tests (bank, P2P, storage, wiring) |
| `node scripts/hisaab-validate.mjs editions/hisaab/bank/<lane>.mjs` | check a bank lane |

The deployment base is available at runtime as `EDITION.base` (from `editions/hisaab/edition.ts`),
which reads a `__HISAAB_BASE__` define. There is no `import.meta.env` typing in this repo, so use that.
Files in `editions/hisaab/public/` are copied to the site root. Vite rewrites root-absolute URLs in
`index.html`, but not URLs set from script: prefix those with `EDITION.base`.

The edition does **not** import JHK's CSS (`app/globals.css`, Tailwind, the Floodlight tokens). Styles
come from the design lane (`editions/hisaab/theme/`, skill `hisaab-design`).

## 2. Layout

```
vite.config.hisaab.ts           the build: root editions/hisaab, alias plugin, base, outDir dist-hisaab
editions/hisaab/
  index.html, main.tsx          entry (mounts app/dev-shell.tsx for now)
  public/favicon.svg            placeholder mark (no emblem, no party or media marks)
  edition.ts                    typed facade: EDITION, ladder, ROUTES, todaysFive, DUEL_FORMATS
  aliases.mjs                   THE list of shared modules the edition swaps (section 3)
  node-aliases.mjs              the same list as a node resolve hook, for tests
  storage-ns.mjs                'hisaab' / 'hd' storage namespace (alias target)
  bank/schema.mjs               the bank contract (lead)       bank/index.mjs   registry: LANES, BANK
  bank/sample.mjs               16 placeholder items (hzz…)   bank/<lane>.mjs  content lanes
  server/bank.mjs               QUESTIONS / ALL_QUESTIONS / HIDDEN_COUNT (alias target)
  engine/content.mjs            domain 'civics', TOPIC_DOMAINS = the 13 sectors (alias target)
  engine/routes.mjs             deriveRoutes(bank): the data-driven route catalogue
  engine/expedition-routes.mjs  EXPEDITIONS = deriveRoutes(QUESTIONS) (alias target)
  engine/labels.mjs             the nine-rung label ladder
  engine/daily.mjs              Aaj Ka Hisaab: dailyFive / dealDaily
  engine/duel-controller.mjs    one match through any request(): calibrate, poll, reveal, answer
  engine/events-data.mjs        empty event calendar (alias target)
  engine/profile-sync-static.ts no-server profile sync (alias target)
  app/use-duel.ts               useDuel / useQuestionShown hooks
  app/dev-shell.tsx             placeholder UI
  p2p/                          transports, host/guest protocol, pass & play
```

Import paths: inside the edition, `@/…` is the repo root (as in JHK), so `@/lib/progression.mjs`,
`@/app/use-player`, `@/components/fx` all work, and **go through the alias table**.

## 3. What is aliased, and why

Every difference between JHK and the edition is one row of `editions/hisaab/aliases.mjs`.
`vite.config.hisaab.ts` applies it with a `resolveId` plugin keyed by the shared module's **resolved
absolute path**, so it catches every spelling of the import: `@/lib/content.mjs` in a screen,
`../content.mjs` inside `lib/`, `./bank.mjs` inside `lib/server/`. A twin may import the module it
replaces; imports from the twin itself are never redirected.

| shared module | edition twin | why |
|---|---|---|
| `lib/duel-client.ts` | `lib/duel-client-static.ts` | the duel service runs in the page (same as JHK's static build) |
| `lib/wallet-client.ts` | `lib/wallet-client-static.ts` | device wallet only; there is no `/api/wallet` |
| `lib/presence-client.ts` | `lib/presence-client-static.ts` | no live counts without a server |
| `lib/profile-sync.ts` | `engine/profile-sync-static.ts` | no `/api/auth` or `/api/profile` on Pages. The real module would POST on every load and log 404s |
| `lib/server/bank.mjs` | `server/bank.mjs` | the civics bank, so the duel service, practice, expeditions and catalogue all use it |
| `lib/content.mjs` | `engine/content.mjs` | domain `civics`; `TOPIC_DOMAINS` = the 13 SECTORS, so journal/progression keep civics facts |
| `lib/expedition-routes.mjs` | `engine/expedition-routes.mjs` | routes derived from the bank, not JHK's nine sports routes |
| `lib/events-data.mjs` | `engine/events-data.mjs` | no sports calendar (keeps 43 KB of fixtures out of the bundle) |
| `lib/storage-ns.mjs` | `storage-ns.mjs` | every IndexedDB, localStorage and BroadcastChannel name becomes `hisaab-*` / `hd-*` |
| `next/dynamic` | `static/next-dynamic-shim.tsx` | same shim as the static build (a plain `resolve.alias`) |

The duel client and the bank are swapped by the same table, so any screen that calls
`request()` from `@/lib/duel-client` is already talking to the in-page duel service over the civics bank.

**Tests use the same table.** `register('../editions/hisaab/node-aliases.mjs', import.meta.url)` at
the top of a test file makes every later **dynamic** `import()` resolve through it. Static imports run
before `register`. Each test file runs in its own process, so JHK's tests never see the hook.

## 4. Shared-code changes

All of them are additive and keep the defaults. With the JHK build, every value is unchanged: the full
suite gives the same results, and a clean-worktree build of `dist-static/` gives byte-identical CSS and
index.html apart from the script hash.

1. **Storage namespace.** New `lib/storage-ns.mjs` (`{ long: 'fact-duel', short: 'fd' }`) and
   `lib/storage-names.mjs` (`storageNames(ns)`, `STORAGE`). The literal names at these call sites now
   come from `STORAGE`, with the same values: `lib/profile-store.mjs`, `lib/wallet-store.mjs`,
   `lib/fx/prefs.ts`, `lib/profile-gate.mjs`, `lib/auth-client.ts`, `lib/queue-client.ts`,
   `lib/duel-client.ts`, `lib/wallet-client.ts`, `lib/wallet-client-static.ts`,
   `lib/duel-client-static.ts`, `lib/profile-sync.ts`, `app/use-player.ts`, `app/use-wallet.ts`,
   `app/use-locale.tsx`, `app/shell/settings-sheet.tsx`, `app/arena.tsx`,
   `components/three/hero-orb.tsx`. Not changed: `app/ops/dashboard.tsx` and `app/studio/studio.tsx`,
   which are JHK server-only tools that are never in an edition graph (listed as exceptions in
   `tests/hisaab-storage.test.mjs`).
2. **`TOPIC_DOMAINS` moved** from `lib/journal.mjs` to `lib/content.mjs`, with the same value.
   `lib/journal.mjs` imports it and re-exports it, so every existing import works. This lets one alias
   (content) define the edition's topics.
3. **Route catalogue split out.** JHK's nine routes moved verbatim to the new
   `lib/expedition-routes.mjs`. `lib/expeditions.mjs` imports and re-exports `EXPEDITIONS`.
   `validExpeditionCards` now accepts an optional `route.topics` array for mixed-topic routes. JHK's
   routes have no `topics`, so the check stays exactly `f.topic === route.topic`.
4. **Verdict made reusable.** `lib/server/room-engine.mjs` now exports `roundVerdict(answers, tieMs)`,
   `matchDecided(mode, roundIndex, scores)` and `matchWinner(scores)`, and `finishRound` calls them.
   The logic is the same code, moved.
5. `package.json`: dependency `trystero@0.25.4`; scripts `build:hisaab`, `dev:hisaab`,
   `preview:hisaab`. `pnpm-lock.yaml` is updated to match. `.gitignore` adds `/dist-hisaab/`.

## 5. The bank

`editions/hisaab/bank/index.mjs` is the only place a lane is wired in:

```js
import { HISAAB_SAMPLE } from './sample.mjs';
export const LANES = Object.freeze({ sample: HISAAB_SAMPLE /*, schemes: HISAAB_SCHEMES, … */ });
export const BANK = Object.freeze(Object.values(LANES).flat());
```

Adding a lane there makes it playable everywhere at once: duels, practice, routes and the daily five.
`tests/hisaab-bank.test.mjs` runs `checkBank(LANES)` and requires it to report nothing. Items keep the JHK
question shape plus the charter fields, and the engine reads `id, domain, region, topic, subtopic,
difficulty, question, options, correctIndex, explanation, sourceUrl, sourceLabel`. Edition fields
(`state`, `kind`, `govt`, `asOf`, `status`, `people`) are for the routes and your screens. Look an item
up by `factId` in `BANK` to show its state, status line or `asOf`.

## 6. Duels vs the bot

### 6.1 `request(body)`

`import { request } from '@/lib/duel-client'` (in this build, the in-page duel service). It resolves
with the result, or throws an `Error` with `.code` and `.status`, the same contract as JHK's HTTP client.

| action | body (beyond `action`) | result |
|---|---|---|
| `clock` | — | `{ serverNow }` |
| `catalogue` | — | `{ catalogue: { count, topics[{topic,domain,count}], facets, rules: { tieMs, maxTransportMs } } }` |
| `practice` | `topic?` ('all') | `{ cards: Card[3] }` (open teaching cards, answers included) |
| `expedition` | `routeId` | `{ routeId, version, cards: Card[6] }` (options shuffled per call) |
| `create` | `roomId` (32 hex), `token`, `invite` (32–64 `[A-Za-z0-9_-]`), `name` (1–24), `config` | `{ room }` |
| `ready` | `roomId, token, roundId` (null before round 1), `rttMs, jitterMs` | `{ room }` |
| `reveal` | `roomId, token, roundId` | `{ room }` (the question is now in `room.round.question`) |
| `answer` | `roomId, token, roundId, attemptId` (16–64 chars), `choice` 0–3, `elapsedMs` | `{ room }` |
| `state` | `roomId, token` | `{ room }` (poll this) |
| `leave` | `roomId, token` | `{ room }` (settles: refund, no winner) |

`config` for a bot match: `{ mode, duration, stake: 0, opponent: 'bot', topic?, difficulty?, subtopic? }`.
Filters default to `'all'`. A filter that leaves fewer questions than the format needs throws `invalid_request`.

### 6.2 Formats and timers

| mode | name | rounds | clock | ends |
|---|---|---|---|---|
| `quick` | Quick Draw | 1 | 10 s | after the round |
| `trilogy` | Triple Threat | up to 3 | 7 s | first to 2 round wins |
| `gauntlet` | The Gauntlet | 5 | 5 s | after 5; most rounds wins |

`DUEL_FORMATS` in `edition.ts` has these, taken from the engine. Allowed durations are 5, 7 and 10 s.
Each round is scheduled 3 s after both seats are ready, and a seat must reveal within 12 s of that or
the match is cancelled (`player-not-connected`). The bot readies itself between rounds; the human seat
calls `ready` again.

**Verdict (the engine's, used for bot, friend and P2P alike):** correctness first. If only one seat is
right, that seat wins (`correct`). If both are right, the shorter reveal-to-input time wins
(`screen-time`) unless the two are within 150 ms, which is a draw (`close-result`). If neither is right,
the reason is `no-correct-answer`. A reported time that the receipt time contradicts beyond the transport
grace cancels the match (`timing-inconsistent`).

The practice bot is **Lucky Guess · BOT**. Its pick is uniform over the four options and its delay is
uniform between 1 s and duration minus 0.5 s. It never sees the question, and the receipts mark it as
`simulated` ("scheduled bot"). Always label it BOT.

### 6.3 The duel controller (use this instead of re-deriving the arena)

```ts
import { request } from '@/lib/duel-client';
import { useDuel, useQuestionShown } from '@/editions/hisaab/app/use-duel';

const { controller, snapshot } = useDuel(request);
useQuestionShown(controller, snapshot); // starts the answer clock 2 animation frames after the question mounts
await controller.createBot({ name, config: { mode: 'quick', duration: 10 } });
// render snapshot.room; on a tap: controller.answer(i)
```

`snapshot`: `{ room, error, busy, clock, shownRoundId, locked, countdownMs, remainingMs }`.
`countdownMs` covers the time before the reveal, and `remainingMs` the time left once
`markShown()` has run. The controller polls `state` every 500 ms while live and every 1500 ms while
waiting (3 s in a hidden tab), reveals at the shared countdown, ignores stale revisions and resends an
answer with the same attempt id. Other methods: `calibrate()`, `ready()`, `refresh()`, `resend()`,
`leave()`, `reset()`, `adopt(data)` (for P2P sessions), `dispose()`.

**Timing contract:** `elapsedMs` runs from `markShown()` to the tap on `performance.now()`. Call
`markShown` only once the question is actually painted (`useQuestionShown` does this). Keep the live
question surface quiet: no entrance animation, no layout shift, no renderer or ceremony during a round.

### 6.4 The room projection you render

`room`: `{ id, revision, seat, phase ('waiting'|'scheduled'|'playing'|'between'|'complete'|'cancelled'),
roundIndex, config, players[{ name, ready, kind: 'human'|'bot' }], scores[2], settled, winner (seat|null),
reason, completedRounds[], round }`.
`round`: `{ id, scheduledAt, issuedAt, answerLocked[2], question, result, receipts }`.
`question` is `{ id, topic, subtopic, difficulty, question, options }` once revealed. When `result` is set
it also has `factId, domain, correctIndex, explanation, sourceUrl, sourceLabel`.
`result` is `{ winner, reason, tieMs }`, and `receipts[seat]` is `{ choice, correct, elapsedMs, simulated, … }`.
`completedRounds` holds the settled earlier rounds, which you need for the receipt screen.

### 6.5 Recording a duel to the profile

`usePlayer(room, profileEpoch)` files every settled round and match into the journal and progression
once, however often the room is re-polled. Pass the room you render and the `player.epoch()` captured
when you created it (see `DevShell`). Nothing else is needed for XP, streaks, quests and the Vault.

## 7. Routes (expeditions)

```ts
import { ROUTES, routesOfKind, routeById, type Route } from '@/editions/hisaab/edition';
```

Routes are derived from the bank (`engine/routes.mjs`) and are **the same objects** `lib/expeditions.mjs`
runs.

- **Rajya Rounds** (`kind: 'state'`, id `state-up`): one route per state with ≥ 4 items. A run is
  always **6 cards** (the engine's run length). A state with 4–5 items of its own is topped up with
  Centre items, taking its own sectors first. `ownCount` and `padded` report this, and your screen
  must say so: the subtitle reads "4 receipts from Assam, 2 from the Centre."
- **Sector Files** (`'sector'`, `sector-farm-food`): one per sector with ≥ 6 items, except Media & Speech.
- **Kiska Media?** (`'media'`, `kiska-media`): topic Media & Speech, ≥ 6 items.
- **Forward Court** (`'forward'`, `forward-court`): `kind: 'forward'`, ≥ 6 items, mixed sectors.

A route has `{ id, kind, key, version, title, subtitle, code, stamp, chapters[3], topic, topics[],
ids[6], ownCount, padded[], poolSize, state?, sector? }`. The titles, subtitles and chapter names are
draft copy for the design lane to restyle or replace. Cards are picked two per difficulty and ordered
simple → expert → extreme across the three chapters.

Playing one, as `DevShell.RoutePlayer` does:

```ts
const data = await request({ action: 'expedition', routeId: route.id });
if (data.version !== route.version || !validExpeditionCards(data.cards, route)) throw …;
await player.dispatch({ type: 'journey-start', routeId, runId: crypto.randomUUID(), previousRunId, cards: data.cards });
await player.dispatch({ type: 'journey-answer', routeId, runId, index, choice, confidence }); // 'steady'|'bold'|'called'
await player.dispatch({ type: 'journey-next', routeId, runId, index });                     // after the reveal
await player.fold(routeId, runId);                                                          // honest exit
```

The record is `player.profile.journeys[route.key]` (`{ run, first, best, last, bestScore, completions,
folded }`), and `expeditionStatus(record)` returns `'new' | 'continue' | 'complete'`. Confidence scoring:
Steady +2/0, Bold +3/−1, Called +4/−3 (`CONFIDENCE` in `lib/expeditions.mjs`). XP is the same at every
tier. Six cards run from −18 to 24 points.

With the lanes present on 25 September (sample, schemes, spending, scams, elections, forwards,
states-east) the bank derives 23 routes: 11 states, 11 sectors and Forward Court. Kiska Media appears
once the media lane lands.

## 8. Aaj Ka Hisaab (the daily five)

```ts
const { day, id, cards } = todaysFive();       // same five, same option order, for everyone that local day
player.dispatch({ type: 'practice', fact: cards[i], choice, roundId: dailyRoundId(day, i) });
```

The `practice` action journals the card and pays Discovery XP once per round id, so replaying the day
earns nothing more. It prefers five different sectors and at most two cards of any difficulty.

## 9. Progression selectors and the label ladder

```ts
const s = standing(player.progression?.xp ?? 0);
// { level, into, toNext, progress (0..1), band, title (engine band name), label: { label, line, from, to } }
```

`LADDER` holds the nine rungs, `labelFor(band)` and `labelForLevel(level)`. Band = floor(level / 5):
Andhbhakt (levels 1–4) … Certified Anti-National (40+). Show the **label**, never the engine's
`title`. From `player.progression`:

| field | meaning |
|---|---|
| `xp` | total XP (`levelForXp` in `lib/progression.mjs`) |
| `streak` | `{ current, best, lastDay, shields, frozenDays }` (local days; shields auto-cover a missed day) |
| `quests` | `{ day, seed, items[3]: { id, label, target, progress, xp, done } }`. "Play a {topic} duel" names a sector |
| `achievements` | id → unlock time. Hide `UNREACHABLE_ACHIEVEMENTS` (sports-fan, lab-coat) |
| `rank` | Arena Rank `{ points, tier, best, floor }` from duel results |
| `counters` | `rounds, correct, matches, wins, …, byTopic[sector], byMode[mode]` |
| `log` | the last 40 XP events `{ kind, xp, label, at }` |

The edition's notification rules (charter §7) are stricter than JHK's: no streak nags and no "come back"
prompts.

## 10. Profile hooks

`usePlayer(room?, roomEpoch?)` from `@/app/use-player` returns: `profile, journal, passport, summary,
progression, analytics, level, loaded, persistent, storageError, syncState ('off' here), dispatch,
epoch(), fold, open(roundId), recall, review, seedReview, save(question), clear() (reset), skin,
exportAll, report, visit, noteOpen, noteBeat, noteCount, equipCosmetic`. Every write goes through one
IndexedDB transaction (`hisaab-player`) and pings other tabs. Treat `loaded === false` as "not yet".
`useWallet()` (`@/app/use-wallet`) is the device coin wallet (`hisaab-wallet`), which you only need if
the design uses coins. Coins are free and simulated, and bot matches are always free.
`LocaleProvider` / `useLocale` (`@/app/use-locale`) persist `hd-locale`.

## 11. Feel: fx and juice

`import { FxProvider, useJuice, ToastStack, Ceremony, NumberCounter } from '@/components/fx'`. Mount
`<FxProvider>` once. `useJuice()` gives `burst(el, 'correct'|'wrong'|…)`, `toast`, `ceremony`,
`confetti`, `settle`, `shake`, `sound`, `haptic` (see skill `juice`). `ProgressionFeedback`
(`@/app/screens/use-progression-feedback`, takes `{ progression, quiet: { toasts, ceremonies } }`) turns
progression diffs into toasts and ceremonies. Under the charter budget, pass `quiet` so that there is at
most one toast per screen visit and ceremonies appear only for a label promotion or a finished file.
Prefs (sound, volume, haptics, motion) are in `lib/fx/prefs.ts` under `hisaab-*` keys. No sound plays
before the first tap.

## 12. Duel a Friend (P2P, no server) and Pass & Play

`import * as p2p from '@/editions/hisaab/p2p/index.mjs'`

**How it works.** The host's browser runs the real duel service on its own in-memory store. The guest
sends ordinary `request()` bodies (`join, ready, reveal, answer, state, leave, clock`) over a transport
and gets ordinary room projections back. The rules, timers, verdicts and timing checks are therefore
the engine's, and the duel controller drives both seats. The room code seeds the deal: the host creates
the room with `seededRng(code)`, and the guest deals the same deck from its own bank (`expectedDeck`)
and checks every revealed question against it (`verify(room)`). A hello handshake compares protocol and
bank fingerprints, so two builds with different banks refuse to pair (`p2p_mismatch`).

**Label it honestly.** `P2P_TRUST.label` / `.body`: casual and trust-based. The host is authoritative,
and each browser reports its own reveal-to-input time, which a modified browser can forge. There are
no coins and no ranking. If you pass a P2P room to `usePlayer(room, epoch)` the way you would a bot
room, each device records its own side, and the match counts toward XP and the "Duel a friend" quest.

```ts
// Host
const code = p2p.makeRoomCode();                       // 'ABCD-EFGH', show it big
const transport = await p2p.createTrysteroTransport(code);
const host = p2p.createP2PHost({ transport, code, name, config: { mode: 'trilogy' } });
const created = await host.start();                    // { room } seat 0, 'waiting'
controller.adopt(created); host.onPoke(() => controller.refresh());
// Guest
const code = p2p.normalizeCode(typed);                 // null → "enter the 8-character code"
const guest = p2p.createP2PGuest({ transport: await p2p.createTrysteroTransport(code), code, name });
controller.adopt(await guest.join());                  // waits for the host's hello (8 s timeout)
guest.onPoke(() => controller.refresh());
// Both: controller.calibrate(); controller.ready(); … same as a bot duel. session.onPeer('leave'), session.close()
```

Use `useDuel(session.request)` inside a component keyed by the session. `session.request` already
carries the seat token, so attach with `adopt`, not `createBot`.

**Transports** (`{ send, onMessage, onPeer, close, kind }`):

- `createTrysteroTransport(code)`: WebRTC over trystero (MIT, npm, v0.25.4). It is lazy-loaded (a
  separate 60 KB chunk) and signals over **public Nostr relays**, with the room code as password.
  Caveats to show the player: both browsers must reach a public relay and form a direct connection.
  Strict NATs can fail because no TURN relay is configured, and adding one would mean running a server.
- `createBroadcastTransport(code)`: two tabs on one device (BroadcastChannel `hisaab-p2p-<code>`).
- `createMemoryPair()`: one realm (tests and the self-test).

**Disconnects.** If the guest leaves mid-match, the host settles the match as `player-left` (no winner).
If the host leaves, pending guest requests fail with `p2p_disconnected`. Error codes: `invalid_code`,
`p2p_timeout`, `p2p_mismatch`, `p2p_disconnected`, `room_full`, plus the duel service's own.

**Pass & Play** (two people, one phone, untimed; a pure reducer):

```ts
let s = p2p.startPassAndPlay({ mode: 'trilogy', names: ['Asha', 'Bilal'] });
s = p2p.reducePassAndPlay(s, { type: 'ready' });            // 'pass' → 'answer' (question shown)
s = p2p.reducePassAndPlay(s, { type: 'answer', choice });   // seat 0, then 'pass' to seat 1 …
s = p2p.reducePassAndPlay(s, { type: 'next' });             // after 'reveal' → next round or 'complete'
const view = p2p.passAndPlayView(s);                        // hides the key and the other pick until reveal
```

The verdict is the engine's `roundVerdict` with equal (zero) times, so both correct gives
`'both-correct'`. Pass & Play writes nothing to a profile because two people are sharing one.

## 13. Storage isolation

JHK and the edition share the `occult-kranti.github.io` origin. All storage names come from
`lib/storage-names.mjs`: `hisaab-player` (IndexedDB), `hisaab-wallet`, `hisaab-player` /
`hisaab-wallet` (BroadcastChannels), `hisaab-online-sound`, `hisaab-volume`, `hisaab-motion`,
`hisaab-haptics`, `hisaab-name`, `hd-principal`, `hd-locale`, `hd-gate`, … **Never write a literal key.**
Add a name to `storageNames()` and read it from `STORAGE`. `tests/hisaab-storage.test.mjs` fails on
literal storage keys in client code.

## 14. Pitfalls

- **Six cards per route.** The engine hard-codes it. Don't build shorter routes; top them up the way
  `deriveRoutes` does and say so on screen.
- **Routes move as lanes land.** A route's six can change when the bank changes. Finished stamps
  survive, but an in-progress run whose cards no longer match is dropped on load (the route starts
  fresh). Don't cache route ids across releases.
- **Per-topic counters for mixed routes** go to the route's dominant sector (`route.topic`). The
  journal itself records each card's own sector.
- **Topics must be SECTORS.** The journal drops any fact whose topic is not a key of `TOPIC_DOMAINS`.
- **Small sectors make impossible quests.** "Play a {sector} duel" can name a sector with too few items
  for a duel filter. Any duel that includes that sector completes it.
- **Don't import `@/lib/duel-client` outside the edition build and expect civics.** Without the alias it
  is JHK's HTTP client and sports bank. Tests must `register` the node hook first.
- **JHK leftovers you may meet:** the export file is still named `fact-duel-player.json`
  (`usePlayer().exportAll`); the season/supporter code in `lib/season.mjs` lists sports (unused here).
  The engine's bot name is `Lucky Guess · BOT`.
- **Tailwind in JHK scans the whole repo.** JHK's `app/globals.css` uses Tailwind's automatic source
  detection, which reads every non-gitignored file, so utility-like class names in edition files (or
  stray files at the repo root) can add unused rules to JHK's CSS. It is harmless to behaviour. Follow
  `hisaab-design` for the edition's class conventions, and don't leave scratch HTML in the repo.
- **Never put a renderer, ceremony or toast in a live round.** Rewards wait for the settled result.

## 15. Tests

`tests/hisaab-bank.test.mjs` (contract, bank exports, duel service over the civics bank),
`tests/hisaab-p2p.test.mjs` (codes, seeded deal, all verdict branches against `roundVerdict`, timing
check, handshake, leave, real-time controller match, BroadcastChannel, pass & play),
`tests/hisaab-storage.test.mjs` (JHK names byte-identical, edition names disjoint, edition graph
resolves them, no literal keys), and `tests/hisaab-edition.test.mjs` (route derivation, ladder, daily
five, alias table, civics through journal, progression, quests and the expedition reducer).
