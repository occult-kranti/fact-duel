# Obsidian polish: runtime and accessibility QA

This log records source inspection, local assertions and managed-browser observations. It does not establish retention, conversion, customer satisfaction or real-device frame-rate improvements. Review perspectives are AI-assisted, not human usability-study participants.

## Round 1 — runtime boundaries and stress accounting

Executed `node docs/obsidian-polish/qa-stress.mjs` against the production outcome helper, preferences module and cricket audio source. The audio graph uses instrumented Web Audio, timer and document doubles; no browser or network operations occur in this command.

| Check | Executed result |
| --- | --- |
| 1,000 settled outcome classifications plus unfinished-result suppression | All assertions passed |
| 2,001 gate claims: 1,000 new IDs, 1,000 repeat IDs, then the first ID again | Exactly 512 first claims accepted, the configured cap; all 1,000 repeats rejected; first ID remained rejected after capacity was reached |
| 1,000 public motion-setting transitions | Full, reduced and off round-tripped correctly; exactly 1,000 preference notifications |
| Volume values below zero, above one, valid fractional, NaN and Infinity | Clamping/default assertions passed for all five cases |
| 100 audio cue replacements across all four cricket outcomes | 1,575 nodes created and 1,575 disconnected; at most 22 live nodes per cue |
| Cleanup by explicit stop, mute, tab hide and timer expiry; repeated stop calls | Zero remaining graph nodes, preference subscribers, visibility listeners or timers after every iteration |
| Muted, zero-volume, hidden-document and suspended-context playback | No new audio nodes allocated in any of the four blocked states |

One local run took 1.90 ms for helper assertions, 2.30 ms for preferences and 126.48 ms for all 100 audio-double iterations. These are local assertion timings, not mobile frame times or a benchmark comparison. The 100 cues allocated 9,120,000 temporary float samples in total; retained browser heap was not measured.

Source inspection confirmed cricket graphics use finite transforms/opacity, with no infinite animation, blur, backdrop filter or permanent `will-change` in their stylesheet. Their component schedules one animation frame and one bounded timer, and cancels/stops both on result replacement or unmount. The audio cue reuses the existing gesture-unlocked context, applies the current volume through its own gain and compressor, and disconnects its graph on mute, hidden tab, timeout or component cleanup.

Relative-luminance calculations for the existing paper card `#f7f1e6` measured title ink `#122c35` at 13.00:1, eyebrow `#356661` at 5.79:1, caption `#43575a` at 6.79:1 and Skip `#245b57` at 6.90:1. These use opaque source colours; final browser styles and other states require the managed-preview pass. The regression command `node --test tests/cricket-outcomes.test.mjs tests/cricket-prefs.test.mjs` also passed 6/6 in this review.

Cricket moments remain in completed result sections: practice passes `room.phase === 'complete'`; online guards `match.phase === 'finished'`; club fixtures guard own-team finished results and suppress no-contest/empty or abandoned fixtures. They are not mounted on timed-question answer controls. The result card stays deliberate warm paper in dark themes, following the visual owner's direction.

## Round 2 — independent shine policy review

Reviewed `app/obsidian-polish.css` independently of its visual owner. The selected navigation icon gets one 700 ms transform/opacity glint. The banner reflection changes background position over 550 ms only on keyboard focus within, or hover with a fine pointer. The latter can repaint the banner, so it is not described as a compositor-only effect. There is no continuous animation, answer-control transform, question-card selector or pointer-intercepting decorative layer. Opaque base colours remain when backdrop-filter is unsupported; blur is limited to navigation and the header. Their real-device compositing cost remains unmeasured.

Source inspection of `AppShell` confirmed navigation is not rendered while `inRoom` is true. Question answer targets remain stationary. The new navigation focus outline has a separate solid colour and is not covered by the glint.

One motion blocker was found and sent to the visual owner: the initial OS reduced-motion rule had lower selector specificity than the glint's animation declaration. The visual owner added `animation: none !important`; the changed source was independently re-read and the blocker is resolved. Saved off/reduced settings already used the same important suppression. Global theme files remain owned by the visual implementation role; this QA lane did not edit them.

## Round 3 — managed preview verification

Used the parent's managed preview at `http://terminal.local:4173/club-ui-qa/` through CUA only. The fixture uses the actual `CricketOutcomeMoment` and `FxProvider`, with synthetic results and no network match operations.

| Browser check | Observed result |
| --- | --- |
| Public motion setter, effects off | Initial fixture inspection exposed a missing fixture-to-root attribute sync: prefs were off but `data-motion` was absent and banner transition was 0.55 s. A central fixture `MotionRoot` now mirrors the actual arena's attribute synchronization. Recheck: `data-motion="off"`, computed banner transition `0s` |
| Public motion setter, reduced | `data-motion="reduced"`, computed banner transition `0s` |
| Public motion setter, full | `data-motion="full"`, computed banner transition `0.55s` |
| 100 actual React receipt replacements | Visible counters reached 100/100. The control uses `flushSync` for one committed receipt update per step, rotates evenly across four outcomes and waits two animation frames between steps, rather than batching 100 state writes into one render |
| Scene count and primary result actions | Exactly one cricket moment remained after 100 updates; Replay and Share stayed enabled. Replay was clicked successfully during the run |
| Result replacement with cancellation | The next cancelled receipt removed the moment: zero matching scene elements |
| Sound preference after stress | Restored to its original on setting. Concurrent identity QA changed the shared sound preference during the run, so browser auditory behavior is not claimed as an isolated 100-cue test |
| Frozen bundle, 390-pixel mobile iframe | Result card width 358 px, right edge x=374 inside the 390 px viewport; no horizontal card overflow |
| Frozen mobile bundle, reduced motion | Root attribute `reduced`, ball computed `animation-name: none`, Skip hidden; Replay clicked successfully |
| Frozen mobile bundle, full motion and Skip | Full motion restored through the real setter; Skip clicked successfully; its target measured 44 × 44 px and became hidden after the click |

The intentionally frame-paced run took 158,861 ms in the shared managed browser. This duration includes pacing and browser scheduling; it is not a frame-rate benchmark, a real-device measurement, a completed-match simulation or evidence of improved performance. Audio cleanup accounting remains the separate instrumented local test above. OS-level reduced motion was verified by source specificity inspection after the fix; this browser pass exercised saved in-game settings, not OS emulation.

The mobile checks above ran after the UI owner's single frozen bundle containing the separate public-label correction. Runtime/accessibility review is closed for the shine and cricket-FX scope, with the OS-source and device-performance limits stated above. No production FX change was required. No profile creation, account consent, external posting or publication was part of this QA.
