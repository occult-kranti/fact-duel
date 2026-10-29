# Gully Club

Replacement visual world, 29 October 2026. Supersedes the earlier Floodlights/Pavilion visual direction; saved day/night preference keys remain compatible.

The home is a cricket club match poster: warm paper, navy ink, vermilion action, original risograph cricket artwork, expressive Bricolage Grotesque and tiny JetBrains Mono scorebook annotations. Working screens use the same colours and rules with quiet typography and no decorative illustration during timed play. Instrument Sans carries body copy and controls. All three fonts remain self-hosted. The design mode for home/play is Operate: finding and playing the next question has priority. Learning screens combine Operate and Read.

Day tokens: paper #f8f3e7, ink #182630, action #ca3c1c, muted #59636a. Night: navy #15232b, warm white #faf2e0, coral #ff9471. Use semantic tokens in static/cricket-themes.css. Four-pixel controls and fine rules replace rounded promotional card stacks. Answers remain stacked, fixed-order, at least52 px on phones, and redundant shape/text feedback remains intact.

One dominant Play cricket starts ordinary-difficulty, five-question bot practice at 30 seconds/question. Bot choices and times are preplanned independently of player input; their scheduled wait is capped at 9.5 seconds. The user can choose5/7/10/20/30-seconds in bot custom settings. Competitive legacy/friend timers retain 5/7/10; Supabase human matches retain their own30-second contract. This is a product judgment about readability, not measured retention or a claim of optimal cognition.

Navigation: Home; Explore (expeditions/topics/facts/fixtures/custom practice); Play (human desk and custom play); Progress (practice record, human player card, activity/data, art); Answers (history/sources/recall). Existing route IDs, recovery and records remain. Native disclosures preserve mounted content and chosen values. Optional supporter/boards/topics/achievements/locker sections are collapsed on Progress.

At 320–390px primary action precedes artwork; at short landscape heights headline/art compress and primary remains visible. Day/night, reduced motion, keyboard focus, long labels, offline after load and unavailable storage must preserve play. Decorative image has empty alt, dimensions, WebP encoding and no embedded controls. No game frame depends on WebGL.

Future ads: home/learning normal-flow footer locations only, default-off pure preview component. No in-game advertising requests. Local practice cannot invoke reload-based H5 breaks. See ad_placement.md for activation and QA requirements.

Tooling: generated UX concept → editable Excalidraw specification → real React/CSS implementation → two independent AI panel rounds → bounded browser verification. Excalidraw specification and generated mockup are references, not fabricated app screenshots. See docs/gully-redesign/TOOLING.md.
