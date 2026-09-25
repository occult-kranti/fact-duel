# HISAAB DO: what Indian Reddit argues about (discourse research)

Lane 1.10 (discourse research). Prepared 2026-09-25 for the product owner and the content, design
and review lanes. Companion script: `scripts/research/reddit-pulse.mjs`.

> **Read the "Method & limits" section first.** Reddit itself (`reddit.com`, `oauth.reddit.com`)
> is blocked by this build environment's network policy. **No Reddit page, API, mirror, archive
> or proxy was read.** Everything below comes from third-party statistics pages, published
> reporting and research, Wikipedia, and background knowledge. Each claim is tagged with its
> source type:
>
> - **[GS]** GummySearch public subreddit pages, "Last updated: September 19, 2026"
> - **[SS]** subredditstats.com API snapshot, 2023-12-18
> - **[PR]** press or academic source, linked
> - **[WP]** Wikipedia, fetched 2026-09-25. It is only a pointer: lanes must cite primary sources.
> - **[BK]** my background knowledge. Treat it as unverified until a lane fetches a source.

---

## 0. The findings in brief

1. **Money is the most widespread topic, and identity and crime come next.** Of the 49 community
   profiles, **jobs, taxes and prices** surfaced in 17. Religion, caste and identity surfaced in
   15, and crime or women's safety in 12. On the right-leaning subs, identity content is also the
   most intense. HISAAB DO must not compete there (CHARTER §2.6), and it does not need to: the
   money topics already reach further.
2. **The money topics that both sides share are also the best game topics.** Right-leaning,
   left-leaning, finance and city subreddits are all angry about the same things: UPI charges
   (September 2026), exam paper leaks (NEET 2026), potholes and city budgets, and paying tax
   without seeing services. The game should lead with these.
3. **Each side uses its own labels, and each side also likes seeing its own labels mocked.** Left
   subs mock personality cults ("JustModiThings" flairs, "Stepmother of Democracy"). Right subs
   mock dynasty and "libs". Meme subs mock everyone. A rank ladder that satirises *the act of
   labelling* has an audience on both sides, as long as it never names a community or turns a
   leader's nickname into a punchline.
4. **Youth and "critical thinking" subreddits are growing fastest**: r/TwentiesIndia +300% a
   year, r/CriticalThinkingIndia +109%, r/TeenIndia +83%, r/indiadiscussion +42% **[GS]**. The 2026
   Cockroach Janta Party is a live example of youth reclaiming an insult as satire **[WP]**. That is
   the same move our "Certified Anti-National" ladder makes, so the tone will be familiar to this
   audience. We should not align with that movement, though.

---

## 1. Subreddit map (30 communities)

**How to read the table.**

- *Lean* is our reading of each community, not the community's own label. It is based on flair
  sets, sample topics, audience overlap ("similar subreddits") and press coverage. Communities
  drift, and one sub always has both kinds of users.
- *Members* comes from GummySearch (2026-09-19) unless another source is named. *Growth* is
  GummySearch's yearly member growth.
- *Status*: "active" means GummySearch listed the community in September 2026. A GummySearch 404
  only means "not indexed", not "banned". Quarantine flags could not be checked from here.
- Faith-community subreddits were deliberately **not** profiled or given a lean.

