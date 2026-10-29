# Stadium redesign: independent flow and mobile review

Review baseline: `71c017e1b31c17c6bf4b43b601395830d5dd294e` (Gully Club). This is an independent AI engineering/design review, not observed participant research. Round 1 below is based on source inspection; browser observations are recorded separately after the implemented candidate is ready.

## Round 1: source assessment

| Finding and evidence | User/task impact | Decision and acceptance | Owner |
| --- | --- | --- | --- |
| `home-screen.tsx` contains a very large editorial headline, two primary-stack actions, a separate image and a match explainer. The primary practice action is one tap. | The first interaction is efficient, but the visual experience is a poster rather than a stadium. More visual layers must not displace the first action below the phone fold. | Replace the world with day/night stadium art; retain one-click practice and clear practice identity at 320×568, 390×844 and short landscape. | Root + visual squad |
| `QuestionStage` keeps answer order stable, reveals through the double-animation-frame marker, locks synchronously and moves keyboard focus to status. | These are valuable gameplay guarantees. An animated foreground or a delayed lock could spoil timed reading and create double answers. | Keep four stable answers and synchronous locking; reserve physical ball/wicket animation for optional play or the settled result. Verify keyboard and repeated taps. | Root + visual squad |
| The `quickDuel` opening path sets `difficulty: simple`; basic rules can also be served through catalogue/custom play because they live in the central bank. | Removing a visible topic chip would not fulfil the user's request to remove elementary rules questions. | Retire elementary law/how-to items at the served-bank boundary; preserve archived source records and substantive cricket history. Spicy must reach a real question in one tap. | Content squad + root |
| `player-screen.tsx` groups the existing locker in a closed native disclosure. Existing `progression.mjs` states its cosmetics are earned, while the coin economy is separate. | A hidden locker does not establish the requested social identity/show-off loop. Adding another ambiguous currency could confuse players. | Show a concise equipped identity card, clearly named free local points and expiry. Put purchases/equipment in a scannable collection surface. Test insufficient balance, rapid repeat purchase, persistence and expired badge behavior. | Collectibles squad |
| Home source has no authoritative online-population statistic. | A prominent invented count would falsely imply available human opponents. | Use the actual connection/search state; show a population number only if an authoritative endpoint supplies it. Keep practice and human actions distinct. | Root |
| Current room has explicit live/lobby/finish stages. `RoomScreen` keeps result feedback mounted for 1.9 seconds and then advances safely. | Unbounded sledge animations could obstruct answers or become spam. | Fixed playful reactions, cooldown, mute, truthful delivery status and no overlays over live options. | Banter squad |

## Browser acceptance protocol

`scripts/stadium-browser-check.mjs` owns a Vite server and Chromium in the same process. It writes observed results, runtime failures, request counts and screenshots under `docs/stadium-redesign/verification/`. Browser viewport emulation is not physical phone testing.

The first candidate pass batches day/night captures and behavior checks; defects are returned to their owners. A second pass confirms the corrected candidate. Checks target responsive fit, touch controls, primary action availability, one-tap ordinary and Spicy play, atomic answer locking, reduced motion, optional pitch physics, collection spending/persistence/expiry, reaction controls, unavailable storage, missing art/offline-after-load, localized and enlarged text, and inactive ads. Exact coverage and results will be appended after execution.

## Round 2: implemented candidate

The first implemented-candidate browser pass produced 73 checks: 72 passed, with no browser runtime errors or ad requests. The single failed assertion read state immediately after clicking a native `details` summary; the browser queues `toggle`, so the runner now waits for the observable reset before asserting it. This is an assertion timing correction, not evidence that a UI defect was fixed.

Material findings and changes from the combined source/screenshot review:

| Finding | Evidence | Implemented correction |
| --- | --- | --- |
| Spicy's platform emoji was a missing-glyph rectangle in Chromium. | `verification/pass1/day-home-390.png` and desktop capture. | Root replaced it with an owned SVG illustration, removing platform emoji dependence. |
| Daytime club headings and controls used pale fallback colors. | `verification/pass1/club-empty-390.png`. The initial Vite server started before the collectibles squad's corrected stylesheet and had watch/HMR disabled. | Collectibles stylesheet now resolves the app's actual `--text`, `--muted`, and `--line`; confirmation uses a fresh server and contrast assertions in both themes. |
| On narrow screens, repeated match-format copy consumed reading space. | `verification/pass1/question-320.png` and source `DuelHUD`/room chrome. | Root removed redundant mode/subtitle/keyboard hints on phones and compacted the format line while preserving the question, answer targets, round position and timer. |
| The player's supplied name was not initially passed to the new club card. | `arena.tsx` mount inspection. | Root passes the same name used by the home into `StadiumLocker`, so the card and copied status match. |
| Full-page captures after browser auto-scroll placed fixed chrome across the middle of the exported image. | Initial nets/earned-club captures. | The capture helper scrolls to the page top before export. This corrects screenshot composition; it is not a UI change. |

Observed first-pass behavior already included real play earning 66 Club points, a 45-point title purchase despite 12 simultaneous button clicks, a persisted 21-point balance without another reward, automatic removal of a genuinely earned badge after its 24-hour window, reduced-motion timing practice, motion-off interruption, rate-limited bot banter, persisted mute, and disappearance of banter during the next timed round. The initial candidate fit all four viewport widths, and ordinary/Spicy matches began with one action. The confirmation pass below supersedes the first-pass screenshots and assertion result.

### Confirmation

The fresh-server confirmation passed **75 of 75 checks**, with **zero runtime errors, zero scenario exceptions and zero advertising requests**. Exact results: [`verification/pass2/browser-checks.json`](verification/pass2/browser-checks.json). Day/night club heading contrast was measured at 12.86:1 and 16.05:1 respectively; these are specific element measurements, not a whole-product accessibility certification.

The final screenshot set confirms the original stadium artwork in both themes, a primary start control visible without scrolling at every tested viewport, the repaired chilli graphic, readable day/night shop controls, a narrower live-question header, the equipped title/point balance on 320px, and playable net practice. Representative artifacts:

- [Daytime home, 390px](verification/pass2/day-home-390.png) and [night home, 390px](verification/pass2/night-home-390.png)
- [Live question, 320px](verification/pass2/question-320.png) and [Spicy question, 390px](verification/pass2/spicy-question-390.png)
- [Day club](verification/pass2/club-empty-390.png), [night club](verification/pass2/club-night-390.png) and [earned/equipped club, 320px](verification/pass2/club-earned-320.png)
- [Reduced-motion net practice](verification/pass2/nets-reduced-390.png)

During the final record check, the test helper was found to assume the source-bank answer index survived the game's option shuffle. It now selects the source answer by its rendered text. This was a test-fixture correction, not a game defect: both full passes already checked the actual earned balance, a single 45-point debit, persistence and expiry. Pass 2's observed balance was 63 earned → 18 remaining; the earlier pass happened to earn 66 → 21. A narrowly targeted behavioral rerun of the collection scenario (with screenshots disabled) passed all **15 checks** and verifies the corrected helper, without adding a third visual-design round. Its [machine-readable results](verification/collection-behavior/browser-checks.json) also record zero errors and zero ad requests.

Browser coverage is mobile emulation and automated interaction, not physical Android/iPhone, screen-reader participant testing, a full WCAG audit or a live human concurrency test. Server reaction-authority and content tests are owned by the corresponding squads and reported separately.
