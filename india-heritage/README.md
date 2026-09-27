# SABHA — The Reading Room (India Heritage Edition)

A strictly non-partisan Indian history & civics knowledge-duel game for ages 30–70,
built on the fact-duel engine's mechanics and rebuilt with complete new art direction.

**Positioning:** *Where India tests what it knows.* Every answer shows its source.

## Run

Open `index.html` — no build step, no server, no API. Works from `file://`.
All state is device-local (localStorage). No accounts, no money, no ads.

## Modes

| Mode | Base (fact-duel) | Rules |
|---|---|---|
| A Single Sitting | quick duel | 1 question, 10s hairline timer |
| Best of Three Sittings | trilogy | first to 2 rounds, 7s |
| The Full Session | gauntlet | 5 rounds, score decides, 5s |
| Reading Route | expeditions | 6 untimed questions, 3 chapters, confidence ladder Steady +2/0 · Bold +3/−1 · Called +4/−3 |
| WhatsApp Check | NEW | True/False debunks of viral forwards with official citations |
| The Record Shows | NEW | two flawed popular framings; pick what the record shows |

Opponents: **The Archivist** bot (25% correct, human-like delay) and **Across the Table**
pass-and-play. **Relaxed Mode** (untimed, speed ignored) offered before every timed duel.
Adjudication: correctness first; both correct → faster wins unless within 150 ms (draw).

## Standing

XP → titles: Pathak → Vidvan → Acharya → Maha-Vidvan. Wax-seal achievements,
calibration tracking with the signature **Well-Calibrated** seal, printable certificate,
WhatsApp share card, 30-day shelf rail.

## Design system

"The Reading Room": cream paper `#F2EAD6`, bottle-green leather `#1E4A38`, brass `#A2803E`
(marks of record), lac-red `#A8372A` (one hot accent). Spectral / IBM Plex Sans+Mono /
Rozha One / Noto Serif Devanagari. Zero radius, hairline rules, one contact shadow,
wax-stamp verdicts, blur-to-sharp question reveals. `prefers-reduced-motion` honored.
No party colors/symbols, no tricolor stacks, no gambling vocabulary or visuals.

## Repo integration

- Question bank in repo-native schema: `lib/server/questions/india-history.mjs`
  (registration steps in its header comment — id regex, bank.mjs, TOPIC_DOMAINS,
  content.mjs domains, i18n keys, bankVersion).
- Mechanics (confidence ladder, adjudication window, bot behavior, XP curve
  `80·level^1.55`) mirror `lib/expeditions.mjs`, `lib/server/room-engine.mjs`,
  `lib/progression.mjs`.

## Content integrity

38 launch questions (30 duel + 5 check + 3 record), all facts verified against the
primary-source spine: Constitution text, Constituent Assembly Debates, ECI, PRS,
NCERT, India Year Book, ISRO, ASI, RBI, PIB Fact Check. Every card names its source
and links to the institution. Sensitive events appear as instrument-and-date only.
