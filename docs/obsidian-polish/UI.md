# Public club identity review

AI panel role: mobile interaction and public identity. This records three review rounds and observed verification, not a claim of human usability research.

## Round 1 — consistency and scope

Public club tags were shown separately beneath a banner or logo, while most player labels showed only a nickname. The implementation now uses one `TeamIdentity` component for the top bar, online score labels, waiting opponent, round results, leaderboard labels, server player card and club banner. The public tag comes before the human name. It is text, not another pill or button.

The display helper accepts only the generated public tag pattern. Private invitation codes, recovery strings, URLs and arbitrary labels cannot become prefixes. Nicknames remain unchanged. Missing tags produce a plain name; an explicitly null server tag does not invent membership. The backend owner supplies public opponent membership separately.

## Round 2 — implementation and issues resolved

- A long visual name can shorten with an ellipsis while its full text remains in the DOM. The top bar's accessible link label also contains the complete tag and nickname.
- The 320-pixel top bar stacks the compact prefix and name within its existing space. Theme, sound and settings retain their own controls.
- The banner puts its public tag before the club name and keeps bright prefix text on its dark surface.
- Online score tracks and result-row identities use explicit zero minimum widths. This prevents long prefixes and names from expanding a mobile grid or flex row.
- Hidden accessibility punctuation has an explicit top/left origin. Its former static absolute position caused a five-pixel document overflow at enlarged text size.
- Team primary actions, entry pins and lineup text selection now consume the semantic fill/foreground pair. Team button hover keeps that pair.
- Colour transitions no longer interpolate an old button fill against a newly switched foreground. Home and Team button transitions retain geometry and shadow only. This was verified during rapid palette changes, including clearing the club palette.

The existing role, lineup, invitation and gameplay permissions remain unchanged.

## Round 3 — observed checks

The managed CUA preview used actual `Topbar`, `TeamIdentity`, `TeamBanner`, production styles and the shared club theme helper. Its local fixture used the 24-character nickname `NandiniBoundaryChampionX` and nine-character public tag `TST1-ABCD`. The buttons used real Home/Teams/Live classes and were clearly labelled local style samples; they did not start games. No accounts were created and no terms were accepted.

Both 390- and 320-pixel views were inspected. At 320 pixels and 200% text, all ten palette/lighting states measured document client width 305 and scroll width 305, allowing for the vertical scrollbar. The enlarged top bar kept its theme, sound and settings controls within the viewport; they measured at least 44 pixels high. The full public tag and nickname remained available in the accessible label.

Measured foreground/background contrast was identical for the three production CTA style samples in each state:

| Club palette | Day | Night | Bright art accent, both themes |
| --- | ---: | ---: | --- |
| Teal | 4.85:1 | 9.11:1 | `#8cdbc9` |
| Saffron | 8.82:1 | 9.73:1 | `#ffca7a` |
| Berry | 7.25:1 | 7.79:1 | `#ecaacd` |
| Blue | 6.40:1 | 9.42:1 | `#add3ff` |
| No club | 8.82:1 | 8.82:1 | Default `#ffbd59` |

`--ps-lime` matched the bright art accent, preserving legibility on dark hero artwork independently of a dark daytime button fill. Selecting No club removed the club palette attribute and returned the default accent.

Keyboard review at 320 pixels, 200% text and blue floodlights reached theme, sound and settings in order. Each had a visible three-pixel outline. Enter on settings reached the local settings callback. The callback was a fixture observation, not a claim that the fixture opened the real settings sheet.

TypeScript `--noEmit` passed. Three identity helper tests passed, including private-code rejection and unchanged multilingual nicknames; the six existing club UI state tests also passed. The shared component passed scoped lint. The pre-existing top-bar root anchor continues to trigger the repository's Next Link lint rule; its single-page navigation behavior was retained.

The separate FX review records the 100-receipt stress check and motion behavior. Physical-device performance, representative human usability and retention effects remain outside these local checks.
