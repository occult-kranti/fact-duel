# Curiosity Arcade: implementation art direction

FACT//DUEL should feel like a contemporary tabletop curiosity arcade: warm paper, printed tickets, tactile objects, and small collections of facts. The visual centerpiece is an original **Curiosity Press**, a friendly mechanical cabinet that appears to print knowledge cards. It combines a squat coral body, cream inset face, yellow side wheel, paper ticket slot, and an abstract split sphere. Avoid familiar licensed mascots, casino machinery, scientific-instrument accuracy claims, and collectible rarity language.

## Color and type

| Token | Value | Use |
|---|---|---|
| Paper | `#FFF6E4` | Main background and cards |
| Ink | `#231F2B` | Text, borders, primary dark controls |
| Coral | `#F36F56` | Start action, mechanical body, small emphasis |
| Yellow | `#F6C945` | Ticket tabs, progress accents, wheel |
| Plum | `#2B1736` | Optional dark background |
| Raised plum | `#3D2649` | Dark card surface |

Use ink on coral/yellow; use paper on ink/plum. Do not place white small text on coral. Theme selection is available from the start and does not require a cosmetic unlock. Validate the final rendered color pairs, including subdued text and focus rings.

Use the existing reliable font stack if available: a heavy, compact display treatment for “FACT//DUEL” and large editorial headings, a highly readable sans serif for prompts and explanations, and restrained tabular numerals for timer/counts. Avoid novelty type in answers. Keep small labels readable rather than tracking them into illegibility.

## Composition by context

- **Home:** an asymmetrical desktop composition with the heading and main action on the left, Curiosity Press on the right, then three format tickets. Passport sits immediately below the play area. On mobile, the artifact becomes a compact accent above the tickets; it must not push play below multiple screens.
- **Mode tickets:** perforated silhouette, one clear format name, an honest question bound, and a short benefit. Use Quick1 / Triple / Gauntlet5 as the recognizable labels. The selected state has an ink outline plus a text indicator.
- **Collection:** a finite grid of knowledge cards with stable numbering derived from the actual catalog and a small topic tab. Browse controls and facts remain HTML. An opened card reveals context and provenance; cosmetics never obscure them.
- **Results:** a paper receipt with the real result and local activity. One new-card stack is sufficient. No slot reels, random reveal suspense, pulsing reward button, or automatic rematch countdown.
- **Timed question:** flat paper or dark plum surface, stable four-answer grid, clear prompt hierarchy, visible timer and progress. The art system appears in typography, color, and border details; all decorative motion stops.

## Original 3D object

Build the Curiosity Press from simple repo-native geometry: bevelled box body, inset panel, shallow cylindrical wheel, a short paper strip, and a two-part sphere. Use a fixed three-quarter view, soft matte materials, one key light and modest fill. Fake the contact shadow with a lightweight shape where practical. The object is a brand artifact, not a UI dependency; buttons, mission text, and counts are independent DOM elements.

Start with project budgets of fewer than 25 draw calls, fewer than 20,000 triangles, no postprocessing, no real-time shadow map, and device pixel ratio capped at 1.5. These are proposed budgets to measure, not documented guarantees or universal thresholds. Lazy-load the decorative scene, preserve its layout box while loading, and show a matching static illustration when WebGL2 is unavailable or initialization fails. Current Three.js documents WebGL2 use, renderer metrics, pixel-ratio control, and disposal. [Three.js renderer reference](https://threejs.org/docs/pages/WebGLRenderer.html)

## Motion and state language

The default scene rests still. A deliberate optional “Turn object” control may trigger one short movement and then settle; it grants no progression. Stamps appear with a brief opacity change. Hover/focus may change color and border without displacing content. Reduced motion removes rotation, positional transitions, card flips, and parallax; the same state change appears immediately. Respect the system preference and allow a persistent user setting. [W3C interaction-animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

Use collected-looking objects to represent actual activity: an empty stamp outline before completion, a dated local stamp afterward, a source tab on a readable card. Cosmetic states are **Locked / Unlocked / Equipped**. Knowledge activity states are independent **Encountered / Opened / Recall tried** badges. Never use wear, shine, rarity, or card level to imply measured expertise.

The visual acceptance check is simple: Home looks distinctive; results feel complete; collections invite inspection; the timer and four answers are easier to read than any decoration. Test mobile layout, both themes, reduced motion, keyboard focus, loading, empty collection, completed Passports, and static fallback.
