# HISAAB DO: code correctness review

Reviewer lane: **code**. Date: 26 Sep 2026. Scope: `editions/hisaab/app/**` and `editions/hisaab/engine/**`
in the working tree at review time, plus the shared modules they drive (`app/use-player.ts`,
`lib/server/room-engine.mjs`, `lib/profile-store.mjs`, `lib/fx/*`, `editions/hisaab/p2p/*`). Binding
references: ENGINE.md (§6.3 timing contract, §6.5 recording, §12 P2P, §13 storage), design bible §9
(notification budget), §10 (3D), §11.9–§11.12 and §12, charter §2 and §7.

I edited no app code. I added one test file, `tests/hisaab-code-review.test.mjs`: two guards that pass,
plus four `todo` tests that reproduce the P2 defects below. They report as TODO until each fix lands;
after that, drop the `todo` option so the test guards the fix.

**Verdict: fix first.** No P0. The live question keeps the timing contract. Every round, the card
mounts hidden and is revealed two frames later, in the same frame as `markShown()`. No toast, ceremony,
WebGL canvas or nav appears during a round, and the 3D and trystero code stays in lazy chunks. There are
**2 P1s**:

- the P2P lobby leaks its WebRTC room when the player leaves while it is still opening;
- every room revision in round 2 or later writes the profile and re-renders the whole app during the
  live question.

There are **7 P2s** for the backlog.

---

## 1. What was run

| check | how | result |
|---|---|---|
| Types | `pnpm exec tsc --noEmit` | 0 errors |
| Tests | `node --test tests/hisaab-*.test.mjs` | 46 tests: 42 pass, 0 fail, 4 todo (the new file) |
| Build + chunk graph | `HISAAB_OUT=<scratch> pnpm build:hisaab`, then a static-import walk from `index-*.js` / `app-*.js` / `home-*.js` | three/fiber/rapier (`kit-*.js`, 1.09 MB gz) is imported **only** by the four `*-scene` chunks and `stamp-rig`. trystero (`dist-*.js`) is reached only through `import()` in `p2p-*.js`. First-paint JS is 378 KB gz, 182 KB of it the bank + room engine |
| Route to the finish | Chromium 390×844, `#/route/state-up`, six cards, then Next | lands on `?done=<runId>`, `data-screen="route-finish"`, one `replaceState`, no console errors |
| Bot Gauntlet and Triple Threat, instrumented | `IDBDatabase.prototype.transaction` wrapped with stacks; arena `data-view` / `data-shown` / canvas / toast / ceremony / `data-chrome` logged every frame | reveal marker 31–33 ms after mount (2 frames) in every round; 0 toasts or ceremonies while live; chrome `none`; the only canvas is the idle 2D `fx-canvas` (particle loop stops when empty). **14 profile readwrite transactions during countdown/live** (P1-2) |
| Reveal cost under load | the same Gauntlet at 6× CPU throttle (CDP), timing mount→marker and marker→next frame | 18–31 ms mount→marker from round 2 on (69 ms on round 1, cold). No profile write fell inside a reveal window on that run |
| P2P lobby lifecycle | `#/duel?vs=friend`, tap *Create room*, with the trystero chunk delayed 1.5 s and `joinRoom`/`room.leave` probed | leaving after the room opened: `left: true`. **Tapping a nav tab while "Opening a room…": `left: false`** (P1-1) |
| P2P two tabs (`?via=tab`) | full Quick Draw, host + guest in one context; profile counters read from IndexedDB | recorded once (`matches 0 → 1`); no console errors. A guest leaving while joining closes its channel and the host shows "Disconnected" |

---

## 2. Findings

### P0: none

### P1: must fix before launch

**P1-1: The P2P lobby leaks the WebRTC room (and can seat a ghost guest) when it unmounts while the transport is opening.**
*File:* `editions/hisaab/app/screens/duel/friend.tsx`, `host()` lines 178–181 and `join()` lines 212–220.
The unmount cleanup (`alive.current = false; closeAll()`) only closes what `link.current` holds at that
moment. Both paths do `attach(await openTransport(code, via))` without checking `alive` after the await.
When the player leaves during that await (the trystero chunk download plus `joinRoom`), `attach` runs
after `closeAll` has already run. The `if (!alive.current) return void api.close()` branch then closes
the session, but `api.close()` calls the **no-op `shared.close`**, so the real transport is never
closed. The nav is on screen during `stage === 'opening' | 'joining'`, so a player can easily leave then.
Confirmed in Chromium with a probe on `joinRoom`/`room.leave`: after leaving mid-opening, `left: false`.
The trystero room then keeps announcing the code on public Nostr relays and accepting peers for the rest
of the page session.

On the **guest** path it is worse. After the unmounted `join()` goes on and takes seat 1, nothing ever
sends `leave` or closes the link. The host's lobby shows the friend as **"Connected · peer-to-peer"**,
enables *I'm ready*, and waits forever for a player who is not there. That is presence that isn't real
(charter §2.8, bible §11.9 "no presence beyond the real link").

