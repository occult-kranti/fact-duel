# Obsidian polish — independent product and visual review

30 October 2026. Owner: independent growth, marketing and artifact-coherence critic. Scope is the requested mobile polish, club theme choices, public tag prefixes and challenge copy. This reviewer changes no application code and does not publish. Three bounded rounds are recorded below; an open round is not a release approval.

## Product truth and intended audience

JHK remains a mobile cricket trivia game with optional friend and club rivalry. The working audience hypothesis is cricket fans comfortable with Roman Hinglish who want a short session or a challenge with friends. The project has not established a representative age, location, language preference, satisfaction score or retention lift through user research. Competitive voice is appropriate in the invitation; errors, permissions, privacy, loss feedback and deadlines need literal, respectful wording.

Keep the primary action understandable to a first-time player: Play Mini over, 3 rounds, the actual completion XP condition, and free bot practice without signup. The proposed “Cricket ka expert?”, “Gyaan hai? / Game dikha.” and “Baaton se nahi. Jawabon se.” are original copy directions, not tested audience findings. A headline is not a promise of a win, score, reward or live opponent.

Club colour is cosmetic identity. App day/night appearance is a personal reading preference. Public tags identify membership; they are not private invites, account credentials or part of the stored nickname. These distinctions must survive the visual polish and shared-card copy.

## Round 1 — Incumbent audit and direction

Reviewed PRODUCT.md, DESIGN.md, the current HomeScreen, top bar, five-tab navigation, team banner and mobile theme rules. Rendered the existing production build at 320×844, 390×844 and 1440×844 in both day and night, with reduced motion. The build is the previous release; it is baseline evidence, not verification of the new polish.

| Baseline observation | Evidence | Implication for the polish |
| --- | --- | --- |
| First useful action is already reachable | Mini over top/bottom: 364.5/433.5px at 320px; 345.25/416.22px at 390px | Preserve this hierarchy when the new headline and material are added. |
| Main chrome already has usable tap geometry | Theme, mute and settings measure at least 44×44px; each mobile tab is 57px high | Retain these hit areas. A smaller glyph need not mean a smaller control. |
| Current pages fit the viewport | Document widths equal 320, 390 and 1440px in both worlds | New gloss, long prefixes and enlarged text must not introduce horizontal page scrolling. |
| Hero currently carries a long English headline over art | At 320px it needs three display lines; literal play and bot disclosures remain below | The shorter Hinglish headline can strengthen the first view, provided text stays independent of reflections. |
| Existing tag and role rules are separate | Public team tag is generated; private invite is a separate field; cosmetic tags have no role powers | A nickname prefix must remain display-only and use current authoritative membership. |

Blocking findings at this round: **none in the incumbent first-screen geometry**. The new direction is accepted for implementation with three concrete confirmation checks:

1. Review the longest valid public prefix plus nickname/team name at 320px and enlarged text. Keep action labels and full identity available even when compact chrome truncates a label.
2. Compare all club palettes in day and night. Gloss and the small finite glint must stay pointerless and outside timed answer states; text, focus and selected state must remain readable without them.
3. Keep the plain Mini/Full length, XP condition and bot/no-signup disclosure next to the competitive Hinglish invitation. Club theme scope and save authority must be explicit; a preview must not imply a saved change.

The canvas owner’s proposed treatment—warm paper by day, dark navigation/banner, a restrained inset specular edge, and a finite 0.7-second selected-icon glint—fits this scope. No extra feature is requested by this review.

## Round 2 — Implemented screens

Reviewed the managed production preview at `http://terminal.local:4173/responsive.html`: 390×844 and 320×640 frames, day and night, including Home and Teams entry. The short Hinglish hero fits, Mini and Full retain their correct 3/6 counts and dynamic completion XP, the completion condition remains beside the controls, and bot/no-signup remains explicit. A zero recent-human count is labelled as recent activity, not available opponents. The five tabs remain readable and 57px high. Compact theme, mute and settings are 44×44px. Inner document client/scroll widths are 375/375 and 305/305; the 15px difference from the named frames is the browser's vertical scrollbar.

