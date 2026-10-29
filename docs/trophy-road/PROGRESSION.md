# Trophy road: earned grounds

## Product contract

The road turns settled play into three permanent format unlocks within a saved profile. Its thresholds describe participation, not expertise or a competitive rank. Ordinary innings, subjects and the existing direct home Play path remain available from the beginning. Visiting the road is optional.

| Ground | Required trophies | Gameplay change | Presentation |
|---|---:|---|---|
| Gully Ground | 0 | Standard five-delivery innings; existing quick single stays available | A warm, intimate daytime neighbourhood pitch |
| Riverside Park | 60 | Chase: first to three correct answers, at most five deliveries; simultaneous target is a draw | A wider waterside ground and calmer late-day palette |
| Crown Lights | 180 | Super Over: six deliveries, 15 seconds each; correct under 5 seconds earns 6 runs, under 10 earns 4, otherwise 2; highest run total wins | An elevated night arena under championship lights |

Chase and Super Over currently run against the practice bot. They are not server-ranked human modes. Each ground opens a distinct scoring format, so the reward changes play rather than only replacing an illustration. Earlier earned grounds remain selectable. No loss removes trophies, no streak expires, and no trophy purchase or spend exists.

## Exact earning rules and source separation

Local trophies are derived from permanent profile counters:

```text
localTrophies = 4 × attemptedRounds + 2 × correctAnswers
unlockTrophies = max(localTrophies, verifiedHumanTrophies)
```

An attempt is an actual choice from index 0 through 3 in a settled round receipt. Locking an answer before settlement does not yet award progress. A wrong answer earns 4; a correct answer earns 6 in total; a timeout earns 0. There is no per-match bonus, so splitting equivalent play into quick singles yields no extra trophies. Completing a whole match is not required to retain rounds already settled. A merely opened question proves no attempt.

The locally observed profile includes bot and locally recorded peer duels; the UI therefore calls it **Local play**, not a verified bot-only counter. The API property `practiceTrophies` preserves the integration name, but has this local scope. Its values cannot establish an online rank or authoritative human result.

Verified human trophies are supplied separately by the online session's server result. The road uses the higher source, never the sum: 58 local and 59 human trophies still leave the 60 gate locked. Neither source is imported into the other. Device resets do not delete the server's human record. Signed-out or unavailable server data contributes zero; local play remains available without an account. Server eligibility and award rules are owned by the human-result backend and must not be inferred from the local helper.

The helper sanitizes non-integer, negative and non-finite inputs. Local counters are bounded to ten million rounds, and resulting trophies to sixty million. These are data-integrity bounds, not player-facing goals.

## Threshold pacing

The thresholds are initial product choices, not retention predictions. Riverside opens after ten entirely correct answered deliveries or fifteen wrong answered deliveries, with mixed play between those bounds. Crown opens after thirty entirely correct or forty-five wrong answered deliveries. These finite early milestones allow a new player to see a meaningful new format without a purchase, punitive loss or daily attendance requirement. Real player research is still needed to validate pacing.

Because each local award is even, 59 and 179 are not naturally reachable local totals. Automated local fixtures test 58/60 and 178/180. Pure helper tests additionally exercise literal 59/60 and 179/180 through the independent human input; no browser evidence should claim impossible local fixtures were earned.

## Persistence, migration and concurrency

- **Storage:** the road derives from `profile.progression.counters`, not the rolling journal, wallet, device clock, analytics or displayed leaderboard. Trimming the 200-round journal or 100-match journal does not remove earned trophies.
- **Migration:** older profiles lack `attemptedRounds`. The progression reader seeds it from known correct answers, bounded by total rounds. Old wrong answers and old timeouts cannot be distinguished reliably, so they are not awarded retroactively. Once saved, new actual attempts accumulate normally.
- **Normal duplicate delivery:** existing profile reduction diffs settled room receipts against retained journal IDs. Re-polling the same round, going from between-round to complete, or reloading a retained result does not award it again. The road itself performs no writes.
- **Local trust limit:** the inherited journal dedupe is capped. Replaying a historical room whose identifiers have already aged out of that journal can be counted again by the local profile. Local progress is not a fraud-resistant ledger; this change does not introduce an unbounded identity table or claim that it can prove competitive results. Authoritative human records remain a separate backend concern.
- **Concurrent tabs:** the existing IndexedDB read-write transaction reads the latest sanitized profile before reducing an action, preventing ordinary independent updates from overwriting each other. Reducer revision numbers support existing profile synchronization. Stale actions carrying an old profile epoch are rejected after reset.
- **Export and sync:** the existing activity JSON export includes the whole profile, including the added counter. Reading that exported shape preserves trophy totals. This change adds no import control or additive merge. Existing full-profile sync/replacement semantics still apply; replacing a record with another valid record can replace its local road.
- **Reset/deletion:** device activity reset clears local counters and creates a new epoch. Root selection storage is `{epoch,id}`, so an old choice cannot revive a locked ground after reset. Clearing browser data similarly discards local progress. Server-recorded human progress remains governed by account data management.
- **Storage failure:** gameplay can continue in the current page's in-memory profile. The road displays that saving is unavailable; closing the page can lose that unsaved progress. The existing export remains the available recovery action.

