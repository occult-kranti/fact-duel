---
name: juice
description: How to add game feel in FACT//DUEL — the useJuice() API (particles, procedural sound, haptics, toasts, ceremonies, counters, shake), which cue goes with which event, and the honesty/accessibility limits. Load before wiring feedback into any screen.
---

# Juice (game feel) in FACT//DUEL

Engines live in `lib/fx/` (sound synth, particles, haptics, prefs, bus) and React pieces in `components/fx/` (FxProvider, useJuice, NumberCounter, ToastStack, Ceremony, XpPop). `<FxProvider>` is mounted once in the app shell. Read `components/fx/index.ts` for the exact exports.

## useJuice()
```ts
const juice = useJuice();
juice.sound('correct');                 // cues: tap hover select correct wrong combo countdown go reveal win loss draw levelUp quest gem stamp streak unlock xp tick whoosh error
juice.haptic('success');                // light medium heavy success error combo tick
juice.burst(buttonEl, 'correct');       // presets: correct wrong win gem levelUp stamp combo
juice.floatText(el, '+25 XP');          // floating number/text from an element
juice.confetti('win');                  // win | levelUp | stamp
juice.shake(el, 1);                     // decaying jitter, reduced-motion safe
juice.toast({ kind: 'xp', title: '+25 XP', body: 'Correct under 2 s' });   // kinds: xp quest achievement streak gem info
juice.ceremony({ kind: 'level', title: 'Level 7', subtitle: 'Contender', rewards: ['+25 gems'] });
```
Every helper is a no-op on the server, respects sound/haptics/effects prefs and reduced motion, and is safe to call in event handlers.

## Event → feedback map
| Event | Visual | Sound | Haptic |
|---|---|---|---|
| Any press | scale .97 | tap | light |
| Answer locked | button fills, lock icon | select | light |
| Round correct | pop 1→1.06→1, volt flash, burst('correct'), floatText +XP | correct (+combo n if streak ≥2) | success |
| Round wrong | shake 4px, ember desaturate, cross icon | wrong | error |
| Combo 3 / 5 | 80ms hit-stop (pause CSS anims), ring pulse | combo | combo |
| Countdown 3-2-1 / go | numeral scale-in | countdown / go | tick |
| Question reveal | none on the card (hard rule) | reveal whoosh | — |
| Match win / loss / draw | confetti('win') / calm fade / equal chips | win / loss / draw | success / medium / light |
| XP gain | floatText + toast(kind xp) | xp | — |
| Quest done | toast(kind quest) + gem ping | quest + gem | success |
| Level up / achievement / stamp / streak milestone | ceremony (3D medal slot) + confetti | levelUp / unlock / stamp / streak | heavy |
| Gem spend / equip | burst('gem') on the item | gem | light |

## Rules
- Drive progression feedback from `progressionDiff(before, after)` (lib/progression.mjs): toast each log entry once; open one ceremony at a time (queue the rest); never re-fire on re-render (track the last handled log id in a ref).
- The live question card: no juice on mount; press feedback allowed on pointerdown; result juice after `round.result` only.
- Reduced motion: shake/confetti/parallax off, fades only. Sound stays unless muted. Every audio cue has a visible twin.
- Keep cues short (<1.2 s) and never stack more than three sounds within 100 ms.