Read `obsidian-polish.css`, `club-accent.css` and the display identity helper. The reflection is a background layer. The only glint pseudo-element is pointerless and lasts one 700ms iteration. The source suppresses it for saved off/reduced and OS reduced motion; answer, clock and question selectors are absent. Focus uses an independent solid outline. Backdrop blur is limited to header/navigation with an opaque fallback; real-device compositing cost is not claimed.

The actual identity fixture uses Topbar, TeamIdentity and shared club-theme helpers with a synthetic 24-character nickname and valid nine-character public tag. At 100%, compact labels fit and the full identity remains in accessible text. Changing a fixture palette does not change its printed unchanged nickname.

**One blocking finding:** compact identity at 200% text with Blue/night reported `clientWidth=305` and `scrollWidth=495`; the prefix crowded the theme control. The preview was refreshed while tracing, resetting the controls to 100%/day/teal, so the later 305/305 reading does not resolve the 200% finding. The UI owner owns the fix. The release owner is freezing one final QA build before confirmation. No other independent blocker was raised in this round.

The research perspective separately found a day-palette foreground mismatch in the team CTA/pin styles; that correction is owned by the visual implementer and its final result belongs in the shared release gate. Do not infer whole-product colour compliance from safe seed tokens.

## Round 3 — Confirmation

The UI owner froze the final harness after correcting the result-row minimum width and the visually hidden punctuation origin. Reloaded that build and independently selected Blue, night floodlights and the fixture’s 200% text scale in the compact frame. The original overflow is resolved: `clientWidth=305`, `scrollWidth=305`.

| Final independent observation | Executed evidence |
| --- | --- |
| Full public identity stays available | The brand link's accessible label contains `#TST1-ABCD NandiniBoundaryChampionX`; the stored nickname printed below remains unchanged. Compact chrome shortens the visual label while the banner provides the full tag and wrapping team name. |
| Header controls remain usable at 200% | Brand 119.08×52.83px; theme 44×45.13px; mute 44×44px; settings 44×44px. Their right edges are 147.08, 197.08, 245.08 and 293.08px, all within the 305px content width. |
| Keyboard focus is visible | Tab from the theme control focused Mute. The actual outline is solid 3px mint `rgb(141,222,211)` and is visibly separated from the dark surface; it fits without crowding Settings. |
| Corrected night foreground | The Blue/night Team action sample computes ink `rgb(18,44,53)` on light blue `rgb(173,211,255)`. |
| Corrected day foreground | The Berry/day production Home and Team action samples compute white on berry `rgb(142,56,99)`. |
| Palette changes use atomic text/fill pairs | The inspected production Home and Team sample transition property is `transform, box-shadow`; colour/background are not independently interpolated. This closes the foreground integration concern without changing answer or eligibility rules. |

The UI owner separately reports all ten palette/no-club × lighting cases at the fixture's 200% text scale, and the research owner records the contrast calculations. Those wider reports are corroborating evidence, not extra cases executed by this critic. The release owner separately confirmed the actual lazy-loaded creation banner receives the material gradients. The 200% fixture is a controlled text-scale test; it is not a claim of physical-phone or browser-zoom testing.

**Final result: the one independent round-2 blocker is closed; no open blocker remains in this review's bounded scope.** The obsidian material, mobile hierarchy, competitive entry copy and public display identity are accepted for the scoped release. Stop visual polishing here. This critic did not complete a live practice match or create an online account; question-state motion exclusion was reviewed in source. Publication and production smoke evidence remain owned by the release owner.

These are AI-assisted design and runtime observations, not a human panel, customer unanimity, measured satisfaction, conversion, retained players or a device-performance/load benchmark.

## Artifact coherence

The current 14-slide product pitch states the roster, playing formats, clocks, roles, fresh weekly consent and validation roadmap. It does not promise an immutable colour palette or specific home headline. Daytime paper remains part of the chosen direction, so the existing pitch is still coherent. No PowerPoint rebuild is needed unless an actual public product claim changes. The editable canvas and design documentation should describe the new material and theme scope after the implementation is confirmed.
