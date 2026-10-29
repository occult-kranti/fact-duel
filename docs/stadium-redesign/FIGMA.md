# Pocket Stadium Figma design

Created and reviewed 29 October 2026.

[Open the editable mobile design board](https://www.figma.com/design/IzTCUwu6pjverrdSo0AqC0?node-id=2-2).

## Account and environment result

The existing **Primary** Figma connection worked without another sign-in. A new Design file, **JHK — Pocket Stadium / Mobile Experience**, was created in the account's single available team plan. This was the connected Figma service; it is not evidence that the Figma desktop app runs locally or works offline without an account.

Available resources were inspected: the team's library and subscribed community libraries, including Material 3, Simple Design System and Apple UI libraries. Searches for the actual required button, bottom navigation and color assets returned no matching assets. The repository had no Code Connect files. Local reusable components were therefore created for the bespoke game direction. Product fonts were available and used: Bricolage Grotesque, Instrument Sans and JetBrains Mono.

## Editable design contents

The main board is node `2:2`, 1350 × 1918. Each phone frame is 390 × 844.

| Screen | Node | Purpose |
| --- | --- | --- |
| Stadium / Day | `2:19` | Daytime stadium art, one-tap primary action, secondary modes and honest lobby fallback |
| Stadium / Night | `2:44` | Matching night lighting and high-contrast play controls |
| Match / Reading and answer | `2:69` | Score hierarchy, 30-second clock, four stable large answers, reactions below play |
| My club / Identity and collectibles | `2:96` | Starter title, card finish, earned points and priced stadium upgrades |
| Spicy / Editorial collection | `2:126` | Off-field category, source promise, play action and editorial scope |

The board contains **155 descendant nodes**: 111 text nodes, 31 frames, 2 discrete artwork rectangles and 11 component instances. Reusable primary action, answer and navigation components are beside the board at nodes `2:7`, `2:10` and `2:13`. All UI copy, controls and layout are native editable layers. Only the two original stadium illustrations are raster assets; neither a whole-screen screenshot nor flattened UI is used as the design.

This is an art-direction and interaction specification, not a claim of pixel-perfect synchronization with every running-app state. Browser verification and live functionality are documented separately.

## Artwork and transfer

The original day/night assets are `public/art/stadium-day.webp` and `public/art/stadium-night.webp`. Figma uses display-sized JPEG derivatives of those same assets. Upload endpoint POST requests returned HTTP 405 in the execution environment; the supported native `createImage(Uint8Array)` API imported the bytes successfully instead. The application retains the higher-resolution WebP originals.

## Review evidence

1. Structural review caught horizontal row containers retaining a 100px cross-axis height; corrected them to grow around the 844px phone frames. Explicit text-height reflow was also restored before visual inspection.
2. The full-board Figma screenshot was inspected. No cropped text, overlapping controls or missing artwork was observed. Native text font families matched the product fonts. Image-filled-node inspection showed only the two 342 × 240 stadium illustrations.
3. One targeted correction aligned the hero copy and catalogue prices with implementation, replaced a lobby placeholder with an unavailable-state label, and set My club / Explore navigation highlights correctly. A second full-board screenshot confirmed the correction. No additional aesthetic loop was run.

The screenshot URL download returned an HTML placeholder in this environment, so the tool's documented inline-image fallback was used for actual visual inspection. The editable Figma board is the persistent evidence; expiring screenshot URLs are intentionally not recorded here.

## Design rationale

The project research record at `docs/gully-redesign/RESEARCH.md` supplies primary links to Steve Krug's *Don't Make Me Think*, Don Norman's *The Design of Everyday Things*, and W3C accessibility guidance. Applied decisions are a single obvious start action, visible action feedback, clear status/error states, recognition-oriented navigation, progressive disclosure of customization, and stable answer geometry. These are source-informed design judgments and AI review observations, not human study results or retention claims.
