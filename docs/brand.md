# Jaanta Hai Kya — brand sheet

**Name:** Jaanta Hai Kya (Hindi, "do you know?"). **Short form:** JHK. **Formerly:** FACT//DUEL.
**Tagline (English):** Do you know? Prove it.

Only what a person sees changed. The repository, package, `fd-` CSS prefixes, IndexedDB names,
localStorage keys and cookie names stay `fact-duel`: those are storage and code contracts.

## 1. The mark

A question mark whose tail is the K's leg, with one dot. Hook, stem, leg and dot are one stroke
weight on a 64-unit grid (stroke 8, round caps and joins), so it survives 16 px. The hook is the J
turned over the top of the stem; the kick is the K; the dot is the question. It is the only
picture the brand owns: no clip art, no bat, no ball, no dice, no coin.

| File | Use |
| --- | --- |
| `public/brand/jhk-mark.svg` | The app icon: dark tile (`--bg-0`, radius 14/64) with the glyph in volt. Use at 16, 24, 32, 240 px. |
| `public/favicon.svg`, `public/brand/favicon.svg` | Same drawing; the favicon the app and the static build link. |
| `public/brand/apple-touch-icon.png` | 180×180 raster of the mark for iOS home screens (iOS ignores SVG here). |
| `app/shell/brand-mark.tsx` | `<JhkMark size tile title />` — the same paths inline, painted with tokens. `tile` draws the icon; without it the glyph is `currentColor` (the hero watermark, the rail). |

Sizes in the product: 32 px tile in the top bar, 24 px glyph at the head of the desktop rail
(≥ 900 px, decorative), 16 px favicon, and a watermark of ~240 px in the home hero at 6 % opacity,
kept to the top-right of the stage where no text sits. Never place text over the watermark at less
than 4.5:1; the badge and chip in the hero sit on their own scrim.

## 2. The wordmark

"Jaanta Hai Kya" hand-drawn as a monoline geometric sans (cap height 100, x-height 70, stroke 20,
round caps, descender to 128) — paths only, no font, so the SVG renders identically everywhere.
Tracking 12, word space 22 (+ tracking). Letters that exist: J a n t H i K y and, for the tagline,
D o w P r v e u k ? and the full stop.

| File | Use |
| --- | --- |
| `public/brand/jhk-wordmark.svg` | Cream (`--text` dark value) letters for dark surfaces. |
| `public/brand/jhk-wordmark-dark.svg` | Ink letters (`--text` light value) for light surfaces. |
| `public/brand/jhk-lockup.svg` / `jhk-lockup-dark.svg` | Mark tile + "JHK" small caps (caps at 78 % of the full wordmark's cap height). The short lockup for tight spaces: chips, footers, the receipt. |
| `<JhkWordmark height variant="full" \| "short" />` | Inline, `currentColor`; the top bar uses `full` at 16 px high and hides it under 360 px so the tile carries the brand alone. |

Colour rules: the wordmark paints in the surface's text colour, never in volt (volt is for the
mark's glyph and the tagline). The mark's tile is always dark; on a light surface it reads as the
app icon and needs no light twin. Tokens: `--volt` #d4ff3a glyph on `--bg-0` #0a0e14 (16:1);
cream `--text` on `--bg-0`; ink #1e2530 on cream #f7f6ef.

## 3. The social card

`public/brand/og.svg` (1200×630) and its raster `public/brand/og.png` (crawlers do not render SVG):
the mark tile, the wordmark in cream, the tagline in volt, on `--bg-0` with a faint volt glow at
the top left. No numbers, no claims. `app/layout.tsx` (`openGraph.images`) and the generated quiz
pages (`scripts/seo-pages.mjs`) point at the PNG.

## 4. Voice

Confident, sports-bar plain English, short sentences, no exclamation marks. The product is named in
full the first time on a surface ("Jaanta Hai Kya") and "JHK" after that where space is short.
Headings carry the name where the page is about the product's promise (Rules: "How a Jaanta Hai
Kya duel works."; Trust: "What you can hold Jaanta Hai Kya to."). Titles: `Jaanta Hai Kya — Do you
know? Prove it.`; sub-pages `Measurement — Jaanta Hai Kya`. The finish screen's footer line is
small print: `Jaanta Hai Kya · <sport>`.

## 5. Hindi (reserved, not shipped)

The Devanagari wordmark **जानता है क्या** is owned by the Hindi locale pass. Reserved names, so the
files land without a rename:

- `public/brand/jhk-wordmark-hi.svg` and `public/brand/jhk-wordmark-hi-dark.svg` (root `<svg lang="hi">`),
- `<JhkWordmark variant="hi" />` in `app/shell/brand-mark.tsx`,
- `og-hi.svg` / `og-hi.png` with the Hindi tagline.

Until those exist, every surface shows the Latin wordmark, including under a Hindi locale.

## 6. Regenerating

`node scripts/brand-svgs.mjs` rewrites every SVG in `public/brand/` and `public/favicon.svg` from
the glyph table in the script. The PNGs are screenshots of `og.svg` (1200×630) and `jhk-mark.svg`
(180×180) taken with the repo's headless Chromium; redo them whenever the SVGs change. The inline
paths in `app/shell/brand-mark.tsx` mirror the same `MARK` / `WORD` / `JHK` data and must be updated
in step (the script prints the layout widths; `BRAND_DATA=<path> node scripts/brand-svgs.mjs` dumps
the JSON the component embeds).
