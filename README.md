# FACT//DUEL — Clubhouse, Expeditions & Duels

A private sports and science knowledge club for friends or random practice bots.
All coins are free, per-room simulations with no monetary value.

## Play

The **Clubhouse** offers a featured expedition, saved Continue state, direct random-bot duels and your stamp case. **Expeditions** has nine narrow sports/science routes using the existing 54-question sample.

An expedition is six untimed questions in three chapters. Choose **Steady** (+2 correct, 0 wrong) or **Bold** (+3 correct, −1 wrong) before each answer. Your first choice locks. Each answer saves locally; pause and resume any route. After all six, **Finish & collect stamp** records the result and awards the same commemorative stamp at any score. First-run and best practice scores are separate. Replay uses the same questions with freshly shuffled options; no general skill ranking is implied.

For a bot duel, use any of the Clubhouse’s three direct mode buttons. To customize, open **Duels** or **Topics, timer & match settings**. For two-screen play, choose **Invite friend**:

1. Open the site on two screens with access to the private site.
2. On the first screen, enter a name, choose a mode and filters, then create a duel.
3. Copy the invitation to the other screen, enter a different name, and join.
4. Press ready on both screens. Answer once on tap/click release or with keys 1–4.
5. Review the shared result, source, and timing table.

Quick Draw is one round; Triple Threat is up to three, first to two wins.
The Gauntlet plays all five questions; final score decides. Untimed Recall Lab
reviews already encountered facts from the local journal.
Coins are reserved once per match. A draw or cancelled match refunds the entry.
Rooms expire in two hours. Leaving, hiding an active page, or reloading after
reveal cancels the match. An invitation does not bypass private-site access.

## Timing contract

The browser reports its monotonic reveal-marker-to-input duration. When both
answers are correct, a difference at most 150 ms is a draw. The value is a casual
rule, not a measured device uncertainty bound. The server checks a capped
500–2000 ms transport envelope, but a modified browser can forge a passing time.
This is unsuitable for ranked competition or valuable stakes.

Connection probes use the primary database path. Reveal issuance and answer
acceptance are timestamped inside their respective successful writes.
The database stamps acceptance inside an atomic answer write before its receipt
deadline. A request read before a deadline but not successfully committed has
not been accepted. Both attempts remain sealed until closure. Coins, escrow,
scores and terminal settlement share one revision-guarded room state. A later
request finalizes committed attempts or persisted deadlines; no Worker timer is
assumed durable. There is no global wallet.

## Practice bot

Lucky Guess is explicitly labelled BOT. Each of the four options is equally
likely (25% correct in expectation, not a promised win rate). Its delay is sampled
uniformly in whole milliseconds from 1000 through `duration * 1000 - 500`.
The planner receives only the duration and RNG, never a question, answer key or
human response. All round plans are fixed and persisted before play. Retries do
not reroll them and public room projections never expose pending plans.

The bot's virtual clock begins with the human seat's atomic reveal timestamp.
An authenticated room request materializes a due bot response; a delayed poll
does not change its scheduled response time. This is a lazy scheduled simulation,
not a continuously running background process or a second device measurement.
The result table labels it accordingly. Human acceptance still uses the strict
database-write deadline and existing timing checks. Bot rounds use the same
correctness-first rule, 150 ms draw band and one-time coin settlement.

Bot-specific regressions cover all three modes and all timers, endpoint sampling,
hidden plans, auto-readiness, late polling, retry races, atomic reveal timing,
seat contention and cancellation. They supplement the existing human-vs-human
regressions; browser and cross-location testing remain separate.

## Verification

`node --test tests/*.test.mjs` runs engine, SQLite concurrency and HTTP-handler
regressions. `node tests/stress.mjs /tmp/duel-stress.json` exercises the same room
service over localhost HTTP, with a real in-memory SQLite adapter and virtual
time. It does not measure Cloudflare D1, mobile devices, browser rendering or
cross-region capacity. Run `pnpm exec tsc --noEmit` for type checking.

The sample bank has 54 questions. The untimed `practice` API intentionally returns
three teaching cards including their answers; these share facts with the duel bank.
Active room projections still seal attempts and answer keys until closure. The
old offline predecessor also exposed these facts; this is not a secret ranked bank. Levels
are editorial, not empirically calibrated.

## Scale boundary

The current transport polls at 500 ms while active, 1500 ms while waiting, and stops
on terminal state. This is for a bounded private pilot. Before wider access,
add pre-storage endpoint limits, observed capacity and error budgets, durable
room actors with authenticated WebSockets, account/session identity, and a
reviewed content release pipeline. A room actor reduces polling overhead; it
cannot prove a browser's physical display or input time.

## Duel experience and shared systems

