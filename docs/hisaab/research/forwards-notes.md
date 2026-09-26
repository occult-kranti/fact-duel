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

## Fact audit (26 Sep 2026)

Independent audit of all 40 items by a second agent (release gate). Method: every `sourceUrl` and
every `sources` URL (56 in all) was fetched with curl and read against the item's stem, correct option,
numbers and dates; 54 returned the page, 2 NDTV links returned 403 to this environment. Newest
reporting (to 26 Sep 2026) was searched through Google News RSS with link decoding for every item
that names a person or carries a status. Each item that names a person or describes wrongdoing was
cross-examined (strongest counter-reading, weakest link in the source chain, what would change the
verdict). Then a scripted giveaway scan compared the distinctive words and numbers of every correct
option in the whole bank with this lane's `explanation`/`outcome`/`otherSide`/`status`, and the
hits were read by hand. Results: **0 items dropped, 0 ids changed, 40 items kept**. `otherSide`
was added to all 22 items that carry `people`/`status` (no item is `kind: 'scam'`).
`node scripts/hisaab-validate.mjs` prints OK for the whole bank, and `node --test tests/hisaab-*.test.mjs` passes
(44 pass, 4 todo).

Lane stats after the audit: answer slots 10/10/10/10; difficulty simple 13 / expert 16 / extreme 11
(hfw038 moved from extreme to expert). The side-balance table above still holds: no verdict or
side changed.

### Fixes, item by item

- **hfw002** — "2013 India Today picture" was not in the source (BOOM only says it dates from his
  Gujarat CM years), so "2013" is removed. otherSide: UNESCO's statement to AFP.
- **hfw004** — Added BOOM's Nov 2017 fact-check (it flagged the missing context first) as a second
  source, and updated the status to match. The line "no public record of Modi making such a promise"
  moved into otherSide as Alt News's counterpoint against Gandhi.
- **hfw005** — Giveaway. The explanation said the clip used "the same misleading-clip trick earlier
  used against Gandhi", which answers hfw004. It is rewritten around how the Kannauj clip was cut
  (Alt News). Deccan Herald's copy of the fact-check is added as a second source. otherSide: no reply
  was reported from the Congress-linked sharers.
- **hfw006** — otherSide: Amit Shah's 2015 "a metaphor" explanation (BOOM). The Quint (Apr 2019) is
  added as a second source.
- **hfw007** — Newest reporting: no chargesheet or verdict was found. Hyderabad police's five arrests
  are added, attributed to the police. otherSide: the Congress denial ("He is not involved in any
  doctored video", The Guardian, 4 May 2024). The Guardian and Gujarat Samachar (arrest, custody,
  bail plea) are added as sources. The status now reads "on bail; no chargesheet or verdict".
- **hfw008** — The stem said the clip ended "Vote for justice, vote for Congress". That line belongs
  to a different clip described by TNM; BOOM's clip ends "Vote for Congress", and the stem is fixed.
  The status now says what Hindustan Times reported (18 Apr 2024): the FIR was filed at Khar police
  station against an unidentified person. No arrest was found. HT is added as a source. otherSide: no
  reply from the Congress sharers was reported, and the FIR names no party.
- **hfw009** — The status now says the FIR is against unknown persons and was filed on a Congress
  complaint (The Quint). The poll result (163 of 230) had no source, so ThePrint/PTI (3 Dec 2023) is
  added. otherSide: the clip's maker has not been identified.
- **hfw010** — otherSide: the kernel of truth behind the forward (the Modi–Putin call on 2 Mar, and
  the MEA's "specific inputs"). Vladimir Putin is added to `people`. Alt News (4 Mar 2022) is added as
  a second source.
- **hfw011** — otherSide: Toje did praise Modi's capacity for peace in the ABP interview but named no
  contender. The status now notes BOOM's Sep 2025 re-debunk.
- **hfw012** — The explanation left out the RBI's central line: "no gold was shifted… in 2014 or
  thereafter". It is added. Alt News (4 May 2019) is added as a second source. otherSide: the claimant
  (an unnamed candidate) said he relied on an RTI reply and the RBI's annual reports.
- **hfw013** — otherSide: the real trigger for the anger (the same GST round taxed pre-packed foods
  and hospital beds; BOOM). BOOM is added as a second source.
- **hfw015** — **Status was stale.** Two things were reported after June 2024:
  - Aug 2024 (FPJ, from RTI documents): MMRDA served the approach-road contractor a ₹1 crore notice
    over pavement quality.
  - Sep 2025 (TOI): MMRDA fined a different contractor ₹1 crore over monsoon surface damage on a 2-km
    stretch of the bridge itself, while saying the bridge was structurally safe.

  Both are now in `outcome` and `status`. Other changes:
  - "asphalt" is removed from the correct option because no source says it.
  - The explanation now carries MMRDA's detail from HT: Ramp 5, Ulwe, a service road.
  - The NDTV link (403 here) is replaced by HT, FPJ and TOI.
  - otherSide: the BJP/MMRDA reply.

  The June 2024 verdict (the cracks were on the approach road, not the bridge) still stands.
- **hfw017 / hfw018** — Mutual giveaway. hfw017's explanation said the Congress-win "BBC survey" was
  a fake, which answers hfw018. hfw018's option and explanation named the pro-BJP fake and "the BBC
  does no Indian pre-poll surveys", which answers hfw017. The fixes:
  - hfw017 drops the cross-reference.
  - hfw018 is re-angled (same id, answer slot and difficulty) to ask whom the forward credited with
    the survey. The answer is the CIA, KGB and Mossad, per Factly. Its explanation now cites the BBC
    editor's denial of this survey only.
- **hfw019** — Indian Express (5 Dec 2015) is added. It confirms the regret, that 1 of 7 photos was
  merged, and that a twin photo shows no flood outside the window. The superimposition sentence is
  reworded to that evidence. otherSide: the I&B ministry's 5 Dec 2015 statement.
- **hfw020** — otherSide: FM Sitharaman's Aug 2021 claim that oil-bond servicing stopped an excise
  cut (The News Minute), with TNM as a second source. Nirmala Sitharaman is added to `people`. The
  explanation now notes that Vajpayee's NDA also issued oil bonds (Factly).
- **hfw025 / hfw026** — Mutual giveaway. Each explanation named the other's hoax ("mirror image" and
  "reuses an older template"). Both cross-references are removed. hfw026's line about a "BBC graphic
  that listed Congress fourth" was not in Factly's article anyway. The replacement text is sourced
  (The Quint's 2018 version; Factly's 2023 debunk).