| # | Subreddit | Lean | Members (source, date) | Growth/yr | Status | What dominates its political discussion |
|---|---|---|---|---|---|---|
| 1 | r/india | centre-left (contested) | 3.5M (GS 2026-09); 2.07M (SS 2023-12); 704k (Quint, 2022-01) | +165k (5.0%) | active | Top flairs are Crime, then Politics. Topics: Iran war, Modi, "struggling". Sample: voter-roll deletions (Odisha), a Supreme Court remark on cancer-drug markups, protests over hostel food. Right-wing critics have accused its moderators of anti-government bias for years (OpIndia 2019 and a change.org petition; search snippets only) **[GS][SS][PR]** |
| 2 | r/IndiaSpeaks | right (nationalist) | 1.1M (GS) · 554k (SS 2023-12) | +23k (2.1%) | active (no quarantine flag on GS; unverified) | Flairs: General, Ask-India, Geopolitics, Economy/Policy, Politics, History & Culture. Sample: US pressure over Russian oil, UPI charges "palmed off onto customers", PMO sanction to prosecute IAS officers, a reported plan to cut NPTEL funding. Also religion-framed attacks on TV journalists and a steady communal undercurrent **[GS]** |
| 3 | r/unitedstatesofindia | left-liberal | 570k (GS) · 392k (SS 2023-12) | +31k (5.7%) | active | Flairs: Politics, a sarcastic "JustRamRajyaThings" flair, Opinion, Education. Sample: a comedian's shows cancelled after threats, women's safety, moral policing, a farmer sued for a pollution complaint ("Naya Bharat" sarcasm) **[GS]** |
| 4 | r/indianews | right-leaning aggregator | 251k (GS) · 192k (SS 2023-12) | +4k (1.6%) | active | Flairs: Crime & Corruption, International, Business/Economy/Infra, Governance & Policy, Internal Security, Defence. **Its flair set includes a communal-conspiracy flair** (do not reuse). Topics: Modi, violence, Iran, police, courts **[GS]** |
| 5 | r/librandu | left satire / meme | 55k (GS) · 39k (SS 2023-12) | +6k (12.5%) | active | The name reclaims a vulgar right-wing insult for liberals. Flairs mock the Hindu right: one mocks RSS supporters by their uniform, plus "JustModiThings", "Stepmother of Democracy", "MainStreamModia". Topics: Modi, caste, casteism, minority rights, nationalism. Jokes about GDP headlines and Adani **[GS][SS]** |
| 6 | r/Chodi | extreme right | 90k+ at ban (TIME) | — | **banned 2022-03-23** for promoting hate | Hindu-nationalist "free speech meme" sub that carried calls for violence against minorities. Its members moved to Telegram and similar platforms **[PR: TIME 2022-03-24; Quint 2022-01-25][WP]** |
| 7 | r/bakchodi | meme, right-leaning | 111k (GS) · 100k (SS 2023-12) | +5k (4.4%) | active | Flairs: "Bakchod News", an ironic "India Super Power 2020" flair, "Bait", a religion-baiting flair, a vulgar anti-liberal flair. Sample: Trump's 100% tariff threat over Russian oil, and a post alleging a local strongman's BJP links (so it is not uniformly pro-government) **[GS]** |
| 8 | r/indiadiscussion | right | 172k (GS) · 48k (SS 2023-12) | **+51k (42.2%)**, fastest-growing political sub in the sample | active | Flairs: Politics, Opinion, News, Geopolitics, Law & Order, Economy & Finance, Infrastructure. Sample: "who is better for the nation", "Boycott UPI", a JNU Palestine protest, a Manipur security operation, a critique of the Adani Dharavi redevelopment, gender-war bait. Overlaps with r/Conservative in GS's similar-subs list **[GS]** |
| 9 | r/IndianDankMemes | meme (youth, mostly apolitical) | 596k (GS) · 573k (SS 2023-12) | +20k (3.6%) | active | Flairs about JEE/NEET aspirants, "Normies won't understand", "OC hai bhai". Politics shows up mainly as exam and job pain **[GS]** |
| 10 | r/indiameme | meme (mixed) | 1.6M (GS) · 811k (SS 2023-12) | +103k (6.7%) | active | Flairs: Political, Political OC, Non-political. Topics: Iran, war, Modi, Holi, "hate". Sample: a "next PM" meme, and 25 lakh diyas lit for the PM's birthday **[GS]** |
| 11 | r/SaimanSays | meme (creator fan sub) | 598k (GS) · 561k (SS 2023-12) | +11k (1.8%) | active | Creator and internet-drama memes. Politics comes in through influencer controversies (2025 *India's Got Latent* row **[BK]**) **[GS][SS]** |
| 12 | r/dhruvrathee | left (fan sub of a YouTuber critical of the BJP government) | **unknown**: not indexed by GS; SS shows a near-empty sub in 2019 | — | unknown | Presumably follows the creator's video topics (electoral bonds, "dictatorship" framing, Ladakh, paper leaks) **[BK — unverified]** |
| 13 | r/Sham_Sharma_Show | right (fan sub of a right-leaning commentator) | ~70k (SS 2023-12); 2026 unknown (not indexed by GS) | — | unknown | Presumably follows the host's themes (geopolitics, "Lutyens media", opposition, policy critiques from the right) **[BK — unverified]** |
| 14 | r/IndianModerate | centre (self-described) | 11k (GS) · 3.5k (SS 2023-12) | +2k (23.1%) | active | Topics: rape/women's safety, BJP, Modi, Congress, Rahul Gandhi, religion, education, protests. Sample: the UPI-charges bill "passed without debate", a reported ₹50,000 offer to women ahead of UP polls, a vigilante attack on a reading circle, a TV anchor booked in Kerala, Article 370. In 2026 it reads critical of the ruling party **[GS]** |
| 15 | r/AskIndia | general | 910k (GS) · 93k (SS 2023-12) | +84k (10.2%) | active | Flairs: Ask opinion, Politics, Career, "India Development" (Delhi smog, "what is govt planning"), Education (NEP 2020). Topics: Iran, politics **[GS]** |
| 16 | r/indiasocial | general / social | 1.8M (GS) · 825k (SS 2023-12) | +187k (11.6%) | active | Venting, memes, food. Politics mostly arrives as rants **[GS]** |
| 17 | r/IndiaInvestments | finance | 958k (GS) · 587k (SS 2023-12) | +47k (5.2%) | active | Mutual funds, insurance, charges. Policy shows up as tax rules and SEBI/RBI decisions **[GS]** |
| 18 | r/IndianStreetBets | finance / meme | 576k (GS) · 234k (SS 2023-12) | +62k (12.1%) | active | Trading, options, Nifty. Sample: "net FDI falls 97% in 3 years", manipulation complaints, an "rip inflation" shitpost ("Mujhe kya, main toh bonds mein invest karta hoon"), broker jokes **[GS]** |
| 19 | r/CriticalThinkingIndia | centre-left / anti-incumbent (newer) | 148k (GS) | **+77k (109%)** | active | Topics: politics, government, **corruption**, religion, education, Iran, media, economy. Sample: UPI MDR called a "jumla" (no MDR promised, then MDR introduced), "paid media", a claim that US card networks lobbied for MDR, a post alleging a Congress MLA's relative drew a clinic salary without attending (Karnataka), untouchability practices **[GS]** |
| 20 | r/DesiMeta | right, hardline (Reddit-drama meta) | 26k (GS) · 23k (SS 2023-12) | +2k (8.9%) | active | Topics: politics, Pakistan, religion, media, terrorism, Congress, Modi. Sample: campaigns against caste reservation, "purge academics" posts, accusations of brigading. Hate speech on it was reported in 2022 **[GS][PR: Quint]** |
| 21 | r/IndiaTax | finance (taxpayer grievance) | 234k (GS) | +41k (21.3%) | active | Topics: tax, ITR, income, GST, notices, TDS. Sample: "collect tax, give freebies, win elections and repeat!", data privacy, import duty shock **[GS]** |
| 22 | r/bangalore | regional (Karnataka) | 1.1M (GS) · 554k (SS 2023-12) | +96k (9.5%) | active | Flairs: News, Rant, Politics, Citizen's Report. Sample: traffic, "flyover flooded", a new "software charge" on property tax, "everyone pays for the freebies". The north–south and language fights flare here too **[GS][PR: ThePrint 2025-11]** |
| 23 | r/mumbai | regional (Maharashtra) | 1.1M (GS) · 554k (SS 2023-12) | +85k (8.3%) | active | Flats and rent, careers, Holi. Politics shows up as civic life **[GS]** |
| 24 | r/delhi | regional (Delhi) | 1.4M (GS) · 623k (SS 2023-12) | +111k (8.7%) | active | Flairs: Rentals/Property, Traffic, Delhi Metro, Meme/Satire. Sample: 25% ethanol blending, racism faced by North-East residents. Seasonal smog **[GS][BK]** |
| 25 | r/kolkata | regional (West Bengal) | 476k (GS) · 192k (SS 2023-12) | +58k (14.0%) | active | Bengali identity, language, jobs, food. Context: the BJP won West Bengal for the first time in May 2026. Separately, the pre-poll voter-roll revision (SIR) removed over 9 million names **[GS][WP]** |
| 26 | r/Kerala | regional (Kerala) | 554k (GS) · 346k (SS 2023-12) | +50k (9.9%) | active | Flairs: News, Politics. Sample: campus elections, drug-case money trails. Context: UDF government from May 2026 **[GS][WP]** |
| 27 | r/TamilNadu | regional (Tamil Nadu) | 327k (GS) · 184k (SS 2023-12) | +25k (8.1%) | active | Tamil identity, politics, history, language, caste. Sample: diaspora enthusiasm for Vijay. Context: TVK won in May 2026, ending 59 years of Dravidian-party rule **[GS][WP]**. Hindi imposition and delimitation fights **[PR: ThePrint]** |
| 28 | r/hyderabad | regional (Telangana) | 614k (GS) · 279k (SS 2023-12) | +82k (15.3%) | active | Jobs, current events, food. Politics mostly civic **[GS]** |
| 29 | r/pune | regional (Maharashtra) | 302k (GS) · 145k (SS 2023-12) | +64k (26.9%) | active | Housing, college, local news **[GS]** |
| 30 | r/bihar | regional (Bihar) | 217k (GS) · 115k (SS 2023-12) | +42k (24.2%) | active | "Pain & anger" is its top discussion type. Sample: "the curse of Bihar", "why is everything costliest in Bihar?", the PM skipping Bihar's investment summit, police removing a political leader from a protest, exams, budget **[GS]** |

**Also scanned (not in the table):**

- Politics and geopolitics: r/GeopoliticsIndia (40k; Trump, Iran, tariffs, China), r/IndianTeenagers_pol (2k; hardline, religion and terror topics).
- Youth: r/TwentiesIndia (342k, +300%), r/TeenIndia (555k, +83%), r/IndianTeenagers (441k).
- Tech and history: r/IndiaTech (797k; UPI MDR), r/developersIndia (1.6M; jobs), r/IndianHistory (434k; the Mughal/temple/colonial "history wars").
- Regional: r/Chennai (577k), r/chennaicity (90k; "Chennai Infra", "Civic Watch" flairs), r/ahmedabad (213k), r/uttarpradesh (105k; Mahakumbh), r/karnataka (125k; language, flag), r/bengaluru_speaks (41k; Kannada-first), r/assam (123k; "the obsession with government jobs"), r/lucknow, r/jaipur, r/Goa, r/gujarat, r/punjab, r/Maharashtra.
- Not indexed by GS (status unknown): r/IndianLeft (5.7k in 2023), r/Hindutva, r/Bharat, r/IndiaRWResources.

**Academic anchor.** A 2025 study treated seven subs as "the most popular subreddits focused on
Indian politics": r/unitedstatesofindia, r/india, r/IndianModerate, r/IndiaMeme, r/IndiaSpeaks,
r/GeopoliticsIndia and r/IndiaNews. It collected 18,462 posts and 946,775 comments from Oct 2023
to Jul 2024. About 12.9% of posts were controversial overall, with r/unitedstatesofindia at 11.4%
and r/GeopoliticsIndia at 4.5% **[PR: arXiv 2503.03500]**.

---

## 2. The top 15 political and economic topics

**How the ranking works.** A topic *surfaces* in a community when it appears in that community's
top-10 topic keywords, its top flairs or their example posts (GummySearch, September 2026), or in
its 2023 keyword list (subredditstats). There are 49 community profiles in total; a
faith-community sub and a bot feed were scanned but excluded. Topics are ranked by how many
profiles they surface in, and ties are broken by secondary sources. The two biggest non-money
magnets are **identity/religion/caste (15 profiles)** and **crime/women's safety (12)**. Both are
out of scope (§2.6) and are left out of the ranking below.

The script's broader "jobs, prices, taxes" bucket hit 17 profiles. Below it is split into finer
topics: 2 (tariffs), 5, 7 and 10. Once split, none of those reaches 12, which is why
leader-centric talk comes out on top.

| Rank | Topic (SECTOR) | Surfaced in | Who pushes it, and how |
|---|---|---|---|
| 1 | **Leader cults and dynasty: "Modi vs Rahul", "who is better for the nation"** (Elections & Funding) | **12**: india, indianews, indiameme, IndianModerate, indiadiscussion, DesiMeta, librandu, TeenIndia, unitedstatesofindia, CriticalThinkingIndia, IndianTeenagers_pol, bihar | **Right:** dynasty (the Gandhi family), Congress-era scams, "there is no alternative". **Left:** mocks the personality cult ("JustModiThings", "Mahamanav", birthday diyas, GDP boasts), "jumla". **Meme subs:** roast both. *Game angle:* satirise the fandom ("bhakt of anyone"), never the leader. Use sourced facts on dynastic MPs and party income (ADR) |
| 2 | **War, fuel and tariffs: the 2026 Iran war, Hormuz, Russian oil, Trump's tariffs** (Energy & Mining / Jobs & Economy) | **10**: india (Iran 34 posts), indianews, indiadiscussion, AskIndia, CriticalThinkingIndia, indiameme, GeopoliticsIndia, IndiaSpeaks, bakchodi, delhi (ethanol) | **Right:** strategic autonomy, "India first", defends neutrality, blames global prices for fuel. **Left/opposition:** foreign-policy failure (Congress criticised the government for not condemning the US–Israel strikes **[WP]**), fuel taxes. *Game angle:* **fuel excise and cess collections, and LPG subsidy**. That is the money trail, not the war |
| 3 | **Civic infrastructure and city money: potholes, flooding, traffic, stampedes, property tax** (Infrastructure) | **10**: bangalore, delhi, chennaicity, lucknow, ahmedabad, Goa, Maharashtra (a festival crowd death), uttarpradesh (Mahakumbh), indiadiscussion, indianews (a fire truck with no water) | **Mostly cross-partisan anger at city corporations.** It turns partisan when the state and the Centre are run by different parties: "double engine" jokes from the left, blame for opposition-run states from the right. *Game angle:* Rajya Rounds can use municipal budgets, the Smart City spend, and CAG findings on roads and bridges |
| 4 | **Exams, paper leaks and education money (NEET 2026, NTA, CBSE marking, NPTEL funding)** (Education & Exams) | **8**: IndianDankMemes, AskIndia, india, IndiaSpeaks, unitedstatesofindia, jaipur, CriticalThinkingIndia, IndianModerate; plus 3 secondary sources (NEET 2026 cancelled on 12 May 2026, Jantar Mantar protests, Education Minister resigned 25 Jul 2026) **[WP]** | **Cross-partisan.** **Left and youth groups:** NTA accountability, the minister's resignation, the CJP protests. **Right:** "coaching mafia", leaks and recruitment cases in opposition-run states (Rajasthan paper leaks under the INC government, the West Bengal SSC recruitment case **[BK]**). **Meme subs:** aspirant trauma. *Game angle:* **leaks happened under every party**, so this is ideal for a balanced lane |
| 5 | **Jobs and unemployment (Gen Z, government-job hunger, layoffs, the "cockroach" remark)** (Jobs & Economy) | **8**: assam, hyderabad, ahmedabad, developersIndia, IndiaTech, TwentiesIndia, AskIndia, bihar; plus the CJP and ThePrint | **Left/centre:** PLFS and CMIE unemployment data, "pakoda employment" callbacks, the 2026 remark comparing jobless youth to "cockroaches" (the CJI later said he was misquoted) **[WP]**. **Right:** "job creators, not job seekers", EPFO payroll and Mudra data, "stop chasing sarkari naukri". *Game angle:* recruitment exam vacancies vs appointments, PLFS numbers over time |
| 6 | **Media capture and free speech (Godi media, anchors, comedians threatened, censorship)** (Media & Speech) | **6**: librandu ("MainStreamModia"), IndianModerate (a "Mainstream Media" flair), unitedstatesofindia, CriticalThinkingIndia ("paid media"), IndiaSpeaks (attacks on a journalist), DesiMeta ("News Sites" flair) | **Left:** "Godi media", press-freedom rankings, comedians' shows cancelled after threats. **Right:** "presstitute", "Lutyens media", foreign-media bias, attacks on named journalists. **Both** say "paid media". *Game angle:* **Kiska Media?**: who owns which outlet (for example, the Adani group's 2022 NDTV takeover and Reliance's Network18 **[BK]**), plus government ad spend |
| 7 | **Taxes, GST and the "middle-class ATM": "I pay 30% and get potholes"** (Jobs & Economy) | **6**: IndiaTax, bangalore, bihar, uttarpradesh, IndianStreetBets, CriticalThinkingIndia | **Middle-class and finance subs** (right-leaning or apolitical): "collect tax, give freebies, win elections, repeat". **Left:** the 2019 corporate tax cut vs GST on essentials. **Everyone:** tax notices and TDS pain. *Game angle:* **the premise of "Hisaab do"**: where a rupee of tax goes (Budget at a Glance), GST collections vs devolution |
| 8 | **Corruption, agencies and courts (scams, ED/CBI, sanction to prosecute, "washing machine")** (Governance & Institutions) | **6**: CriticalThinkingIndia (Corruption 19 posts), IndiaSpeaks, indianews (Crime & Corruption flair), india (Law & Courts), bakchodi, IndianModerate | **Right:** opposition-state scams (the Delhi excise policy case, West Bengal SSC recruitment, Karnataka MUDA), Congress-era 2G and CWG, "ED is just doing its job". **Left:** the "washing machine" (leaders under probe who switch sides and see their cases slow **[BK: Indian Express investigation, 2024]**), ED's low conviction rate, electoral-bond timing. *Game angle:* conviction and chargesheet data from Parliament answers; exact legal status on every case (§2.2) |
| 9 | **UPI charges / MDR (September 2026 flashpoint)** (Banking & Finance) | **6**: IndiaSpeaks, IndianModerate, indiadiscussion ("Boycott UPI"), CriticalThinkingIndia, IndiaTech, TwentiesIndia; plus 1 secondary source (the 2026 tax-laws amendment gives MDR a legal basis) **[WP]** | **This is unusual: right and left subs are angry about the same policy** and blame different culprits. The right blames customers being charged and US card-network lobbying. The left calls it a "jumla" and a broken promise. *Game angle:* a question that tests both sides. Who pays MDR, and what the law actually says. Freshest item for Aaj Ka Hisaab |
| 10 | **Cost of living and housing (rent, flats, "why is everything costly")** (Jobs & Economy) | **6**: mumbai (flats: 31 posts), ahmedabad, chennaicity (Rentals flair), delhi (Rentals/Property), bihar, IndianStreetBets | Mostly apolitical and urban. The left links it to inflation and GST. The right links it to state fuel VAT and opposition-state taxes. *Game angle:* food-inflation CPI and PMAY-Urban targets vs completions |
| 11 | **Crony capitalism (Adani, Ambani, loan write-offs)** (Banking & Finance) | **5**: indiadiscussion (Adani Dharavi), librandu (an Adani dystopia joke), india (2023 keywords), DesiMeta (2023 keywords), IndiaTech (a large corporate-loan settlement) | **Left:** Hindenburg's allegations (denied by the group), the US indictment (Nov 2024 **[BK]**), airports, Dharavi, coal, write-offs. **Right:** "Adani also won projects in Congress/Left-run states", "Hindenburg was a short-seller with an agenda". *Game angle:* **the other side's answer is part of the fact** (§2.3). Keep status exact |
| 12 | **Federalism, language and tax devolution (the north–south divide)** (Governance & Institutions) | **5**: TamilNadu, bengaluru_speaks, karnataka, kolkata, bihar; plus ThePrint (2025-11) | **Southern and eastern regional subs:** Hindi imposition, "we get X paise per rupee", delimitation. **North-leaning and right subs:** "freebie states", "one nation". Colourism and regional slurs show up in the comments **[PR: ThePrint]**. *Game angle:* Finance Commission devolution shares (sourced numbers, not slogans) |
| 13 | **Health costs (drug price control, insurance, hospitals)** (Health) | **5**: india (Supreme Court on cancer-drug markups), IndiaInvestments, IndiaTax, Kerala, lucknow | Mostly apolitical and consumer-focused. The left talks about privatisation. The right talks about Ayushman Bharat coverage. *Game angle:* Ayushman claims data, NPPA price caps |
| 14 | **Freebies and pre-poll cash transfers ("revdi" vs welfare)** (Welfare & Subsidies) | **4**: IndiaTax, bangalore, IndianModerate (a post on a reported ₹50,000 pre-poll offer to women in UP), bihar (a post on ₹10 lakh interest-free state startup loans) | **Right and middle class:** "revdi culture". **Left:** "welfare is a right". **Both** point at the other side's pre-poll cash: AAP's free power, Karnataka's guarantees, Maharashtra's Ladki Bahin, Bihar's 2025 women's scheme **[BK]**. *Game angle:* **every party does it**, so compare the schemes side by side with state-budget costs |
| 15 | **Election integrity (SIR voter-roll revision, "vote chori", EVMs, ECI)** (Elections & Funding) | **2** in the sample (india: 17.67 lakh names deleted in Odisha; IndianModerate: ECI timing), plus 2 secondary sources: Rahul Gandhi's Aug 2025 "vote chori" allegation (ECI dismissed it and asked for a sworn declaration, which was never filed) **[WP]**; 9M+ names removed in West Bengal before the 2026 polls **[WP]** | **Left/opposition:** "vote chori", SIR deletions, ECI independence. **Right:** "bad losers", the ECI's affidavit demand. Some right posts frame deletions communally ("infiltrators"): **avoid that frame**. The secondary evidence suggests the sample under-counts this topic. *Game angle:* ECI and SC records, deletion counts by state, with status dated |

**Evergreens: rare in the 2026 sample, high value for the game.** Reddit in 2026 is not talking
much about these, but they are the documented core of the last decade and each side still raises
them in arguments **[BK]**:

- **Electoral bonds.** Peaked in Feb–Apr 2024, when the Supreme Court struck the scheme down and
  SBI released the data.
- **Demonetisation.**
- **PM CARES.**
- **Rafale.**
- **Farm laws and MSP.**
- **Agnipath.**
- **F&O retail losses** (SEBI studies).
- **State cases across parties:** Delhi excise (AAP era), West Bengal SSC (TMC), MUDA (INC
  Karnataka), Mahadev app (INC Chhattisgarh era), Vyapam (BJP MP), Kaleshwaram (BRS), TASMAC
  (DMK), the AP skill-development case (TDP) and the AP liquor case (YSRCP).

Every one of these needs the §2.2 status line.

---

## 3. Label lexicon

**Rules for this section.**

- **SAFE**: usable in game copy about *the player* or *the concept*.
- **CAUTION**: usable only with the qualifier shown.
- **AVOID**: not in game copy.
- **UNSAFE**: a slur or smear. Described abstractly, never reproduced (§2.6).
- **No label is ever applied to a real person, party, outlet or community.** In 2024 a broadcast
  regulator penalised a news channel for tagging people with "tukde-tukde gang" and related
  separatist and "Pakistan" smears **[WP search snippet: NBDSA / Aaj Tak, Mar 2024]**. On the
  ladder, labels are only ever *self-applied* by the player.

### 3a. Political labels

| Label | Meaning | Who uses it, about whom | Satire verdict |
|---|---|---|---|
| **Andhbhakt** | "blind devotee" | Anti-BJP users about uncritical Modi/BJP supporters; now also about any party's blind fans | **SAFE, as reframed by the charter**: "devotee *of anyone*". Pair it with copy that includes every party's fans |
| **Bhakt** | a devotee; used as a pejorative for ardent Modi/BJP supporters **[WP: Bhakt (pejorative)]** | Same | **SAFE with care**: never with deity imagery, temples or saffron visuals |
| **IT Cell** | a party's social-media department (originally the BJP IT Cell **[WP]**); used to dismiss someone as a paid poster | Everyone, about everyone | **SAFE** when generic: "every party's IT cell" |
| **Godi Media** | "lapdog media" for pro-government TV; coined by Ravish Kumar **[WP]** | Anti-BJP users about pro-government channels | **SAFE as a concept.** Never tag a named outlet or anchor with it (defamation risk). Pair with **Kiska Media?** ownership facts |
| **WhatsApp University / WhatsApp uncle** | forwarded misinformation as a "degree"; the relative who forwards everything | Everyone, across ages and sides | **SAFE**: the most cross-partisan label we have (charter rung 1) |
| **Urban Naxal** | an urban Maoist sympathiser. Popularised by Vivek Agnihotri's 2018 book **[WP]**; also used by officials | Right and the government about left activists, academics and lawyers | **CAUTION**: only with "(as per the forwards)". Several people so labelled face UAPA trials, so never pair it with a real name |
| **Tukde-Tukde Gang** | "gang that wants India in pieces", from the 2016 JNU sloganeering row **[WP]** | Right about left students and activists | **SAFE with its punchline**: the Home Ministry told an RTI applicant it had *no information* on any such gang (Jan 2020) **[WP ref snippet; verify via ET/NDTV]** |
| **Anti-National** | a critic cast as disloyal. In 2021 a parliamentary panel asked the I&B ministry to define it **[WP]** | Right and TV about critics, protesters and journalists | **SAFE as the top rung**: "the label for asking where the money went" |
| **Jumla** | an empty poll promise. From the 2015 "chunavi jumla" remark about "15 lakh in every account" **[BK]** | Opposition about BJP promises; now about any broken promise (r/CriticalThinkingIndia used it on UPI MDR) | **SAFE when generic**: "every manifesto has a jumla section" |
| **Neutral Uncle / "sab chor hain" / "sab mile hue hain"** | the cynic who says every politician is a thief and has not checked which | Both sides, about the uncommitted | **SAFE** (charter rung 3) |
| **2-rupee troll** | a supposedly paid online troll (₹2 a post) | Originally left about pro-BJP accounts; now thrown by every side at every other | **SAFE when generic** |
| **Presstitute** | "press" + "prostitute". Popularised in India by V.K. Singh in 2015 **[WP]** | Right about critical journalists | **AVOID**: sexualised and misogynistic. Use "paid media" |
| **Librandu** | "liberal" + a vulgar Hindi suffix. Reclaimed as r/librandu | Right about liberals and the left | **AVOID**: vulgar |
| **Sickular / Libtard** | insults for secularists and liberals | Right about the left | **AVOID**: "sickular" carries a communal subtext |
| **Sanghi / the RSS-uniform insult** | mocking names for RSS/BJP supporters (r/librandu flairs) | Left about the right | **AVOID**: insults the members of a named organisation |
| **Pappu** | "simpleton", about Rahul Gandhi | Right | **AVOID**: a nickname for a named person, not a label for a behaviour |
| **Feku** | "fibber / big talker", about Narendra Modi | Left | **AVOID**: same reason |
| **Toolkit / Ecosystem / Lutyens** | an alleged coordinated liberal-elite network | Right about the left, NGOs and the English press | **CAUTION**: "toolkit" works as generic satire. The related "Khan Market gang" coinage: **AVOID** (dog-whistle risk) |
| **Andolanjeevi** | "professional protester" (a 2021 coinage in Parliament) | Right about activists | **CAUTION**: rarely needed |
| **Vishwaguru / Mother of Democracy** | official aspirational slogans, used sarcastically by critics (r/librandu flips it to "Stepmother of Democracy") | Government sincerely; critics sarcastically | **SAFE** in gentle form: "Vishwaguru, pending receipts". AVOID the "stepmother" sneer |
| **Cockroach (2026)** | an insult reclaimed after a May 2026 CJI remark about jobless youth, by the Cockroach Janta Party **[WP]** | Gen Z about themselves | **AVOID in copy** (it ties us to a live movement). Fine as a dated, sourced question fact |

### 3b. Communal, caste and regional slurs: all UNSAFE, described abstractly

These appear in the sources and in the flair sets of some subreddits:

- **Slurs for Muslims:** dehumanising, "invader/infiltrator" framings, and some referring to
  religious practice or to livestock.
- **Slurs thrown at Hindus or at BJP supporters** that mock cow veneration.
- **A family of conspiracy labels that attach an Islamic religious term to everyday life**
  (romance, land, jobs). One news subreddit uses one of them as a post flair.
- **Separatist labels thrown at Sikh protesters and farmers** as a smear.
- **Caste slurs:** for Dalits and reservation beneficiaries, and derogatory renderings of
  upper-caste names. One of these appears in a left-sub flair.
- **Regional and colour-based slurs** for people from the North-East, Bihar or South India
  **[PR: ThePrint]**.
- **"Go to Pakistan" / "Pakistani"** as a smear for critics.
- **Puns that merge a party's name with a Muslim surname.**
- **Sexualised slurs aimed at women journalists.**

None of these goes anywhere near the game, the bank, the research notes or social copy.

---

## 4. Recurring meme formats and running jokes

1. **"India Super Power 2020"** (r/bakchodi flair). Irony about promised greatness, a callback to
   the old "Vision 2020". Updated versions: "Vishwaguru", "7.8% GDP". *Usable:* it targets hype,
   not people.
2. **Sarcastic "Just ___ Things" flairs**: "JustModiThings" (r/librandu) and a religion-referencing
   variant (r/unitedstatesofindia). Absurd news is posted as proof of decline. *Avoid the
   religion variant.*
3. **"Naya Bharat" sarcasm.** Sincere on the right, ironic on the left ("Naya Bharat farmer sued
   for ₹1 crore").
4. **2014 slogan callbacks**: "Achhe din", "Mitron", "15 lakh in every account", "pakoda
   employment", "aapda mein avsar" (opportunity in disaster). Deployed at any bad economic news.
   *Usable only in Forward Court, with the fact.* The "15 lakh" line is a hypothetical from a
   2014 speech, not a scheme.
5. **"Washing machine"**: a leader enters under investigation and comes out clean. It began as a
   2024 opposition campaign prop **[BK]**. *Usable* with conviction and case-status data, never
   with a named person as the punchline.
6. **The anchor-shouting montage**: prime-time debate clips cut to noise. Left subs use it for
   "Godi media"; right subs use it on "left" anchors. *Usable as a format* (see copy line 12),
   never naming an anchor.
7. **"IT cell ka paisa"**: calling any upvoted opposing post "paid". Both sides do it.
8. **"Mujhe kya, main toh bonds mein invest karta hoon"** (r/IndianStreetBets): the apolitical,
   self-mocking middle class. *Usable*: it is Neutral Uncle's younger cousin.
9. **"Scam of the century!"** as ironic hyperbole for trivial things (r/indianews on a rum
   labelling case). *Usable*: our "scam size" scale can play with it. Real cases keep exact
   status.
10. **"Bro is stuck in the same loop"** reaction memes for politicians' U-turns and alliance-hopping
    (r/Maharashtra). *Usable generically.*
11. **Aspirant memes**: the JEE/NEET flairs on r/IndianDankMemes, "NTA" acronym jokes after 2024
    and 2026 **[BK]**. *Usable* for exam-lane loading lines. **Never joke about the student
    deaths** linked to NEET 2026 **[WP]**.
12. **City absurdity genres**: Bengaluru traffic and potholes ("Peak Bengaluru" **[BK]**),
    "flyover flooded", Mumbai monsoon, Delhi AQI. *Usable*: this is the best cross-partisan
    material we have.
13. **Clipped-video "gotchas"**: a leader's sentence cut mid-thought. For example, the right's
    "potato-into-gold machine" clip of Rahul Gandhi from 2017, in which he was attributing the
    promise to Modi mockingly **[BK: Alt News fact-check]**. The left makes equivalents with
    Modi clips. *Forward Court material, not jokes.*
14. **Rage bait flagged as bait**: r/bakchodi's "Bait" flair and gender-war posts on
    r/indiadiscussion. *Avoid.*

---

## 5. Viral claims for Forward Court (non-communal, all sides)

Every entry is **[BK — verify]**. The Forward Court lane must fetch a fact-checker or primary source
for each (§2.1) and write the status line. No communal claims, and none about private people.

| # | Claim as it circulates | Mostly pushed by | What the record says (to verify) | Source to fetch |
|---|---|---|---|---|
| 1 | "UNESCO declared Jana Gana Mana the best anthem / Modi the best PM" | pro-government forwards | Recurring hoax. UNESCO does no such ranking | Alt News / BOOM |
| 2 | "The new ₹2,000 note has a GPS nano-chip" (2016) | pro-demonetisation forwards | False. RBI said nothing of the kind | BOOM / Factly |
| 3 | "Fuel is costly only because UPA left oil bonds" | right | Oil bonds were ~₹1.3–1.4 lakh crore. Central fuel excise collected many times that after 2014 | Factly / PIB / Parliament answers |
| 4 | "Congress got more electoral-bond money than BJP" | right | False. BJP received the largest share by far, then TMC, then Congress | SBI/ECI disclosures (Mar 2024) |
| 5 | "Rahul Gandhi promised a machine that turns potatoes into gold" | right | Clipped. He was mocking promises he attributed to Modi | Alt News |
| 6 | "Only 1–2% of Indians pay tax; everyone else freeloads" | middle-class / finance subs | Misleading. Crores file ITRs (many owe nothing), and everyone pays GST and other indirect taxes | CBDT data; GST collections (PIB) |
| 7 | "Opposition states are bankrupt because of freebies" | right | Debt/GSDP is high in states run by several parties. Compare with the RBI table | RBI *State Finances* |
| 8 | "The government waived ₹X lakh crore of corporate loans for Adani and Ambani" | left | Banks *wrote off* large sums (Parliament answers), but a write-off is not a waiver: recovery continues. Borrower-level claims need a source | Parliament Q&A (MoF), RBI |
| 9 | "EVMs are hacked" | left / opposition fringe | No court has accepted it. The SC rejected the 100%-VVPAT / paper-ballot plea (Apr 2024) | SC judgment (ADR v ECI) |
| 10 | "India's debt tripled under Modi" | left | True in nominal rupees. Debt-to-GDP rose far less. Both numbers are the fact | Budget documents / RBI |
| 11 | "PM CARES is audited by the CAG" / "PM CARES is secret" | both | Audited by an independent auditor, not the CAG. The government told the Delhi HC it is not a "public authority" under RTI | Delhi HC affidavit coverage; the PM CARES site |
| 12 | "Unemployment is at a 45-year high" | left | True for PLFS 2017-18 (6.1%). Later PLFS rounds show lower rates. Both sides quote whichever year suits them | MoSPI PLFS |
| 13 | "Vote chori: fake voters in Mahadevapura" | left / opposition | A Congress allegation (Aug 2025). The ECI dismissed it and asked for a sworn declaration, which was not filed **[WP]**. Status is contested | ECI statements; Indian Express |
| 14 | "The government spent ₹X crore on ads / PM foreign trips" | left | Parliament answers give official figures. Use those, not the forward's number | Lok Sabha / Rajya Sabha answers |
| 15 | "UPI will now charge every customer" (Sep 2026) | everyone | The 2026 amendment gives MDR a legal basis **[WP]**. Who bears it and at what rate needs the notified rules | Gazette / RBI / NPCI |
| 16 | "Tamil Nadu gets 29 paise for every rupee it pays" | southern regional subs | Contested methodology. Compare Finance Commission devolution to tax collected | Finance Commission / PRS |
| 17 | "India is now the 4th-largest economy" | right | Nominal-GDP ranking based on IMF projections. Per-capita rank is far lower. Both numbers are the fact | IMF WEO; NITI Aayog statement |
| 18 | "Delhi's air equals smoking X cigarettes a day" | city subs | A rule of thumb (Berkeley Earth). Approximate, not a measurement | Berkeley Earth; CPCB AQI |
| 19 | "The Home Ministry has a list of the tukde-tukde gang" | right (implied) / left (rebuttal) | The MHA said in an RTI reply that it had no information on such a group (2020) | ET/NDTV coverage of the RTI reply |
| 20 | "NEET 2024: many toppers from one centre" | youth / left | A real anomaly. The NTA re-tested affected candidates. The SC declined to cancel the whole exam | SC order (2024); NTA notices |

**Avoid in Forward Court:**

- Population or "demography" claims, conversion claims, riot or "attack" videos, and
  "infiltrators on the rolls" claims. All of these are communal.
- Doctored-video claims about violence.
- Anything about Manipur, Pahalgam or war casualties.
- Health cures with a religious frame.
- Claims about private individuals.

---

## 6. What this means for HISAAB DO

### 6a. Topics to prioritise, by mode

1. **Aaj Ka Hisaab (daily): lead with the shared-anger topics.** UPI MDR (who pays), NEET 2026 and
   NTA (what failed, who resigned, what the re-exam cost), fuel excise during the Hormuz crisis,
   and SIR deletion counts by state. Refresh each month from the pulse script.
2. **Sector Files weighting, in rough order of audience pull:**
   - Jobs & Economy (taxes, GST, jobs, prices)
   - Education & Exams
   - Infrastructure (civic)
   - Banking & Finance (UPI, write-offs, cronyism, F&O)
   - Elections & Funding (electoral bonds, SIR, party income)
   - Media & Speech
   - Governance & Institutions (agencies, conviction rates)
   - Energy & Mining (fuel taxes)
   - Welfare & Subsidies (the freebies comparison)

   Health, Farm and Environment are quieter on Reddit in 2026. Keep them at charter targets, not
   above.
3. **Rajya Rounds: city subs are huge (1.1–1.4M) and argue about civic money.** Include at least
   one municipal or civic-budget card per big-city state (Karnataka, Maharashtra, Delhi, Telangana,
   Tamil Nadu, West Bengal). Put every party's pre-poll cash scheme side by side.
4. **Kiska Media?**: the "Godi media" vs "presstitute" fight is the loudest media topic. Answer it
   with ownership, ad-spend and press-freedom *facts*, not adjectives.
5. **Forward Court**: use §5, split roughly evenly between claims each side pushes. The review lane
   should check that split (§2.5).

### 6b. Tone that lands with both sides

- **Punch at the label economy**, not the labelled. The targets are the forward, the shouting
  format, every party's IT cell, the "sab chor hain" cynic who never checked, and our own player
  (self-deprecating ladder copy).
- **Treat the player as smart.** Communities that call themselves "Critical Thinking" and
  "Moderate" are the fastest-growing. Explanations should read like receipts, not lectures.
- **Symmetry in every joke set.** For every jab at one fandom, the next line lands on another.
  "Bhakt" always means *of anyone*: BJP, Congress, AAP, TMC, DMK, TVK, Left.
- **Hinglish and code-mixing is the native register** across the meme and youth subs. Keep it
  light and use no profanity: flair and keyword sets show profanity is common there, but it would
  break our all-ages, share-card use.
- **Money is the neutral ground.** Numbers with a source defuse identity fights. When a topic can
  only be told through religion or caste, it is not our topic.

### 6c. What to avoid

- Communal, caste, regional or religious content, imagery or claims. **Avoid religious visuals
  even around "bhakt".**
- Leader nicknames (Pappu, Feku), mockery of any leader's body, speech, degree or family, and
  "Just *leader* Things" jokes.
- The sexualised or vulgar labels (presstitute, librandu), insults for members of a named
  organisation (sanghi and the uniform insult), and dog-whistle coinages ("Khan Market gang").
- Applying any ladder label to a real person, party, outlet, subreddit or community. Labels are
  only ever self-applied by the player.
- Gamifying tragedy: student suicides (NEET 2026), stampedes, war and terror deaths, violence
  against women. These can appear as sourced facts in an explanation, never as a joke, a streak
  line or a score multiplier.
- Aligning with a creator (Dhruv Rathee, Sham Sharma) or a movement (the Cockroach Janta Party),
  and naming subreddits in the product.
- Treating Reddit as India. Its users skew urban, young, male, English-first, and tech- and
  finance-heavy. Right-leaning critics call r/india left-dominated, while r/IndiaSpeaks and
  r/indiadiscussion together have 1.3M+ members. Balance comes from the record (§2.5), not from
  upvotes.
- The word "scam" for any case without a conviction. Say "case" and give the status.

### 6d. Twenty copy lines (loading, streak, rank-up)

All of these satirise labelling, forwards or the player. None names a community, a party's
supporters or a real person.

*Loading*

1. "Forward mila. Source dhoondh rahe hain…" *(Forward received. Looking for the source…)*
2. "Opinions load instantly. Receipts take a second."
3. "Every party's IT cell is typing…"
4. "Prime time is shouting. We're reading the CAG report."
5. "Counting crores in tukdas. Please hold."
6. "RTI filed. Reply in 30 days, or 3 seconds if you're us."
7. "WhatsApp University result aa raha hai. Re-evaluation pending."

*Streak*

8. "Teen sahi. Kisi ka bhakt nahi, bas receipt ka." *(Three right. Nobody's devotee, only the receipt's.)*
9. "Streak on. Jumla detector fully charged. Works on every manifesto."
10. "5 in a row. Neutral Uncle has left the group."
11. "Somewhere, a family WhatsApp group just lost an argument."
12. "Lagatar sahi. The anchor would now like to shout at you."
13. "Your forward-to-fact ratio is embarrassingly healthy."

*Rank-up (ties to the charter ladder)*

14. "Promoted: Receipt Maango. Bill maangoge toh label milega." *(Ask for the bill, get a label.)*
15. "New label: RTI Warrior. Status: awaiting reply."
16. "New label: Urban Naxal (as per the forwards). Offence: reading a CAG report on the metro."
17. "Tukde-Tukde Gang unlocked. You now count public money in tukdas, ₹1 lakh crore at a time."
18. "Certified Anti-National. Crime: asked where the money went. Sentence: more questions."
19. "Every side has now called you a name. That's how you know you're getting close."
20. "Label badla. Sawaal wahi: Hisaab do." *(New label. Same question: show us the accounts.)*

---

## 7. Method & limits

**What could not be done.** This environment's network policy blocks `reddit.com` and
`oauth.reddit.com`. No Reddit page or API was read. **No mirror, archive or proxy** was tried:
no pullpush, pushshift, redlib/libreddit, teddit or archive sites. So this document contains
**no first-hand reading of Reddit posts or comments**, no measured topic frequencies, and no
usernames.

**What the evidence actually is:**

1. **GummySearch public subreddit pages** (`gummysearch.com/r/<name>/`) for 51 communities (49 used; a faith-community sub and a bot feed excluded), read
   2026-09-25 (pages say "Last updated: September 19, 2026"). GummySearch is a third-party
   audience-research tool that states it is not affiliated with Reddit. We used only aggregates:
   - member count and yearly growth
   - its "Popular Topics" top-10, with post counts in the tens
   - its top flairs, each shown with one example post title
   - its "similar subreddits" list

   Example titles are paraphrased here, and none of the communal ones is repeated. **Limits:** the
   samples are small and recent, and its method is opaque. Its topic extraction mixes in emotion
   words ("struggling", "worst"), and one busy month (the Iran war, Holi, UPI MDR) colours the
   results. A 404 there means "not indexed", not "banned".
2. **subredditstats.com API** (`/api/subreddit?name=<name>`). Member counts and, for some subs, top
   comment keywords, all from a snapshot dated **2023-12-18**. It is stale and used only as a
   second data point.
3. **Published sources:**
   - TIME on the r/Chodi ban (2022-03-24): <https://time.com/6160519/reddit-international-hate-speech-ban/>
   - The Quint on hate in Indian subreddits (2022-01-25): <https://www.thequint.com/neon/web-culture/out-of-sight-how-reddit-became-a-safe-space-for-hate>
   - ThePrint on Reddit and the north–south divide (2025-11-24): <https://theprint.in/ground-reports/reddit-is-the-new-site-of-north-south-divide/2790802/>
   - arXiv 2503.03500, a dataset of seven Indian political subreddits (Oct 2023–Jul 2024): <https://arxiv.org/html/2503.03500v1>
   - OpIndia (2019) and a change.org petition on r/india moderation, **seen only as search-result
     titles**, not read.
4. **Wikipedia**, fetched directly by title. Used for 2025–26 context and for label definitions:
   - context: Cockroach Janta Party; 2026 NEET scandal; 2026 Delhi Jantar Mantar protests;
     Taxation and Other Laws (Amendment) Bill, 2026; 2025 Indian electoral controversy; the 2026
     West Bengal, Tamil Nadu and Kerala assembly elections; India in the 2026 Iran war
   - label definitions: Godi media; Presstitute; Bhakt (pejorative); Anti-national (India); BJP
     IT Cell; Controversial Reddit communities

   §2.1 applies: bank items need primary or established-outlet sources, not these.
5. **Search.** WebSearch was used for a handful of queries before the session's shared search
   budget ran out. After that, only direct page fetches were made. **No further searches were run
   and no other search engine was used** to get around the limit.
6. **Background knowledge** (training data to mid-2026), marked **[BK]**. It is used for label
   histories, meme origins, viral-claim leads and older cases. **Every [BK] item is a lead, not a
   source.**

**How to interpret the results:**

- *Leans* are editorial judgements, made at the community level only. They say nothing about any
  individual user.
- *Surface counts* (§2) measure how widely a topic appears across communities. They do not
  measure volume.
- The ranking should be re-run on real data before anyone quotes it as a measurement.

**How to fix these limits.** On a machine that can reach Reddit, run
`node scripts/research/reddit-pulse.mjs --out=<file outside the repo>` with credentials in
environment variables (see the script header). It uses the same topic, case and label
dictionaries as this document, so its `summary.topics` ranking replaces §2's surface counts. The
output holds no usernames and no bodies, and by default no titles either. Its keyword lists are
raw, so review them for slurs before pasting anything into `docs/`. Suggested cadence: monthly,
per ROADMAP Phase 5.
