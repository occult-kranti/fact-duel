# JHK obsidian polish — color, voice and player psychology

Prepared 30 October 2026. This is a bounded source-led design review of a mobile-first cricket quiz and club game. It is not a claim to have read entire books, interviewed the audience, run a representative survey, or measured a retention lift. The sources establish principles and requirements; the JHK adaptations and Hinglish voice are design hypotheses.

## Audience and emotional contract

The user explicitly wants a sharper, competitive Hinglish voice and artistic game presentation. The working audience hypothesis is mobile cricket fans who enjoy cricket knowledge, friend rivalry and a visible identity. Age, geography, language proficiency, device quality, preferred script and tolerance for provocation have not been established through audience research. The online club flow retains its existing 18+ attestation; the new copy does not redefine eligibility.

The intended emotional sequence is **recognition → playful challenge → a clear small commitment → an honest score → optional pride or learning**. A headline may challenge a claim of expertise; an error, missed answer or loss must not judge the player as a person. A first-time visitor still needs to know which button starts play, how many questions it contains, whether the opponent is a bot, and what earns the displayed XP.

## Primary sources and scoped application

| Source, checked 30 October 2026 | What it supports | JHK decision and evidence limit |
| --- | --- | --- |
| W3C, [WCAG 2.2 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Normal text requires 4.5:1 contrast; qualifying large text requires 3:1. Thresholds cannot be passed by rounding up. | Calculate the actual text/background pairs. Keep muted copy readable. A few passing token pairs do not establish whole-product accessibility, especially over images, gradients and translucent layers. |
| W3C, [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Meaning cannot rely on hue alone. Essential control and graphical information needs sufficient contrast, subject to the criterion's exceptions. | Selected club palettes retain a check and name. Preparation/Battle/Result remain literal labels. Correct/wrong, warning, focus and selection use text, icon, border or shape as appropriate. A decorative reflective edge is not a substitute for an identifiable control. |
| W3C, [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) | WCAG's 24×24 CSS-pixel minimum has defined spacing and other exceptions; larger controls can be easier to activate. | Preserve JHK's approximately 44–54px primary touch controls. This is a product target above the normative minimum, not a claim that WCAG universally demands 44px. Check compact layouts after the new words wrap. |
| Przybylski, Rigby and Ryan (2010), [A Motivational Model of Video Game Engagement](https://repository.essex.ac.uk/7228/), author university repository abstract | The model links game appeal and well-being to competence, autonomy and relatedness. | Competence: a visible, truthful score and clear explanations. Autonomy: choose Mini/Full, solo/club, sound and motion. Relatedness: club name, banner and earned identity. The repository provides an abstract, not the full article. General game-motivation theory does not prove how JHK mobile users or Hinglish readers will respond. |
| NN/g, Kate Moran, [The Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/) (2016; reviewed 2023), author's article and reported study | Humor, formality, respect and enthusiasm can be designed separately. Context matters; humor during frustration can irritate. The reported study involved 50 American respondents rating invented website copy. | Use casual, energetic, mildly irreverent entry headlines; keep error, consent and time-limit copy plain. This source does not validate Hinglish, cricket marketing, Indian audiences, conversion or retention. |
| NN/g, Tanner Kohler, [Autonomy, Relatedness and Competence in UX Design](https://www.nngroup.com/articles/autonomy-relatedness-competence/) (2022), original UX guidance | Choice of pace and configuration, relevant messages and comprehensible progress can support these needs. | Personality belongs in headlines; predictable controls and self-directed pace belong in the flow. A stronger slogan cannot justify forced replay, an unsolicited share prompt or a compulsory club commitment. |
| Don Norman, [Emotional Design: People and Things](https://jnd.org/emotional-design-people-and-things/) (2008), author's public article, previously reviewed for the club redesign | Appearance, experience of use and expressed identity are distinct parts of emotional design. | Obsidian material can add perceived craft; simple navigation and honest status make it usable; a chosen club palette expresses identity. This is a public article, not a full-book reading. |

No universal claim such as “teal creates trust,” “saffron causes engagement,” or “dark UI increases retention” is supported here. Color meaning depends on context and learned conventions. JHK uses repeated semantic roles and measured light–dark separation; emotional interpretation is an artistic hypothesis to test.

## Theme roles and solid-color contrast

The root moderator invoked the compose-UI-theme palette picker with these representative colors. Keep the warm day-world presentation available; obsidian is the material for dark navigation, banners and night surfaces. Do not create an inconsistent new theme for each page or animate a continuous sparkle over reading or timed play.

| Color | Semantic role | Safe foreground/use |
| --- | --- | --- |
| `#0C1820` | Deep obsidian canvas; ink foreground on light accents | `#F7F1E6` main text; the bright club accents can be text or icon detail here. |
| `#10272F` | Obsidian card/surface | `#F7F1E6` or `#F3F6F3` main text; `#AEBEC5` supporting text. |
| `#F7F1E6` | Warm ivory reading and heading text; preserved day paper | Dark ink foreground when used as a solid light surface. |
| `#F3F6F3` | Crisp high-emphasis text/highlight | Use sparingly within the same hierarchy, not as an additional accent category. |
| `#AEBEC5` | Secondary text on obsidian | Keep it at full intended opacity; recalculate if dimmed or composited. |
| `#FFCA7A` | Saffron primary commitment/preparation accent; saffron club identity | `#0C1820` text on a solid saffron control; visible text/icon accompanying phase state. |
| `#8CDBC9` | Teal club identity, selected state and focus accent | `#0C1820` text on a solid teal chip; checkmark and label accompany selection. |
| `#ECAACD` | Berry club personality and optional cosmetic identity | `#0C1820` on solid berry. Do not repurpose a berry club's identity as “wrong answer.” |
| `#ADD3FF` | Blue club identity and informational detail | `#0C1820` on solid blue; information retains a label. |
| `#394D57` | Decorative separator or material edge | Not the sole essential control boundary on `#10272F`; its contrast is only 1.754:1. |

Calculated with sRGB relative luminance; these are exact solid foreground/background pairs, not screenshots or whole-interface compliance results:

| Foreground / background | Contrast |
| --- | ---: |
| `#F7F1E6` / `#0C1820` | 16.005:1 |
| `#F7F1E6` / `#10272F` | 13.803:1 |
| `#AEBEC5` / `#10272F` | 8.107:1 |
| `#FFCA7A` / `#10272F` | 10.331:1 |
| `#8CDBC9` / `#10272F` | 9.674:1 |
| `#ECAACD` / `#10272F` | 8.275:1 |
| `#ADD3FF` / `#10272F` | 10.004:1 |
| `#0C1820` / `#FFCA7A` | 11.979:1 |
| `#0C1820` / `#8CDBC9` | 11.216:1 |
| `#0C1820` / `#ECAACD` | 9.594:1 |
| `#0C1820` / `#ADD3FF` | 11.600:1 |

If a night input requires a visible edge to identify its boundary, a derived `#758D98` edge on `#10272F` gives 4.448:1. The implemented `app/obsidian-polish.css` uses this value as `--obsidian-control`. Its actual muted obsidian text is the derived `#C0CFCE`, which gives 9.649:1 on `#10272F`; the picker's `#AEBEC5` remains a representative secondary-text option. Focus must remain independently visible and cannot depend on a passing decorative separator.

Existing crest foils are a separate category: `#F9DC9B` on teal `#087F7A` is 3.637:1, and `#FFE3A2` on saffron `#AA5B18` is 3.973:1. Those pairs can support essential non-text symbols at the relevant 3:1 threshold, but must not carry ordinary small text. Keep palette names outside the swatches in normal readable text. Do not claim whole-UI compliance from crest calculations.

The four club palettes express a chosen identity. They must not alter answers, eligibility, score, timer, rank or reward rates. Use club reflection in banners and decorative edges; preserve stable action and feedback semantics so a blue club still recognizes the primary action and a berry club still sees an error as an error.

## Marketing and voice decisions

The voice aims for an invitation to demonstrate knowledge, not a demand to defend self-worth. “Gyaan hai? Game dikha.” is short enough to support an intended two-line mobile hero; “Play Mini over” remains the action. Specifics beneath it explain 3 versus 6 rounds, verified completion XP and bot practice. A fact or source is a useful receipt; an invented player count or fabricated scarcity claim is not.

Use one strong challenge per visual region. Let the next line explain the choice or commitment. Display actual stored progress, not guessed local rank. Preserve “saved in this browser” where that is the real storage boundary. Earned items can be proud and visible without expiring them to create anxiety. Sharing, rematching and weekly drafts remain optional.

The target-user task test should ask actual mobile cricket players to explain what “Mini,” “Full,” “My club” and “Teams” do, start a short practice round, identify bot versus human play, and describe the XP condition. Separately ask whether the new voice feels playful, confident, confusing or insulting. Include people who prefer Devanagari and people unfamiliar with Roman Hinglish. This is a future validation plan; no invented responses or conversion claims are part of this pass.

## Three bounded review rounds

| Round | Evidence | Status |
| --- | --- | --- |
| 1 — Source and direction | Current W3C requirements, scoped game-motivation and UX/tone sources; calculated palette pairings; exact copy proposals. | Complete |
| 2 — Implemented source critique | Read actual changes in Home, Teams, Explore, My club, Answers and Events. New headlines introduce no fake activity or reward claim. Corrected the promise “3 sawaal” above both Mini 3 and Full 6 to “3 ya 6 sawaal. Ab tumhari baari.” The repeated expert challenge was varied to “Baaton se nahi. Jawabon se.” | Copy corrections verified in source and browser |
| 3 — Confirmation | In the actual application embedded at 390px and 320px, observed the short two-line hero, both over actions with correct 3/6 counts, XP completion condition and explicit bot/no-signup disclosure. Also viewed the 390px night material. Source review confirms bounded material motion and reduced/off fallbacks, separate feedback semantics and clear palette names. The day-palette foreground integration issue was corrected in the actual CTA, pin, hover and text-selection source; see below. | Bounded copy, color-pair and source review complete; no remaining finding from this perspective |

This is an AI-assisted review, not human audience testing or proof that all customers are satisfied. The parent release record owns the final build, deployment and production evidence.

### Final palette integration finding

`club-accent.css` maps day club fills to teal `#087F7A`, saffron `#FFBD59`, berry `#8E3863` and blue `#285BB8`, with white foreground on the dark fills and ink on saffron. The initial Teams CTA/pin styles instead hardcoded ink `#122C35`, giving only 3.010:1 on day teal, 2.015:1 on berry and 2.281:1 on blue. White gives 4.853:1, 7.251:1 and 6.405:1 respectively. The implementation now consumes `--volt-ink` in the CTA, pin and lineup-sheet text selection; the CTA hover preserves the same semantic background/foreground pair. This source correction was directly inspected. The shared club invitation also uses its matching fill and foreground instead of treating the text color as a filled control.

Actual club-button night ink is the existing `#122C35`, rather than the deeper picker canvas. Its contrast on night teal/saffron/berry/blue is 9.107:1 / 9.727:1 / 7.790:1 / 9.419:1; day saffron is 8.818:1. Those actual pairings also clear the normal-text threshold. The research table above deliberately distinguishes the representative picker pairings from the implemented semantic foreground. Material compositing, physical-device glare and all runtime accessibility states remain wider verification concerns; they are not inferred from these solid-color calculations.