- **hfw027** — The Quint (12 May 2020) is added as a second source. otherSide: no reply from Sambit
  Patra was reported (Google News searched; AFP's check exists but is blocked here).
- **hfw029** — otherSide: the objections from the Congress and Mamata Banerjee (TOI). Mamata
  Banerjee is added to `people`. The status now says the MoU ran five years.
- **hfw030** — otherSide: Modi's own opening line ("whether… bhajans can also be used…") and the
  Wire Science op-ed critique. India Today (31 Aug 2022) is added as a second source.
- **hfw032** — The explanation said a Moneycontrol chart was "misread". India Today says
  Moneycontrol's own graphic carried the wrong figures and was later replaced. Corrected.
- **hfw033** — Giveaway risk. The "rule of thumb: a real scheme never asks you to forward a link"
  answered hfw034, so it is removed. otherSide: Chamoli Police's call and PIB's earlier denial
  (Factly).
- **hfw034** — "Something no government scheme does" is reworded to Factly's specific point (real
  schemes register on official portals).
- **hfw035** — otherSide: PIB Fact Check's May 2026 statement on a similar AI video of the FM ("has
  not endorsed… any such investment scheme", Mint). Mint is added as a source.
- **hfw036** — "The ministry said it does not indicate the quantum" is re-attributed. The PIB note
  cites the media reports as saying the figures do not indicate the quantum of black money.
- **hfw038** — **Cross-lane giveaway.** hst120 (states-north) asks for the new pay days (answer "5th
  and 10th"), and hfw038's answer and explanation stated exactly that. A first re-angle (the CM's
  reason) was also stated in hst120's explanation. The final version:
  - It now asks what Sukhu said when the BJP called it a financial crisis. Answer: no crisis, the new
    pay schedule was financial discipline (Business Today, 4 Sep 2024, now the `sourceUrl`; The Hindu
    moves to `sources`).
  - The explanation adds "first time in the state's history" (BT).
  - otherSide: Jai Ram Thakur's "complete crisis" remarks and his figures on loans. He is added to
    `people`.
  - Newest reporting goes into `outcome`: the 2026-27 salary deferrals for ministers, MLAs and senior
    officers after the revenue-deficit grant ended (Indian Express, Mar 2026). No percentages are
    given, because hst121 asks for the CM's share.
  - Difficulty is now expert, and the subtopic is renamed.
- **hfw039** — otherSide: Morning Consult's own weighting method (per The Wire).
- **hfw040** — **Status was missing a court view.** On 17 Oct 2022 the Supreme Court dismissed
  Kerala's challenge to the Thiruvananthapuram lease and rejected the argument that the bid was
  tailor-made (Indian Express). This is added to the status, otherSide and sources. The otherSide
  also carries minister K Rammohan Naidu's Dec 2024 Lok Sabha reply (DH), and he is added to
  `people`.

Checked and left as written (the source states the fact): hfw001, hfw003, hfw014, hfw016, hfw021,
hfw022, hfw023, hfw024, hfw028, hfw031, hfw037.

### Dropped

None.

### Unresolved: for the lead or reviewer

1. **hfw038 and hst120 cover one event** (Himachal's Sept 2024 salary shift). hfw038 no longer states
   hst120's answer. But hst120's explanation, which I may not edit, still describes the CM's
   savings rationale, and that nudges players toward hfw038's answer. The Hindu URL kept in hfw038's
   `sources` also has "5th… 10th" in its slug; `sources` is not rendered in the app today. Consider
   keeping only one of the pair, or re-angling hst120's explanation.
2. **hfw008 names film actors** (Aamir Khan, Ranveer Singh) as deepfake targets. They are public
   figures and accused of nothing, but charter §2.7 lists office holders, candidates and public
   companies. The lead should confirm this is acceptable, or anonymise to "a Bollywood star".
3. **hfw007 bail** rests on NDTV's 13 May 2024 report. Its headline is in Google News, but the page
   returns 403 here. The arrest, custody and bail plea are confirmed by The Guardian and Gujarat
   Samachar. No chargesheet or trial news was found as of Sep 2026.
4. **hfw035 otherSide** quotes PIB's May 2026 statement about a *similar* Sitharaman deepfake, not
   the Feb 2026 video in the question. The wording says so.
5. **hfw015** — The Aug 2024 ₹1 crore notice is reported by FPJ from an RTI activist's documents,
   and no MMRDA press release was found. The Sep 2025 fine concerns a different stretch and a
   different contractor.
6. **Stale-prone:** hfw021 (the IMF October 2026 WEO is due next month and may move India's rank);
   hfw039 (the tracker changes weekly); hfw007, hfw008 and hfw009 (open FIRs with no outcome).
7. **Not fetched:** NDTV (hfw007 bail) and AFP (hfw027) are blocked for this environment's fetchers.
   The NDTV link for hfw015 was removed.
