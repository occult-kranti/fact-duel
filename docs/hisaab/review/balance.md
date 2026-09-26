# HISAAB DO — balance audit

Reviewer: balance auditor, 26 Sep 2026. Scope: all 20 lanes registered in
`editions/hisaab/bank/index.mjs` (910 items); charter §2.5 (balance across parties) and §4b.4
(every party). `sample.mjs` is not registered and was not audited.

Method: the bank was loaded from the registry and tabulated by script. `govt` is used exactly as
the lanes recorded it. Where the question is who is being accused, each item was also coded by
hand as the **party under the cloud**: the party whose government ran the thing when the alleged
act happened, or whose leader is accused. Every finding below was checked against the item's own
text. Where a fix needed a fact the item did not already carry, its source was fetched first.

**Verdict.** The bank is broadly even-handed. Across the whole bank, BJP/NDA and INC/UPA each
carry about a third of the wrongdoing items. Loaded words ("revdi", "bonanza", "populist",
"gimmick", "jumla") are nearly always attributed to whoever said them. Every one of the 114
`scam` items now has an `otherSide`. Acquittals and clearances show up for every side: 2G, CWG,
MUDA, the AP skill case, the Delhi excise discharge, Rafale, Adani/SEBI. Forward Court clears
the 40% floor on both sides.

Four problems are real:

- **Who gets named.** 38 opposition politicians are named as accused or under probe. Only 2
  BJP politicians are, and one of them was in the TMC at the time.
- **The West Bengal and Kerala route cards** show the ruling party only as the villain.
- **Thin early eras.** 2000–2013 holds almost no accountability items for any party.
- **Small wording asymmetries**, fixed in this pass (§7).

---

## 1. Items by `govt` × `kind` (910)

| govt | scheme | spend | scam | media | funding | forward | institution | total |
|---|---|---|---|---|---|---|---|---|
| NDA | 78 | 85 | 36 | 10 | 17 | 36 | 90 | 352 |
| BJP | 73 | 29 | 21 | 3 | · | 2 | 17 | 145 |
| INC | 48 | 17 | 14 | 2 | 1 | 1 | 6 | 89 |
| UPA | 23 | 20 | 3 | 2 | 2 | · | 6 | 56 |
| AAP | 8 | 8 | 3 | 1 | · | 1 | 1 | 22 |
| AIADMK | 12 | 3 | 2 | 1 | · | · | 2 | 20 |
| TMC | 8 | 3 | 8 | · | · | · | 1 | 20 |
| JDU | 12 | 4 | 1 | · | · | · | 2 | 19 |
| BJD | 10 | 6 | · | 1 | · | · | 1 | 18 |
| Other | 10 | 2 | 2 | · | · | · | 3 | 17 |
| LDF | 3 | 3 | 5 | 3 | 1 | · | 2 | 17 |
| DMK | 11 | 1 | 2 | 1 | · | · | 1 | 16 |
| BRS | 10 | 2 | 3 | 1 | · | · | · | 16 |
| SS | 8 | 1 | 1 | 2 | 1 | · | 2 | 15 |
| TDP | 8 | 3 | 1 | 1 | · | · | · | 13 |
| JMM | 5 | 1 | 3 | · | · | · | 1 | 10 |
| YSRCP | 2 | 4 | 2 | 1 | · | · | 1 | 10 |
| SP | 4 | 3 | 1 | · | · | · | · | 8 |
| President's Rule | · | 2 | 1 | · | · | · | 3 | 6 |
| UDF | 3 | 1 | 1 | 1 | · | · | · | 6 |
| NPP | 2 | · | 2 | · | · | · | 1 | 5 |
| ZPM | 1 | 4 | · | · | · | · | · | 5 |
| NDPP | 1 | 1 | 1 | · | · | · | 2 | 5 |
| SKM | 1 | 3 | · | · | · | · | 1 | 5 |
| CPI(M) | 2 | 1 | · | · | · | · | 2 | 5 |
| BSP | 2 | 2 | · | 1 | · | · | · | 5 |
| MNF | 2 | · | · | · | · | · | 1 | 3 |
| NCP | · | · | 1 | · | · | · | · | 1 |
| RJD | · | 1 | · | · | · | · | · | 1 |
| **total** | **347** | **210** | **114** | **31** | **22** | **40** | **146** | **910** |