*Fix:* in both paths, check `alive` after each await, and close the **real** transport:
```ts
const transport = await openTransport(code, via);
if (!alive.current) { await transport.close(); return; }
const shared = attach(transport);
…
const created = await api.join();                      // host: await api.start()
if (!alive.current) {
  await api.request({ action: 'leave' }).catch(() => {}); // guest only: free the seat
  return void closeAll();                              // closes link.current.transport, not `shared`
}
```
Also switch the chrome to `top` while `stage` is `opening`/`joining` (`useChrome(stage === 'opening' ||
stage === 'joining' ? 'top' : null)`). A nav tap would abandon the room anyway.

**P1-2: Every room revision in round 2 or later writes the profile and re-renders the whole app during the live question.**
*Files:* `editions/hisaab/app/shell/player.tsx` `useRecordRoom` (line 53). This feeds
`app/use-player.ts` line 229, which dispatches `{ type: 'room' }` on every `room.revision` once
`completedRounds.length > 0`.
Three events bump the revision: the reveal, the bot's answer and your answer. Each bump opens a
`hisaab-player` **readwrite** IndexedDB transaction. The reducer is a no-op then, but `transactProfile`
still resolves a freshly read object, `accept()` calls `setProfile` with it, and the `PlayerProvider`
memo (keyed on `player.profile`) hands a new context value to every `useAppPlayer()` consumer. That means
BotRoom → Arena → LiveQuestion re-render, and ProgressionWatch runs `progressionDiff`, all while the
quiet surface is up.

Measured: 14 readwrite transactions during countdown/live in one Gauntlet. The stacks all come from
`use-player` `dispatch`. One started **4 ms after the hidden card mounted, before the reveal marker**,
which breaks "no work before the reveal marker" (README checklist, ENGINE §6.3). I could not measure a
frame delay on desktop Chromium, even at 6× throttle, so this is P1 and not P0. On a low-end phone, a
provider-wide re-render between `markShown()` and the paint adds to the player's measured time.
*Fix (foundation, `shell/player.tsx`):* forward a room only when something recordable changed:
```ts
const settled = room ? (room.completedRounds?.length ?? 0) + (room.round?.result ? 1 : 0) : 0;
const key = room ? `${room.id}:${settled}:${!!room.settled}` : '';
useEffect(() => { record(room ?? null, epoch); }, [record, key, epoch]); // eslint-disable-line react-hooks/exhaustive-deps
```
The reducer only files settled rounds and the settled match, so this loses nothing. Optional: pause the
analytics heartbeat while `budget.isLive()`. It is another 15-second readwrite plus re-render inside rounds.

### P2: backlog

