# Cricket redesign: two visual worlds

The home screen is a launch surface: a cricket hook, one primary play action, optional practice and three secondary destinations. Personal rewards and collection history belong in the player and learning screens rather than competing with the first match.

## Floodlights

Midnight teal grounds, warm chalk type and a pale green primary action place the game in an evening stadium. The large grotesk headline, inset mode cards and red stitched ball give it a contemporary sports identity. Cricket imagery carries the personality while the controls stay plain.

## Pavilion

Ivory scorebook paper, forest ink and brick-red italic emphasis make a separate daytime editorial design. Serif headings, double rules, square controls and divided columns change composition and material alongside color. The same stadium becomes a softer daylight illustration.

## Shared implementation

- `html[data-cricket-theme]` supplies semantic palette variables to home, live duels, practice, learning, player records, settings and navigation.
- The existing dark/light setting selects Floodlights/Pavilion and persists through the existing preference store.
- `CricketArt` is an original responsive SVG, with perspective stadium stands, pitch, stumps, bat and stitched ball. It requires no remote assets, WebGL context or continuous render loop.
- A short entrance animation establishes the artwork once. Controls move only a few pixels on hover. The OS reduced-motion preference and the app preference disable these movements.
- Text and control colors use separate tokens where necessary. Existing error and answer semantics retain distinguishable colors.
- On mobile, the hero stacks, mode cards become compact rows, and the decorative wordmark collapses to the existing brand mark to leave room for the design switch and sound/settings controls.

## Panel round two

Source integration review caught and corrected a theme-switch markup mismatch, unstyled secondary home links, the missing practice-bot banner, crowded mobile topbar, and an overly narrow headline measure. The two visual systems preserve the same action order and functional labels so changing appearance does not require relearning the game.

A bounded desktop/mobile screenshot pass belongs in the release verification record. Source review and a passing TypeScript check support this implementation; they do not establish cross-device visual results by themselves.

The first screenshot batch covered both worlds at desktop and mobile. It confirmed distinct typography and composition, readable controls and fitting mobile chrome. It exposed a small desktop artwork overflow and an oversized Pavilion heading. One CSS correction constrains the artwork to its grid cell with room for its slight rotation and gives both desktop hooks a 56px ceiling; the release owner performs the final confirmation.