**Level.** The Centre (`IN`) has 370 items: NDA 322, UPA 47, Other 1. The states have 540 items:
BJP 145, INC 89, NDA 30 (Centre measures coded to a state), AAP 22, AIADMK 20, TMC 20, JDU 19,
BJD 18, LDF 17, and so on.

**Era** (by `year`; Centre / states):

| era | Centre | states | scam items |
|---|---|---|---|
| 2000–04 | NDA 20, UPA 2 | 24 | 0 |
| 2005–09 | UPA 20 | 37 | 1 |
| 2010–14 | UPA 25, NDA 2 | 55 | 5 |
| 2015–19 | NDA 65, Other 1 | 90 | 15 |
| 2020–26 | NDA 235 | 334 | 93 |

The Centre skews NDA because the NDA has governed since 2014, and 2020–26 holds 63% of the bank.
That is proportional to the charter's 5–12-year focus. The thin 2000–2013 band is a structural
gap (§9.2), not a framing one.

## 2. Named people, by party, as the item states it

This counts the 146 names in `people[]`. Non-party names are left out: businesspeople, judges,
officials, journalists, actors. The party is the one the person belonged to when the item's
facts happened. "Accused / under probe" means named as an accused, a probe target or a
commission target.

| party | named as accused / under probe: people (mentions) | named in other roles: enacting, deciding, criticising (people, mentions) |
|---|---|---|
| INC | **16 (16)** | 12 (19) |
| AAP | 3 (4) | 4 (5) |
| BRS | 3 (3) | 2 (5) |
| TMC | 3 (3) | 3 (4) |
| DMK | 3 (6) | 2 (2) |
| BJP | **2 (2)**¹ | 15 (38) |
| AIADMK | 2 (2) | 3 (3) |
| RJD | 2 (2) | 1 (1) |
| CPI(M) | 1 (2) | 3 (4) |
| TDP | 1 (1) | 2 (2) |
| YSRCP | 1 (1) | 2 (2) |
| SAD, JMM, NCP | 1 each | 0 |
| SS, SP, JDU, NPP, NC, others | 0 | 1–4 each |

¹ Pema Khandu (hst324), and Suvendu Adhikari (hst303). Adhikari was in the TMC when the Narada
tape was made, and the item says he was never charge-sheeted.

The INC 16 are Manmohan Singh (summons quashed), Suresh Kalmadi (case closed), Sonia and Rahul
Gandhi, P. and Karti Chidambaram, Bhupinder Singh Hooda, Mahesh Joshi, Alamgir Alam, Digambar
Kamat, Churchill Alemao, Bhupesh Baghel, Kawasi Lakhma, Siddaramaiah (clean chit), B. Nagendra
and Vijay Darda.

**Is the party stated?** The item text states the accused's party in 22 of the 36 accused items.
Omissions fall on every side: the Gandhis, Kejriwal, Siddaramaiah, Naidu and Khandu. For Khandu,
the one BJP accused, the item named the Congress's demand but not his own party. That is fixed
in §7.

## 3. Wrongdoing items (151)

Wrongdoing items are all 114 `scam` items, plus 37 items of other kinds whose `status` describes
a case, a probe, an audit finding or a Model Code finding. Pure "no allegation" statuses are
excluded.

**3a. By `govt` as recorded:** NDA 50 · BJP 23 · INC 17 · TMC 8 · AAP 7 · UPA 6 · LDF 6 · BRS 5 ·
SP 3 · JDU 3 · JMM 3 · YSRCP 3 · Other 2 · SS 2 · DMK 2 · AIADMK 2 · TDP 2 · NPP 2 · President's
Rule 1 · NCP 1 · UDF 1 · NDPP 1 · BJD 1.

**3b. By party under the cloud** (hand-coded; a clearance means the status records an acquittal,
discharge, closure, clean chit, quashing or "not established" for at least one accused):

