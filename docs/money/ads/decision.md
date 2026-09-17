# Ad-funded economy — architecture decisions

**16 September 2026.** Decisions taken on the ad-tech lane (as corrected by its adversarial audit, `audit-1.json`: 17 defects, mostly citation and attribution; the two load-bearing quotes — no web SSV, non-transferable rewards — were confirmed verbatim on source) (`lane-adtech.json`) and the competitor
lane (`lane-competitors.json`), both web-grounded and confidence-marked. Where a number is `likely`
or `UNVERIFIED` there, it is not repeated here as fact.

## 1. Where the wallet lives, and why it is honest either way

Google's help page for rewarded web ads says, verbatim: *"Server-side verification is an app only
feature and it is unavailable for web use."* Every other web rewarded provider we found (Playwire,
Venatus/AdinPlay, AppLixir) is in the same position: the completion signal is a browser event.
(AppLixir markets a "signed server webhook"; the audit could not find it documented, so it is
treated as UNVERIFIED and not relied on.) A
server cannot know an ad played; it can only know a client said so.

So on the web, a server-held wallet buys no integrity over a device-held one — both trust the
client's word about the ad. What a server CAN add is *rate-limiting that the client cannot edit*:
a short-lived reward nonce issued before the ad, a completion that must arrive no sooner than the
ad's length, and daily caps enforced against an account rather than a browser. That is what
`lib/ads/nonce.mjs` is for, and it lands with accounts (M4).

Until then the economy runs on the device with the same reducer, the same caps and the same
cooldowns, and the design accepts that a determined user can grant themselves coins that are
worth nothing. **The only verified reward path is a store build**: AdMob SSV callbacks (signed,
rotating keys) via Capacitor, mediated by AppLovin MAX or Unity LevelPlay with their S2S callbacks.
That is phase two, and the web build is the acquisition funnel into it.

Consequence for the reward size: a web reward must be **cheap** — cheap enough that spoofing it is
not worth anyone's time, and cheap enough that the ad revenue behind it is not materially at risk.

## 2. Coins never move between players

Google's *Policies for ad units that offer rewards* (identical across AdSense, AdMob and Ad
Manager): direct monetary items may never be a reward, and an indirect reward must be redeemable only within the publisher's own platform (paraphrase — the
audit found that phrase is not verbatim) and *"non-transferable"* — *"only redeemable and usable by
the same user who received it, and is not directly convertible into direct monetary items or items
that can be transferred to a third party."*

A coin earned from an ad, staked into a pot, and won by the opponent has been transferred to a
third party. The policy text does not name games; the risk is a keyword-driven review reading
"your opponent takes your coins" and concluding exactly that.

**Decision.** The mental model, the copy and the books all say the same thing: a player pays an
**entry** to the house to play, and the house pays a **prize** to the winner. The loser's coins go
to the house. The winner's prize comes from the house. They are equal in size, so the house nets
zero — economically this is identical to a player-v-player stake — but no coin ever moves from one
player's balance to another's, and the ad reward is consumed by the same user who earned it.

In the ledger this is the existing `stake` → escrow → `settle` flow with one clarification already
in `accounts.mjs`: the escrow is *house-owned*, "owned by neither seat until it settles." The
words that must never appear are "your opponent's coins", "take their stake", "winner takes all".

This also keeps the competitor lane's strongest single finding — **one currency, one screen** —
without contradiction. A second "entries" currency was considered and rejected: every long-lived
competitor is being savaged in reviews for "a sea of gems, credits, gold bars", and the policy is
satisfied by the flow of the one currency, not by adding another.

## 3. Vocabulary

Out, everywhere a user or a reviewer can read it (UI, store listing, marketing, source strings):
**bet, wager, odds, jackpot, casino, slots, multiplier, gamble.** In: **entry, stake, play for
N coins, challenge, prize, pot** (sparingly). Google's simulated-gambling category explicitly lists
"sports betting"; a sports app whose UI says "bet coins" reads as simulated sports betting to
ad review, to store review, and to India's advertising prohibition. No clause hinges on the word.
It is risk management, and it is free.

## 4. Region and the reward table

App rewarded eCPMs (2025-26, `likely`): tier 1 (US, UK, DE) $14-22; tier 2 (FR, IT, ES) $8-10;
India $2-3, with anecdotes near $1. Web is materially lower: AppLixir's own latest figures are $4+ average, $7+ tier-1, $1-2 tier-3, so plan web at ~$4-7 rather than the $8-15 headline; and that is before ad-block loss (~30% of
users globally, ~31.5% in Germany per GWI; a 49% figure circulates but did not verify). India's Q2 2026 rewarded eCPM fell a further 5% quarter on
quarter.

The economy config carries a coins-per-ad table by region so that one ad watched is worth roughly
the same *revenue* everywhere. The tension the economy lane must resolve: at a 10:1 US:India eCPM
ratio, a revenue-flat table makes India nearly unplayable (five ads per entry). The placeholder in
`economy.mjs` deliberately does NOT encode that ratio yet.

## 5. Things only the founder can do

- **Buy a first-party domain.** AdSense will not approve a `github.io` subdomain; H5 Games Ads is
  application-only on top of an approved AdSense account. This is the first item on the critical
  path and it is not engineering.
