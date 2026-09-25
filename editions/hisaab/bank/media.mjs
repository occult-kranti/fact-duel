// HISAAB DO — lane: Media & speech ("Kiska Media?"). Prefix hmd, 45 items.
// Who owns which outlet and their documented political links (across parties), press freedom,
// government ad spend and state action on media. Every item was checked against the page in
// sourceUrl in September 2026; research log and drops: docs/hisaab/research/media-notes.md.
// Ownership facts are stated neutrally; wrongdoing items carry a dated legal status.
export const HISAAB_MEDIA = Object.freeze([
  {
    "id": "hmd001",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "NDTV",
    "kind": "media",
    "difficulty": "simple",
    "year": 2022,
    "govt": "NDA",
    "question": "In December 2022, which conglomerate became the controlling shareholder of broadcaster NDTV after buying most of its founders’ remaining stake?",
    "options": [
      "Adani Group",
      "Reliance Industries",
      "Tata Group",
      "Aditya Birla Group"
    ],
    "correctIndex": 0,
    "explanation": "Adani’s RRPR Holding bought 27.26% of NDTV from founders Prannoy and Radhika Roy for ₹602.3 crore on 30 Dec 2022, lifting RRPR to 56.45%. NDTV had said in Aug 2022 that the VCPL route to RRPR was taken without the founders’ consent. In Jan 2026 the group agreed to buy the rest of news agency IANS, where it already held a majority.",
    "status": "Ownership fact from exchange filings; no allegation against any person.",
    "people": [
      "Prannoy Roy",
      "Radhika Roy"
    ],
    "sourceUrl": "https://www.tribuneindia.com/news/business/adani-buys-roys-27-26-stake-in-ndtv-for-rs-602-cr-466108",
    "sourceLabel": "The Tribune — Adani buys Roys’ 27.26% stake in NDTV for Rs 602 cr (31 Dec 2022)",
    "sources": [
      "https://indianexpress.com/article/business/companies/adani-stake-in-ndtv-open-offer-8107464/",
      "https://www.thehindu.com/business/markets/adani-group-completes-full-takeover-of-ians-news-agency/article70541841.ece"
    ]
  },
  {
    "id": "hmd002",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "NDTV (VCPL loan)",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2022,
    "govt": "NDA",
    "question": "The 2009–10 VCPL loan whose conversion handed Adani the NDTV promoter firm’s 29.18% stake in 2022 had itself been funded by a subsidiary of which group?",
    "options": [
      "Tata Sons",
      "Bharti Enterprises",
      "Reliance Industries",
      "Essar Group"
    ],
    "correctIndex": 2,
    "explanation": "VCPL lent ₹403.85 crore to the Roys’ RRPR Holding in 2009–10 against warrants convertible into 99.9% of RRPR, and had raised the money from Reliance Strategic Ventures, a wholly owned RIL unit (Indian Express). Adani’s AMG Media bought VCPL in Aug 2022 and exercised the warrants; NDTV said this was done without the founders’ consent.",
    "status": "Ownership and financing fact from filings reported by The Indian Express; no allegation against any person.",
    "people": [
      "Prannoy Roy",
      "Radhika Roy"
    ],
    "sourceUrl": "https://indianexpress.com/article/business/companies/adani-stake-in-ndtv-open-offer-8107464/",
    "sourceLabel": "The Indian Express — Adani steps into NDTV with 29%, to launch open offer for 26% more (23 Aug 2022)"
  },
  {
    "id": "hmd003",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "JioStar",
    "kind": "media",
    "difficulty": "simple",
    "year": 2024,
    "govt": "NDA",
    "question": "The JioStar joint venture, completed in November 2024, merged Reliance’s Viacom18 with the India media assets of which company?",
    "options": [
      "Sony Group",
      "The Walt Disney Company",
      "Warner Bros. Discovery",
      "Comcast (NBCUniversal)"
    ],
    "correctIndex": 1,
    "explanation": "Completed on 14 Nov 2024 and valued at ₹70,352 crore, JioStar is 63.16% Reliance-owned (16.34% direct, 46.82% via Viacom18) and 36.84% Disney-owned, with Nita Ambani as chairperson. RSF’s 2026 India profile says Mukesh Ambani owns more than 70 media outlets followed by at least 800 million Indians.",
    "status": "Ownership fact from the companies’ joint release; no allegation.",
    "people": [
      "Nita Ambani",
      "Mukesh Ambani"
    ],
    "sourceUrl": "https://www.jiostar.com/news/reliance-and-disney-announce-completion-of-transaction-to-form-joint-venture-to-bring-together-the-most-iconic-and-engaging-entertainment-brands-in-india/",
    "sourceLabel": "JioStar — Reliance and Disney announce completion of transaction to form joint venture (14 Nov 2024)",
    "sources": [
      "https://rsf.org/en/country/india"
    ]
  },
  {
    "id": "hmd004",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Network18",
    "kind": "media",
    "difficulty": "expert",
    "year": 2014,
    "govt": "NDA",
    "question": "In May 2014 Reliance Industries approved up to ₹4,000 crore to take control of Network18 (CNN-IBN, CNBC-TV18, Colors). Through which vehicle, of which RIL was sole beneficiary?",
    "options": [
      "Reliance Strategic Ventures",
      "Jio Platforms",
      "Viacom18 Media",
      "Independent Media Trust"
    ],
    "correctIndex": 3,
    "explanation": "RIL’s board approved the funding on 29 May 2014 for Independent Media Trust (IMT) to acquire control of Network18 Media & Investments and TV18 Broadcast — about 78% of NW18 and 9% of TV18, plus open offers — citing “fundamental synergy” with its 4G business and digital assets such as Moneycontrol and Firstpost.",
    "status": "Ownership fact from RIL’s press release; no allegation.",
    "sourceUrl": "https://www.ril.com/sites/default/files/2023-01/PR29052014.pdf",
    "sourceLabel": "Reliance Industries — Acquisition of Network18 by Independent Media Trust (press release, 29 May 2014)"
  },
  {
    "id": "hmd005",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Zee–Sony merger",
    "kind": "media",
    "difficulty": "simple",
    "year": 2024,
    "govt": "NDA",
    "question": "Which company called off its planned $10 billion merger with Zee Entertainment in January 2024?",
    "options": [
      "The Walt Disney Company",
      "Reliance-Viacom18",
      "Sony (Culver Max Entertainment)",
      "Netflix India"
    ],
    "correctIndex": 2,
    "explanation": "Sony’s India unit (formerly Sony Pictures Networks India, now Culver Max) sent Zee a termination notice on 22 Jan 2024 after the deadline passed without an agreed extension. Sony had sought a $90 million termination fee in arbitration; on 27 Aug 2024 both sides settled, withdrawing all claims at the SIAC and the NCLT, with no outstanding obligations either way.",
    "status": "Corporate dispute settled in Aug 2024 with all claims withdrawn; no finding against anyone.",
    "sourceUrl": "https://www.moneylife.in/article/zee-sony-settle-merger-dispute-agree-to-withdraw-all-claims-cases/75011.html",
    "sourceLabel": "Moneylife — ZEE, Sony settle merger dispute, agree to withdraw all claims, cases (Aug 2024)",
    "sources": [
      "https://www.sec.gov/Archives/edgar/data/313838/000115752324000085/a53885811.htm"
    ]
  },
  {
    "id": "hmd006",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "HR",
    "subtopic": "Zee / Subhash Chandra",
    "kind": "media",
    "difficulty": "expert",
    "year": 2016,
    "govt": "BJP",
    "question": "Zee group founder Subhash Chandra won a Rajya Sabha seat in 2016 as an independent backed by BJP legislators. Which state’s assembly elected him?",
    "options": [
      "Haryana",
      "Rajasthan",
      "Uttar Pradesh",
      "Madhya Pradesh"
    ],
    "correctIndex": 0,
    "explanation": "PRS lists him as an Independent member from Haryana from 2 Aug 2016 to 1 Aug 2022. The RSF–DataLEADS Media Ownership Monitor (2019) listed him among media owners with political links, noting he was elected “with the help of” BJP lawmakers; Zee Media Corporation owns Zee News.",
    "status": "Held Rajya Sabha office 2016–2022; political-link fact, no allegation.",
    "people": [
      "Subhash Chandra"
    ],
    "sourceUrl": "https://prsindia.org/mptrack/rajya-sabha/subhashchandra",
    "sourceLabel": "PRS Legislative Research — MP Track: Subhash Chandra (Rajya Sabha)",
    "sources": [
      "https://india.mom-gmr.org/en/findings/politicalaffiliations/"
    ]
  },
  {
    "id": "hmd007",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "Republic TV / Asianet",
    "kind": "media",
    "difficulty": "expert",
    "year": 2025,
    "govt": "LDF",
    "question": "An early backer of Republic TV quit its parent company’s board in 2018, saying he had joined the BJP. In March 2025 he was made the BJP’s president in which state?",
    "options": [
      "Karnataka",
      "Tamil Nadu",
      "Goa",
      "Kerala"
    ],
    "correctIndex": 3,
    "explanation": "Rajeev Chandrasekhar left the board of ARG Outlier Asianet News in 2018; in May 2019 Arnab Goswami bought back shares from Asianet, which stayed a minority investor. His Jupiter Capital controls Asianet News (Malayalam) and Suvarna News (Kannada), per the Media Ownership Monitor. He was elected Kerala BJP chief in March 2025.",
    "status": "Ownership and party-office facts; no allegation.",
    "people": [
      "Rajeev Chandrasekhar",
      "Arnab Goswami"
    ],
    "sourceUrl": "https://www.onmanorama.com/news/kerala/2025/03/23/bjp-new-president-of-kerala-named-as-rajeev-chandrasekhar.html",
    "sourceLabel": "Onmanorama — Rajeev Chandrasekhar to replace K Surendran as Kerala BJP chief (23 Mar 2025)",
    "sources": [
      "https://scroll.in/latest/874159/bjp-mp-rajeev-chandrasekhar-resigns-from-board-of-republic-tvs-parent-company",
      "https://inc42.com/buzz/arnab-goswami-takes-control-of-republic-tv-buys-back-shares-from-asianet/",
      "https://india.mom-gmr.org/en/media/detail/outlet/asianet-news/"
    ]
  },
  {
    "id": "hmd008",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Dainik Jagran",
    "kind": "media",
    "difficulty": "expert",
    "year": 2006,
    "govt": "UPA",
    "question": "Dainik Jagran chairman Mahendra Mohan Gupta, whose family controls Jagran Prakashan, sat in the Rajya Sabha from 2006 to 2012 for which party?",
    "options": [
      "Bharatiya Janata Party",
      "Samajwadi Party",
      "Bahujan Samaj Party",
      "Indian National Congress"
    ],
    "correctIndex": 1,
    "explanation": "The Media Ownership Monitor (RSF and DataLEADS, 2019) records his 2006–12 Samajwadi Party term and notes that his brother Narendra Mohan Gupta had been a BJP Rajya Sabha member. The Gupta family held 60.63% of listed Jagran Prakashan through Jagran Media Network Investment.",
    "status": "Former MP; ownership and political-link fact, no allegation.",
    "people": [
      "Mahendra Mohan Gupta",
      "Narendra Mohan Gupta"
    ],
    "sourceUrl": "https://india.mom-gmr.org/en/media/detail/outlet/dainik-jagran/",
    "sourceLabel": "Media Ownership Monitor India (RSF/DataLEADS) — Dainik Jagran (2019)",
    "sources": [
      "https://india.mom-gmr.org/en/findings/politicalaffiliations/"
    ]
  },
  {
    "id": "hmd009",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TN",
    "subtopic": "News J / Jaya TV",
    "kind": "media",
    "difficulty": "expert",
    "year": 2017,
    "govt": "AIADMK",
    "question": "Tamil channel News J was set up after a party could not take control of Jaya TV, which stayed with V.K. Sasikala’s family after her 2017 expulsion. Which party controls News J?",
    "options": [
      "AIADMK",
      "DMK",
      "AMMK",
      "PMK"
    ],
    "correctIndex": 0,
    "explanation": "The Indian Express (Jan 2023) reports that the AIADMK, led by Edappadi K. Palaniswami, directly controls News J, while Sasikala’s family runs Jaya TV and its news arm Jaya Plus. In Tamil Nadu the DMK directly runs Kalaignar Seithigal, Sun TV is owned by Kalanithi Maran, and Mega 24 is viewed as the Congress’s channel.",
    "status": "Ownership fact; no allegation in this item.",
    "people": [
      "V.K. Sasikala",
      "Edappadi K. Palaniswami",
      "Kalanithi Maran"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)"
  },
  {
    "id": "hmd010",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "OD",
    "subtopic": "Odisha TV (OTV)",
    "kind": "media",
    "difficulty": "expert",
    "year": 2019,
    "govt": "BJD",
    "question": "The Media Ownership Monitor found Odisha TV about 96% owned by the family of Baijayant ‘Jay’ Panda, now a BJP leader. Which party had he belonged to earlier?",
    "options": [
      "Indian National Congress",
      "Communist Party of India",
      "Biju Janata Dal",
      "Jharkhand Mukti Morcha"
    ],
    "correctIndex": 2,
    "explanation": "MOM (2019) calculated the Panda family’s holding in Odisha Television Ltd at 96.46%; OTV’s founder is his wife Jagi Mangat Panda. It describes him as a former BJD member who became BJP national vice-president. RSF cited OTV as an example of how politics and media ownership overlap.",
    "status": "Ownership fact (2019 data); no allegation.",
    "people": [
      "Baijayant Panda",
      "Jagi Mangat Panda"
    ],
    "sourceUrl": "https://india.mom-gmr.org/en/media/detail/outlet/odisha-tv/",
    "sourceLabel": "Media Ownership Monitor India (RSF/DataLEADS) — Odisha TV (2019)",
    "sources": [
      "https://rsf.org/en/media-ownership-monitor-who-owns-media-india",
      "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/"
    ]
  },
  {
    "id": "hmd011",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "PB",
    "subtopic": "PTC / Gurbani telecast",
    "kind": "media",
    "difficulty": "expert",
    "year": 2023,
    "govt": "AAP",
    "question": "Punjab’s AAP government passed a 2023 bill for free-to-air Gurbani telecast from the Golden Temple, then aired by PTC. The channel is often linked to which party’s first family?",
    "options": [
      "Indian National Congress",
      "Shiromani Akali Dal",
      "Bharatiya Janata Party",
      "Bahujan Samaj Party"
    ],
    "correctIndex": 1,
    "explanation": "The Hindu (June 2023) describes PTC as a private channel “often linked to the Shiromani Akali Dal’s Badal family”. The SGPC contested the Sikh Gurdwaras (Amendment) Bill, 2023, arguing the 1925 Act is central law; in Dec 2023 the Governor reserved the bill for the President’s consideration.",
    "status": "Bill reserved for the President in Dec 2023; no allegation against any person.",
    "sourceUrl": "https://www.thehindu.com/news/national/other-states/punjab-assembly-passes-bill-to-ensure-free-telecast-of-gurbani-from-golden-temple/article66989100.ece",
    "sourceLabel": "The Hindu — Punjab Assembly passes bill to ensure free telecast of Gurbani from Golden Temple (20 Jun 2023)",
    "sources": [
      "https://www.thehindu.com/news/national/punjab-governor-reserves-3-bills-for-presidents-consideration/article67612090.ece"
    ]
  },
  {
    "id": "hmd012",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "Jaihind TV",
    "kind": "media",
    "difficulty": "expert",
    "year": 2023,
    "govt": "LDF",
    "question": "Malayalam news channel Jaihind TV, whose owner company is chaired by Ramesh Chennithala, is backed by which party’s Kerala unit?",
    "options": [
      "CPI(M)",
      "Bharatiya Janata Party",
      "Indian Union Muslim League",
      "Indian National Congress"
    ],
    "correctIndex": 3,
    "explanation": "The Indian Express (Jan 2023) reports that Jaihind TV is backed by the state Congress, with former Opposition leader Ramesh Chennithala chairing owner Bharat Broadcasting Network Ltd. In the same state, Kairali TV’s owner has CPI(M) backing and Janam TV is known to lean towards the Sangh Parivar.",
    "status": "Ownership/political-link fact; no allegation.",
    "people": [
      "Ramesh Chennithala"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)"
  },
  {
    "id": "hmd013",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "MH",
    "subtopic": "Lokmat / Vijay Darda",
    "kind": "scam",
    "difficulty": "expert",
    "year": 2023,
    "govt": "NDA",
    "question": "Lokmat Media chairman Vijay Darda, a former Congress Rajya Sabha MP, was convicted by a special CBI court in July 2023 in a case over the allocation of what?",
    "options": [
      "2G spectrum licences",
      "An iron-ore mining lease",
      "A coal block in Chhattisgarh",
      "A KG-basin gas block"
    ],
    "correctIndex": 2,
    "explanation": "The court convicted him, his son and a former coal secretary over the Fatehpur (East) block allotted to JLD Yavatmal Energy, and gave the Dardas four years. The Delhi HC suspended their sentences on 26 Sep 2023 pending appeal. In a separate Bander coal-block case, a CBI court acquitted them in March 2026.",
    "status": "Convicted by special CBI court (July 2023, 4 yrs); sentence suspended by Delhi HC on 26 Sep 2023 pending appeal, no appeal verdict found as of 2026-09; acquitted in the separate Bander block case (Mar 2026).",
    "people": [
      "Vijay Darda",
      "Devendra Darda"
    ],
    "sourceUrl": "https://www.outlookindia.com/national/coal-scam-delhi-court-convicts-former-mp-vijay-darda-ex-coal-secretary-h-c-gupta-news-302720",
    "sourceLabel": "Outlook — Coal scam: Delhi court convicts former MP Vijay Darda, ex-coal secretary H C Gupta (July 2023)",
    "sources": [
      "https://aninews.in/news/national/general-news/coal-scam-delhi-hc-suspends-4-yrs-sentence-of-ex-mp-vijay-darda-his-son-and-businessman-manoj-jayaswal20230926204013/",
      "https://dailypioneer.com/news/coal-scam-delhi-court-acquits-ex-mp-vijay-darda-former-coal-secretary-hc-gupta",
      "https://india.mom-gmr.org/en/media/detail/outlet/lokmat/"
    ]
  },
  {
    "id": "hmd014",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "NewsClick / UAPA arrest",
    "kind": "media",
    "difficulty": "expert",
    "year": 2024,
    "govt": "NDA",
    "question": "In May 2024 the Supreme Court held NewsClick founder Prabir Purkayastha’s UAPA arrest and remand invalid. What defect did it find?",
    "options": [
      "Grounds of arrest were not given to him in writing",
      "No prior sanction from the Home Ministry",
      "He was arrested outside Delhi Police jurisdiction",
      "UAPA cannot be applied to a news portal"
    ],
    "correctIndex": 0,
    "explanation": "Delhi Police arrested him on 3 Oct 2023. The court held that written grounds of arrest were not supplied before the 4 Oct remand order, vitiating it, and ordered his release. NewsClick called the later UAPA chargesheet “absurd” and “baseless”. In June 2026 the Delhi HC quashed a separate 2020 FIR and ED case over its foreign funding.",
    "status": "Arrested Oct 2023 (UAPA); SC declared arrest invalid and he was released, May 2024; UAPA case not concluded as of 2026-09; separate EOW FIR and ED case quashed by Delhi HC on 10 Jun 2026. Not convicted.",
    "people": [
      "Prabir Purkayastha"
    ],
    "sourceUrl": "https://m.thewire.in/article/law/sc-deems-newsclick-editor-prabir-purkayasthas-arrest-illegal-orders-his-release",
    "sourceLabel": "The Wire — Supreme Court deems NewsClick editor Prabir Purkayastha’s arrest void, orders his release (15 May 2024)",
    "sources": [
      "https://www.thehindu.com/news/national/newsclick-founder-prabir-purkayasthas-arrest-invalid-orders-sc-directs-his-release-on-furnishing-of-bail-bonds/article68177596.ece",
      "https://www.livelaw.in/high-court/delhi-high-court/gross-abuse-of-law-delhi-high-court-quashes-fir-ed-case-against-newsclick-prabir-purkayastha-over-foreign-funding-537448"
    ]
  },
  {
    "id": "hmd015",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "IT Rules fact check unit",
    "kind": "institution",
    "difficulty": "expert",
    "year": 2024,
    "govt": "NDA",
    "question": "Which High Court in September 2024 struck down the 2023 IT Rules amendment letting a government Fact Check Unit flag ‘fake’ online content about the Centre?",
    "options": [
      "Delhi High Court",
      "Madras High Court",
      "Karnataka High Court",
      "Bombay High Court"
    ],
    "correctIndex": 3,
    "explanation": "After a split verdict in Jan 2024, tie-breaker Justice A.S. Chandurkar held Rule 3(1)(v) unconstitutional on 20 Sep 2024, and a Division Bench formally struck it down on 26 Sep 2024. The Supreme Court had stayed the notification naming PIB’s unit as the FCU in March 2024.",
    "status": "Court ruling on a rule; no allegation against any person.",
    "sourceUrl": "https://www.thehindu.com/news/national/bombay-hc-formally-strikes-down-centres-fact-check-unit-calls-amended-it-rules-unconstitutional/article68684934.ece",
    "sourceLabel": "The Hindu — Bombay High Court formally strikes down Centre’s Fact Check Unit (26 Sep 2024)",
    "sources": [
      "https://www.thehindu.com/news/national/supreme-court-stays-it-ministrys-notification-establishing-fact-check-unit-under-pib-to-identify-fake-news/article67975405.ece"
    ]
  },
  {
    "id": "hmd016",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "Kerala Police Act s.118A",
    "kind": "institution",
    "difficulty": "expert",
    "year": 2020,
    "govt": "LDF",
    "question": "In November 2020 Kerala’s LDF government added Section 118A — up to three years’ jail for ‘offensive’ posts — to which law, only to repeal it within days?",
    "options": [
      "The Information Technology Act",
      "The Kerala Police Act",
      "The Indian Penal Code",
      "The Code of Criminal Procedure"
    ],
    "correctIndex": 1,
    "explanation": "The ordinance adding Section 118A was issued on 21 Nov 2020. After critics likened it to Section 66A of the IT Act, struck down in 2015, the government put it in abeyance and the Governor signed a repeal ordinance on 25 Nov 2020. CM Pinarayi Vijayan said many, including LDF supporters, had raised concerns.",
    "status": "Law withdrawn by the state government; no allegation against any person.",
    "people": [
      "Pinarayi Vijayan"
    ],
    "sourceUrl": "https://www.thenewsminute.com/kerala/kerala-governor-signs-ordinance-repealing-section-118a-kerala-police-act-138421",
    "sourceLabel": "The News Minute — Kerala Governor signs ordinance repealing Section 118A of Kerala Police Act (25 Nov 2020)"
  },
  {
    "id": "hmd017",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "MH",
    "subtopic": "Arnab Goswami arrest",
    "kind": "media",
    "difficulty": "expert",
    "year": 2020,
    "govt": "SS",
    "question": "Maharashtra Police arrested Republic TV’s Arnab Goswami in November 2020 in a reopened 2018 abetment-to-suicide case. Which court ordered his interim release?",
    "options": [
      "Supreme Court",
      "Bombay High Court",
      "Alibag sessions court",
      "Raigad magistrate court"
    ],
    "correctIndex": 0,
    "explanation": "The SC granted interim bail on 11 Nov 2020, two days after the Bombay HC refused it, with Justice D.Y. Chandrachud remarking that personal liberty was becoming a casualty. The case had been closed in 2019 and reopened in 2020 under the Shiv Sena-led MVA government, which he calls political vendetta.",
    "status": "Arrested 4 Nov 2020; interim bail from SC 11 Nov 2020; his plea to quash the FIR was pending in Bombay HC (heard Aug 2026). Not convicted.",
    "people": [
      "Arnab Goswami",
      "D.Y. Chandrachud"
    ],
    "sourceUrl": "https://www.thehindu.com/news/national/supreme-court-grants-bail-to-arnab-goswami-two-others-in-2018-abetment-to-suicide-case/article33073472.ece",
    "sourceLabel": "The Hindu — Supreme Court grants interim bail to Arnab Goswami, two others (11 Nov 2020)",
    "sources": [
      "https://www.barandbench.com/news/should-not-be-a-proxy-war-bombay-high-court-on-mva-government-reopening-case-against-arnab-goswami"
    ]
  },
  {
    "id": "hmd018",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "MediaOne ban",
    "kind": "institution",
    "difficulty": "expert",
    "year": 2023,
    "govt": "NDA",
    "question": "In April 2023 the Supreme Court quashed the I&B ministry’s broadcast ban on which Malayalam news channel, rejecting unproven national-security claims made in a sealed cover?",
    "options": [
      "Kairali News",
      "Janam TV",
      "MediaOne",
      "Reporter TV"
    ],
    "correctIndex": 2,
    "explanation": "The ministry refused to renew MediaOne’s licence in Jan 2022, citing security concerns shared only in a sealed cover; the Kerala HC upheld the ban in Feb 2022. The SC stayed it and on 5 Apr 2023 quashed it, with CJI D.Y. Chandrachud’s judgment holding that unsubstantiated national-security claims cannot curb press freedom.",
    "status": "Court ruling; no allegation against any person.",
    "people": [
      "D.Y. Chandrachud"
    ],
    "sourceUrl": "https://www.scobserver.in/journal/judgement-pronouncement-mediaone-broadcast-ban/",
    "sourceLabel": "Supreme Court Observer — Judgement pronouncement: MediaOne broadcast ban (5 Apr 2023)"
  },
  {
    "id": "hmd019",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TG",
    "subtopic": "Telangana channel blackout 2014",
    "kind": "media",
    "difficulty": "expert",
    "year": 2014,
    "govt": "BRS",
    "question": "In June 2014, weeks after Telangana was formed, cable operators blocked which two Telugu news channels after coverage that angered the TRS government?",
    "options": [
      "Sakshi TV and NTV",
      "TV9 and ABN Andhra Jyothy",
      "ETV and TV5",
      "10TV and HMTV"
    ],
    "correctIndex": 1,
    "explanation": "Operators (MSOs) took off TV9 and ABN Andhra Jyothy on 16 June 2014 after a TV9 satire on new TRS legislators and ABN’s critical coverage; CM K. Chandrasekhar Rao later warned he would “bury” media that insulted Telangana. Minister K.T. Rama Rao said the government had not asked or pressured operators to block them.",
    "status": "No formal government order was issued (per The Indian Express); no finding against any person.",
    "people": [
      "K. Chandrasekhar Rao",
      "K.T. Rama Rao"
    ],
    "sourceUrl": "https://indianexpress.com/article/india/india-others/behind-kcrs-media-remarks-2-channels-that-insulted-telangana-govt/",
    "sourceLabel": "The Indian Express — Behind KCR’s media remarks: 2 channels that ‘insulted’ Telangana govt (12 Sep 2014)"
  },
  {
    "id": "hmd020",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "AP",
    "subtopic": "Andhra channel blackout 2024",
    "kind": "media",
    "difficulty": "expert",
    "year": 2024,
    "govt": "TDP",
    "question": "Days after the TDP-led government took office in Andhra Pradesh in June 2024, cable operators blacked out four news channels. Which of them is owned by the former CM’s family?",
    "options": [
      "NTV",
      "10TV",
      "TV9 Telugu",
      "Sakshi TV"
    ],
    "correctIndex": 3,
    "explanation": "Members of the state cable operators’ association stopped carrying Sakshi TV, TV9, NTV and 10TV, first on 6 June and again from 21 June 2024. The NBDA sought state intervention and a YSRCP MP alleged government pressure; the TDP denied issuing any directive. Sakshi TV belongs to Jagan Mohan Reddy’s company and is run by his wife, Y.S. Bharathi Reddy.",
    "status": "Blackout; YSRCP alleged government pressure, TDP denied it; no finding against any person.",
    "people": [
      "Y.S. Jagan Mohan Reddy",
      "Y.S. Bharathi Reddy"
    ],
    "sourceUrl": "https://m.economictimes.com/industry/media/entertainment/nbda-seeks-andhra-pradesh-governments-intervention-in-channel-blackouts-by-cable-operators/articleshow/111233409.cms",
    "sourceLabel": "The Economic Times — NBDA seeks Andhra Pradesh government’s intervention in channel blackouts (24 Jun 2024)",
    "sources": [
      "https://madhyamamonline.com/india/four-news-channels-off-the-air-again-since-naidu-govt-took-power-in-andhra-1301819",
      "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/"
    ]
  },
  {
    "id": "hmd021",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Media Ownership Monitor 2019",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2019,
    "govt": "NDA",
    "question": "RSF and DataLEADS’ 2019 Media Ownership Monitor found that four Hindi dailies together captured what share of Hindi newspaper readership?",
    "options": [
      "46.20%",
      "91.30%",
      "76.45%",
      "58.70%"
    ],
    "correctIndex": 2,
    "explanation": "Dainik Jagran, Hindustan, Amar Ujala and Dainik Bhaskar held 76.45% — “three out of four readers”. The study of 58 leading outlets said a handful of people own and control Indian media, and its political-affiliations finding flagged owners linked to several parties, from the BJP to the Samajwadi Party and the NCP.",
    "sourceUrl": "https://rsf.org/en/media-ownership-monitor-who-owns-media-india",
    "sourceLabel": "RSF — Media Ownership Monitor: Who owns the media in India? (29 May 2019)",
    "sources": [
      "https://india.mom-gmr.org/en/findings/politicalaffiliations/"
    ]
  },
  {
    "id": "hmd022",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TN",
    "subtopic": "Kalaignar TV / 2G",
    "kind": "scam",
    "difficulty": "extreme",
    "year": 2017,
    "govt": "NDA",
    "question": "In the 2G case, investigators alleged Swan Telecom’s promoters paid how much to DMK-run Kalaignar TV? A special court acquitted all accused in December 2017.",
    "options": [
      "₹200 crore",
      "₹20 crore",
      "₹2,000 crore",
      "₹75 crore"
    ],
    "correctIndex": 0,
    "explanation": "The Enforcement Directorate alleged the ₹200 crore payment; on 21 Dec 2017 the special court acquitted all accused, saying the prosecution had “miserably failed” to prove its charges. The CBI and ED appealed, and the Delhi HC admitted the CBI’s appeal in March 2024; it was pending as of 2026-09.",
    "status": "All accused acquitted by special court (21 Dec 2017); CBI appeal admitted by Delhi HC (Mar 2024), pending as of 2026-09.",
    "people": [
      "A. Raja",
      "Kanimozhi"
    ],
    "sourceUrl": "https://www.outlookindia.com/national/2g-scam-verdict-a-raja-kanimozhi-found-guilty-by-special-cbi-court-news-305794",
    "sourceLabel": "Outlook — 2G scam verdict: A Raja, Kanimozhi acquitted by special CBI court (21 Dec 2017)",
    "sources": [
      "https://www.barandbench.com/news/2g-spectrum-case-six-years-later-delhi-high-court-admits-cbi-appeal-acquittal-a-raja"
    ]
  },
  {
    "id": "hmd023",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TG",
    "subtopic": "Namasthe Telangana ads",
    "kind": "spend",
    "difficulty": "extreme",
    "year": 2018,
    "govt": "BRS",
    "question": "RTI data published in 2018 showed Telangana government ads in Namasthe Telangana, run by the CM’s family firm, rose from ₹2.6 crore in 2016 to what in 2018?",
    "options": [
      "₹5.2 crore",
      "₹26.4 crore",
      "₹48.0 crore",
      "₹12.8 crore"
    ],
    "correctIndex": 3,
    "explanation": "The Wire’s RTI-based analysis (July 2018) put the rise at 387.4%; sister paper Telangana Today went from ₹4.7 lakh to ₹87.3 lakh. Both are published by Telangana Publications, launched by K. Chandrasekhar Rao, whose wife sat on its board. The figures came from the state I&PR department’s own RTI reply.",
    "status": "Government spending data from an RTI reply; no finding of wrongdoing against any person.",
    "people": [
      "K. Chandrasekhar Rao"
    ],
    "sourceUrl": "https://thewire.in/politics/chief-minister-chanrasekhar-rao-telangana-media-owner",
    "sourceLabel": "The Wire — When the Chief Minister is also a media owner (20 Jul 2018)"
  },
  {
    "id": "hmd024",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "RSF index 2014",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2014,
    "govt": "UPA",
    "question": "What was India’s rank out of 180 countries in RSF’s World Press Freedom Index 2014?",
    "options": [
      "105th",
      "140th",
      "122nd",
      "161st"
    ],
    "correctIndex": 1,
    "explanation": "RSF ranked India 140th in 2014, citing “an unprecedented wave of violence against journalists” with eight killed in 2013 and endemic censorship in Kashmir and Chhattisgarh. India later fell to 150th (2022) and a low of 161st (2023), then 151st (2025) and 157th (2026).",
    "sourceUrl": "https://rsf.org/en/node/79154",
    "sourceLabel": "RSF — World Press Freedom Index 2014",
    "sources": [
      "https://www.tribuneindia.com/news/nation/world-press-freedom-index-india-slips-11-places-to-161st-rank-media-associations-voice-concern-504444",
      "https://rsf.org/en/country/india"
    ]
  },
  {
    "id": "hmd025",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "BBC India / FEMA",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2025,
    "govt": "NDA",
    "question": "In February 2025 the ED fined BBC World Service India ₹3.44 crore for not cutting foreign investment in its digital news business to what cap?",
    "options": [
      "26%",
      "49%",
      "74%",
      "51%"
    ],
    "correctIndex": 0,
    "explanation": "The ED said BBC WS India stayed 100% foreign-owned despite the 2019 26% cap for digital news, adding ₹5,000 a day from 15 Oct 2021 and about ₹1.14 crore on each of three directors. Its FEMA case followed a Feb 2023 Income Tax “survey” of BBC offices. The BBC said it had not received the order and was committed to operating within the law.",
    "status": "ED adjudication order (civil FEMA penalty), Feb 2025; BBC said it had not yet received it.",
    "sourceUrl": "https://theprint.in/india/ed-fines-bbc-india-rs-3-44-crore-for-fema-violations-penalises-3-directors-too/2505840/",
    "sourceLabel": "ThePrint — ED fines BBC World Service India Rs 3.44 crore for FEMA violations (21 Feb 2025)",
    "sources": [
      "https://www.thehindu.com/news/national/ed-issues-order-levying-penalty-of-over-344-crore-on-bbc-ws-india-for-alleged-fema-violations/article69248049.ece"
    ]
  },
  {
    "id": "hmd026",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "JK",
    "subtopic": "Anuradha Bhasin judgment",
    "kind": "institution",
    "difficulty": "extreme",
    "year": 2020,
    "govt": "NDA",
    "question": "In Anuradha Bhasin (January 2020) the Supreme Court read safeguards into the telecom suspension rules. How often must a review committee re-examine each shutdown order?",
    "options": [
      "Every 30 days",
      "Every 90 days",
      "Every 7 working days",
      "Every 6 months"
    ],
    "correctIndex": 2,
    "explanation": "Ruling on the Kashmir communications shutdown, the court held that suspension orders must be published, cannot be indefinite and must be reviewed every seven working days, applying a proportionality test. It treated the internet as a medium for exercising fundamental rights rather than a fundamental right in itself.",
    "status": "Court ruling; the petitioner is a journalist, no allegation against any person.",
    "people": [
      "Anuradha Bhasin"
    ],
    "sourceUrl": "https://internetfreedom.in/scs-judgement-on-kashmir-communication-is-just-the-beginning/",
    "sourceLabel": "Internet Freedom Foundation — SC’s Kashmir communication shutdown judgement is just the beginning (10 Jan 2020)"
  },
  {
    "id": "hmd027",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Central govt ad spend",
    "kind": "spend",
    "difficulty": "extreme",
    "year": 2022,
    "govt": "NDA",
    "question": "The I&B minister told the Rajya Sabha in December 2022 how much the Centre had spent on ads via the Central Bureau of Communication since 2017-18. Roughly how much?",
    "options": [
      "₹1,172 crore",
      "₹3,723 crore",
      "₹9,450 crore",
      "₹17,230 crore"
    ],
    "correctIndex": 1,
    "explanation": "The written reply showed over ₹1,200 crore in 2017-18 and about ₹1,100 crore in 2018-19, then ₹627.67 crore (2019-20), ₹349.09 crore (2020-21), ₹264.78 crore (2021-22) and ₹154.07 crore up to 9 Dec 2022. Minister Anurag Thakur said ad spending had not increased in recent years.",
    "status": "Parliament reply; no allegation.",
    "people": [
      "Anurag Thakur"
    ],
    "sourceUrl": "https://indianexpress.com/article/india/govt-spent-rs-3723-crore-on-ads-in-5-years-no-increase-anurag-thakur-8327198/",
    "sourceLabel": "The Indian Express — Govt spent Rs 3,723 crore on ads in 5 years, no increase: Anurag Thakur (16 Dec 2022)"
  },
  {
    "id": "hmd028",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "UP",
    "subtopic": "Paid news: first disqualification",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2011,
    "govt": "BSP",
    "question": "In 2011 the Election Commission made UP MLA Umlesh Yadav the first ‘paid news’ disqualification. How much ad spending had she left out of her poll accounts?",
    "options": [
      "₹2.1 lakh",
      "₹21 lakh",
      "₹2.1 crore",
      "₹21,250"
    ],
    "correctIndex": 3,
    "explanation": "The ECI disqualified her from contesting for three years from 20 Oct 2011 under Section 10A of the RP Act for suppressing ₹21,250 spent on ads in two Hindi dailies that were “masquerading as news items”. She had won Bisauli in 2007 on a Rashtriya Parivartan Dal ticket.",
    "status": "Disqualified by the ECI for three years from 20 Oct 2011 (Section 10A, RP Act; poll-expense accounts); the period has lapsed. No criminal finding in this item.",
    "people": [
      "Umlesh Yadav"
    ],
    "sourceUrl": "https://www.thehindu.com/news/national/paid-news-claims-first-political-scalp-as-ec-disqualifies-mla/article2556366.ece",
    "sourceLabel": "The Hindu — ‘Paid news’ claims first political scalp as EC disqualifies MLA (21 Oct 2011)"
  },
  {
    "id": "hmd029",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "AP",
    "subtopic": "Andhra channel blackout 2019",
    "kind": "media",
    "difficulty": "extreme",
    "year": 2019,
    "govt": "YSRCP",
    "question": "When cable operators pulled TV5 and ABN Andhra Jyothy in YSRCP-ruled Andhra Pradesh in Sept 2019, the channels cited a TRAI rule requiring how many days’ notice first?",
    "options": [
      "7 days",
      "45 days",
      "21 days",
      "3 days"
    ],
    "correctIndex": 2,
    "explanation": "Under TRAI rules operators cannot disconnect a channel without 21 days’ notice and a stated reason. Channel executives alleged three state ministers told operators to drop them; the ministers’ offices did not respond to The News Minute. The channels likened it to the 2014 blocking of TV9 and ABN in TRS-ruled Telangana.",
    "status": "Allegations by channel executives; ministers did not respond; no finding against any person.",
    "sourceUrl": "https://www.thenewsminute.com/andhra-pradesh/tv5-and-abn-andhra-jyothi-channels-go-cable-networks-ysrcp-behind-ban-109093",
    "sourceLabel": "The News Minute — TV5 and ABN Andhra Jyothi channels go off cable networks, YSRCP behind ban? (18 Sep 2019)"
  },
  {
    "id": "hmd030",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KA",
    "subtopic": "Karnataka misinformation bill",
    "kind": "institution",
    "difficulty": "extreme",
    "year": 2025,
    "govt": "INC",
    "question": "The Karnataka Cabinet’s June 2025 draft misinformation bill proposed jail of up to how many years for posting ‘fake news’?",
    "options": [
      "7 years",
      "1 year",
      "3 years",
      "10 years"
    ],
    "correctIndex": 0,
    "explanation": "The draft Karnataka Misinformation and Fake News (Prohibition) Bill also proposed fines of up to ₹10 lakh. After criticism from groups such as the Internet Freedom Foundation, the Congress government’s July 2025 redraft dropped “fake news” from the title and no longer stated the penalty quantum. It had not become law as of 2026-09.",
    "status": "Draft bill; not enacted as of 2026-09.",
    "sourceUrl": "https://www.newindianexpress.com/states/karnataka/2025/Jul/27/karnataka-government-dilutes-misinformation-bill-drops-fake-news",
    "sourceLabel": "The New Indian Express — Karnataka government dilutes misinformation bill, drops ‘fake news’ (27 Jul 2025)",
    "sources": [
      "https://internetfreedom.in/statement-on-the-karnataka-misinformation-and-fake-news-prohibition-bill-2025/"
    ]
  },
  {
    "id": "hmd031",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Internet shutdowns 2025",
    "kind": "institution",
    "difficulty": "extreme",
    "year": 2025,
    "govt": "NDA",
    "question": "Access Now’s report on 2025 counted how many internet shutdowns in India — its lowest since 2017, yet still the highest of any democracy?",
    "options": [
      "116",
      "29",
      "134",
      "65"
    ],
    "correctIndex": 3,
    "explanation": "India imposed 65 shutdowns in 2025 across 12 states and territories, after 84 in 2024 and 116 in 2023; Myanmar led the world for a second year with 95. Of the 2,102 shutdowns Access Now has logged worldwide since 2016, 920 were in India.",
    "sourceUrl": "https://indianexpress.com/article/india/india-recorded-65-internet-shutdowns-in-2025-highest-among-democracies-access-now-report-10613113/",
    "sourceLabel": "The Indian Express — India recorded 65 internet shutdowns in 2025: Access Now report (1 Apr 2026)"
  },
  {
    "id": "hmd032",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "JK",
    "subtopic": "J&K 4G restoration",
    "kind": "institution",
    "difficulty": "extreme",
    "year": 2021,
    "govt": "NDA",
    "question": "In February 2021 the J&K administration ordered 4G mobile internet restored across the Union Territory. Roughly how long after it was curtailed in August 2019?",
    "options": [
      "About 6 months",
      "About 18 months",
      "About 30 months",
      "About 9 months"
    ],
    "correctIndex": 1,
    "explanation": "On 5 Feb 2021 the administration revoked the curbs across J&K, about a year and a half after services were cut when the state was split and downgraded, though prepaid users needed post-paid-style verification. The move came amid criticism at home and abroad of internet restrictions.",
    "sourceUrl": "https://indianexpress.com/article/india/jammu-kashmir-internet-services-restored-7176371/",
    "sourceLabel": "The Indian Express — 18 months after split, downgrade, 4G mobile Internet back in J&K (5 Feb 2021)"
  },
  {
    "id": "hmd033",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "DL",
    "subtopic": "Delhi govt ads (CCRGA)",
    "kind": "spend",
    "difficulty": "extreme",
    "year": 2022,
    "govt": "AAP",
    "question": "In December 2022 Delhi’s L-G directed the Chief Secretary to recover how much from the AAP for 2015–16 ads that a government-ad content panel had found in breach of Supreme Court guidelines?",
    "options": [
      "₹97.14 crore",
      "₹9.71 crore",
      "₹971 crore",
      "₹1,100 crore"
    ],
    "correctIndex": 0,
    "explanation": "L-G V.K. Saxena ordered the Committee on Content Regulation in Government Advertising’s Sept 2016 finding enforced, with interest. The AAP called the orders “illegal” and said the L-G had no jurisdiction. Separately, in 2023 the SC cited Delhi’s ₹1,100 crore three-year ad budget while pressing it to fund the RRTS project.",
    "status": "Recovery direction disputed by the AAP; no court finding against any person.",
    "people": [
      "V.K. Saxena"
    ],
    "sourceUrl": "https://www.thehindu.com/news/cities/Delhi/delhi-l-g-directs-chief-secretary-to-recover-9714-crore-from-aam-aadmi-party-for-political-advertisements/article66284313.ece",
    "sourceLabel": "The Hindu — Delhi L-G directs Chief Secretary to recover ₹97.14 crore from AAP for political advertisements (20 Dec 2022)",
    "sources": [
      "https://www.thehindu.com/news/national/sc-tells-delhi-to-transfer-its-ad-budget-to-pay-for-rrts-project-but-keeps-order-in-abeyance-for-a-week/article67557527.ece"
    ]
  },
  {
    "id": "hmd034",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TN",
    "subtopic": "Sun TV",
    "kind": "media",
    "difficulty": "simple",
    "year": 2023,
    "govt": "DMK",
    "question": "Sun TV, the most popular of Tamil Nadu’s politically linked channels, is owned by Kalanithi Maran, the elder brother of an MP from which party?",
    "options": [
      "AIADMK",
      "PMK",
      "DMK",
      "Congress"
    ],
    "correctIndex": 2,
    "explanation": "The Indian Express (Jan 2023) notes that Sun TV is owned by DMK MP Dayanidhi Maran’s elder brother Kalanithi, while the DMK directly runs Kalaignar Seithigal. The Media Ownership Monitor found Kalanithi Maran and his wife own the Sun Group company that publishes the Tamil daily Dinakaran.",
    "status": "Ownership fact; no allegation.",
    "people": [
      "Kalanithi Maran",
      "Dayanidhi Maran"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)",
    "sources": [
      "https://india.mom-gmr.org/en/media/detail/outlet/dinakaran/"
    ]
  },
  {
    "id": "hmd035",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "AP",
    "subtopic": "Sakshi TV",
    "kind": "media",
    "difficulty": "simple",
    "year": 2009,
    "govt": "INC",
    "question": "Telugu news channel Sakshi TV, launched in 2009 by Indira Television and run by Y.S. Bharathi Reddy, belongs to the family of which party’s chief?",
    "options": [
      "Telugu Desam Party",
      "YSR Congress Party",
      "Bharat Rashtra Samithi",
      "Jana Sena Party"
    ],
    "correctIndex": 1,
    "explanation": "The Indian Express (Jan 2023) reports that Jagan Mohan Reddy’s company Indira Television launched Sakshi TV in March 2009 and is run by his wife, Y.S. Bharathi Reddy; the Telugu daily Sakshi was launched by Jagati Publications in March 2008. Sakshi TV was among four channels blacked out by cable operators in June 2024.",
    "status": "Ownership fact; no allegation in this item.",
    "people": [
      "Y.S. Jagan Mohan Reddy",
      "Y.S. Bharathi Reddy"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)"
  },
  {
    "id": "hmd036",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "Kairali TV",
    "kind": "media",
    "difficulty": "simple",
    "year": 2021,
    "govt": "LDF",
    "question": "Kerala’s Kairali TV is owned by Malayalam Communications, whose managing director John Brittas entered the Rajya Sabha in 2021. Which party backs the company?",
    "options": [
      "Indian National Congress",
      "Indian Union Muslim League",
      "Bharatiya Janata Party",
      "CPI(M)"
    ],
    "correctIndex": 3,
    "explanation": "The Indian Express (2023) reports that Malayalam Communications, owner of Kairali TV and People TV, has the backing of the CPI(M), with party leaders owning a major portion of its shares. PRS lists Brittas as a CPI(M) Rajya Sabha member from Kerala since April 2021.",
    "status": "Ownership/political-link fact; no allegation.",
    "people": [
      "John Brittas"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)",
    "sources": [
      "https://prsindia.org/mptrack/rajya-sabha/john-brittas"
    ]
  },
  {
    "id": "hmd037",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "KL",
    "subtopic": "Janam TV",
    "kind": "media",
    "difficulty": "simple",
    "year": 2015,
    "govt": "UDF",
    "question": "Janam TV, a Malayalam news channel launched in April 2015, is described by The Indian Express as leaning towards which ideological family?",
    "options": [
      "The Left Democratic Front",
      "The Congress-led UDF",
      "The Sangh Parivar",
      "The Indian Union Muslim League"
    ],
    "correctIndex": 2,
    "explanation": "Before its launch, chairman and film director Priyadarshan said neither the RSS nor the BJP backed the channel, which he said had about 5,000 shareholders. In 2023 BJP sources told The Indian Express that a planned BJP channel in Tamil Nadu would be “an extension of Janam TV”.",
    "status": "Editorial-lean description; the channel denied party backing at launch. No allegation.",
    "people": [
      "Priyadarshan"
    ],
    "sourceUrl": "https://indianexpress.com/article/political-pulse/tv-channels-sun-tv-sakshi-tv-to-kairali-8402373/",
    "sourceLabel": "The Indian Express — Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to politicians (25 Jan 2023)",
    "sources": [
      "https://www.business-standard.com/article/news-ians/janam-tv-has-no-rss-or-bjp-backing-priyadarshan-115021800832_1.html"
    ]
  },
  {
    "id": "hmd038",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "MH",
    "subtopic": "Saamana",
    "kind": "media",
    "difficulty": "simple",
    "year": 2020,
    "govt": "SS",
    "question": "In March 2020 Rashmi Thackeray became editor of Saamana after her husband Uddhav became Chief Minister. Saamana is the mouthpiece of which party?",
    "options": [
      "Shiv Sena",
      "NCP",
      "MNS",
      "BJP"
    ],
    "correctIndex": 0,
    "explanation": "Uddhav Thackeray had edited the Marathi daily since 2012 and stepped down on becoming Maharashtra CM in Nov 2019 — a party leader said, to avoid a conflict of interest as the paper receives government ads. Party MP Sanjay Raut stayed on as executive editor.",
    "status": "Editorial-post fact; no allegation.",
    "people": [
      "Rashmi Thackeray",
      "Uddhav Thackeray",
      "Sanjay Raut"
    ],
    "sourceUrl": "https://scroll.in/latest/954796/uddhav-thackerays-wife-rashmi-takes-over-as-editor-of-shiv-sena-mouthpiece-saamana",
    "sourceLabel": "Scroll.in — Rashmi Thackeray appointed editor of Shiv Sena’s ‘Saamana’ (1 Mar 2020)"
  },
  {
    "id": "hmd039",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "TG",
    "subtopic": "T News",
    "kind": "media",
    "difficulty": "simple",
    "year": 2011,
    "govt": "INC",
    "question": "Telugu news channel T News, registered in 2010 and on air from 2011, was started by the leader of which party?",
    "options": [
      "Telugu Desam Party",
      "Indian National Congress",
      "YSR Congress Party",
      "TRS (now BRS)"
    ],
    "correctIndex": 3,
    "explanation": "The Wire (2018) reports that T News was started by K. Chandrasekhar Rao with associates on its board; he left the board after becoming Telangana CM, and it is seen as the CM’s channel. Telangana Publications, linked to his family, also runs Namasthe Telangana and Telangana Today.",
    "status": "Ownership fact; no allegation.",
    "people": [
      "K. Chandrasekhar Rao"
    ],
    "sourceUrl": "https://thewire.in/politics/chief-minister-chanrasekhar-rao-telangana-media-owner",
    "sourceLabel": "The Wire — When the Chief Minister is also a media owner (20 Jul 2018)",
    "sources": [
      "https://en.wikipedia.org/wiki/T_News"
    ]
  },
  {
    "id": "hmd040",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "AS",
    "subtopic": "News Live",
    "kind": "media",
    "difficulty": "simple",
    "year": 2019,
    "govt": "BJP",
    "question": "The Media Ownership Monitor found Assam channel News Live majority-owned by Riniki Bhuyan Sarma, wife of a sitting state minister from which party?",
    "options": [
      "Indian National Congress",
      "Bharatiya Janata Party",
      "AIUDF",
      "Asom Gana Parishad"
    ],
    "correctIndex": 1,
    "explanation": "MOM (2019) recorded 51.33% of owner Pride East Entertainments with Riniki Bhuyan Sarma, and further stakes with the parents of her husband Himanta Biswa Sarma, then Assam’s finance and health minister. RSF cited News Live as an example of how politics and media ownership overlap.",
    "status": "Ownership fact (2019 data); no allegation.",
    "people": [
      "Riniki Bhuyan Sarma",
      "Himanta Biswa Sarma"
    ],
    "sourceUrl": "https://india.mom-gmr.org/en/media/detail/outlet/news-live/",
    "sourceLabel": "Media Ownership Monitor India (RSF/DataLEADS) — News Live (2019)",
    "sources": [
      "https://rsf.org/en/media-ownership-monitor-who-owns-media-india"
    ]
  },
  {
    "id": "hmd041",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "RSF index 2026",
    "kind": "media",
    "difficulty": "simple",
    "year": 2026,
    "govt": "NDA",
    "question": "In RSF’s World Press Freedom Index 2026, released in April 2026, where did India rank out of 180 countries?",
    "options": [
      "157th",
      "151st",
      "161st",
      "142nd"
    ],
    "correctIndex": 0,
    "explanation": "India slipped six places from 151st in 2025 to 157th, scoring 31.96. RSF’s India profile cites violence against journalists and concentrated ownership, saying Mukesh Ambani owns over 70 outlets and that the 2022 NDTV takeover by Gautam Adani “signalled the end of pluralism” in mainstream media.",
    "status": "RSF ranking and assessment; no allegation of illegality against any person.",
    "people": [
      "Mukesh Ambani",
      "Gautam Adani"
    ],
    "sourceUrl": "https://rsf.org/en/country/india",
    "sourceLabel": "RSF — India country profile, World Press Freedom Index 2026",
    "sources": [
      "https://m.thewire.in/article/media/india-is-157th-out-of-180-countries-on-rsfs-2026-world-press-freedom-index"
    ]
  },
  {
    "id": "hmd042",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "UP",
    "subtopic": "Siddique Kappan",
    "kind": "media",
    "difficulty": "simple",
    "year": 2020,
    "govt": "BJP",
    "question": "Kerala journalist Siddique Kappan was arrested by Uttar Pradesh Police in October 2020 while travelling to report on a crime in which district?",
    "options": [
      "Unnao",
      "Lakhimpur Kheri",
      "Hathras",
      "Muzaffarnagar"
    ],
    "correctIndex": 2,
    "explanation": "He was arrested on 5 Oct 2020 en route to cover the death of a Dalit woman who was allegedly gang-raped; UP Police alleged links to the now-banned PFI and invoked UAPA, later adding a money-laundering case. The SC granted bail in Sept 2022, saying every person has a right to free expression; he left jail on 2 Feb 2023.",
    "status": "Arrested Oct 2020 (UAPA, PMLA); on bail, released Feb 2023; SC relaxed bail conditions Nov 2024; cases not concluded as of 2026-09. Not convicted.",
    "people": [
      "Siddique Kappan"
    ],
    "sourceUrl": "https://www.boomlive.in/law/kerala-journalist-siddique-kappan-uapa-pfi-hathras-up-police-20922",
    "sourceLabel": "BOOM — Kerala journalist Siddique Kappan walks out of jail after 2 years (2 Feb 2023)",
    "sources": [
      "https://www.thehindu.com/news/national/sc-relaxes-journalist-siddique-kappans-bail-condition/article68827976.ece"
    ]
  },
  {
    "id": "hmd043",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Section 66A",
    "kind": "institution",
    "difficulty": "simple",
    "year": 2015,
    "govt": "NDA",
    "question": "In Shreya Singhal v Union of India (March 2015), the Supreme Court struck down which provision that had been used to arrest people over online posts?",
    "options": [
      "Section 69A of the IT Act",
      "Section 66A of the IT Act",
      "Section 124A of the IPC",
      "Section 295A of the IPC"
    ],
    "correctIndex": 1,
    "explanation": "The court held Section 66A “constitutionally vague” and outside the reasonable restrictions allowed on free speech. New FIRs under the struck-down provision kept being filed, and in July 2021 the PUCL asked the Supreme Court to stop its further use.",
    "sourceUrl": "https://www.scobserver.in/journal/section-66a-4-must-reads-2/",
    "sourceLabel": "Supreme Court Observer — Section 66A: 4 must reads (2021)"
  },
  {
    "id": "hmd044",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Sedition law",
    "kind": "institution",
    "difficulty": "simple",
    "year": 2022,
    "govt": "NDA",
    "question": "In May 2022 the Supreme Court put pending trials under which colonial-era offence in abeyance while the Centre reconsidered the law?",
    "options": [
      "Criminal defamation",
      "Section 66A of the IT Act",
      "The Official Secrets Act",
      "Sedition (Section 124A IPC)"
    ],
    "correctIndex": 3,
    "explanation": "A bench led by CJI N.V. Ramana on 11 May 2022 kept all Section 124A trials, appeals and proceedings in abeyance and said it expected governments not to register fresh FIRs; it was told about 13,000 people were in jail under the provision. The Centre had told the court it was re-examining the law.",
    "status": "Court order; no allegation against any person.",
    "people": [
      "N.V. Ramana"
    ],
    "sourceUrl": "https://www.thehindu.com/news/national/sc-asks-centre-states-to-not-file-fresh-firs-in-sedition-cases/article65403622.ece",
    "sourceLabel": "The Hindu — Supreme Court puts colonial sedition law on hold (11 May 2022)"
  },
  {
    "id": "hmd045",
    "domain": "civics",
    "region": "India",
    "topic": "Media & Speech",
    "asOf": "2026-09",
    "state": "IN",
    "subtopic": "Dainik Bhaskar searches",
    "kind": "media",
    "difficulty": "simple",
    "year": 2021,
    "govt": "NDA",
    "question": "In July 2021, which agency searched Dainik Bhaskar Group premises in nine cities? The paper linked the searches to its Covid reporting.",
    "options": [
      "Enforcement Directorate",
      "Central Bureau of Investigation",
      "Income Tax Department",
      "SEBI"
    ],
    "correctIndex": 2,
    "explanation": "The I-T department then alleged ₹700 crore of tax evasion over six years and bogus expenses; the CBDT said seized material was being examined. Dainik Bhaskar said the searches were the result of its critical journalism on the government’s Covid handling; a group editor said governments had stopped its ads for months.",
    "status": "Tax-evasion allegations by the CBDT (July 2021); no court finding reported in this item.",
    "sourceUrl": "https://indianexpress.com/article/india/dainik-bhaskar-group-it-raid-tax-evasion-7420920/",
    "sourceLabel": "The Indian Express — After raids, I-T alleges Rs 700-cr tax evasion by Dainik Bhaskar Group (25 Jul 2021)"
  }
]);
