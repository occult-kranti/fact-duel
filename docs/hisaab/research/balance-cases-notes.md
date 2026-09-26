# Balance cases: research notes (hgh100–hgh129)

Lane file: `editions/hisaab/bank/balance-cases.mjs` (`HISAAB_BALANCE_CASES`, 30 items). Researched
26 Sep 2026. **It is not registered in `bank/index.mjs`.** This pass could not edit other files, so
the lead has to register it.

## Why this lane exists

The balance audit (`docs/hisaab/review/balance.md`, §2, F1, §9.1–9.2) found two problems:

- 38 opposition politicians were named as accused, against 2 from the BJP.
- The years 2000–2013 held almost no accountability items.

This lane adds the BJP/NDA-side record: convictions, commission findings, clearances, and cases that
eased after a politician switched sides. It also adds early-era cases. The rules are the same as in
every other lane: exact dated status, no implied guilt, the other side's answer, non-person
distractors and deep-link sources.

## What the lane holds

| measure | value |
|---|---|
| items | 30 |
| difficulty | 10 simple, 10 expert, 10 extreme |
| answer slots | 8 / 8 / 7 / 7 |
| kind | 29 `scam`, 1 `institution` |
| items dated 2000–2013 | 16 (hgh100, 103–111, 117–119, 121, 123) |
| `govt` | BJP 11, NDA 8, UPA 5, INC 4, BSP 1, SS 1 |
| state | IN 13, KA 5, MH 5, GJ 2, AP 1, MP 1, HP 1, UP 1, AS 1 |

Checks:

- `node scripts/hisaab-validate.mjs editions/hisaab/bank/balance-cases.mjs` prints OK.
- `checkBank` over every registered lane plus this file finds 0 problems, so no id or question text
  is duplicated across lanes.
- `node --test tests/hisaab-*.test.mjs` passes 91/91. The lane is not registered yet, so the tests do
  not cover it.

### Who is named as accused or under probe, by party at the time

This is the audit's §2 measure. It excludes people named only as clearing officials or critics.

| party | people named |
|---|---|
| **BJP** | Bangaru Laxman, Dilip Singh Judeo, B.S. Yediyurappa, B.Y. Raghavendra, B.Y. Vijayendra, G. Janardhana Reddy, B. Sriramulu, Madal Virupakshappa, K.S. Eshwarappa, Laxmikant Sharma, Babu Bokhiria, Parshottam Solanki, Dileep Sanghani, Pankaja Munde, Anurag Thakur, P.K. Dhumal, Eknath Khadse, Arun Shourie, Kothapalli Geetha (BJP when convicted), and the three MPs in the cash-for-votes case (Kulaste, Argal, Bhagora) |
| **NDA ally (Samata Party)** | Jaya Jaitly, George Fernandes |
| **Named when in another party, later joined BJP/NDA** | Himanta Biswa Sarma (INC), Ajit Pawar (NCP), Ashok Chavan (INC), Pratap Sarnaik (SS), Babu Singh Kushwaha (BSP) |
| **Others** | Amar Singh (SP), Amit Jogi (INC), Sabitha Indra Reddy (INC, now BRS), Bharat Odedara (INC) |

Notes on the table:

- The cash-for-query item names no MPs. Six of those MPs were BJP.
- Praful Patel is named in hgh125, but the FIR did not list him as an accused.

**Outcomes are recorded as they stand, for every side:**

- **Convictions (5):** Laxman, Jaitly, Reddy, Geetha and Bokhiria. Bokhiria was later acquitted,
  Geetha's conviction is stayed, and Reddy's and Jaitly's sentences are suspended.
- **Acquittals, discharges and quashings:** Yediyurappa (2016), the Madal case, the HPCA FIR, the
  Judeo co-accused, the coffin case officers, and the cash-for-votes accused.
- **Closures:** Barak (court-accepted), MSCB (court-accepted), Praful Patel (pending before court),
  and the Eshwarappa 'B' report (protest petition pending).

## Method and tools

**Tools used.** No Exa tools were available (a ToolSearch for "exa" returned nothing), so the work
used these instead:

- **WebSearch**, for URLs from outlets it can reach.
- **Google News RSS**, for headlines and dates.
- **`curl` plus a BeautifulSoup text extractor**, to read every page cited. Helper scripts are in the
  session scratchpad, not the repo.
- **Indian Express daily sitemaps** (`indianexpress.com/sitemap.xml?yyyy=&mm=&dd=`), to turn IE
  headlines into URLs. WebSearch and WebFetch cannot reach IE, but `curl` can.

What did not work:

- **Google News article links** could not be decoded because Google returned a 429 rate-limit
  response.
- **Bing HTML** returned junk results.
- **reddit** was not used.

**Rules followed.**

- Every item's `sourceUrl` and extra `sources` were fetched and read.
- Every claim about a named person was cross-examined. The table below gives the strongest
  counter-reading, and what would make the item wrong.
- The bank was grepped first for every seed case, to avoid duplicates:
  - Narada / Suvendu Adhikari is already hst303.
  - The NAN scam is already hst231, so it was dropped from this lane.
  - Vyapam convictions are already hst221. The new hgh117 covers a different case, the 2012
    contract-teacher test.
  - The 40% commission is already hst235. Its explanation already mentions the Eshwarappa clearance;
    hgh116 asks a separate question.
  - hgh030 gives the "23 of 25 defectors got relief" aggregate. hgh124–hgh128 are the named cases
    behind it, from the same IE investigation, with each person's and each agency's reply.

**`govt` coding.** `govt` means who governed at the level concerned *when the alleged conduct
happened*. That is the rule the audit recommends for the whole bank (§8). As a result:

- **hgh113 (Janardhana Reddy, BJP) is coded `INC`, state `AP`.** The Obulapuram leases were granted
  by Andhra Pradesh's Congress government under YSR in 2007–09. The source says so, and the
  explanation says so.
- **hgh124 (Himanta, 2014), hgh126 (MSCB loans, 2007–17) and hgh127 (Adarsh approvals, to 2010) are
  coded `INC`.** These are Congress-era acts; the accused later joined the BJP.
- **hgh125 (Praful Patel, 2006 leases) and hgh129 (Geetha, 2009 loan) are coded `UPA`.**
- **hgh123 (Kushwaha) is coded `BSP`.** The NRHM conduct happened under Mayawati's government.
- **hgh128 (Sarnaik) is coded `SS`.** The sources do not date the MMRDA contract. `SS` covers both
  the 2020 FIR period (the Sena-led MVA) and the 2022 court acceptance (the Shinde Sena-led
  government). Flagged for the reviewer.
- **hgh108–hgh110 (cash-for-query, the 2007 ruling, cash-for-votes) are coded `UPA`.** That is who
  governed the Centre. The accused MPs were mostly BJP (hgh108) or were the BJP MPs displaying cash
  (hgh110).

So the `govt` column understates the BJP share of "who is under the cloud". The audit's proposed
`implicates` field would fix this.

## Items, sources and cross-examination

**Legend.** "Counter" is the strongest reading against the item as written. "Would change" is the
evidence that would make it wrong. Every URL below was fetched on 26 Sep 2026.