- **Ship a Google-certified TCF 2.3 CMP** before any EEA/UK traffic (Google's own "Privacy &
  messaging" qualifies on web). The 28 February 2026 TCF 2.3 deadline has already passed.
- **Do not flag the product child-directed.** A misapplied flag costs ~70% of eCPM. Neutral age
  gate instead; India's DPDP forbids targeted ads to under-18s from May 2027 and needs its own plan.
- **Keep "Gambling & Betting (18+)" blocked** in AdSense/AdMob controls (it is off by default) and
  block the "Social Casino Games" category, at minimum for India and for unassured-age traffic.

## 6. What the competitor reviews say to build, in one line each

Opt-in ads only, never an interstitial in the duel flow. Reward credited visibly as a ledger line
the moment the completion fires. Every opponent badged Human / Practice bot / Ghost — never a hidden
bot (Papaya: a federal judge found it "undisputed" they ran bots while denying it 200+ times). A
fairness receipt per duel: both answer times, latency compensation. No RNG anywhere near the
economy — no wheels, no lotteries. A Report button on every answer reveal. No question repeats
within 30 days. No lives, hearts, energy or timers; a player at zero always has one free path. A
permanent "coins are not money" statement. Rewarded ad ≤ 30 s, visible countdown, close works on
the first tap. One primary action on the home screen and zero nag surfaces.

The lane flags, correctly, that coin-gated practice **can read as an energy wall**. The economy
already answers this: the floor, the daily grant, and `affordability()` saying exactly how many
ads away each thing is, so the ad is a priced choice on the screen and never a toll mid-flow.

## AdSense maximisation addendum — 17 September 2026

Source: `lane-adsense.json` (40 findings, every number carrying a source and a confidence; disagreements
recorded, not averaged). Five decisions, in the order they bite.

**1. Two surfaces, two stacks.** The static question/answer pages and share-your-score pages are
ordinary content pages: Auto ads (in-page load capped at 3), one manual unit right after the answer,
a bottom anchor on mobile, and a vignette on link-click only, with "additional triggers" OFF. The app
shell (lobby, duel, receipt, practice) never loads the Auto ads script; it carries only the H5 Games
Ads `reward` placement and at most one display unit under a content-bearing receipt. Reason: since
9 Feb 2026 vignettes fire on the browser back button and on "30 seconds of inactivity followed by
user interaction" — a quiz player's exact behaviour — and an anchor on a non-scrolling screen sits
over the answer controls; both are the H5 placement violations Google names verbatim ("interfere
with user navigation", "interrupt the user during periods of continuous game play").

**2. The receipt is content or it carries nothing.** Google's Inventory-value policy bans ads on
screens "used for alerts, navigation or other behavioral purposes" and on screens "without
publisher-content". The ad card below the duel receipt (commit 1960cd3) stays only while the receipt
above it shows the score, both answer times, the answer review, the rating change and the fairness
receipt, with "next duel" above the ad. No ad on loading, error, login, coin-empty or bare win/loss
transitions. Same rule for share pages: scoreboard plus question list, varied per set, noindex if thin.

**3. Apply with the content site, not the app.** AdSense review takes "a few days … in some cases
2-4 weeks"; "low value content" is the standard refusal for templated pages. Order: first-party
domain → About/Contact/Privacy live → question pages substantive (explanation, source, stats) and
indexed → AdSense application → only then the H5 Games Ads form ("approval is not guaranteed").
Cloudflare before applying: WAF rule that skips bot protection for `Mediapartners-Google`,
`Google-Display-Ads-Bot`, `AdsBot-Google`; `/ads.txt` at the root of the static assets; sellers.json
set to Transparent (confidential "might impact your revenue").

**4. Reward copy is a lint rule.** Rewarded inventory is the one explicit exception to "encouraging
clicks", and its own policy allows text "other than to describe the reward(s) offered" nowhere:
"Watch a short ad to earn 50 coins" is the whole permitted vocabulary. Out, in source strings:
"support us", "keep the game free", "help the developer", "click", arrows or hands at the ad,
countdowns on the opt-in. Equal-weight "No thanks". Display units labelled "Advertisement" only.
Rewards are gated in the reward layer, not the ad layer: per-account daily caps, device velocity,
no reward for datacentre/VPN ASNs — because India's "earn" ecosystems (paid-to-click, link
shorteners) will share an "earn coins" game, and farmed opt-in views read to Google as
"third-party services that generate clicks or impressions". Test only with `data-adbreak-test`.

**5. Plan India on published web numbers, not app benchmarks.** Web rewarded is $1-4 gross in
India on both vendor datasets that publish it (Playgama $1-3, AppLixir $1-4; they disagree 2x on
the US, $15-28 vs $6-15); entertainment display RPM is Rs 40-165; 48% of Indian consumers say
they block ads; FatChilli's EU rewarded-web fill is "up to 30%", so the reward card must hide when
`beforeReward` is not called. Demand peaks are IPL (April-May) and the September-November
festive window; the rummy/fantasy advertiser pool left Google Ads India on 21 Jan 2026 and is
not in any forecast. Payments: USD wire from Google Asia Pacific (Singapore), $100 threshold,
21st-26th, no Indian TDS, GST zero-rated only with an LUT; US withholding is disputed between
sources (15% vs 0%) and needs a CA's answer before the first payment.

Not decided here, flagged: Sporcle earns ~90% from ads and sells a $4/month ad-free tier as the
second line; Ezoic closed to sites under 250,000 monthly users on 19 Feb 2026; Raptive needs 25k
pageviews with 50% tier-1 traffic; Mediavine Journey (1,000 sessions, 70%) is the only managed
option that an India-heavy site could reach early, and only for the content pages.
