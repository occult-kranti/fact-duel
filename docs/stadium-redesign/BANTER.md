# Boundary banter and honest live presence

Implemented 29 October 2026. This review is an AI engineering/design perspective, not a human usability study.

## Round 1 — baseline and decisions

The previous `DuelActions.signal` controls local sound/haptics. It does not transport opponent messages. Neither the memory-backed room protocol nor the Supabase human protocol offered chat or stickers. Calling a local toast “sent to your opponent” would therefore be false.

The new boundary banter tray offers six authored cricket reactions: All talk!, Appeal rejected., Brain duck., Nice shot!, Check the replay., and Too easy. Each has Hindi copy and a compact expressive glyph. There is no free-text field, sexual content, identity-targeted abuse, ranking change or purchase requirement. The “toxic fun” tone comes from cricket sledging and competitive exaggeration.

The tray appears in the lobby and between rounds. It occupies ordinary document flow below the match content, never overlays an answer, and is absent from timed questions and countdowns. Sending or muting during local practice stops the five-second automatic advance so an intentional interaction is not snatched away. The player can proceed manually.

Six 67px-high targets form a 3×2 mobile grid, becoming a single row on larger screens. A dedicated reserved status area announces the current confirmed sticker. No animated overlay, audio loop, vibration request or colour-only feedback is introduced. The tiny optional press transform is disabled with reduced motion.

## Delivery and consent

- Practice explicitly says “Practice bot · playful, automatic replies.” Replies follow a fixed mapping after 1.1 seconds; they are not another human. Timers are cancelled when the tray unmounts and replies are suppressed when the match becomes active or muted.
- Human games call the existing authenticated Supabase boundary with a new `reaction` action. A local click never fabricates a sent human sticker. The display comes only from the server snapshot. A failed request says it was not confirmed.
- A `reactionsEnabled` capability in the snapshot gates the human UI. Older servers show “Opponent stickers are unavailable on this server” and do not receive unsupported actions.
- Mute hides incoming reactions and sending controls. It is saved under `STORAGE.stadiumBanterMute` (JHK: `fact-duel-stadium-banter-muted-v1`). Denied storage still allows a current-tab mute. Unmuting does not replay a backlog.
- The human tray closes at the final whistle because the existing terminal-match transport stops polling. It does not promise delivery after the rival has left.

## Authority and limits

`lib/stadium-banter.mjs` provides the same six sticker IDs, an immediate client gate and bounded event parsing. The client uses the input event’s monotonic timestamp to reject rapid duplicate actions before any asynchronous request. One reaction is permitted per round break, at least eight seconds apart.

The database independently checks the authenticated room membership, exactly two joined players, supported sticker ID, UUID request ID, waiting/result phase and deadline. The same eight-second and one-per-round limits apply under the existing room lock. A retry with the same request ID is idempotent. A forged nickname/player ID or sticker text cannot be transported.

Each member stores only one latest reaction; the projection contains at most two events, expiring after 12 seconds. Reactions have no effect on answers, clocks, scores, rewards, stakes or settlement. A new nullable member column and replacement RPC functions leave existing identities, balances, room records and score authority intact.

Deployment consists of both:

1. `supabase/jhk/migrations/20261029_stadium_banter_presence.sql`.
2. `supabase/jhk/functions/jhk-game/index.ts` and its `core.mjs` dependency.

The migration has been tested twice against the same database state for idempotency. Deployment and live endpoint checks are reported separately by the release owner.

## Live numbers

The home’s `StadiumPresence` is an anonymous, read-only aggregate request. It creates no guest session or heartbeat. It counts undeleted, unexpired human profiles whose authenticated activity occurred in the last two minutes. A reader of this aggregate does not become a counted player. Practice bots and visitors without a human profile are not counted.

The label is “N humans active · last 2 min”; its accessible tooltip explains that this is not a count of available opponents. Zero remains zero. An unavailable/invalid/stale response says “Live count unavailable” rather than displaying a fabricated number.

The Edge worker caches a successful aggregate for 15 seconds; the data expires after 30 seconds and the UI refreshes every 20 seconds while visible. Returning to a stale page cannot preserve a green-looking old count. Cached aggregate timestamps do not calibrate the match clock. Only fresh authenticated game-response clock measurements can do that.

## Round 2 — implementation review

The implementation review identified and corrected:

- Access to the `window.localStorage` getter itself can throw, before `getItem`. The initializer now guards both.
- A status timer coupled to 100ms server-clock renders could be repeatedly cancelled. Human status now derives from the immutable server event and its expiry; the bot has a separate event-expiry timer.
- Reading mutable refs during render could leave disabled-state presentation stale. Visible cooldown/sent-round state is now explicit, while the synchronous guard remains independent.
- A cached presence response must not become the lowest-round-trip clock anchor. Presence requests are expressly excluded from competitive clock calibration, and this is tested.
- Human reactions are filtered to the current round before rendering so a previous break cannot replay after the next question.

Verification completed for this subsystem:

- 23 targeted Node checks passed, including six new banter/presence checks and the existing online transport/server contracts.
- PostgreSQL WASM execution of the canonical schema and additive migration passed: membership, forged text, question-phase rejection, duplicate IDs, rate limit, projection expiry, read-only aggregate and migration preservation.
- Existing JHK database integration: 51 security checks, 33 economy checks and 3 upgrade/role checks passed.
- TypeScript passed. The new component lint pass is recorded in the release verification.

These are automated integration checks. Physical-phone ergonomics, participant reactions and human concurrency/load are not established by them. The release verification records separate browser and deployment evidence.

## Deployed authority verification

After release-owner deployment of the additive migration and Edge function, `scripts/stadium-live-check.mjs` exercised the actual HTTPS endpoint using two disposable synthetic human profiles in a zero-stake private room. **14 live assertions passed**, including anonymous aggregate privacy, rejection of an unknown private bearer, capability discovery, invalid sticker rejection, two-way opponent snapshot delivery, immutable duplicate request, same-break cooldown, bounded feed, absence of credentials/contact data in match snapshots, normal countdown, countdown reaction rejection, and zero-reward cancellation. Both synthetic profiles were deleted in `finally`; cleanup acknowledgements succeeded.

Evidence: `docs/stadium-redesign/verification/live-banter.json`. It contains no bearer tokens, recovery codes, profile IDs, nicknames, room IDs or invite codes. This establishes real deployed delivery between two controlled clients; it does not establish general concurrent load or participant experience.
