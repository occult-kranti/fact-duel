# Local design-tool record

The user reported that Figma does not work and directed the redesign to continue locally. No new Figma account, project or successful Figma editing session is claimed for this revision.

We used the actual open-source [Excalidraw React editor](https://github.com/excalidraw/excalidraw), package `@excalidraw/excalidraw` **0.18.1**, as the local fallback. Excalidraw is an independent design/whiteboard tool, not a reverse-engineered Figma service. The package was downloaded and run locally outside the app dependencies; the small optional editor in `design-board/` has its own package manifest and adds nothing to the game bundle.

## Deliverables

- [`design-board/gully-club.excalidraw`](design-board/gully-club.excalidraw): native editable scene with 112 elements, including desktop home, phone question, five route groups, palette and implementation notes. Text, shapes and controls are independently editable. The original generated cricket illustration is embedded in the scene as one image.
- [`design-board/gully-club.svg`](design-board/gully-club.svg): genuine output from Excalidraw's `exportToSvg()` API, including its embedded scene metadata. This is an editor export, not a hand-authored SVG presented as one.
- [`design-board/excalidraw-editor.png`](design-board/excalidraw-editor.png): screenshot of the running Excalidraw editor with the native scene loaded.
- [`design-board/index.html`](design-board/index.html): optional local Excalidraw editor entry point.

The board communicates the selected visual system and screen hierarchy. It is a design specification, not a pixel-perfect screenshot of the finished application. The implemented browser screens and their test evidence remain authoritative for final behavior. The board's phone question is illustrative editorial content; it is not a recorded live game.

## Open and edit

Drag `gully-club.excalidraw` into an Excalidraw editor, or use its Open command. The file embeds the illustration, so the scene does not depend on an external image URL.

For the included local editor, run from `docs/gully-redesign/design-board/`:

```sh
npm install
npm run dev
```

Open the localhost address printed by Vite. Use Excalidraw's main menu to save the editable scene or export SVG/PNG. The editor is a separate development tool; do not deploy its `node_modules` folder with the game.

## Verification and provenance

The installed editor rendered the scene in headless Chromium. `getSceneElements()` returned 112 elements and `getFiles()` returned one embedded image; the browser produced zero uncaught page errors. Both the native JSON and SVG were generated through Excalidraw's public APIs (`serializeAsJSON()` and `exportToSvg()`). The running editor was visually inspected after export.

The illustration is the project's original generated `public/art/gully-cricket.webp`. It is intentionally placed only on the home concept; the timed question concept contains no artwork, moving decoration or advertisement.

References:

- [Excalidraw source and MIT license](https://github.com/excalidraw/excalidraw/blob/master/LICENSE)
- [Excalidraw package documentation](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation)
- [Excalidraw export utilities](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export)
- [Excalidraw data utilities](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils)

Version 0.18.1 was the resolved package version used for this board. This record does not claim it will remain the latest release.
