# Cricket redesign: marketing psychology and interruption review

Reviewed 2026-10-29. Five-expert panel, round 1 of 2. This document records product recommendations, not measured conversion claims.

## Observed friction

`app/screens/home-screen.tsx` currently stacks the knowledge-core hero, a player level card, live events, missions, an expedition, XP history and stamps. The main action is mixed with multiple progress systems. `app/shell/jhk-profile-gate.tsx` blocks play behind nickname, email and profile details. `app/screens/use-progression-feedback.tsx` produces quests, streak, cosmetic, rank and event toasts plus level/badge ceremonies. A budget limits presentation volume but still asks the player to process rewards unrelated to the next question.

The new entry should deliver a playable cricket question before asking for optional profile details. Keep server identity and recovery controls where needed, but email should not be a prerequisite to practice. Existing accounts must retain their saved records.

## Decision matrix

| Surface | Recommendation | Purpose |
|---|---|---|
| Home | One dominant **Play cricket** action, one **Play a friend** secondary action | Make the first choice obvious |
| Modes | Plain, brief rows for cricket, other sports/science and solo learning | Preserve scope without a wall of promotions |
| Identity | Automatic device guest; optional nickname/email from profile | Let people experience value before registration |
| Match search | Inline status and visible five-second deadline, plus Cancel | Make the wait predictable and reversible |
| Bot fallback | Explicit **Practice bot** label before play and in results | Set truthful expectations about the opponent |
| Round feedback | Correct/incorrect state next to the chosen answer, one explanation | Put feedback where the action happened |
| Results | Score first; **Play again** primary; **Review answers** secondary | Offer a clear next step without a reward sequence |
| Progress | Persist XP, collections and learning history behind Progress | Preserve optional depth without competing with play |
| Ads | After a completed match at a natural break, never during an answer | Protect concentration and avoid accidental interaction |

## Two design directions, one simple flow

**Floodlight:** deep forest green, warm white, scoreboard typography, a restrained cricket ground illustration and one short ball-flight transition. A bright primary control remains readable against the field. The hook is a direct challenge: **“Know cricket? Take your shot.”**

**Pavilion:** warm ivory, ink typography, cricket red, editorial scorecards and a graphic seam motif. Generous space makes the answer choices and match status easy to scan. The hook is **“Five questions. One good innings.”**

Both directions should expose the same game functions and differ in art direction rather than forcing players to relearn navigation. Use one remembered theme control in Settings or the header. Neither direction needs a promotional carousel, autoplay reward video, floating badge pile or persistent particle animation.

## Copy ready for implementation

| State | Suggested copy |
|---|---|
| Home description | Cricket questions. Quick duels. Play straight away. |
| Main action | Play cricket |
| Secondary action | Play a friend |
| Search starts | Looking for a player… |
| Search helper | If no player joins in 5 seconds, you’ll play a practice bot. |
| Search countdown | Practice bot starts in {n}s |
| Bot transition | Practice bot ready. Let’s play. |
| Bot results | Practice result · no human leaderboard change |
| Match complete | Your innings: {correct} of {total} correct |
| Next action | Play again |
| Exit action | Back to pavilion |
| Optional profile | Add a name. Email is optional. |
| Optional profile value | Save a recovery code to keep access on another device. |

Avoid implying a six-ball cricket over when the underlying game uses five questions. Avoid fictitious online counts, fabricated scarcity, forced streak messaging, loss-chasing language and disguised bots. Match-result actions should remain usable when an ad has no fill or fails.

## Evidence and limits

