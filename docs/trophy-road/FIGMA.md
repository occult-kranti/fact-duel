# Trophy Road — design work and Figma handoff

Design work dated 29 October 2026. The actual sequence is **one native Figma round, followed by two native Excalidraw rounds**. Figma's account quota blocked continuation after the first round; three completed Figma rounds are not claimed.

[Open the new Figma architecture board](https://www.figma.com/design/IzTCUwu6pjverrdSo0AqC0?node-id=9-37). The previous [Pocket Stadium board](https://www.figma.com/design/IzTCUwu6pjverrdSo0AqC0?node-id=2-2) was preserved.

## Connection and resource check

The authorized **Primary** connection created a fresh task session in the existing file. The new page is `9:36`, **Trophy Road / three design rounds**; its Round 1 board is `9:37`. Session ID: `a2b00d42-c4b2-4191-8748-9fe21afe5393`.

Existing resources were inspected before design work. The connected file has subscribed team, Material 3, Simple Design System and Apple UI libraries. Searches across those libraries returned no matching trophy-progression or locked-level components. Generic Material surface variables and a Simple Design System heading style did exist. The existing bespoke Pocket Stadium components were the appropriate visual match and were reused: primary action `2:7`, answer `2:10`, navigation `2:13`. There are no repository Code Connect mappings. Bricolage Grotesque, Instrument Sans and JetBrains Mono were available and loaded.

After the successful Round 1 mutation, the screenshot request returned: **“You've reached the Figma MCP tool call limit on the Starter plan.”** The prescribed `whoami` diagnostic confirmed the Primary team is on Starter with a View seat. No other account was silently substituted, no paid upgrade was initiated, and no additional login was requested. This is a service quota limitation, not a code failure. See Figma's [rate-limit and access documentation](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/).

The local fallback uses the already installed [Excalidraw](https://github.com/excalidraw/excalidraw), package `@excalidraw/excalidraw` **0.18.1**, MIT license. The editor and its exports ran locally without an account. This verifies a working open-source local design editor; it does **not** establish that Figma itself runs locally or offline.

## Three changed design rounds

| Round | Actual tool and artifact | Changes made | Review that drove the next step |
| --- | --- | --- | --- |
| 1 — architecture | Native Figma board `9:37`; six 390 × 844 frames; [mutation receipt](design/figma-round-1-receipt.json) records 175 created IDs, including the new page and component-instance children | One-tap home, trophy levels at 0/60/180, Riverside unlock, Chase question, Crown mode introduction, earned reward. Existing native control components reused. Art areas remain placeholders. | Structural critique: disconnected level cards need a continuous path; active gameplay should lose global navigation; Crown needs an actual question state; progress scope and the final trophy formula need clearer labels. A screenshot was requested but blocked by quota, so no visual pass is claimed for this Figma board. |
| 2 — visual and flow revision | [Editable Excalidraw scene](design/round-2.excalidraw), [SVG](design/round-2.svg), [rendered board](design/round-2-board.png), [editor screenshot](design/round-2-editor.png), [render record](design/round-2-render.json) | Replaced isolated cards with a connected route; added an actionable locked Crown preview; removed global navigation from timed questions; created a real Superover question state. Imported all three second-round generated arena artworks. The 204-element scene contains 141 editable text layers and six placed art instances. | The actual rendered export was inspected. The Superover headline overflowed. AI review also identified that “Play to unlock” can imply immediate Crown access, that Practice 62 + Human 44 can imply 106 total, and that “played” should say “answered” because timeouts earn zero. |
| 3 — correction and handoff | [Editable Excalidraw scene](design/round-3.excalidraw), [SVG](design/round-3.svg), [rendered board](design/round-3-board.png), [editor screenshot](design/round-3-editor.png), [render record](design/round-3-render.json) | Final arena assets; shorter Superover heading; canonical Riverside Park naming; selected-ground home CTA explicitly starts The Chase; classic remains available; locked Crown CTA starts the currently playable Chase; remaining trophies and higher-record scope are explicit; reward arithmetic distinguishes answered and correct rounds. Ledger controls grow to 44px. | The final 208-element scene contains 145 editable text layers and six art instances. Chromium rendered the actual local editor and SVG with no page errors. The final export was visually inspected. [Native text-bounds check](design/round-3-bounds.json) reports zero right/bottom overflow across six phones, including the corrected Superover title. Runtime app verification belongs to the implementation's test record; these are design artifacts, not a claim of interactive app parity. |

The review observations are AI design critiques and source-informed design judgments. They are not recruited focus-group results, user telemetry, or a claim of measured conversion improvement. Public-player feedback and research are recorded separately by the research workstream.

## Final screen and interaction specification

| Surface | Visible state | Intended action |
| --- | --- | --- |
| Home | Current earned ground, selected mode, separate progress records, one dominant play action | One tap starts the selected unlocked mode. At Riverside this is **Play The Chase**. Classic remains a secondary action. |
| Trophy Road | Continuous 0 → 60 → 180 journey with available, current and locked states | Home → Road → Play is two taps. A locked ground opens a preview instead of starting a gated game. |
| Crown preview | Six-question Superover explanation, 62/180 record and 118 remaining | **Play Chase · earn trophies** starts the currently playable challenge. It never implies Crown is already available. |
| Chase | First to three correct, at most five questions, stable answer targets, visible score and clock | A single answer locks the choice. The practice bot replies 3–4 seconds after the player. No global navigation or ad placement interrupts the active question. |
| Superover | Six-ball rail; 15-second question; correct answers worth 6/4/2 runs based on response time | Under 5 seconds gives six; under 10 gives four; later correct answers give two. Question-bank inventory totals are absent; “ball 3 of 6” is match progress. |
| Earned result | Unlock art, record scope, +20 for five answered and +8 for four correct | One tap tries The Chase. Classic replay and Answers & sources remain visible secondary choices. |

Trophies are awarded at **4 per actually attempted, settled round plus 2 per correct answer**. Unanswered timeouts and unplayed rounds earn zero. There is no loss or decay, no purchase requirement, and no paid gameplay advantage. Unlocks use the higher of the practice and human records, never their sum. The separate records remain visible and interpretable. The design scene uses illustrative record values to explain the flow; the implementation must derive values from real state.

## Artwork and editable-layer boundary

All controls, labels, progress markers, connector lines, score rails, answer buttons, frames and annotations are editable native elements. The arena illustrations alone are raster layers. The Excalidraw files embed their three image assets and can be opened without broken external image links. Proportional fitting preserves the stadium/pitch geometry. Import derivatives are optimized for the design canvas; application assets remain separately managed by the art workstream.

Open either `.excalidraw` scene in the local editor or drag it into Excalidraw's canvas to edit individual elements. The SVG can be viewed directly or imported into another vector editor. [Asset provenance](design/asset-provenance.json) records the source files and hashes used by the two fallback rounds. The final sources are `public/art/arena-gully.webp`, `public/art/arena-riverside.webp` and `public/art/arena-crown.webp`.

Round 1 art critique separated the worlds by silhouette: Gully's broad banyan and warm lanes, Riverside's green dome and turquoise water, Crown's violet lights and gold roof points. Round 2 review requested warmer daylight around Gully, less foreground flower/boat noise at Riverside, and a larger visible pitch with a simpler Crown facade. The third art round applied those refinements before the final design import. These are original arena illustrations, not copies of Clash Royale's maps or UI.

The Figma board is the earlier architecture study and deliberately remains identifiable as Round 1. The final Excalidraw board is the authoritative visual handoff for this pass. The SVG export is a convenient view/import artifact; the `.excalidraw` file preserves the native scene. Typography in the fallback uses the editor's supported native sans-serif rather than asserting exact Figma font parity. The running application retains its product font system.

## Resume in Figma when access is available

1. Create a new Figma file session in the existing file and inspect page `9:36` without deleting the previous boards.
2. Reuse the existing native button and answer components, and build a Round 3 board from the final Excalidraw screen specification. Keep text and controls native.
3. Import only the final arena images as image fills; preserve their aspect ratio. Do not import a flattened full-screen image as the UI.
4. Copy the final trophy formula, scope, canonical names, mode labels and locked-preview actions exactly from implementation.
5. Obtain a fresh Figma screenshot and inspect the six screens, especially the Superover title and road-card labels. Until that happens, no Figma Round 2/3 completion or final Figma visual verification should be reported.