| party under the cloud | items | clearance recorded | ids |
|---|---|---|---|
| private / corporate (no party accused) | 27 | 6 | hgh001–010, hgh012–013, hgh017–020, hgh022, hgh042, hgh054–057, hgh059–060, hst201, hmd025, hel013 |
| BJP (state governments, a BJP ex-MLA, a BJP CM) | 23 | 4 | hst114, 125, 126, 132, 200, 202, 203, 205, 215, 221, 222, 223, 231, 235, 236, 315, 324, 325, hrf134, hel030, hel034, hmd042, hdb127 |
| INC (state governments, INC leaders) | 21 | 5 | hgh052, hst113, 123, 133, 143, 144, 145, 158, 217, 226, 227, 228, 233, 234, 319, hrf115, hrf131, hmd013, hel043, hfw007, hdb144 |
| NDA (Centre) | 12 | 1 | hgh014, hgh016, hgh023, hgh024, hsc031, hmd014, hmd045, hel017, hel018, hfw015, hfw040, hdb035 |
| UPA (Centre) | 11 | 6 | hgh045–051, hgh053, hmd022, hdb021, hpe016 |
| TMC | 9 | 0 | hst300–306, hrf123, hdb040 |
| AAP | 7 | 3 | hst100–102, hst107, hmd033, hdb128, hdb134 |
| LDF | 6 | 1 | hst239–241, hrf128, hrf135, hrf139 |
| BRS | 5 | 0 | hst259, 261, 262, hmd019, hdb236 |
| SP · JDU · YSRCP | 3 each | 0 | hst127, hdb110–111 · hst149, hst154, hdb140 · hst253, hst255, hmd029 |
| JMM · SS · DMK² · AIADMK · TDP · NPP | 2 each | 0–1 | hst156–157 · hst212, hmd017 · hst245–246 · hst247, hrf117 · hst252, hmd020 · hst334–335 |
| SAD, RJD, NCP, UDF, NDPP, BJD, J&K (NC/PDP era), President's Rule, several states (PAC) | 1 each | — | hst110, hst150, hst209, hst242, hst340, hdb316, hst138, hst139, hrf010 |

² hst245 is coded DMK (a DMK minister in 2025). The jobs were allegedly sold while he was an
AIADMK transport minister (2011–15), and the item now says so (§7).

**Reading.** BJP + NDA have 35 items and INC + UPA have 32, which is close to even. The
difference is *what* is shown:

- **BJP-state items** are institutional failures: exam leaks, the Morbi bridge, the Rajkot fire,
  Vyapam convictions, the 40% commission. The accused are officials or firms.
- **INC-state and UPA items** usually name the minister or chief minister.

That tracks the record the bank itself reports: an Indian Express count says 95% of politicians
in the CBI's and ED's net since 2014 are from the Opposition (hgh027, hgh028), and 23 of 25
defectors to the BJP got relief (hgh030). But it is not the whole record (§9.1).

**Other side.** All 114 `scam` items now carry `otherSide`; 108 had it before this pass. Of the
37 other wrongdoing items, 16 in the money-trail lanes still have none. Those 16 span UPA, INC,
LDF, SP, AAP, JDU, BRS, BJD, BJP and NDA, and most already carry the reply in the explanation.
It is a lane gap, not a party one (§9.5).

## 4. Pre-election items (207 tagged `pre-election`)

The incumbent is `govt`. "Won" means the incumbent's party or front formed or kept the
government after that poll, read from `poll.result` and the poll label. For a Centre measure
before a state poll, it means the BJP/NDA won that state.

| incumbent (govt) | items | incumbent won | incumbent lost | hung House | multi-state poll | promise kept after winning³ |
|---|---|---|---|---|---|---|
| NDA | 48 | 23 | 13 | 1 | 11 | · |
| BJP | 38 | 27 | 11 | · | · | · |
| INC | 30 | 7 | 19 | 3 | · | 1 |
| UPA | 18 | 10 | 8 | · | · | · |
| JDU | 9 | 9 | 0 | · | · | · |
| BRS | 8 | 3 | 4 | · | · | 1 |
| TMC | 7 | 5 | 2 | · | · | · |
| TDP | 6 | 1 | 4 | · | · | 1 |
| AIADMK | 6 | 0 | 4 | · | · | 2 |
| SS | 5 | 5 | 0 | · | · | · |
| DMK | 5 | 1 | 3 | · | · | 1 |
| LDF | 5 | 1 | 4 | · | · | · |
| Other (INLD, SAD, SDF) | 4 | 0 | 3 | · | · | 1 |
| BJD | 4 | 2 | 2 | · | · | · |
| AAP | 3 | 2 | 1 | · | · | · |
| SP | 3 | 0 | 2 | · | · | 1 |
| BSP | 2 | 0 | 2 | · | · | · |
| JMM | 2 | 2 | 0 | · | · | · |
| NDPP, NPP | 1 each | 1 each | 0 | · | · | · |
| YSRCP, UDF | 1 each | 0 | 1 each | · | · | · |
| **total** | **207** | **100** | **84** | **4** | **11** | **8** |

