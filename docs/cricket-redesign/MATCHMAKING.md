# Cricket quick-play implementation

## Panel round 1: remove the empty lobby

The former live desk required a completed email profile and promised that a bot would never fill an empty seat. It kept waiting indefinitely. The device-local bot engine already existed but was unreachable from configured live builds.

Quick play now opens a human-first search with a fixed 5,000 ms deadline measured from the action. Creating the guest identity, entering the queue, and polling all share that same deadline. A human found before the deadline keeps the server room and its existing Ready confirmation. Otherwise the local practice bot starts. Bots never enter a human room, reserve server coins, or receive human leaderboard points.

The search controller retains late queue responses long enough to leave their rooms. It ignores late human snapshots after cancellation or fallback. When guest creation finishes after the deadline, its active-search check prevents a late queue request. Cleanup clears all search timers and is idempotent.

Quick play defaults to zero stake. The optional chosen-stake search uses the same five-second deadline; its bot fallback always has zero stake. Private friend rooms remain human-only because the invitation is intended for a particular person.

Email is unnecessary. Human play uses the shared `ensureGuest` client after explicit 18+ and beta-terms confirmation. Practice bots are immediately available without that server setup.

## Panel round 2: route intent and replay

- `initialFile?: string` selects the topic from a home action, overriding an older saved favourite. Generic navigation can omit it to retain the saved preference.
- `initialIntent?: 'play' | 'friend' | 'join'` defaults to `play`. Friend entry scrolls to and focuses Create room; join entry focuses the room-code field.
- Human results offer **Play again**, which starts a fresh five-second search using the completed match's topic. Existing bot rematch controls stay in the local room engine.
- Friend room creation and joining establish the guest identity directly. They do not require playing another match first.
- Unconfigured backend builds still reach the practice bot after the deadline. Their friend controls state that a shared server is required.
- Expired identity feedback opens the optional recovery screen with `jhk-profile-open`; it does not silently recheck an expired session.
- A late private-room response after leaving the screen is cleaned up instead of reopening the room.

## Verification

`node --test tests/jhk-match-search.test.mjs tests/jhk-online-client.test.mjs` exercises the real controller and transport with deterministic timers and delayed promises. Coverage includes the 4,999/5,000 ms boundary; one-shot fallback; a human arriving before the deadline; cancellation; delayed queue and snapshot responses; network failure; slow identity creation; an unconfigured backend; optional-email identity creation; and concurrent guest creation deduplication.

`node node_modules/typescript/bin/tsc --noEmit` validates the component and its arena callback interface.

Browser review should confirm the visible bot label, the selected topic, no required email modal, the Cancel search action, and direct friend/join focus on both design variants. Frontend behavior does not establish that the optional-email Supabase migration has been deployed; backend deployment is verified separately.
