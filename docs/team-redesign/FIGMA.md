# Team Pavilion design tooling

Prepared 29 October 2026.

## Figma result

The existing Primary connection created the blank Design file [JHK — Team Pavilion · Mobile first](https://www.figma.com/design/YUFElZofMTD1HjO0JloLlM). Session creation also succeeded. The first `get_libraries` discovery call then returned:

> You've reached the Figma MCP tool call limit on the Starter plan.

The required `whoami` diagnostic confirmed the same Starter team plan. No further design writes were attempted. The new file is blank: there are no completed team-screen frames, component layers or claimed Figma review screenshots. No offline Figma installation or reverse-engineered service was used to bypass that plan limit.

The repository contains no Code Connect component files. Existing product fonts were identified directly in `public/fonts/fonts.css`: Bricolage Grotesque, Instrument Sans and JetBrains Mono. Library discovery was blocked before asset searches could be performed, so no claim is made about whether a remote library has suitable components.

## Editable fallback canvas

The user permitted canvas and other design tools. The implementation therefore includes an original, inspectable HTML/CSS/JavaScript design canvas plus an editable SVG flow:

- `design-board/index.html`: seven mobile screen specifications and one desktop adaptation.
- `design-board/flow.svg`: text and vector nodes for the principal task branching.

Open the HTML through the supported local preview. The canvas switches between 390px mobile, 320px compact and desktop adaptation. “Edit copy” enables direct text editing in the current preview; those edits are not saved to application data or written back to the source file automatically. Native form controls show the intended capacity choice, team name and banner selection. Navigation buttons jump to the associated design screen. Unimplemented server actions show a clear design-preview message. Print uses a dedicated layout.

The UI is semantic editable HTML and CSS, not a flattened screenshot. Only the existing original stadium illustration is raster artwork. The crest is a new vector drawing in the canvas source. Illustrative team names, public tags, member initials, scores and bracket states are prominently labelled as examples; they are never presented as live users.

| Design screen | Core decision |
| --- | --- |
| Play | One-tap solo practice with a separate team entry |
| Teams entry | Create a squad or join with an invite |
| Create squad | Choose fixed capacity 5 or 11 before submission |
| Team home | Banner, public tag, roster and one next fixture action |
| Fixture | Personal over, team progress, deadline and score rules |
| Four-team cup | Vertical mobile bracket, fixed seeds and explicit participation |
| Captain settings | Identity preview and deliberate Save |
| Desktop | Same hierarchy in a side rail and two columns |

## Verification boundaries

Canvas JavaScript passed `node --check`; the SVG parsed as XML. Palette checks caught the lighter teal’s insufficient 4.32:1 contrast against paper; small teal text was darkened to `#076f6b`. Measured contrast values and the distinction between identity fill and text appear in `DESIGN.md`.

An attempted ad-hoc HTTP preview was blocked by the browser client and stopped. The project’s supported managed preview subsequently rendered the complete canvas, so this did not block final visual confirmation. No bot challenge or website outage was inferred from that environment error.

The final browser check inspected the rendered mobile 390px, compact 320px and desktop-adaptation modes. Eight design screens were present. The existing stadium image loaded at its 900px source width, and computed headline/body families matched Bricolage and Instrument. All seven compact phone frames measured 320px wide; DOM geometry showed no horizontal overflow in the checked phone or desktop frames. The desktop adaptation measured 1226px in the available viewport and showed its side rail and two-column layout clearly. Composition screenshots were inspected for readable text, intact controls and overlapping/clipped content; no remaining visual blocker was found.

Copy editing was toggled on and off: 21 marked text nodes became editable, then returned to normal. A desktop cup navigation action was exercised through its visible button. It now restores the mobile overview, marks the cup frame and scrolls the visible cup into view.

Two browser defects were corrected before confirmation: a classic-script `const top` declaration collided with `Window.top`, leaving the screen board empty; module scope and `topbarMarkup` corrected it. A desktop-only preview initially targeted a hidden mobile cup frame; the navigation handler now restores the overview before jumping. These were canvas defects, not evidence about live team-service behavior. The passing confirmation followed those targeted corrections; no additional aesthetic polish pass was run.

These checks validate this design canvas in the managed browser. They do not establish physical-phone ergonomics, functioning online competitions, pixel-perfect synchronization with every application state or representative player satisfaction.