**P2-1: The duel controller accepts responses that arrive after `reset()` / `adopt()`.**
*File:* `editions/hisaab/engine/duel-controller.mjs`, `poll()` line 114 and `tick()` line 127 (also
`run()` callers `ready`/`leave`, `resend`). `poll(mine)` checks the epoch only before the await.
`accept()` compares revisions only when the ids match. So a late response can bring back a room that
`reset()` forgot, or replace a newly adopted room that has a different id. No current screen path hits
this (a settled room stops polling, and P2P rematches remount the controller). But it breaks the public
contract ("Forget the match"), and it will bite the first screen that calls `refresh()` next to `reset()`.
*Fix:* capture `const mine = epoch` before every `await request(…)` (poll, tick's reveal, resend,
ready, leave, createBot's ready) and `if (mine !== epoch) return;` before `accept`. Tests:
`hisaab-code-review` #3 and #4 (todo).

**P2-2: The 150 ms ticker re-renders the live question about 7 times a second for nothing.**
*File:* `editions/hisaab/engine/duel-controller.mjs` line 142: `} else changed();` runs every tick until
the result. After the reveal, nothing on screen reads `countdownMs`/`remainingMs` from a re-render. The
timer bar reads `controller.snapshot()` in its own rAF loop (`screens/room/live.tsx`). So the Arena
subtree re-renders about 7 times a second on the quiet surface.
*Fix:* `} else if (rd.issuedAt === null) changed();` (the countdown still ticks). Test: #5 (todo).

**P2-3: `useVisit` breaks the one-toast visit when a sheet closes.**
*File:* `editions/hisaab/app/budget.ts` lines 431–437.
(a) The cleanup calls `budget.newVisit(before)`, and `newVisit` resets `visitToastUsed`. So opening and
closing a receipt sheet gives the Vault a **second** toast in the same screen visit (bible §9 rule 1).
Test: #6 (todo).
(b) Suppose a link inside the open sheet navigates, for example the receipt detail's *Report an error*
→ `#/rules?s=report`. The shell's layout-effect `newVisit('/rules')` runs first, then the sheet's
passive cleanup runs `newVisit('/receipts')`. The budget now believes it is on `/receipts` while
`/rules` is showing: Activity entries are tagged with the wrong visit, and coming back to `/receipts` is
not a new visit.
*Fix:* give the budget a sheet API that saves and restores the parent's state instead of starting a
visit, e.g.
`enterSheet(key) → leave()`, where `leave()` restores `{ visit, visitToast, visitToastUsed }` **only if**
`visit` is still the sheet key. Then `useVisit` calls `enterSheet`/`leave`.

**P2-4: The guest keeps polling a host that has gone.**
*File:* `editions/hisaab/app/screens/duel/friend.tsx` around line 626. After `endReason = 'connection-lost'`
(or `fatal`), the controller still polls. Each poll waits the full 15 s p2p timeout, errors, and
reschedules, until the player leaves the screen. Nobody reads the result.
*Fix:* when `endReason || fatal` is set, call `controller.dispose()` in an effect. Or have
`duel-controller` `poll()` stop on `p2p_disconnected` / `p2p_closed`, as it already does on 403/404/410.

**P2-5: "Deleted. A fresh file." shows even when the reset failed.**
*Files:* `editions/hisaab/app/screens/settings/index.tsx` line 276 and `app/use-player.ts` line 320.
`clear()` swallows `dispatch`'s `false` (the "Reset could not be saved" path), so Settings reports
success when nothing was deleted.
*Fix:* make the shared `clear` return `ok`. This is additive, and JHK ignores the return. Settings then
shows `player.storageError` inline when it is `false`.

**P2-6: A human seat can present as the bot.**
*Files:* `editions/hisaab/app/screens/duel/lib.ts` line 123 `seatNameFor` and `app/data.ts` `seatName`
(human branch). A friend or Pass & Play player can type "Babu-Bot · BOT". Their name is shown verbatim
on the other phone's lobby, round head, TARAZU pans and result.
*Fix:* in `seatNameFor`, and in `seatName` for `kind !== 'bot'`, reject names that match `/\bbot\b/i`
or equal `BOT_NAME`, falling back to `ANONYMOUS`.

**P2-7: The P2P connection banner shifts the live question.**
*File:* `editions/hisaab/app/screens/room/live.tsx` line 247 (`{banner}` above the card). When the peer
drops mid-question, "Connection lost — waiting 10 s" is inserted above the stem and pushes the options
down while the player may be tapping. The bible (§11.10) says no layout shift on the live surface.
*Fix:* render the banner inside the round head's box, positioned absolutely, or reserve its slot with a
fixed `min-height`, so it never moves the answers.

---

## 3. What is right (keep it)

- **Timing contract.** `LiveQuestion` mounts the card `visibility:hidden` and registers its visibility
  flip *after* `useQuestionShown`'s double rAF. `markShown()` and the reveal therefore land in the same
  frame, just before its paint. Measured at 2 frames in every round. `answer()` refuses before
  `markShown()` and after the local clock, and it locks on the first tap. Guarded by the new tests #1–#2.
- **Quiet surface.** `useQuietRound` covers countdown → live. `SceneHost` refuses while live. Arena holds
  toasts and ceremonies for the whole match and releases them 1.2 s after the result renders. TARAZU
  unmounts on a rematch (`reset()` → loading view). Fixed option order, and `correctIndex` only arrives
  with the result.
- **Recording.** There is one `usePlayer()` (the provider), and `useRecordRoom` uses the epoch captured
  at creation. Pass & Play never records. A two-tab friend match is filed once.
- **Lazy loading.** Four module-scope `React.lazy` scenes behind a capability gate and a one-canvas slot.
  trystero is loaded by `import()` only when a friend room opens. Screen chunks are lazy, and a failed
  chunk reloads the page on Retry.
- **Storage.** No literal keys. Everything goes through `STORAGE` / `PREF_STORAGE_KEYS`, and the storage
  test passes.
- **P2P honesty.** Peer state is real: transport events, the hello, and the room's seats. The guest
  checks the seeded deal against its own bank. A handshake mismatch surfaces as fatal. The host settles
  a guest leave as `player-left`.
- **Route flow.** `journey-start` is sent with the first answer, the finish uses `?done=`, and the `file`
  ceremony is raised once through a ref (replays note "Best: a → b" instead).
- **Route derivation and the daily five** are pure and seeded (FNV + mulberry32, id tiebreaks). Nothing
  reads the clock except `localDay`.

---

## 4. Requests to other lanes (I edit no app code)

| lane | findings |
|---|---|
| duel (`screens/duel`, `screens/room`) | P1-1, P2-4, P2-7, P2-6 (`seatNameFor`) |
| foundation (`shell/player.tsx`, `budget.ts`, `data.ts`) | P1-2, P2-3, P2-6 (`seatName`) |
| engine (`engine/duel-controller.mjs`) | P2-1, P2-2 |
| me (`screens/settings`) + shared `app/use-player.ts` (additive) | P2-5 |

When a fix lands, remove the matching `{ todo: … }` in `tests/hisaab-code-review.test.mjs` (#3–#4 for
P2-1, #5 for P2-2, #6 for P2-3(a)).
