# Jaanta Hai Kya: advertising placement and activation guide

Reviewed against official Google documentation on 29 October 2026. Advertising is disabled in this release. The new display component is a development layout preview, not an AdSense integration. There is no publisher ID, display slot, ad request, ad script, ad iframe, revenue promise or automatic activation in it.

## What is implemented

`app/ads/display-placement.tsx` accepts `home-footer`, `learn-footer` and `results-footer`. It returns `null` by default, including no empty container or reserved gap. A developer can pass `preview={true}` in a nonproduction build to inspect the space. Production ignores that prop. Preview text says **Advertisements** and **Layout preview · no advertisement loaded**. It contains no link, button, impression tracker or SDK. Slot names are placement identifiers, not Google slot IDs.

Home and learning footers are the intended future display locations. The results identifier exists for planning only: this release does not enable result display ads. Gameplay always takes priority. A display preview is not evidence of publisher approval, policy compliance or a working consent integration.

The existing optional H5 completion break remains a separate feature in `app/screens/online/completion-ad-break.tsx`, available only through server-backed human-match results and the existing approval/consent gates. Local practice results no longer mount it. The static practice transport holds rooms in memory; the current H5 provider reloads when it disposes the SDK, which would otherwise discard the local result. Practice retains score, sources and direct replay without an ad upsell.

## Two different advertising products

| Product | Intended use here | What must not happen |
| --- | --- | --- |
| Manual AdSense display | A labelled, static placement after home/learning content, introduced later with its own reviewed adapter | Do not turn display units into a forced pregame screen, a fake Play button or a coin reward |
| Approved H5 Games Ads / Ad Placement API | An optional natural break after a final recoverable human result, behind existing cadence and explicit user action | Do not invoke it during a question, countdown, matchmaking, reveal or unfinished match |

Google's [gameplay-page guidance](https://support.google.com/adsense/answer/2768340?hl=en) says Play controls should remain obvious and recommends at least 150 pixels between content ads and a game, or removing those ads from gameplay pages. This is a Google recommendation, not a blanket certification that any 150px layout is acceptable. Our design uses the stronger choice of **no display ads on active gameplay**. Its 150 CSS px spacing around future footer placements is an additional product rule.

Google's [placement policies](https://support.google.com/adsense/answer/1346295?hl=en) prohibit implementations that encourage accidental ad clicks or disguise ads as navigation. Use the neutral label **Advertisements**, visually separate from questions, sources and buttons. Do not point arrows at inventory, animate it, use game reward art beside it, or ask users to click it to support the game. A normal display click must never award coins or affect a score.