1. [NN/g: Login Walls Stop Users in Their Tracks](https://www.nngroup.com/articles/login-walls/) reports interaction cost from asking for registration before value is clear. Application here: make first play available as a guest. This is a design rationale, not a quantified forecast for this game.
2. [NN/g: Popups: 10 Problematic Trends and Alternatives](https://www.nngroup.com/articles/popups/) recommends avoiding premature prompts and interruptions during important tasks. Application: remove automatic reward ceremonies and use contextual inline feedback.
3. [NN/g: Indicators, Validations, and Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/) distinguishes input-related feedback from passive system notices. Application: place answer feedback near answers; leave actionable network errors visible until resolved.
4. [Google Ad Placement API](https://developers.google.com/ad-placement) and [adBreak reference](https://developers.google.com/ad-placement/apis/adbreak) describe HTML5 game placements and lifecycle callbacks, including completion callbacks when no ad shows. Application: use an existing approved provider only at terminal game transitions; do not let absent inventory block replay. The API’s existence does not establish publisher approval or ad availability.
5. [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) supports disabling nonessential motion. [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) explains controls for persistent moving content. Application: reduced-motion support, no competing looping visuals during questions, no flashing celebrations.
6. [Przybylski, Rigby & Ryan, 2010: A Motivational Model of Video Game Engagement](https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf) discusses competence, autonomy and relatedness. Design inference: source-backed explanations, voluntary mode choice and friend play offer more relevant reasons to return than repeated badge interruptions. The paper does not validate this particular implementation or prove a retention increase.
7. Book reference points: [Steve Krug’s author page for *Don’t Make Me Think*](https://sensible.com/dont-make-me-think/) and [Don Norman’s author page for *The Design of Everyday Things*](https://jnd.org/books/the-design-of-everyday-things-1st-ed/). Public author/publisher material was consulted; no claim is made to have downloaded or read entire books in this review. Application: obvious controls, short labels and immediate feedback.

## Verification criteria for round 2

- Fresh visitor can reach cricket play without email.
- A queued player sees the five-second fallback promise and Cancel.
- Every bot is labeled; practice never impersonates a human result.
- Home has one dominant action and does not display missions, XP log or reward ceremonies.
- Result screen has a visible replay path and optional answer review.
- Persistent errors are not suppressed by reward simplification.
- Reduced motion removes decorative travel/loop animations.
- Ads do not overlap a question or turn no-fill into a new wait screen.

## Measurement after release

Use first-play completion, median time from home action to first question, queue cancellation, fallback rate, completed matches per willing player, replay selection and answer-review use. Track ad errors/no-fill and post-ad exits separately. Compare the two visual themes with consistent game mechanics; theme selection is not a randomized experiment, so differences do not establish causation. No uplift estimates are asserted.

## Round 2: integrated flow and copy review

Reviewed the implementation in `app/screens/home-screen.tsx`, `app/arena.tsx`, `app/screens/online/live-duel-screen.tsx`, `app/shell/jhk-profile-gate.tsx`, `components/fx/fx-provider.tsx` and `static/cricket-themes.css`. This pass is a source review; browser/timing evidence belongs to the implementation verification record.

### Improvements confirmed in code

- Home now has a single visually dominant **Play cricket** action. The secondary **Just practice** control and mode rows serve distinct intentions. Missions, XP logs, stamps and player-level promotion no longer occupy home.
- The opening profile wall is optional. The email field accepts an empty value. Human online play retains an explicit beta age/terms checkbox; bot practice remains separate.
- Match search presents a visible five-second countdown, **Cancel search**, a clearly stated bot fallback and a notice that practice has no human leaderboard effect.
- Reward overlays are suppressed by default at the FX provider. Actionable online errors still render inline with retry controls.
- Advertising remains an explicit optional action after a completed human match. The result is already saved and **Return to result** is available. No new ad trigger interrupts answering.
- Floodlights and Pavilion share controls while changing typography, shapes, art treatment and palette. Decorative ball/bat entrances are brief and honor reduced-motion preferences.
- No invented online count, fabricated activity, false urgency or claimed retention uplift appears on home. The fixed five-question/four-choice labels describe mechanics; the money label communicates the zero real-money model.

### Small changes required for the promised path

| Priority | Finding at review time | Required correction |
|---|---|---|
| High | **Play cricket** enters the generic online desk, which initializes from stored favourite topics. A previous science preference can therefore open science beneath a cricket-specific CTA. | Carry a cricket topic intent into the online desk and preserve it through the search. Generic **Play** navigation can retain the saved preference. |
| High | **Challenge a friend** also enters the same generic online desk without a friend intent. Private-room controls are in a later side section, which falls below public play on narrow screens. | Carry a friend intent; focus/scroll to the private-room section, or present that section first. Keep the beta checkbox visible where its action depends on it. |
| Medium | A completed human game offers **Back to lobby** as the primary action. Replay is possible only after navigating back and selecting play again. | Add a direct **Play again** action that leaves the finished room, preserves the selected topic and starts the next allowed search. If keeping the lobby step, use a truthful **Choose next game** label instead of implying immediate replay. |
| Low | The lobby heading says **Your next rival awaits** even when availability is unknown. The explanatory line is accurate, so this is not a functional blocker. | Prefer **Your next innings starts here** or **Let’s find your next rival**. |

The two high-priority corrections connect existing controls to their advertised tasks; they add no new game system. Parent implementation owns fixes and verification. Existing source rationale remains NN/g's clear task paths and contextual feedback, plus Google's natural terminal ad placement and no-fill callbacks. This review introduces no further feature scope.

### Final integration disposition

The cricket CTA now passes an explicit topic; friend/join entry carries its intent and focuses the private section. Human results offer direct Play again with the finished topic retained. The lobby headline now says Your next innings starts here. Main round UI removes floating XP, combo celebration and speed-reward promotion, with the answer itself as feedback.
