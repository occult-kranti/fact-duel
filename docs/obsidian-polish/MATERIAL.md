# Obsidian Pavilion material specification

30 October 2026. This is a visual finishing pass on the existing mobile-first JHK application. The [editable canvas](canvas/index.html) keeps the nine club screens and desktop adaptation, with daylight/floodlights and illustrative club-palette controls. Preview choices do not change a real club or account.

## Direction and scope

Warm paper remains the daytime world. Obsidian navigation, a glass-like team banner, selected roster controls and restrained floodlights cards provide depth. The material uses original CSS gradients and inset edges. Original stadium and cricket artwork remains in use; no new licensed artwork or game screenshot is copied.

The app remains an **Operate** surface. The canvas is a **Read / Experience** surface that explains the visual choices without granting game permissions. The leading action, phase, deadline and answer geometry retain their existing places. The cricket outcome scorecard deliberately retains its ivory surface for readable feedback.

`app/obsidian-polish.css` owns the finish. `app/club-accent.css` owns club accent values and the verified membership attribute. Component layout, tag-prefix truncation and account controls remain with their respective owners.

| Token | Value | Role |
| --- | --- | --- |
| Obsidian deep | `#0c1820` | Navigation and team banner ground |
| Obsidian base | `#10272f` | Selected control and floodlights chrome |
| Obsidian text | `#f7f1e6` | Readable labels on the dark material |
| Obsidian muted | `#c0cfce` | Supporting navigation labels |
| Control boundary | `#758d98` | Essential dark-control boundary |
| Decorative edge | `#394d57` | Low-emphasis material rule only |
| Reflected tint | Club accent at 14% | Decorative radial reflection |
| Dark-surface accent | 40% club accent + 60% `#fffdf8` | Readable small detail on always-dark chrome |

Club teal, saffron, berry and blue come from the server lane's accent contract. The material consumes the accent for reflections; it does not set membership, change eligibility or infer an opponent's colours as the user's club. The default-colours setting remains available. Correctness, error and timed-answer colours stay independent.

## Surface rules

| Surface | Finish | Interaction |
| --- | --- | --- |
| Bottom navigation / desktop rail | Dark opaque fallback, soft reflection and inset edge; supported browsers receive 95% opaque glass with 12px blur | One 700ms corner glint on the selected icon; no continuous animation |
| Team banner | Dark ground, low-opacity specular background and restrained club tint | A 550ms reflection shift on fine-pointer hover or keyboard focus within |
| Selected roster tab | Stable obsidian fill, readable ivory text/count and visible boundary | Existing focus ring and geometry; no sparkle |
| Floodlights header | Restrained glass and edge | Static |
| Selected floodlights non-question cards | Static 3% white reflection and club tint | No filter, particle layer or continuous motion |
| Timed question, answers and clock | Existing stable surface | No material animation or overlay |
| Settled cricket result | Existing ivory scorecard and original finite cricket feedback | Existing optional sound/motion controls |

Reflections are background layers, not positioned overlays. The only new pseudo-element is a 6px pointerless glint inside the selected navigation icon. It does not receive focus, intercept taps or cover label text. No new overflow clipping or `will-change` is added. Geometry remains owned by the component styles.

The opaque fallback keeps content readable when `backdrop-filter` is unsupported. Blur is restricted to the two chrome surfaces rather than every card. The mobile navigation shadow is reduced. Dark text and focus contrast do not depend on a bright photograph behind the glass.

## Motion

There is no infinite material animation. The selected-icon glint runs once for 700ms; the banner shift is driven by a deliberate hover/focus state. The OS reduced-motion media query and the saved `data-motion="reduced"` / `"off"` settings remove material movement. An immediate static edge remains. Native timed-room navigation is absent, and the stylesheet also suppresses its glint in the timed-room shell.

Round 2 also caught team-points text inheriting a dark daytime club accent on the dark banner. The points now use the ivory-mixed dark-surface accent.

Round 2 caught an OS-only specificity defect: the original lower-specificity `animation:none` media rule could lose to the selected-icon declaration. The guard now uses `animation:none!important`, consistent with the saved motion guard. This is an implemented correction, not a plan.

## Three bounded review rounds

| Round | Evidence | Status |
| --- | --- | --- |
| 1 — Direction and first implementation | Existing PRODUCT/DESIGN context, picker seed colours, unchanged 320/390 geometry, agreed club-accent contract; implemented material CSS and editable canvas. | Complete |
| 2 — Cross-role critique | Independent critic approved the restrained material direction; runtime perspective inspected duration, scope, paint cost and preference guards. Corrected OS-only motion specificity and the banner team-points colour under dark daytime club accents. | Complete |
| 3 — Confirmation | Managed preview: actual 390/320 home and floodlights header, keyboard focus, saved Off, all four canvas palettes in day/night, default reset, editing, solid answer surface and desktop adaptation. Module syntax and SVG XML verified. | Complete |

Observed rendered evidence:

- Actual app viewport/scroll widths were **375/375** in the 390px frame and **305/305** in the 320px frame. The revised headline, Mini/Full actions, completion conditions and bot disclosure fit.
- Keyboard Tab to Teams showed a visible **3px ivory focus ring**, offset **-4px**, entirely within the compact navigation target. Selected navigation stayed distinct from focus.
- The floodlights header resolved to `rgba(16,39,47,.96)` with `blur(12px)`; readable text and the stable dark ground remained visible.
- Saved Effects **Off** produced `data-motion="off"` and computed navigation-glint `animationName="none"`. OS-only reduced motion was checked in source; no browser OS emulation is claimed.
- Every canvas mobile frame fit at **390px**. All four club palettes fit at **320px** in daylight and floodlights with no internal horizontal overflow. Default removed the palette attribute; editing enabled 21 copy fields; motion Off removed the preview glint.
- The canvas answer controls computed `backgroundImage="none"` and `animationName="none"` across the palette checks. Original cricket artwork loaded. The desktop canvas was **1210/1210px** with no internal horizontal overflow.
- The canvas width/world pressed controls gained a static accent rule after review made the selected state too subtle against the dark easel. This is a preview-only visibility correction.

Calculated nominal navigation fill contrast, before decorative gradient layers: a 95% deep fill over warm paper resolves to `(24,35,42)`. Ivory text is **14.23:1** and muted text **9.95:1** on that fill. The ivory-mixed palette accents range from **8.01:1** (berry) to **12.90:1** (saffron). The essential boundary `#758d98` against `#10272f` is **4.45:1**. These are specific colour-pair calculations, not a claim that every application state has received a complete accessibility certification.

The managed preview uses HTTP `terminal.local`, where `crypto.randomUUID` is unavailable. A live practice launch therefore stopped at “Setting the arena…” in that context; no polyfill was injected through the browser. Timed-question exclusion is supported by source inspection, the native timed-room navigation boundary and the solid canvas answer check. This pass does not claim a completed live practice run in that HTTP context. No physical-phone, OS preference emulation or screen-reader test was performed.

All three bounded material review rounds are complete. The six perspectives are an AI-assisted product review, not six independent human experts, target-user interviews or measured satisfaction. Physical-device, screen-reader and audience testing require separate evidence. This pass produces source and review artifacts; publishing is outside this lane.
