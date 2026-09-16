# Ad-funded economy — architecture decisions

**16 September 2026.** Decisions taken on the ad-tech lane (`lane-adtech.json`) and the competitor
lane (`lane-competitors.json`), both web-grounded and confidence-marked. Where a number is `likely`
or `UNVERIFIED` there, it is not repeated here as fact.

## 1. Where the wallet lives, and why it is honest either way

Google's help page for rewarded web ads says, verbatim: *"Server-side verification is an app only
feature and it is unavailable for web use."* Every other web rewarded provider we found (Playwire,
Venatus/AdinPlay, AppLixir) is in the same position: the completion signal is a browser event. A
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
Manager): direct monetary items may never be a reward, and an indirect reward must be *"redeemable
only within the publisher's platform"* and *"non-transferable"* — *"only redeemable and usable by
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
India $2-3, with anecdotes near $1. Web is quoted 30-70% lower, before ad-block loss (~30% of
users globally, ~49% in Germany). India's Q2 2026 rewarded eCPM fell a further 5% quarter on
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