## Interaction and accessibility contract

The root app owns the selected stadium and validates mode access on every launch path. `eligibleStadiumSelection` rejects a missing, corrupt or newly locked selection and falls back to the highest currently earned ground. It also permits replay of any earlier earned ground. The road's Play handler repeats the gate check. The generic helper returns false for unknown modes; root must apply it only where intended, not disable unrelated existing modes accidentally.

Selecting an unlocked node updates the current ground without starting a game. Selecting a locked node only previews its art, format and exact threshold. It neither writes selection nor launches a game. The disabled launch action states the required total. The home play button still launches directly; home → road → Play is a two-action alternative when its current ground is already chosen. Changing a ground adds one action.

On phones the three compact ground controls appear before the featured stadium. On wider screens they form a side road. Native buttons, a semantic ordered list, visible textual lock states and progress elements preserve operation without canvas or motion. No moving hit target is used. Buttons meet a minimum 44-pixel height; the primary launch is at least 54 pixels. Art is decorative with fixed layout dimensions and a CSS background fallback. Existing site keyboard-focus treatment applies. Reduced-motion settings disable button displacement; the road has no compulsory animation.

Selectors for browser checks: `[data-open-trophy-road]`, `[data-road-stage="gully"]`, `[data-road-stage="riverside"]`, `[data-road-stage="crown"]`, `li[data-unlocked]`, `[data-road-play]`, and `[data-testid="road-trophies"]`.

## Review and verification record

These are implementation reviews by delegated agents, not interviews or tests with real research participants. Book and player-review evidence belongs to the wider research record; the pacing above is a hypothesis until observed with users.

### Round 1: rules and failure analysis

The progression owner inspected permanent counters, settled receipts, capped journal history and existing profile transactions. The initial per-match reward was rejected after the root panel identified the advantage of farming quick singles. The accepted formula uses answered deliveries, rewards wrong attempts without claiming mastery, and excludes timeouts. Gates remain 0/60/180. Gameplay ownership was separated from presentation ownership; no parallel edits to the progression reducer were made by the road owner.

### Round 2: changed source and launch flow

Root review identified a hidden-navigation risk at 320-pixel width and ambiguous source labels. The road controls were moved ahead of the featured ground on mobile, while preserving the desktop side road. The source labels became Local play and Verified human; the higher-total rule is shown next to both totals. Existing `/art/` references were checked against the site's hero-art convention. Root retains control of generic launch guarding so unrelated modes remain available.

Executed `node --test tests/stadium-road.test.mjs`: 11 tests passed, covering all gates, max rather than sum, malformed input, legacy migration, wrong answer versus timeout, unsettled receipts, duplicate normal snapshots, export-shaped round trips, journal aging, reset/stale epochs and safe selection. A TypeScript check at this stage reported only the concurrently edited static duel client's dispatch union; the road files themselves had no reported type error. Final integrated build and physical-browser evidence are separate checks.

### Round 3: integrated source and image review

The root requested a final bounded review of Home, Road and the earned-mode launch. Source inspection confirmed that selection is stored as `{epoch,id}`, missing or reset-epoch selections fall back through `eligibleStadiumSelection`, locked IDs are rejected, and every new-mode creation passes the trophy check. The root guard applies only to Chase and Super Over, so it does not reject unrelated existing modes. The home launch passes the selected format directly; the shared launch builder forces a bot, zero stake and the Super Over's 15-second clock. The live human-session subscription supplies the separate server total. No UI path writes that total.

The progression owner independently inspected the generated three stadium assets and the integrated screenshots `verification/round-3/road-gully-320.png`, `road-crown-locked-320.png`, `night-road-gully-390.png`, and `home-320.png`. The three ground controls are legible before the featured ground on the 320-pixel road; locked Crown has a visible lock, exact 180-trophy gate and disabled launch. The home primary action is visible in the initial 320-pixel viewport. The road's own launch can require vertical scrolling on that short viewport; it remains optional and does not replace the direct home action. Day and night preserve clear ground names, state labels and stable play controls. These are screenshot observations, not measured contrast ratios or physical-touch performance claims.

Separately, the root inspected actual round-3 Home/Road day and night screenshots at 320 pixels and accepted the art legibility, ground controls, source labels and above-fold home action. No additional UI change was requested. The source and image review found no remaining blocker in the road scope.

Re-executed `node --test tests/stadium-road.test.mjs tests/no-pool-counts.test.mjs`: all 14 tests passed. The no-pool-counts test covers the integrated screens, while the 11 road tests exercise the progression contracts described above. Browser QA additionally reported a real played session earning 12 local trophies that persisted after reload, gate fixtures, all three format completions and one-action home launch; its final consolidated run remains owned by the QA report, not by this source review. The root's final integration checks supersede the earlier transient TypeScript observation.

## Remaining empirical checks

The browser QA record owns detailed viewport, keyboard, lock, persistence and launch-path results. A physical phone, mobile Safari, real WAN latency and representative player pacing research are not established by unit tests or simulated viewport screenshots. The local history replay limit above is an explicit retained trust boundary.