³ hst119, hst258, hpe100, hpe104, hpe110, hpe113, hpe117 and hpe120 describe a promise carried
out *after* winning, so `govt` is the winner by construction. They are kept out of won/lost.

By the party that made the measure or promise (`enactedBy[0]`; 13 were made in opposition):

- **BJP/NDA:** 90 items; its side won 54 and lost 24.
- **INC/UPA:** 48 items; its side won 17 and lost 27.
- **Regional parties:** 69 items; won 32, lost 30.

The INC's 19 losses follow the electoral record from 2013 to 2024. The framing is neutral:

- **Timing** appears in the stem about as often for each side: 69% of BJP/NDA stems, 70% of
  regional stems and 54% of INC/UPA stems.
- **Causal claims** about results are attributed to a named survey (Lokniti-CSDS in hpe144), or
  the item says outright that no study was cited (hpe039).
- **Motive words** ("poll bonanza", "gimmick", "revdi", "jumla", "populist") are attributed on
  both sides: hdb200/217 (BJP Goa), hdb121 (AAP), hdb315 (BJD), hpe139 (BRS), hpe019 (UPA),
  hpe214 (BJP MH), hpe218 (INC RJ).
- **Parallel criticism** exists for comparable schemes. PM-KISAN's ₹3,000 crore paid to 42 lakh
  ineligible people (hsc003) matches the UPA 2008 waiver's 8.5% ineligible accounts (hpe016).
  ECI and MCC findings appear against the BRS (hdb236, hrf124) and the YSRCP (hpe141). Congress
  MCC complaints against NDA measures appear too (hdb035), with statuses in the same register.

## 5. Forward Court: side served (40)

I re-checked the tags in `docs/hisaab/research/forwards-notes.md` against each item. I agree with
all 40.

| verdict group | flattered the ruling side / attacked its opponents | attacked the ruling side / flattered the opposition | neutral hoax or scam |
|---|---|---|---|
| Debunked: false, misleading, clipped or deepfake (35) | 15 (42.9%) | 16 (45.7%) | 4 |
| Same 35 by national alignment | pro-BJP 16 (45.7%) | pro-opposition 15 (42.9%) | 4 |
| True, or true with context (5) | 1 (hfw039) | 4 (hfw036, 037, 038, 040) | — |

The pushers are attributed symmetrically:

- **Congress side:** "shared by Congress" (hfw012), the Congress state chief (hfw015), Congress
  functionaries (hfw008), a Congress coordinator arrested with the party's denial (hfw007).
- **BJP side:** official BJP state handles (hfw023), BJP spokesperson Sambit Patra with a
  "no reply" note (hfw027), BJP MPs (hfw028), the BJP's IT cell head (hfw004), and PIB and the
  NITI Aayog CEO (hfw019, hfw021, hfw022).
- **Twin fakes are paired:** "potato to gold" (hfw004/005), BBC polls (hfw017/018) and "4th most
  corrupt party" (hfw025/026).

No change needed.

## 6. Framing findings (each checked against the item text)

**F1. Accused politicians are almost all from the opposition** (structural; §2 and §3b). In
wrongdoing items, 38 opposition politicians are named and 2 BJP politicians are. The items
themselves are careful: statuses, denials and clearances are present. The skew comes from item
selection. The record the bank already cites also includes, for example:

