# Forward Court (`hfw`) — research notes

Lane file: `editions/hisaab/bank/forwards.mjs` (40 items, hfw001–hfw040, all `kind: 'forward'`).
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/forwards.mjs` → **OK** (also OK for the
whole bank directory). Answer slots 10/10/10/10; difficulty simple 13 / expert 15 / extreme 12.
All statuses verified in **2026-09** (`asOf: '2026-09'` on every item).

## Method

- Every item's `sourceUrl` is the fact-check article (or the official clarification) that states the
  answer, fetched and read this session. Extra fetched pages are in `sources`.
- Tools: WebSearch until the session-wide search budget ran out, then Google News RSS (with link
  decoding) and Factly site search via curl, plus direct page fetches. reddit.com not used.
- No communal claims (religion-based population, conversion or violence forwards) were considered.
  Two items touch religion only as context and do not target any community: hfw007 (the original
  2023 speech was about a religion-based state quota) and hfw030 (bhajan events).
- Private individuals are not named. The self-described "ex-ECIL engineer" in hfw016 is left unnamed.
  Journalists and news anchors are not named. Named people are office holders, candidates, party
  spokespersons, film actors who were deepfake targets, and a Nobel committee officer.

## Side balance

"Side served" is measured against **the government of the day at the level the claim is about** (the
`govt` field). The national alignment (pro-BJP/NDA vs pro-opposition) is shown too, because the two
state items for AAP-ruled Delhi and INC-ruled Himachal flip.

| verdict group | flattered ruling side | attacked ruling side / flattered opposition | neutral (hoax/scam) |
|---|---|---|---|
| Debunked: false, misleading, clipped, deepfake (35) | **15 (42.9%)** | **16 (45.7%)** | 4 (11.4%) |
| Same 35 by national alignment | 16 pro-BJP (45.7%) | 15 pro-opposition (42.9%) | 4 |
| True or true with context (5) | 1 (hfw039) | 4 (hfw036, 037, 038, 040) | — |

Both measures clear the 40% floor. `govt`: NDA 36, BJP 2 (GJ, MP), AAP 1 (DL), INC 1 (HP). States:
IN 35, GJ, MP, MH, DL, HP 1 each.

## Items, verdicts, side served and sources

Tag key: **PRO** = flattered the government of the day or attacked its opponents; **ANTI** =
attacked the government of the day or flattered the opposition; **NEU** = hoax or scam serving no side.

| id | claim (short) | finding | side (govt of day → national) | who pushed it | source |
|---|---|---|---|---|---|
| hfw001 | GPS nano-chip in ₹2,000 note (2016) | False — RBI spokesperson | PRO | WhatsApp | The News Minute, 9 Nov 2016 |
| hfw002 | UNESCO named Modi best PM | False — UNESCO doesn't rank leaders | PRO | WhatsApp | BOOM, 27 Nov 2022 (+ Factly anthem hoax, 2019) |
| hfw003 | NASA photo of India on Diwali | Not Diwali; 2003 NOAA composite | NEU | yearly forward | Factly, 23 Oct 2025 |
| hfw004 | Rahul Gandhi "potato to gold" (2017) | Clipped; he attributed it to Modi | PRO (GJ BJP) → pro-BJP | BJP IT cell head | Alt News, 22 Sep 2020 |
| hfw005 | Modi "potato to gold" (2020) | Edited clip of Modi mocking Gandhi | ANTI → pro-opp | Congress supporters | Alt News, 25 Sep 2020 |
| hfw006 | "Modi promised ₹15 lakh in every account" | Misleading — hypothetical in 2013 speech; Shah called it "jumla" | ANTI → pro-opp | opposition handles | BOOM, 22 Jan 2019 |
| hfw007 | Amit Shah vows to end SC/ST/OBC quotas (2024) | Doctored; FIR, arrest, bail | ANTI → pro-opp | Congress-linked handles | BOOM, 29 Apr 2024; Scroll; NDTV |
| hfw008 | Aamir Khan backs Congress (2024) | AI voice clone; FIR by actor | ANTI → pro-opp | Congress functionaries | BOOM, 16 Apr 2024; Tribune; TNM (Ranveer Singh) |
| hfw009 | Kamal Nath to end Ladli Behna (2023) | Fake audio; MP Police FIR | PRO (MP BJP) → pro-BJP | social media | BOOM, 3 Nov 2023; The Quint |
| hfw010 | Russia paused war at Modi's request | MEA: "absolutely inaccurate" | PRO | forwards, some TV | The Quint, 3 Mar 2022 |
| hfw011 | Nobel's Toje: Modi "biggest contender" | Toje: "fake news" | PRO | TV channels, X handles | Alt News, 17 Mar 2023; BOOM 2025 |
| hfw012 | 200 t of RBI gold secretly sent to Switzerland | False — RBI: normal overseas custody | ANTI → pro-opp | a candidate; INC handle | The Quint, 5 May 2019 |
| hfw013 | 18% GST on cremation | Misleading — works contracts only | ANTI → pro-opp | social media | Newschecker, 22 Jul 2022 |
| hfw014 | GST on UPI above ₹2,000 | False — Finance Ministry | ANTI → pro-opp | finance influencers | Alt News, 23 Apr 2025; PIB |
| hfw015 | Atal Setu cracked (2024) | Misleading — approach-road asphalt | ANTI (MH NDA) → pro-opp | state Congress chief | The Hindu, 21 Jun 2024 |
| hfw016 | EVMs hacked in 2014 (London event) | Unsupported; ECIL denial, ECI FIR | ANTI → pro-opp | event organisers | Scroll, 23 Jan 2019 |
| hfw017 | "BBC survey": BJP 323–380 seats | Fake — BBC | PRO | WhatsApp/Facebook | Alt News, 9 Apr 2019 |
| hfw018 | "BBC survey": Congress wins | Fake — BBC | ANTI → pro-opp | WhatsApp/Facebook | Factly, 13 Apr 2019 |
| hfw019 | PIB photo of PM over flooded Chennai | Merged image; PIB withdrew it | PRO | PIB (govt) | The Quint, 4 Apr 2018 |
| hfw020 | Fuel costly because of UPA oil bonds | Misleading — ₹73,696 cr vs ₹25 lakh cr | PRO | social media | Factly, 8 Apr 2022 |
| hfw021 | India already 4th-largest economy | Premature; IMF Apr 2026 had India 6th | PRO | NITI Aayog CEO | Alt News, 27 May 2025; The Wire, 16 Apr 2026 |
| hfw022 | India "4th most equal" per World Bank | Misleading — consumption vs income Gini | PRO | PIB (govt) | Alt News, 10 Jul 2025 |
| hfw023 | Metro photo as India's growth | Singapore's Jurong East MRT | PRO | BJP WB & Tripura handles | BOOM, 19 May 2024 |
| hfw024 | Navy wrecked Karachi port (May 2025) | Unfounded; visuals unrelated | PRO | TV channels | Alt News, 17 May 2025; BOOM |
| hfw025 | "BBC": Congress 4th most corrupt party | Fake site "BBC News Point" | PRO | social media | The Quint, 3 Oct 2025 |
| hfw026 | "CNN": BJP 4th most corrupt party | Fake, edited clip | ANTI → pro-opp | social media | Factly, 5 Jan 2026 |
| hfw027 | Rahul: "red zone is green zone" | Clipped ("national level" cut) | PRO | BJP spokesperson | Alt News, 11 May 2020 |
| hfw028 | Mohalla clinic is a garbage dump | Misleading — roadside sign | ANTI (DL AAP) → **pro-BJP** | BJP MPs | Alt News, 12 May 2022 |
| hfw029 | Red Fort sold to Dalmia | Misleading — 5-yr amenities MoU | ANTI → pro-opp | opposition parties | TOI, 29 Apr 2018; ThePrint |
| hfw030 | Modi: bhajans solve malnutrition | Misleading | ANTI → pro-opp | social media | BOOM, 1 Sep 2022 |
| hfw031 | 250 mn strike for farmers, 4 photos | Photos from 2018/Jan 2020 protests | ANTI → pro-opp | social media | BOOM, 16 Dec 2020 |
| hfw032 | Adani owes ₹120 lakh cr to banks | False — banks' total loan books | ANTI → pro-opp | social media | India Today, 22 Nov 2024 |
| hfw033 | Free 3-month recharge for Modi 3.0 | Fake; phishing-type links | NEU | scammers | Factly, 7 Jun 2024 |
| hfw034 | Free laptops for students (Covid) | Fraud link | NEU | scammers | Factly, 24 Sep 2020 |
| hfw035 | FM's ₹21,000 → ₹5.5 lakh platform | Deepfake | NEU | scammers | Factly, 13 Feb 2026 |
| hfw036 | Swiss funds of Indians hit ₹20,700 cr | True figure; deposits fell, bonds rose | ANTI → pro-opp (TRUE) | media headlines | PIB (MoF), 19 Jun 2021 |
| hfw037 | New Parliament leaked in rain | True; dome adhesive shifted, fixed | ANTI → pro-opp (TRUE) | opposition MPs | Hindustan Times, 1 Aug 2024 |
| hfw038 | HP Congress govt can't pay salaries | True with context — pay moved to 5th | ANTI (HP INC) → **pro-BJP** (TRUE) | BJP opposition | The Hindu, 4 Sep 2024 |
| hfw039 | Modi most popular leader, 68% | True per tracker; online panel | PRO (TRUE) | govt media, TV | The Wire, 26 Mar 2026; Akashvani |
| hfw040 | Rules bent to give Adani six airports | True with context — DEA "max two" note | ANTI → pro-opp (TRUE) | Rahul Gandhi (Lok Sabha) | Scroll, 9 Feb 2023; Deccan Herald (govt reply) |

## Dropped or merged, and why

- **UNESCO "best anthem" (Jana Gana Mana)**: merged into hfw002's explanation (same hoax
  template); Factly 2019 kept as a second source there.
- **PM Berozgari Bhatta Yojana scam**: verified (Factly, 7 Jul 2023) but held back to keep neutral
  scams at 4 and protect the side balance. First candidate for the next batch.
- **KTR deepfake on Telangana polling day (2023)**: no Indian fact-checker article found (only
  Al Jazeera's report of the BRS complaint); a NewsMeter piece from Jul 2026 is about a different clip.
- **Nirav Modi in the Davos 2018 group photo**: true, but it needs a dated legal status for a
  fugitive accused; dropped for legal risk.
- **Zee News' edited Rahul Gandhi "they're kids" clip (2022)**: the clip was tied to a communal
  killing; skipped under the no-communal rule.
- **Modi's "gas from a drain" story (2018)**: he did say it; the fact-checks argue about whether it
  works, so there's no clean answer to test.
- **"India overtook the UK" (2022)**: overlaps hfw021, and the IMF's April 2026 data put the UK back
  ahead of India.
- **Adhir Ranjan "vote for BJP" deepfake (2024), Mamata's "President made to stand" photo row
  (Mar 2026)**: seen only as headlines; not fetched in time.

## For the reviewer to double-check

1. **hfw007 status**: bail is sourced to NDTV's 13 May 2024 headline (found in the news index; ndtv.com
   blocks this environment's fetcher). FIR and arrest are confirmed via Scroll and BOOM. No verdict
   was found. Re-check for a chargesheet or trial news.
2. **hfw008 / hfw009 FIR outcomes**: FIRs were confirmed, but no follow-up was found.
   Statuses say "no outcome/verdict reported as of 2026-09".
3. **hfw021** relies on The Wire's reading of the IMF's April 2026 WEO (India 6th; 4th only in 2028).
   Re-check against the next WEO (October 2026), because the ranking can move again.
4. **hfw039**: Morning Consult numbers change weekly. The 68% figure is dated March 2026 (Akashvani).
5. **hfw040**: presents the DEA/NITI notes and the government's "transparent process" reply. It does
   not allege wrongdoing by the company. Re-check whether any court ruling has since come on the
   airport leases.
6. **Secondary URLs not fetched** (primary sources were fetched): NDTV (hfw007, hfw015), Scroll
   Parliament-leak link (hfw037).

Statuses most likely to go stale: hfw007, hfw008, hfw009 (live criminal cases), hfw021 (IMF
rankings), hfw039 (tracker).

## Ten candidate claims for the next batch

1. "PM Berozgari Bhatta Yojana pays ₹3,000–6,000 a month to unemployed youth" — NEU scam; Factly
   2023 (URL verified): https://factly.in/the-union-government-is-not-offering-any-unemployment-allowance-under-the-scheme-pradhan-mantri-berojgari-bhatta-yojana/
2. KTR "vote Congress" deepfake on Telangana polling day, 30 Nov 2023 — ANTI (vs BRS state govt);
   needs a BOOM/Decode/NewsMeter source.
3. World Bank: extreme poverty fell from 27.1% (2011-12) to 5.3% (2022-23) — PRO, likely TRUE with
   context (new $3/day line); PIB Apr 2025 and Frontline Jul 2025 as leads.
4. Rahul Gandhi: "Modi waived ₹16 lakh crore of billionaires' loans" (Apr 2024) — ANTI; write-off vs
   waiver; needs a 2024 fact-check (BOOM's 2018 "waivers vs write-offs" explainer is background).
5. Adhir Ranjan Chowdhury "vote for BJP" deepfake (May 2024; Kolkata Police called it manipulated) —
   PRO at the Centre, attacked Congress.
6. "UAE offered ₹700 crore for Kerala floods" (2018) — flattered the LDF state govt against the
   Centre; UAE envoy said no amount had been finalised.
7. Fake India Today screenshot predicting 17 Lok Sabha seats for SP in UP (BOOM, 2024) — pro-opposition.
8. Deepfake of Rahul Gandhi and Nirmala Sitharaman "discussing a quantum AI investment platform in
   Parliament" — NEU scam (Factly).
9. "Vande Bharat fitted with a crash guard" photo, digitally altered (BOOM, Nov 2022) — mocked the
   government (ANTI).
10. "₹500 notes will be withdrawn by March 2026" — NEU/ANTI rumour; PIB Fact Check (2025).

Also worth a look: AAP Gujarat "manifesto" fake (Vishvas News, Dec 2022); old photo of the Punjab CM
in hospital shared as new (DFRAC, Jul 2022); the fake "Telangana Scribe" newspaper about KTR
(NewsMeter, Apr 2025).
