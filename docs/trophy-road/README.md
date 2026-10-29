# Trophy Road release

Three earned stadiums add new practice formats while preserving a one-tap start from Home.

|Ground|Unlock|Format|
|---|---:|---|
|Gully Ground|0 trophies|Five-question innings; standard quick play stays open|
|Riverside Park|60 trophies|Chase: first to three correct, up to five deliveries|
|Crown Lights|180 trophies|Superover: six deliveries, fifteen seconds each, correct answers worth six/four/two by response time|

Each settled submitted answer earns four trophies, with two more if correct. Timeouts and void timing rounds earn none. Local play and verified human trophies remain separate; the higher total unlocks grounds. Trophies cannot be spent. Existing local records migrate conservatively from provable correct answers.

The bot commits 3.5 seconds after the player's first accepted answer. Its answer plan is independent and immutable. A 900-millisecond result beat leads directly to the next ball. Review controls, banter, manual pause and hidden tabs hold that transition. Selected earned grounds persist by profile epoch; locked previews cannot launch a challenge. Standard innings and existing topics remain open.

Question selection prioritizes unseen eligible families, then the oldest seen. Local history persists across reloads and coordinates tabs where Web Locks is available; human decks consider both players. Added 48 primary-sourced cricket cards. Category inventory totals are absent from app copy, SEO fallback and catalogue count fields. The practice bank is client-delivered and inspectable; this is not bank encryption. Repeats remain possible after a filtered pool is exhausted. Authored difficulty is not statistically calibrated.

## Evidence and design

- [Research and explicit evidence limits](RESEARCH.md)
- [Three-round panel ledger](PANELS-review.md)
- [Original art direction and three image rounds](ART-DIRECTION.md)
- [Figma and editable fallback designs](FIGMA.md)
- [Progression and boundary rules](PROGRESSION.md)
- [Gameplay and timing](GAMEPLAY.md)
- [Question sources and expansion](CONTENT.md)
- [Backend authority and deployment](BACKEND.md)
- [Advertising integration guide](../../ad_placement.md)

The Figma primary account accepted one new native board, then its Starter quota blocked further calls. Design rounds two and three were built and rendered using the installed open-source Excalidraw tool. The final editable scene and SVG are in `design/`; those are not claimed as Figma edits. Research combines dated public feedback, primary references and explicitly labelled AI perspectives, not a recruited human focus group.

## Verification

The final full automated suite passes 1,042 tests with no failures, skips or cancellations. TypeScript and the production static build pass. Existing large optional-chunk warnings remain; the new arena images total 380,478 bytes before HTTP compression. The browser evidence includes 320/390-pixel phones, landscape and desktop, both palettes, trophy gates, all new modes, one-action launch/replay, actual bot timing, automatic continuation, pause/focus, storage/reset/cross-tab rotation, image failure, offline and enlarged text. See `verification/round-3/` and `verification/round-3-final-corrections/`; the latter closes the earlier catalogue leak and checks the pause-control sizing fix. Earlier failing snapshots are retained as review history.

Production SQL migrations applied successfully. Live verification passed 20 checks across two synthetic profiles and two zero-stake rooms; both profiles were deleted in cleanup. The new history table has RLS and no anonymous/authenticated read grant. No Edge function replacement was required.

Phone testing is Chromium emulation, not physical-device or field research. At 320×568, long questions require vertical scrolling; readable text and usable answer targets are preserved. The optional road's full preview also scrolls, while Home's Play button remains above the fold. Local records are editable device data and are not competitive authority. Advertising stays disabled and never delays a round.