- Karnataka's Cunha commission recommending action against former CM B.S. Yediyurappa and former
  health minister B. Sriramulu (in hst235's own source, the Indian Express, Mar 2026);
- the Vyapam arrests of a BJP former minister;
- the Bellary mining cases;
- clean chits after party switches (named cases behind hgh030's aggregate).

Partly proportional, since central agencies act mostly against the opposition and the bank says
so. But state agencies under opposition governments have also acted against BJP leaders, and
none of those cases appears. **Recommendation:** §9.1.

**F2. The West Bengal Rajya Rounds route shows the TMC only as the villain.** Six cards are dealt
from a WB pool of 30. The route gets hst306, hst305, hst300 and hrf123 (four TMC `scam` items)
plus hst307 and hdb338 (two BJP scheme items). Yet the pool holds 8 TMC scheme and 3 TMC spend
items, including Kanyashree and its 2017 UN award (hdb301) and Lakshmir Bhandar.

The Kerala route has the same problem. It deals hst239, hst241, hrf106 and hrf119: four LDF
cards, all negative. Two NDA cards on the Centre's Wayanad response (hrf035, hrf036) are critical
of the Centre, so that route is at least two-sided.

Within `states-east`, the TMC appears 8 times: 7 `scam` and 1 election loss. Within
`states-west-south`, the LDF is 3 of 3 `scam`, the BRS 4 of 4 negative and the YSRCP 4 of 4
negative. Credit exists in the money-trail lanes, so this is a **route-composition** problem in
`editions/hisaab/engine/routes.mjs` (`pickCards` is a hash order with no govt/kind mix). It is not
a wording problem. **Not changed**: engine code is outside this lane. **Recommendation:** §9.4.

**F3. "Scam" wording was asymmetric.** Fixed:

- **hst123 (INC, HP):** the stem called it "Himachal's scholarship scam" as a bare fact, with no
  conviction. BJP-era stems say "alleged recruitment scam" (hst236) or "'NAN scam'" (hst231),
  and INC-era hst227 says "alleged liquor 'scam'".
- **hst306 (TMC, Saradha):** "the scam's inter-state reach", while the Centre's PACL item says
  "alleged Ponzi scheme" (hgh059).
- **hst205 (BJP, GJ):** "the fraud since 2016" appeared unattributed. Fixed as well, so the rule
  runs both ways.

**F4. Status-line denials were uneven.** The one BJP accused (Khandu, hst324) has "says he is
innocent" in his status line. Several opposition accused whose items *record* a denial did not:

- hst150 (Lalu/Rabri, RJD)
- hst158 (Alamgir Alam, INC)
- hst145 (Mahesh Joshi, INC)
- hst239 (Pinarayi Vijayan, CPI(M))
- hst156 (Hemant Soren, JMM)
- hst110 (Bikram Singh Majithia, SAD)

The denial now appears in each status, taken from the item's own `otherSide`. Not changed:

- hst101/102 (Kejriwal) and hst113 (Hooda): the items record no denial, and hst101/102 already
  carry the stronger fact, a discharge.
- hst227 (Lakhma): only a counsel's argument is recorded.

**F5. Comparable CM cases were named asymmetrically.** hst233 names Siddaramaiah (INC) in the
stem ("the wife of Siddaramaiah"), and so do the stems for Kejriwal, Soren and Baghel. hst324
said only "the CM's family" for BJP CM Pema Khandu and never gave his party. **Fixed:** named in
the stem, with "BJP Chief Minister" in the explanation. The Hindu's source, already in `sources`,
says "The current BJP CM Pema Khandu".

**F6. Party switchers lacked context.**

- **hst245 (Senthil Balaji):** coded DMK and framed as a DMK minister. The cash-for-jobs acts
  allegedly date from his 2011–15 term as an AIADMK transport minister, and the item did not say
  so. **Fixed** from The News Minute (fetched and added to `sources`).
- **hst217 (Louis Berger):** the stem called Digambar Kamat a "former Goa minister", but he is
  the sitting PWD minister in Goa's BJP-led government. **Fixed**: the stem now says "an ex-Goa
  CM and his then PWD minister", and the explanation says "then in the Congress, now PWD
  minister". Sources: Hindustan Times ("then with the Congress", already the item's source) and
  O Heraldo, 5 May 2026 ("PWD Minister Digambar Kamat"), added.
- **hst303 (Suvendu Adhikari):** already handles this correctly.

**F7. The government's own action was credited for BJP-era leaks but not INC-era ones.** In the
BJP-state exam-leak items, `otherSide` and the explanation credit the state's corrective action:

- hst125: re-test with free bus travel.
- hst126: cancelled on evidence.
- hst132: the state sought a CBI probe.
- hst325: the state sought the CBI probe and suspended officials.

hst144 (Rajasthan senior-teacher leak, INC) left out that the Congress government's own SOG made
the first arrest in April 2023, while the opposition BJP sought a CBI probe. **Fixed** from the
item's own source (The Hindu, 16 Sep 2023).

**F8. Who allotted the MUDA sites.** hst233 names Siddaramaiah in the stem. MUDA allotted the 14
sites in 2021, during BJP rule, and the lane notes flag it. The item's own source (Indian
Express, 6 Sep 2025) says so. The comparable BJP-state item already carries the reverse
attribution: hst223's `otherSide` notes the FRP-idol order was placed "under Congress rule".
**Fixed**: the allotment year and government are added to hst233's explanation.

**F9. Some relief-state `scam` items had no `otherSide`.** hrf115 (INC), hrf117 (AIADMK), hrf123
(TMC), hrf128 (LDF), hrf134 (BJP) and hrf139 (LDF) were the only `scam` items in the bank
without one. **Fixed**: each now has an `otherSide` built from the denial or clearance already in
its explanation or status. No new facts were added.

**Checked and found fair (no change):**

- **hst235 (40% commission, BJP):** the status says "found corruption". This is supported by the
  item's Indian Express source ("the commission confirmed evidence of corruption").
- **hmd019 (BRS channel blackout):** the stem says "coverage that angered the TRS government".
  This is supported by the source's headline and KCR's "bury" remark, and KTR's denial is the
  `otherSide`.
- **Channel blackouts (hmd019, hmd020, hmd029), journalist arrests (hmd014, hmd017, hmd042) and
  Centre–state relief disputes** (hrf030, 035, 036, 122, 133, 137): comparable wording, with
  both sides' figures on each side.
- **Rafale and Adani (NDA-era):** clean chits and denials present. **2G, CWG and coal
  (UPA-era):** acquittal, closure and the quashed Manmohan Singh summons present.

**Not fixable without a new source (flagged):**

- **hst105 (AAP Mohalla clinics, CAG):** no AAP reply is recorded. The Tribune source has none.
  Government replies are also missing from CAG items for the BJP (hst318, hst350), BJD (hst314),
  INC (hst238) and YSRCP (hst256), so this is not party-specific.
- **hel030 (Chandigarh mayor poll):** the presiding officer's BJP link is not stated. Congress
  functionaries' affiliations are stated in comparable items (hfw007). The item's sources
  (LiveLaw, Tribune) do not state it either. Verify before adding.

## 7. What I changed (wording only; ids, answers, `govt`, `kind` and `correctIndex` untouched)

| id | lane | field | change |
|---|---|---|---|
| hst123 | states-north | question | "Himachal's scholarship scam" → "Himachal's **alleged** scholarship scam" |
| hst144 | states-north | explanation | Adds the first SOG arrest in Apr 2023 "under the then Congress government", and "the Opposition BJP sought a CBI probe into the leaks". Source: The Hindu, the item's own. |
| hst145 | states-north | status | + "calls the case a conspiracy" (from its `otherSide`) |
| hst150 | states-north | status | + "the family denies the charges" (from its `otherSide`) |
| hst156 | states-north | status | + "his lawyers say the ED's case rests on hearsay" (from its `otherSide`) |
| hst158 | states-north | status | + "says he is innocent" (from its `otherSide`) |
| hst110 | states-north | status | + "his counsel calls it political vendetta" (from its `otherSide`) |
| hst205 | states-west-south | explanation | "put the fraud" → "put the **alleged** fraud" |
| hst217 | states-west-south | question, explanation, sources | Stem: "two former Goa ministers" → "an ex-Goa CM and his then PWD minister". Explanation: + "(then in the Congress, now PWD minister in Goa's BJP-led government)". Added O Heraldo, 5 May 2026. |
| hst233 | states-west-south | explanation | + "MUDA allotted the 14 sites … in 2021, during BJP rule in the state". Source: the item's Indian Express source. |
| hst239 | states-west-south | status | + "Vijayan denies favouring CMRL" (from its `otherSide`) |
| hst245 | states-west-south | explanation, sources | + the alleged acts date from his AIADMK transport-minister term (2011–15), and he joined the DMK in 2018. Added The News Minute. |
| hst306 | states-east | explanation | "the scam's inter-state reach" → "the case's inter-state reach" |
| hst324 | states-east | question, explanation | Stem names "CM Pema Khandu's family". Explanation: "BJP Chief Minister Pema Khandu". Source: The Hindu, the item's own. |
| hrf115, hrf117, hrf123, hrf128, hrf134, hrf139 | relief-states | + otherSide | Built from the clearance or denial already in each item |

Checks: `node scripts/hisaab-validate.mjs` prints OK, and `node --test tests/hisaab-*.test.mjs`
passes 74/74. All stems are ≤ 220 characters, explanations ≤ 420 and `otherSide` ≤ 240.

## 8. Data-quality notes on `govt`

`govt` means different things for wrongdoing items:

- **Year of the latest event.** hgh047 (2G appeal) is NDA; hmd022 (Kalaignar TV/2G) is NDA;
  hmd013 (Darda coal-block conviction, a UPA-era allocation) is NDA.
- **Government at the time of the alleged act.** hst150 (land-for-jobs) is coded UPA in 2026.
  hst110 (Majithia) is coded "Other" (SAD) in 2025, though AAP governed Punjab.
- **Party of the accused.** hst245 is DMK, though the acts allegedly happened under the AIADMK.

The `states-west-south` notes already set a clear rule: the government in office when the
alleged act happened. **Recommendation:** adopt that rule bank-wide, or add an optional
`implicates` field so the Rules §5 balance chips can count "who is under the cloud" separately
from "who governed when the item's event happened". Until then, read `govt` counts for `scam`
items with care (§3a vs §3b).

## 9. Remaining structural imbalances: recommendations for the content roadmap

All candidates below are leads to research; none has been verified for the bank. Each needs a
fetched source, a dated status and the other side, as usual.

1. **Accused politicians across parties (F1).** Add 6–10 items where BJP or NDA-ally leaders are
   named in cases, with their clearances where they exist. Leads:
   - The Cunha commission's recommendation on B.S. Yediyurappa and B. Sriramulu (already in
     hst235's source).
   - Vyapam arrests of a BJP former minister.
   - The Bellary mining cases and the Lokayukta report that led to a CM's resignation in 2011.
   - Party-switch clean chits behind hgh030 (Ajit Pawar's irrigation case and others).
   - The Chandigarh presiding officer's affiliation (hel030).

   Keep the statuses and denials as careful as the opposition items.
2. **Thin eras, 2000–2013.** 162 items in 14 years, only 3 of them `scam` items (1 before 2010). The Saal-dar-Saal routes
   for 2000–2012 therefore deal almost no accountability cards. Add era-balanced cases:
   - NDA-I Centre: Tehelka 2001, UTI 2001, petrol-pump allotments 2002.
   - UPA Centre: cash-for-votes 2008, and the Adarsh society in INC-ruled Maharashtra (2010).
   - States of every party: the Taj corridor (BSP), mining under a JMM-backed independent CM,
     the Jagan DA case, the Karnataka mining report (BJP), the fodder-scam convictions (RJD) and
     the Telgi stamp-paper case.

   Also add UPA-era credit and critique so the 2004–14 Centre is not mostly schemes.
3. **Credit items in the state lanes** for parties that appear only as villains in their own
   lane: the TMC in `states-east`, the LDF, BRS and YSRCP in `states-west-south`, and the JMM
   and AAP in `states-north`. Examples: audited outcomes of Kerala's welfare pensions or food
   kits, and Odisha-style disaster-preparedness credit where the record supports it. Or rely on
   the fix in item 4.
4. **Route mix (F2, engine lane).** In `deriveRoutes` / `pickCards`, cap `scam` cards at 2 of 6
   per state route, and require at least one non-`scam` card from each `govt` that has 3 or more
   items in the state's pool. Today the WB route is 4 TMC scams plus 2 BJP schemes, and the KL
   route is 4 negative LDF cards.
5. **Backfill `otherSide`** on the 16 remaining wrongdoing items in the money-trail lanes: hrf010,
   hrf131, hrf135, hdb021, hpe016, hdb035, hdb040, hdb110, hdb111, hdb127, hdb128, hdb134,
   hdb140, hdb144, hdb236, hdb316. Most already carry the reply in the explanation. Also add
   government replies to CAG items across parties (hst105, hst238, hst256, hst314, hst318,
   hst350).
6. **Forward Court growth.** Keep ≥ 40% each way. Only 4 of 40 forwards are state-level (GJ, MP,
   DL, HP). Add state forwards that flattered or attacked the TMC, DMK, LDF, BRS and BJP state
   governments. The neutral "PM Berozgari Bhatta" scam, already verified, is the first candidate.
7. **Pre-election balance** is fine as a record. Keep the 8 "promise kept after winning" items
   distinguishable (for example a note in `poll`), so win/loss counts are not read as incumbency
   outcomes.