| id | case | key sources (fetched) | counter / would change |
|---|---|---|---|
| hgh100 | Tehelka sting, 2001: the product offered | DH/PTI 11 Oct 2012 (hand-held thermal imagers, Laxman quit); IE 31 Jul 2020 (Jaitly HC stay); IE 1 Mar 2014 (Laxman died, "on bail"); ThePrint 2017 (Jaitly: "no substance") | Counter: Laxman said stings that induce crime are "prohibited", and Jaitly says she was naive. Both are recorded. Would change: a Delhi HC ruling on Jaitly's appeal. None found. |
| hgh101 | Laxman sentence, 2012 | DH Oct 2012; IE Mar 2014 | Would change: a posthumous appeal ruling. None found. The status says "no appeal ruling reported", not "appeal pending". |
| hgh102 | Jaitly ₹2 lakh, 2020 | IE 31 Jul 2020; Tribune 26 Jul 2020 | IE says "hand held thermal cameras"; other outlets say "imagers". Would change: an HC ruling on her appeal. None found as of Sep 2026. |
| hgh103 | Barak closure, 2013 | BS/PTI 24 Dec 2013; BS/IANS 1 Feb 2017 (court accepted on 27 Jan) | This is a clearance item. The arms dealer is not named (private individual). |
| hgh104 | Laxmi Vilas hotel sale | DH/PTI 22 Oct 2020 (HC stay; ASG backed petitioners; loss claim ₹244 cr); The Wire (warrant stay) | **Stale-status risk.** No ruling was found after Oct 2020. If the HC has since quashed the case or vacated its stay, the status changes. |
| hgh105 | Coffin case, 2013 | BS/IANS 11 Dec 2013 | This item is about officials. Fernandes appears only to record that he was *not* charge-sheeted. |
| hgh106 | Petrol pump allotments | Tribune editorial 13 Oct 2004 (297 of 409, 73%); Tribune 6 Aug 2002 (the cancellation, Ram Naik's denial) | **The source is an editorial.** The numbers are its factual core. The date of the SC order was not found in a primary source. Allegations are attributed ("allegations that…"). Reviewer: swap in the SC order or a news report if one can be reached (Zee and DNA returned 403). |
| hgh107 | Judeo video, 2003 | Court judgment, CBI v. Dalip Singh Judev, 4 Apr 2016 (Indian Kanoon); Al Jazeera, 17 Nov 2003 | Primary source. Proceedings against Judeo abated by order of 30 Oct 2013; the other five were acquitted. The CBI's theory that Amit Jogi set up the filming was not proved. The status says so. |
| hgh108 | Cash-for-query, 2005: party count | DH/PTI 7 Dec 2017 (charges framed, party of each MP); DH 12 Dec 2023 (5 BJP + 3 BSP + 1 INC + 1 RJD in the Lok Sabha, plus 1 BJP in the Rajya Sabha) | Would change: a verdict. None was found in Google News through Sep 2026. No names are used. |
| hgh109 | SC 2007: expulsions upheld 4–1 | DH 12 Dec 2023 | This is an institution item. Its `otherSide` records only what DH states: the ruling was 4–1, not unanimous. |
| hgh110 | Cash-for-votes: discharge, 2013 | BS/IANS 22 Nov 2013 | Counter: the three BJP MPs describe themselves as whistleblowers, and this is recorded. The outcome for the charged aide is not known. |
| hgh111 | Karnataka Lokayukta, 2011 | ThePrint 11 May 2018 (₹16,085 cr, resignations); BS Oct 2013 (loss period 2006–10); Tribune 27 Oct 2016 (acquittal) | The period 2006–10 includes the JD(S)–BJP coalition, so the stem does not say "2006–10". The loss figure is the report's estimate, and the stem says so. |
| hgh112 | Yediyurappa acquittal, 2016 | Tribune/PTI 27 Oct 2016 | Would change: a CBI appeal. None was reported (search in Sep 2026). |
| hgh113 | Janardhana Reddy conviction, 2025 | South First 6 May 2025 (conviction, INC-era leases, Sabitha Indra Reddy acquitted); South First 11 Jun 2025 (HC suspension); DH 19 Jun 2025 (seat restored) | Would change: an HC ruling on his appeal. The final hearing had been set for Aug 2025; no ruling found. Google News shows the CBI appealing the co-accused's acquittals (Aug 2025). That article was not fetched and is not used. |
| hgh114 | D'Cunha commission, 2024 | TNM 9 Nov 2024 (₹2,117.53 per kit vs ₹400–1,444 local); DH 16 Nov 2024 (Yediyurappa: "malafide", "face it legally"); IE 1 Apr 2026 (FIR against officials in Dec 2024, no other action) | **Correction made while drafting.** The IE line "SIT yet to be formed" refers to the 40% commission SIT, not the COVID one, so the item says only "no other action". No reply from Sriramulu was found, and the item says so. |
| hgh115 | Madal Virupakshappa, 2023 | TNM 21 Dec 2023 (HC quash); TNM 1 Jan 2024 (the trap, the ₹6 cr seizure, the arrest); NIE 10 Apr 2025 (son discharged) | TNM's legal analysis questions the quashing. It is cited as a source but kept out of the item, to avoid editorialising. The son is a KAS officer and is not named. The complainant is not named. |
| hgh116 | Eshwarappa, 2022 | TNM 20 Jul 2022 ('B' report, his "vindicated" reply); TNM 23 Aug 2022 (family's protest petition) | The contractor is not named (private individual). Would change: a court ruling on the protest petition. None found. |
| hgh117 | Vyapam 2012: Laxmikant Sharma | DH/PTI 8 Feb 2018 (chargesheet: Sharma, his OSD and 85 others; his portfolio); DH Apr 2016 (arrested and expelled, June 2014); BS 1 Jun 2021 (death; "given a clean chit by the CBI in 2019, the sources added") | **Weak link.** The 2019 "clean chit" rests on unnamed sources in a death report, and may concern a different Vyapam case. The item attributes it ("reports then said"). Reviewer: verify it, or cut it. |
| hgh118 | Bokhiria, 2013 | BS/PTI 17 Nov 2014 | This is an acquittal item. A former Congress MP was convicted and acquitted with him, and the item says so. |
| hgh119 | Gujarat fisheries contracts | BS/PTI 28 Jul 2024; LiveLaw 4 Mar 2025 (trial stayed); DH 21 Sep 2012 (the state cabinet refused sanction and the Governor "snubbed the Modi government"; HC upheld the sanction) | The complainant is not named. Would change: a ruling on the HC stay after Apr 2025. None found. |
| hgh120 | Pankaja Munde 'chikki' purchases | IE/PTI 21 Dec 2016 (ACB closure, her reply); IE 12 Aug 2021 (PILs, payments stayed) | Would change: a final Bombay HC ruling on the PILs. None found. |
| hgh121 | HPCA land case (Anurag Thakur, P.K. Dhumal) | Tribune 3 Nov 2018 (SC quashed FIR; 2013 FIR; state's April 2018 withdrawal decision); Tribune 20 Nov 2018 ("by mistake"); BS/PTI 26 Mar 2018 (the BJP state government fielded its law officer for Thakur) | **`govt` = BJP is an inference.** The FIR targets ex-CM Dhumal, but no fetched source dates the lease. The outcome of the "mistake" relisting was not found. |
| hgh122 | Khadse, Bhosari land | FPJ 11 Dec 2025 (discharge rejected, ACB closure not accepted); DH 15 Jan 2021 (he left the BJP for the NCP) | Google News shows a non-bailable warrant issued and cancelled in Feb 2026, and a 2026 HC discharge plea in the ED case. These were not fetched and are not used. |
| hgh123 | Kushwaha joins BJP, 2012 | Tribune 8 Jan 2012 (membership on hold); DH 4 Jan 2012 (CBI raids, criticism, no ticket); BS 12 Jun 2024 (charged in 8 of 25 NRHM cases; won Jaunpur) | Would change: a conviction. None found. |
| hgh124 | Himanta Biswa Sarma, Saradha | The Wire 6 Feb 2019 (timeline; his "witness" and "baseless" replies); IE 3 Apr 2024 (open, no action) | **Defamation-sensitive.** In Apr 2024 Sarma sent IE a legal notice over its report, disputing the characterisation. Only OpIndia reports this, and it is not an acceptable source. So the item leads with his own account: a witness, not an accused. The alleged ₹3 crore is attributed to the Saradha chief's letter, with Sarma's denial. |
| hgh125 | Praful Patel, Air India leasing | Scroll 29 Mar 2024 (headline: "eight months after he joined NDA"); ANI 25 Feb 2026 (notice to the complainant CPIL; Patel not named as accused; ₹840 cr); TNM and ThePrint Mar 2024 | Scroll's body did not parse; the headline states the fact. Patel joined on 2 Jul 2023 and the report was filed on 19 Mar 2024, about 8.5 months. No public response from Patel was found, and the item says so. Would change: the court accepting or rejecting the closure (listed 12 Mar 2026; no result found). |
| hgh126 | Ajit Pawar, MSCB loans | Tribune/PTI 27 Feb 2026 (closure accepted; the 2020 / 2022 / 2024 sequence); FPJ 27 Feb 2026 (ED intervention rejected); IE 3 Apr 2024 (timeline); News On AIR 28 Jan 2026 (death) | The item is about the record, and is dated. His death is stated as fact with an official source. |
| hgh127 | Ashok Chavan, Adarsh | IE 3 Apr 2024 (SC stay on the trial since 2018, still in place; joined BJP Feb 2024); ThePrint Apr 2024 ("political accident"; sanction history); LawChakra Feb 2024 (the stay came on his appeal; his "nothing to do" quote) | **Open lead, not used.** Google News lists a Lawtext.in item dated 17 Sep 2026: "Bombay High Court Dismisses CBI Revision Against Dropping of Charges Against … Ashok Chavan in Adarsh …". It could not be fetched: the site returned 404 or JavaScript. It may be a new clearance, or a re-post of the 2015 ruling. Reviewer: verify it, and update the status if it is new. |
| hgh128 | Pratap Sarnaik, Topsgrup | IE 14 Jun 2025 (HC set aside the closure acceptance); IE 26 Nov 2020 (ED's ₹7 cr allegation); IE 3 Apr 2024 (timeline; June 2021 "harassment" letter) | IE 2024 dates the EOW closure report to Jan 2021; IE 2025 says Jan 2022. The item avoids the month. The complainant (a former employee) is not named. |
| hgh129 | Kothapalli Geetha | IE 3 Apr 2024 (timeline: joined BJP 2019; convicted Sep 2022; HC stay on the conviction in Mar 2024; CBI had not challenged it); ThePrint/PTI 14 Sep 2022 (the 2009 ₹25 cr loan grew to ₹42 cr) | Google News suggests she lost Araku in 2024. The result page was not fetched, so the item does not say so. No personal reply was found; the other side is the HC stay. |

## Seed leads dropped or not written

- **Narayan Rane.** No fetched source reported a change in a case's status together with his party
  switch. Dropped, as the brief requires.
- **Suvendu Adhikari (Narada).** Already covered by hst303, including the CBI's statement that it
  lacked Lok Sabha sanction.
- **NAN scam (Chhattisgarh, 2015).** Already covered by hst231.
- **Ajit Pawar, irrigation cases (Nov 2019 ACB affidavit).** Sources were found: Tribune Dec 2019 and
  The Federal Nov 2019. The ACB said the nine closed inquiries did not concern him. The ACB also filed
  an affidavit on 27 Nov 2019 finding no criminal liability for the VIDC chairman, one day after his
  brief alliance with the BJP ended. The timing is ambiguous and he already has hgh126, so it was not
  written. It is a good future lead.
- **Kripashankar Singh.** He was discharged in 2018 for lack of sanction, three years before he joined
  the BJP. The sanction had been refused in 2014, before the BJP took power in Maharashtra. It does
  not fit the "eased after switching" lens. Sources: IE 15 Feb 2018 and IE 3 Mar 2024.
- **Not researched for lack of time.** The Taj corridor (BSP–BJP coalition), Madhu Koda, UTI US-64,
  the Yediyurappa denotification cases, and Rajasthan's Ashok Singhvi case (2015).

## Statuses most at risk of going stale

In priority order:

1. hgh127 (Chavan): the Lawtext headline above.
2. hgh125 (Patel): the court's decision on the closure report is due.
3. hgh113 (Reddy): the HC appeal.
4. hgh102 (Jaitly): the HC appeal.
5. hgh119 (Solanki): the HC stay.
6. hgh122 (Khadse): framing of charges.
7. hgh104 (Shourie): the HC stay since 2020.
8. hgh128 (Sarnaik): a fresh magistrate order.
9. hgh116 (Eshwarappa): the protest petition.
10. hgh114 (D'Cunha): any FIR against the leaders.

## For the lead

- **Register the lane in `bank/index.mjs`.** For example, import `HISAAB_BALANCE_CASES` from
  `./balance-cases.mjs` and add it as `'balance-cases': HISAAB_BALANCE_CASES`. After that,
  `tests/hisaab-bank.test.mjs` checks it with the rest.
- **Route mix.** Five KA items and five MH items land in those state pools. Nineteen of the 30
  items are `scam` items coded `BJP` or `NDA`. Before these items reach players, apply the audit's §9.4
  route-mix cap (at most 2 `scam` cards per 6).

## Verification

Independent adversarial check, 26 Sep 2026, of all 30 items. Tools: no Exa tools were available
(ToolSearch "exa" found nothing). Sources were found through Google News RSS, WebSearch, Indian
Kanoon search and the Indian Express daily sitemaps, and read with `curl` plus an HTML/JSON-LD
article-body extractor, or with WebFetch where Cloudflare blocked `curl` (ThePrint). Every
`sourceUrl` and every extra source in the lane (72 URLs) was fetched and read, and at least one
further recent source was searched for each item. Each claim about a named person was
cross-examined: what is the strongest reading against it, is it the newest status, is the other side
the person's or the agency's own words, and does any option or wording imply guilt that no court
found.

**Result.** 30 items kept, none dropped, ids unchanged. One answer key was wrong (P0), seven statuses
were out of date or incomplete, ten `otherSide` lines were replaced with the person's own reply or a
stronger clearance, and seven sets of distractors were changed so no wrong option says a named, living
person was convicted, charged or arrested.

### P0: wrong answer key

- **hgh110 (cash-for-votes).** `correctIndex` 2 pointed at "Ordered a fresh probe by the CBI". The
  source (BS/IANS, 22 Nov 2013) says the court discharged Amar Singh, Kulkarni, the three BJP MPs and
  an activist and charged only Amar Singh's former aide. The correct option was moved to slot 2, so
  the answer spread stays 8/8/7/7.

### Status corrections (newest record, to Sep 2026)

| id | was | now | new source |
|---|---|---|---|
| hgh105 (coffin) | "US vendor did not appear" | Centre told the SC the vendor had been discharged; **SC dismissed the PILs for a probe on 13 Oct 2015**, saying nothing was found amiss in the CBI probe and trial | Tribune, 14 Oct 2015 |
| hgh106 (petrol pumps) | an editorial was the only source | News report of the SC order (Tribune, 12 Oct 2004: two-judge committee, 409 examined, 297 "tainted") and the SC's Dec 2002 judgment appointing Justices S.C. Agrawal and P.K. Bahri (Indian Kanoon). "No criminal case" was unverified and is now "no case against Ram Naik found" | Tribune 12 Oct 2004; *Onkar Lal Bajaj v. UoI* (20 Dec 2002) |
| hgh113 (Janardhana Reddy) | two acquittals stated as final | **CBI appealed the acquittals of Sabitha Indra Reddy and an ex-IAS officer; the HC admitted it (18 Aug 2025)**. Seat restored "subject to further judicial pronouncements". "The CBI said" became "the court found" for a convicted person | Siasat, 19 Aug 2025 |
| hgh117 (Laxmikant Sharma) | "reports said the CBI gave him a clean chit in 2019" | **That clean chit was in a different case**: the 2012 transport-constable test (Scroll/PTI and ANI, 20 Jan 2019), not the contract-teacher case the item asks about. The item now says so, and adds bail in all seven Vyapam cases (Dec 2015) | Scroll 20 Jan 2019; DH Dec 2015; Scroll 8 Feb 2018 |
| hgh119 (fisheries) | both ex-ministers facing trial | **SC discharged Dileep Sanghani on 27 Feb 2025**, finding "not even an iota of material" and no allegation that he sought or took a bribe. The HC stay covers Solanki's trial | ETV Bharat, 27 Feb 2025 |
| hgh121 (HPCA) | outcome of the "by mistake" FIR not found | **SC quashed the second (encroachment) FIR on 6 Dec 2018**, finding no criminality | Tribune, 7 Dec 2018 |
| hgh122 (Khadse) | "charges to be framed" | Khadse challenged the Dec 2025 order; **the Bombay HC put framing of charges on hold (10–11 Feb 2026)**. An NBW was issued and then cancelled when the couple appeared (13 Feb 2026) | IE, 11 and 13 Feb 2026 |
| hgh123 (Kushwaha) | no arrest in status | Arrested by the CBI on 3 Mar 2012 | Tribune/PTI, 18 May 2015 |
| hgh124 (Himanta) | "case open … no case against him found" (contradictory) | "not charge-sheeted in any report found; no CBI action since 2015". The explanation adds the exculpatory 2019 CBI remark (to TOI, via The Wire) that the probe had so far found no evidence against him | The Wire, 6 Feb 2019 |
| hgh127 (Chavan) | Lawtext lead unresolved | **Resolved: not new.** Lawtext's search page dates the ruling to **19 Nov 2014**. It is a write-up of an old judgment, not a 2026 clearance. The SC stay dates to Jan 2018 (IE timeline) | lawtext.in search results |

### Other side: replaced with the person's own words or a stronger clearance

- **hgh103:** "no reason to differ" was quoted as if verbatim. The court's words are "I do not find any
  reason to differ", so the quotation marks were removed. The denial is now attributed only to those
  IANS lists (Fernandes, Jaitly, the ex-treasurer and the dealer), not to "all the named accused".
- **hgh114:** Sriramulu's reply was found. He said he would quit politics if any wrongdoing by him was
  proved (Tribune/PTI, 9 Nov 2024).
- **hgh117:** His own words on release ("faith in the judiciary"), plus the separate 2019 CBI finding,
  correctly attributed.
- **hgh119:** The SC's discharge of Sanghani.
- **hgh121:** Dhumal called the cases "political vendetta". His statement also confirms "the BJP govt
  had allowed the construction", which now supports `govt: 'BJP'` (it was an inference before).
- **hgh122:** Khadse had been cleared by an earlier ACB inquiry and by the Zoting commission (DH, Jan
  2021), and has challenged the refusal to discharge him.
- **hgh123:** Kushwaha's own letter called the charges "false propaganda" and a political
  conspiracy.
- **hgh125:** Patel's reply was found (ANI, 1 May 2024): the CBI "found nothing against me", the FIR
  did not name him, and a group of ministers took the decisions.
- **hgh126:** A generic ED remark from the IE series was replaced with the court's own clearance: it
  rejected Anna Hazare's protest petitions and the ED's bid to intervene.
- **hgh128:** Adds the Sena's "political vendetta" line and the EOW finding of no cognisable offence.

### Distractors and wording (charter §2.2, §2.4)

- **Wrong options that named a real person's conviction, charge or arrest were replaced** with neutral
  procedural outcomes:
  - hgh110: "Convicted all the accused of bribery"
  - hgh112: "Convicted Yediyurappa alone" and "Convicted his two sons"; both sons are living public
    figures
  - hgh120: "Filed a chargesheet against her"
  - hgh122: "Convicted him of corruption"
  - hgh124: "An approver for the CBI", "An accused out on bail" and "Discharged by a special court"
  - hgh126: "Been arrested by the ED"
  - hgh128: "Ordered his arrest"
- **hgh107:** The stem said "mining rights in Chhattisgarh"; the judgment says "mining projects in the
  states of Chhattisgarh and Orissa".
- **hgh111:** "detailed how miners … colluded to cheat" became "the report said …". The transfers
  became "alleged illegal transfers", and "mining baron" was dropped.
- **hgh123:** "the NRHM scam" in the stem became "CBI probe over NRHM funds".
- **hgh106:** "a Supreme Court panel" became "a Supreme Court-appointed panel". The explanation now
  says the committee examined the allotments named in media reports, not all 3,000.

### `govt` recode

- **hgh128 (Sarnaik) is now `BJP`, not `SS`.**
  - Tribune/PTI (9 Dec 2020) says the ED was probing Topsgrup guards for MMRDA projects "during
    2014-15".
  - DH (Dec 2020) reports that the contracts ran 2014–17 and 2017–20.
  - Maharashtra was BJP-led from 31 Oct 2014 to Nov 2019. Most of the contract period, therefore,
    falls under a BJP-led government.
  - Residual risk: the first contract's month is unknown and could predate Oct 2014 (Congress–NCP).
- **New lane tally:** BJP 12, NDA 8, UPA 5, INC 4, BSP 1.

### Duplicates against the rest of the bank

The whole bank was grepped for every case in this lane: Tehelka, Barak, Laxmi Vilas, coffin, petrol
pumps, Judeo, cash-for-query, cash-for-votes, the Lokayukta mining report, Yediyurappa, Obulapuram,
D'Cunha, KSDL, Eshwarappa, Vyapam, Bokhiria, fisheries, chikki, HPCA, Khadse, Kushwaha/NRHM,
Saradha/Himanta, Praful Patel, MSCB/Ajit Pawar, Adarsh/Chavan, Sarnaik and Geetha.

- **One overlap: hgh116 and hst235.** hst235's explanation and status already record the police
  'B' report clearing Eshwarappa (Jul 2022), which was hgh116's answer. **hgh116 was rewritten** to
  ask a fact hst235 does not carry: the family's Aug 2022 petition asking the court to reject the
  clean chit and give the probe to another agency (TNM, 23 Aug 2022). The answer is still in slot 0.
- **Checked and distinct:**
  - hst221: a Vyapam 2008 exam, not the 2012 contract-teacher case.
  - hst306: the Saradha probe handed to the CBI, with no person named.
  - hmd040: News Live ownership.
  - hgh030: the 23-of-25 aggregate, with no names.
  - hpe203: a Chavan-cabinet slum cut-off, not Adarsh.

### Checks

- `node scripts/hisaab-validate.mjs` (whole bank directory) prints **OK — no problems**.
- The lane is **registered** in `editions/hisaab/bank/index.mjs` as `'balance-cases'`. `checkBank`
  over the 21 registered lanes (940 items) finds 0 problems.
- `node --test tests/hisaab-*.test.mjs` passes **91/91**.

### Route effect after registration

`deriveRoutes` over the registered bank:

- **State and sector routes respect `ROUTE_MIX`** (at most 2 scam cards). For example, `state-mh`
  deals hgh126 plus five non-scam cards.
- **Year routes have no scam cap.** `year-2012` now deals 3 scam cards, all from this lane (hgh101,
  hgh117, hgh119; NDA/BJP), with 3 non-scam cards. That is inside what the lane was meant to fix (the
  thin 2000–13 accountability record), but year routes are outside the §9.4 cap. Engine lane: consider
  `maxScams: 2` for `kind: 'year'`.
- **Same-case siblings share routes.** `sector-energy-mining` deals hgh111 (extreme) and hgh112
  (simple) together, and hgh111's receipt states the 2016 acquittal that hgh112 asks about. The
  chapter order deals simple before extreme, so there is no leak today. If route order changes, split
  them.

### Still unresolved (reviewer)

- hgh113:
  - The Hindu and TOI headlines (11–12 Jun 2025) say the HC suspended Reddy's *conviction* as well
    as his sentence; The South First says sentence.
  - The item says "sentence suspended" plus "seat restored", which is true on every reading.
- hgh118: A TOI headline (14 Feb 2017), "Government asks Babu Bokhiria, associates to pay Rs 150
  crore", could not be fetched. It may be a civil recovery tied to the same limestone case. The
  criminal status (acquitted, Nov 2014) is unaffected.
- hgh124: Sarma's Apr 2024 legal notice to the Indian Express is still reported only by OpIndia. The
  item continues to lead with his own account.
- hgh106: "No case against Ram Naik found" is a finding from absence, not a sourced clearance.
- hgh108 and hgh110: No trial outcome found, either for the 11 cash-for-query ex-MPs (charged Dec 2017)
  or for the cash-for-votes aide.
- hgh117: PTI (DH/Scroll) dates the contract-teacher recruitment to 2012. A Jan 2018 India.com
  report on a *different* Vyapam chargesheet (Varg-3, 95 accused) dates its exam to 2011. The two
  should not be confused. The "85 others" count is consistent across PTI, Scroll and Zee (87 accused
  in all).
