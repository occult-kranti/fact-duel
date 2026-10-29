# Release verification

29 October 2026. Source began at d1eed51. Verification uses the actual app and existing game engines; screenshots are browser captures, separate from generated concept art.

## Completed checks

- TypeScript `pnpm exec tsc --noEmit`: passed.
- Entire Node suite, including JHK, Hisaab, server authority, coins, races, persistence, question bank and new reading-timer/ad tests: **982 passed, zero failures**. The release log records the final count.
- `node scripts/gully-browser-check.mjs`: **73 acceptance checks passed**, zero runtime errors and zero ad-network requests. See `verification/browser-checks.json`.
- 320×568,390×844,844×390,1440×1000: home CTA above fold, no initial modal, day/night without horizontal overflow and remembered preference.
- Main route groups and custom setup tested at 390/1440; all task directory destinations and distinct rule views tested at 320. Custom settings closed by default, optional progress categories closed, keyboard disclosure works.
- One primary click, including 12 rapid synthetic repeats, reaches four enabled answers with explicit bot identity, 30-second timer and simple question difficulty. Keyboard answering moves focus to status; subsequent rapid presses cannot change the lock.
- Quick-single completion, collapsed stats/source review, direct replay and rapid replay tested. Full five-round 30-second simple practice also completes in the service test, retaining zero stake.
- Offline after page assets load and failed decorative artwork still allow local play. Blocked Web Storage does not prevent practice. Hindi and 200% text at 320 reflow. Search cancellation cannot revive fallback; unavailable human networking opens labelled separate bot practice.
- `tests/gully-static-auth.test.mjs`: static build resolves unavailable legacy auth and profile-sync helpers locally, avoiding a pointless 404 request to `/api/auth`; Supabase human sessions are unchanged.
- Production build `pnpm build:static` and `node scripts/jhk-assemble-pages.mjs`: passed, including deployment subpath and existing legal/deck/sister redirect assembly.
- `git diff --check`: passed. New directory/nav/display components lint clean. Scoped legacy component lint comparison has 13 existing errors/2 warnings versus 14 errors/3 warnings at baseline; a native image warning applies to the new static WebP. Full lint is not claimed clean. No lint gate or rule was disabled to obtain the functional results.

## Production smoke

Run `node scripts/gully-production-check.mjs` after the build. It serves the assembled real files under `/fact-duel/`, verifies the original artwork loads, then starts a question with one tap at 4× CPU throttling. It records answer count, timer, elapsed time, HTTP failures, runtime errors and ad requests in `verification/production-check.json`. The release production smoke passed: one click, four answers, 30-second timer, 4,288 ms until the playable question under 4× CPU throttling, zero HTTP failures, zero runtime errors and zero ad requests. This observed local timing is not a promise for physical phones or public networks.

## Review and limits

Two panel rounds reviewed changed artifacts and produced implemented corrections; see PANELS.md. Known legacy optional 3D chunks still produce a build size warning. They are not required for the home or timed question, and future optimization is separate from verified gameplay.

This is Chromium emulation plus code/engine testing. No claim is made of physical iPhone/Android coverage, TalkBack/VoiceOver user testing, a full WCAG audit, load testing many live human rivals, or real advertising approval/consent/provider validation. Human-search failure/cancellation is tested with deliberately aborted network requests. Existing server regression tests cover its contract; no real matches, emails or ad impressions were generated for this release.

Existing browser evidence in docs/cricket-redesign remains historical. Its old script entry now delegates to the maintained Gully suite; archived CRICKET_SKIP_* switches no longer select the current suite.
