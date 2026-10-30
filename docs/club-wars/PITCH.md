# JHK club release pitch

Updated 30 October 2026. Owner: panel seat 6, growth, marketing and presentation. This is a product pitch and validation plan, with an editable 14-slide PowerPoint and matching responsive web presentation. It replaces the historical FACT//DUEL fundraising narrative with the current JHK club direction.

Published source: `public/product/investor/deck.site.html`; the Pages assembler copies it to `/deck/`. The deck download retains the established `factduel-seed-deck.pptx` URL so existing links continue to work. Product copy, speaker notes and a source ledger are in `deck.md` and `deck-plan.json`.

## Positioning and evidence

JHK offers short cricket trivia overs and club rivalries designed for a mobile audience. The intended audience—cricket fans seeking short play with friends—is an audience hypothesis, not a claim from completed user research.

The release narrative covers Mini over — 3 rounds, Full over — 6 rounds, a 22-member club with playing 5 or 11, preparation-only reserve selection, functional roles separate from cosmetic badges,23h preparation and24h battle, team fixtures, four-team cups, cricket result art and sharing. Captain and VC match permissions differ from the Coach’s limited lineup authority. Bottle boy and other fun badges are opt-in, permission-free and self-removable.

Both captains must opt in to weekly recurrence, which is off by default. The home side sends and the away side accepts a fresh draft. New lineups require confirmation; nobody is automatically enrolled. Both current lineups can be marked ready to end preparation and start battle early; a lineup change invalidates that side’s readiness. Existing active fixtures retain their original deadline. The server is authoritative.

The slides label validation and season work separately. They make no measured traction, revenue, retention, market-size, monetization, legal clearance or funding claim. Larger leagues, richer cosmetic systems, season ladders, notification orchestration and scale investment remain roadmap work. Exact XP and simulated-coin return rules belong to the actual game receipt and server; the pitch does not invent values or imply cash returns.

Primary inspiration references are linked in the HTML sources and PowerPoint speaker notes:

- [CoC regular wars](https://support.supercell.com/clash-of-clans/en/articles/about-clan-wars-2.html):23h preparation,24h battle and selected lineups.
- [CoC league preparation](https://support.supercell.com/clash-of-clans/en/articles/cwl-week-of-wars.html): preparation-stage lineup changes.
- [CoC role reference](https://sc-clashofclans.zendesk.com/hc/en-us/articles/49529121959323-Clan-Roles): role powers as a structural reference; JHK permissions differ.
- [Player motivation research](https://repository.essex.ac.uk/7228/): autonomy, competence and relatedness as a design reference. This does not establish JHK retention.

Original JHK artwork is used throughout. `public/art/cricket-outcomes.webp` is the new original bat, wicket and run-out triptych. No Supercell artwork, logos, screenshots or branded presentation assets are used.

## Three review rounds

| Round | Review and evidence | Correction and result |
| --- | --- | --- |
|1 — Source audit | Imported and rendered the existing 26-slide PPTX; inspected the historical plan, market assumptions and fundraising appendices. The prior deck mixed an older bot-only product, monetization assumptions, legal statements and stale evidence with the product pitch. | Replaced it with 14 slides about the actual club direction, a clear pilot and an explicit season roadmap. Historical research files remain historical and are not cited as current product evidence. |
|2 — Product and claims review | Server owner confirmed22/5/11,23/24, limited Coach authority, preparation-only reserves and fresh weekly consent. Research panel seat reviewed the deck’s source mapping and separation of roadmap from release. Moderator checked actual navigation and published play destination. | Corrected the mobile navigation to Play, Teams, Explore, My club and Answers; identified My club as the personal progress destination. Corrected the Play link to `/fact-duel/`. Kept23/24 and made fresh home-send/away-accept consent explicit in notes. No invented performance claims remain. |
|3 — Visual and artifact review | Inspected every rendered slide and tested web widths 390px and 1440px. Passed native table, package integrity, font policy, heading geometry and ArtifactTool reimport checks. | Replaced a cropped outcome image with the full triptych; removed a legacy coin illustration from the sharing story; shortened the close; widened the roadmap table and separated table footers to remove overflow warnings. Final structural/layout report has 0 findings and 0 warnings. |

Panel seat 6 accepts this pitch for the scoped release. This records a design review, not external customer testing or a prediction that the retention hypothesis is proven.

## Verification record

- 14 slides, all narrative text editable; native PowerPoint tables on slides 3, 6, 12 and 13. No data chart is presented because there is no measured product dataset to plot.
- Source canvas preserved: 12191695×6858000 EMU, approximately 1280×720 CSS pixels.
- DejaVu Sans is an installed font used for the editable PowerPoint. The web uses the product’s local Instrument Sans file.
- Final PowerPoint: 1,381,655 bytes; SHA-256 `76d9f12b11609b1484290431cfd16d112f5df97aac528cf47c3a2da722b4c8d3`.
- Finalizer passed package integrity, geometry, declared fonts, native tables and first-party PPTX reimport. No native PowerPoint or Google Slides application test is claimed.
- The final exported PPTX was imported again and all 14 slides rendered for visual inspection. Structural validation alone is not a claim that the presentation will render identically in every office application.
- Responsive deck check at 390px and 1440px: document width equals viewport width, 14 slides, all images decode, local font loads, no page JavaScript errors and no failing HTTP responses. Wide tables scroll inside their labelled container on mobile.

## Regeneration

`scripts/club-pitch-deck.mjs` is the current authoring source. It writes the plan, Markdown and both web versions, imports an existing PowerPoint, rebuilds its slide content with ArtifactTool, and stages an editable PPTX candidate. `--web-only` updates only the published web/text sources. `JHK_DECK_SOURCE` and `JHK_DECK_WORK` override the input and private staging directory. Runtime dependencies come from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

The candidate must pass the Presentations skill’s `finalizePresentation` workflow before replacing the published PPTX. Preserve an unchanged source copy, use a separate candidate and final path, declare native tables on slides 3/6/12/13, preserve the source canvas, and use a fresh validation receipt. Render and inspect every final slide after export. The historical `scripts/investor-deck.py` and `scripts/investor-deck-html.mjs` are not the authoring path for the new schema.

## Next evidence to collect

Observe a first-time player’s first over, a Captain’s first fixture, a Coach’s permitted lineup change and a reserve’s entry into a future lineup. Measure completion and confusion with cohort denominators. Test whether public scorecards lead to a first completed over and whether both captains voluntarily choose a second fixture. Track reminder opt-outs, excluded reserves, privacy complaints and missed battle windows alongside any return measure. Decide the season investment after this evidence exists.