H5 uses a distinct approved lifecycle. Follow the [official API reference](https://developers.google.com/ad-placement/apis/adbreak) and [game-page setup](https://support.google.com/adsense/answer/9955214?hl=en). `adBreakDone` is the completion path even when no ad displays. Normal display units are not a substitute for that lifecycle. Neither product is activated by this document.

## Placement map and dimensions

All sizes below are CSS pixels. The box dimensions exclude the 150px clear space above and below and the small neutral label. They are design specifications for later integration; use the final provider's supported formats without stretching an actual creative.

| Placement | Page position | Mobile viewport below 360px | Mobile 360–767px | Desktop from 768px |
| --- | --- | --- | --- | --- |
| `home-footer` | After the complete home content, away from Play and friend actions | 250 × 250 preview | 300 × 250 preview | Up to 728 × 90 preview |
| `learn-footer` | After a complete learning overview, away from topic/lesson controls | 250 × 250 preview | 300 × 250 preview | Up to 728 × 90 preview |
| `results-footer` | Reserved identifier; unmounted and disabled in this release | No served inventory | No served inventory | No served inventory |

The preview width never exceeds its container; this lets designers inspect narrow screens without horizontal overflow. For a real unit, select a supported smaller unit or suppress the request if the actual available width is insufficient. Do not scale a 300px ad into a narrower box or crop it. The 728px desktop reservation also needs enough content width; viewport width alone is insufficient.

Keep at least 150px of noninteractive clear space between the future ad boundary and Play, replay, answer, share, navigation, disclosure or other frequently tapped controls. If the measured distance is smaller, omit that placement. A CSS margin on one wrapper does not prove adequate distance from sticky headers, bottom navigation, floating overlays or neighboring grid cells. Check rendered geometry. Keep ads in normal page flow; no fixed banners, side rails, anchors, sticky ads, overlays or carousels. A long page may simply show no ad to a player who starts immediately.

During reading, if there is approved fill, reserve the selected slot dimensions before inserting inventory. Do not move controls after the player begins touching the page. On no-fill, keep the already reserved region stable for that page view or collapse it only at a safe later navigation; never shift a nearby control under a finger. With ads disabled, the current component reserves nothing.

## Screen rules

| State | Display | Optional H5 |
| --- | --- | --- |
| Home / learning overview | Future manual footer only after consent and route checks | None |
| Topic chooser / account / settings / wallet / private friend room | None | None |
| Search / lobby / countdown / question / reveal / between-round reading | None; no requests, preload or refresh | None |
| Final local practice result | None in this release | None: result is not recoverable after SDK reload |
| Final server human result | None in this release | Existing gated opportunity only; score already settled |
| Error / offline / loading / unknown page | None | None |

An active game includes a room hidden behind another panel or an unfinished server match. Do not decide eligibility from the visible screen name alone. Starting or restoring a game must end advertising activity before the question appears. Removing a script element does not unload third-party SDK timers. A later display integration therefore needs a separate reading document or a verified full-document transition into a clean game document, preserving legitimate game intent. Do not graft a script onto this preview component and assume unmounting stops the SDK.

## Existing H5 configuration

The following are **public build-time** values already recognized by the JHK completion-break component and static build. They contain no secret credentials. Empty/false values keep serving disabled. Setting a flag is an assertion by the operator, not evidence of approval.

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_JHK_ADS_ENABLED` | Master switch; only literal `true` enables the eligibility check |
| `NEXT_PUBLIC_JHK_ADS_SITE_APPROVED` | Publisher has confirmed the actual site is approved |
| `NEXT_PUBLIC_JHK_ADS_AUTO_ADS_DISABLED` | Operator has disabled account/site Auto ads for this game |
| `NEXT_PUBLIC_JHK_ADS_CLIENT` | Actual approved `ca-pub-` identifier |
| `NEXT_PUBLIC_JHK_ADS_CMP_ID` | Identifier matching the reviewed consent adapter |
| `NEXT_PUBLIC_JHK_ADS_ORIGIN` | Exact HTTPS origin, without a path |
| `NEXT_PUBLIC_JHK_ADS_H5_ENABLED` | Separate H5 product switch |
| `NEXT_PUBLIC_JHK_ADS_H5_APPROVED` | Actual H5 approval confirmed by publisher |
| `NEXT_PUBLIC_JHK_ADS_H5_TEST` | Fake H5 inventory for an approved test build; never a production default |

These values do not configure a JHK manual display slot. No JHK display SDK adapter or real display slot is introduced in this redesign. Add and review that work separately before activating manual units. Do not borrow the sister game's publisher configuration, identity or inventory IDs.

The current H5 gate also requires the exact origin, ready CMP snapshot, matching provider, advertising/storage permission, satisfied regional rules, adult audience, completed game and online state. Missing/throwing/declined consent means no serving. The bridge name `window.hisaabAdConsent` is an existing shared adapter contract; it must report real provider signals, not an object of hard-coded `true` values. The game uses a stricter adult-only explicit-permission product rule. This is not an assertion that every country has identical requirements.

## Publisher, consent and domain setup

1. Confirm the actual domain/site status in the publisher account before setting any approval flag. Follow [Google site-status guidance](https://support.google.com/adsense/answer/12170222?hl=en). Keep the game playable while approval is pending.
2. Choose and integrate a real consent platform and vendor disclosures. Google's [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en) require a Google-certified TCF CMP for personalized ads in the EEA, UK and Switzerland. Review the current requirements for the chosen regions and format. Nonpersonalized ads do not remove every storage/consent obligation. Publish the privacy notice and provide an accessible preference-reopen action.
3. Test unknown, adult, minor, declined, pending, malformed, revoked and region-specific consent states. Advertising must fail closed; practice remains usable. Pass the provider's required consent signals to its actual SDK in addition to this application's eligibility check.
4. Follow [Google's ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en). The file belongs at the domain root, for example `https://YOUR_DOMAIN/ads.txt`. A file at `/fact-duel/ads.txt` does not serve that root URL on the current project-subpath deployment. Arrange the origin-root file through the repository/host that controls it, or use an appropriate custom domain. Copy the exact authorized seller line from the account; do not publish placeholder IDs. The client uses `ca-pub-…`; the seller declaration uses `pub-…`.
5. Disable Auto ads for the game site, including anchors, vignettes, side rails and in-page insertion. Google's [Auto ads overview](https://support.google.com/adsense/answer/9261805?hl=en) describes formats that can place inventory automatically. Keep these off. Do not rely on a fragment such as `#online` being a distinct excluded URL: this app reuses a document across views. Only an explicit, tested manual allowlist is suitable for future display serving.

## Result, no-fill and failure behavior

The existing opportunity cadence is after two wins or three losses, deduplicated by completion ID; a draw is not a new reward trigger. It is an opportunity, not a forced wait. The finished score and direct replay remain available even when inventory is absent. Do not make ads a prerequisite for a zero-stake game, answer review, profile restoration or friend play.

The existing H5 wrapper bounds loading at 4 seconds and its ready/showing lifecycle at 90 seconds. It has explicit cancel, offline and consent-change paths, pauses game sound, and restores focus on exit. The provider disposes via full reload after loading its SDK. Verify recovery of the exact finished server room before approving a real serving build. Do not offer this provider to a local practice room until a tested result snapshot/recovery implementation exists. Never reload an active game to refresh an ad.

No-fill, blocker, network error, SDK exception, hidden page or withdrawal must not change score, coins, ranking or question order. Do not automatically retry ad requests, refresh inventory on timers, or repeatedly reopen the same completed opportunity. Keep measurement limited to eligible placement outcomes and errors under the selected privacy policy; never log private player tokens or answer payloads for advertising.

The game uses simulated free coins with no purchase or cash-out. Ad activation must not change that product model. A paid entry, cash prize, redeemable reward or gambling promotion would require a fresh product and publisher-policy review; it is not authorized by these placements.

## Rollout and mobile QA

First use the local preview without any real ad network. Inspect 320, 360, 390, 430, 768 and 1440px widths; phone landscape; 200% text zoom; large font settings; keyboard focus; safe-area insets; bottom navigation; open disclosures; and reduced motion. Record slot bounds and distances to visible controls. Starting the first practice game must still require one click, unaffected by inventory.

Before later approved serving, verify in provider test mode: no requests before consent; no requests on protected screens; zero ad-network requests in the default disabled build; one SDK per eligible reading document; correct unit width; no overflow; no control movement during insertion; decline/revoke; no-fill; blocker; offline; slow/error/never-resolving SDK; cancel/Escape/focus return; fast replay; route change during load; duplicate completion; reload and finished-human-room recovery. Test using fake inventory or approved publisher tools, not clicks on live ads. Roll back the public flags if a screen, consent or recovery check fails.

Automated tests validate this release's default-off renderer, explicit development previews, production preview suppression and local-result H5 exclusion. They do not certify a future CMP, publisher account or real advertisement integration.