The default midnight/chartreuse identity and alternate cool light theme share
semantic controls. The Clubhouse now pairs finite expeditions with direct bot
duels; the full match configurator remains in Duels. Original sports/science
covers support the routes, with metallic artwork in the duel area. Optional Three.js now lives in a
separate showroom; static art loads first and every action works without WebGL.
The scene caps DPR at 1.25, stops while hidden/offscreen, respects reduced motion
and disposes resources on unmount. Its import itself cannot be cancelled after
it starts. No renderer is mounted during a room.

The server retains at most five completed-round snapshots, written only at
closure and exposing only the settled question, result and public receipt fields.
Live-room active/future answer keys, credentials and pending bot plans remain
private in room projections; open solo teaching packs are explicitly separate.
The result view uses a whole-match verdict plus independently inspectable round
receipts, including both selected options and explicit scheduled-bot/browser
clock labels. Cancelled later rounds preserve earlier completed receipts.
Journal recovery records every retained round once. Timeout counts use resolved
rounds, not only submitted attempts. Bot replay explicitly starts a new room;
friend replay is accurately labelled Set up rematch.

Question concerns are browser-local records containing the encountered snapshot,
a category and a note capped at 800 characters. Exact round/reason keys deduplicate
identical saves and allow note updates. Up to 50 issues appear in the Vault and
are included in export/reset. They are not sent to a support or editorial service.
An older version-2 profile initializes its missing issues list safely.

Discovery offers three untimed sourced questions before a first duel. The Fact
Vault revisits encountered questions, snapshots the recall deck so cross-tab
updates cannot swap the active card, and has bookmarks, explanations and export.
The Passport awards 10 activity points per stable fact, 5 for its first explicit
explanation opening and 5 for its first untimed attempt. The internal `recalled`
flag includes both Discovery and Vault attempts; the UI calls the combined measure
untimed attempts. It is not a mastery measure. First field notes, Field notes and
the mode tour unlock deterministic Orbit, Grid and Rally card finishes. These do
not affect answers, timing, coins or content access. Missions do not decay.

## Product Studio and local records

`/studio` contains current decisions, a searchable 32-observation review table
covering eight selected apps, a more than 7,500-word combined report, 73 distinct
source URLs, current and historical advisor reviews and a 73-issue roadmap. Historical v3 work
remains explicitly labeled. Status and evidence notes are browser-local and
exportable, not live telemetry or an unattended agent service. Research downloads
live in `public/product`; structured article data is in `lib/product`. Keep both
representations synchronized when editing a report.

The version-2 browser profile lives in IndexedDB (`fact-duel-player`, `profile`,
`player`). Every change reads/reduces/writes inside one transaction. BroadcastChannel
and focus refresh reconcile stored changes across tabs. The old localStorage
journal migrates once; no past awards or stable IDs are invented. At most 200
revealed rounds and 100 completed matches are retained. A separate ledger stores
up to 1,200 stable fact IDs and preserves earned awards beyond rolling history.
Client-local records are editable, not trusted rank or a global wallet.

Exports wait for initialization and prior writes, then read the latest persistent
profile. Reset clears expedition runs/stamps/scores, journal, saved facts, question issues, activity, missions and finishes while
keeping theme/sound preferences and room coins. Seat generations, captured before
create/join, reject old room observations after reset without comparing clocks.
A successful reset authoritatively replaces any ahead-of-storage temporary branch;
a failed previously persistent reset leaves the state and explains the failure.
Opening blocked storage falls back after four seconds. Visit-only fallback is
visible and exportable. No cross-device sync or import/restore UI is shipped.

The current release gate is 68 automated tests, TypeScript checking and the
production build; exact results are in `public/product/expeditions/verification.md`. The rivalry advisor independently inspected the changed source and repair paths;
the earlier v4 review independently ran 15 targeted tests. No physical-device,
assistive-technology, GPU or WAN QA is claimed. Demand, content depth and production
capacity remain observed gates. Private access and simulated coins are unchanged.

## Current expedition release

The current design and technical decision record is `public/product/expeditions/decision-record.md`, also rendered in Studio. The seven-source research panel, two advisor passes, repair record and verification accompany it. Current roadmap: 73 issues, 38 marked done. This adds a coherent solo loop; it does not expand the question bank or claim observed retention gains.

`lib/expeditions.mjs` owns public manifests, signed scoring and pure local progression. The profile transaction stores one frozen six-card snapshot per route, first/best/latest summaries and explicit completion. Epoch/run/index guards cover reset, duplicate writes, partial resume and concurrent tabs. Expedition API responses deliberately contain open teaching answers; active live-room projections remain separate. These device-local records are not an anti-cheat or remote account system.

Current validation and unobserved browser/device/WAN gates are in `public/product/expeditions/verification.md`.
