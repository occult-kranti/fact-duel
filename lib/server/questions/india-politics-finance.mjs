/* LEDGER — Politics & Money Desk question bank v1.1
 * 95 items: 48 politics (2000-2026: audits/courts, parties, ministries, elections, schemes timeline)
 * + 47 finance (schemes, markets, investment literacy, budgets).
 * Every item sourced to an official record; mutable facts date-stamped in explanations.
 * REGISTRATION: extend tests/bank.test.mjs id regex with the pl/gs/mm/ia/bd prefixes,
 * import+flatten in lib/server/bank.mjs, add topics to TOPIC_DOMAINS (lib/journal.mjs),
 * domains to ALL_DOMAINS+ENABLED_DOMAINS (lib/content.mjs), topic.* i18n keys, bump bankVersion.
 */
export const INDIA_POLITICS_FINANCE = Object.freeze([
{
  "id": "pl001",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "What presumptive-loss figure did the CAG's performance audit of the issue of 2G telecom licences and spectrum (Report No. 19 of 2010-11) place at the upper end of its estimate for revenue forgone?",
  "options": [
    "₹22,000 crore",
    "₹58,000 crore",
    "₹1.76 lakh crore",
    "₹10.67 lakh crore"
  ],
  "correctIndex": 2,
  "explanation": "The report was tabled in Parliament on 16 November 2010; it computed presumptive loss across methodologies, with ₹1.76 lakh crore as the headline figure. The Supreme Court quashed the licences on 2 February 2012; the figure itself was never judicially adjudicated.",
  "sourceUrl": "https://cag.gov.in",
  "sourceLabel": "Comptroller and Auditor General of India — Report No. 19 of 2010-11 (Performance Audit of Issue of Licences and Allocation of 2G Spectrum)"
},
{
  "id": "pl002",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "extreme",
  "question": "On which date was the CAG's report on the issue of 2G licences and allocation of spectrum (Report No. 19 of 2010-11) tabled in Parliament?",
  "options": [
    "10 November 2010",
    "16 November 2010",
    "17 August 2012",
    "2 February 2012"
  ],
  "correctIndex": 1,
  "explanation": "The report was submitted to the government in November 2010 and tabled in Parliament on 16 November 2010. It examined DoT processes from 2003 through the 2008 allocations.",
  "sourceUrl": "https://cag.gov.in",
  "sourceLabel": "Comptroller and Auditor General of India — Report No. 19 of 2010-11"
},
{
  "id": "pl003",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "In its judgment of 2 February 2012 in Centre for Public Interest Litigation v. Union of India, the Supreme Court held the 2008 grant of 2G licences and spectrum unconstitutional and:",
  "options": [
    "quashed all 122 licences and directed reallocation by auction",
    "ordered only a fresh CBI inquiry, leaving licences intact",
    "imposed monetary penalties equal to the CAG estimate",
    "referred the allocations to the CAG for re-audit"
  ],
  "correctIndex": 0,
  "explanation": "The Court quashed 122 Unified Access Service licences issued in 2008 and directed that spectrum be allocated through auction. The cancellation took effect after four months to protect ongoing services.",
  "sourceUrl": "https://main.sci.gov.in",
  "sourceLabel": "Supreme Court of India — Centre for Public Interest Litigation v. Union of India, (2012) 3 SCC 1"
},
{
  "id": "pl004",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "On 21 December 2017, the special CBI court hearing the 2G spectrum cases (Special Judge O.P. Saini) held that:",
  "options": [
    "the former telecom minister was convicted of criminal misconduct",
    "the licences should be re-auctioned by court order",
    "the trial should move to a Supreme Court bench",
    "all accused were acquitted, the prosecution having failed to prove the charges"
  ],
  "correctIndex": 3,
  "explanation": "The special court acquitted all accused in the CBI and ED cases, holding the prosecution had not proved the charges. CBI and ED appeals were admitted by the Delhi High Court in 2024 and, as of early 2026, remain pending; the acquittal stands.",
  "sourceUrl": "https://www.thehindu.com",
  "sourceLabel": "Special CBI Court, New Delhi — 2G cases judgment of 21 December 2017 (appeals pending before Delhi High Court)"
},
{
  "id": "pl005",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "The CAG's Report No. 7 of 2012-13 on allocation of coal blocks, tabled in Parliament on 17 August 2012, estimated the financial gain to private allottees at approximately:",
  "options": [
    "₹1.76 lakh crore",
    "₹1.86 lakh crore",
    "₹91,000 crore",
    "₹30,984 crore"
  ],
  "correctIndex": 1,
  "explanation": "Tabled on 17 August 2012, the report computed a figure of about ₹1.86 lakh crore using 2010-11 Coal India cost and price data. In 2014 the Supreme Court declared the screening-committee allocations arbitrary and cancelled 214 blocks; reallocation moved to auctions under the Coal Mines (Special Provisions) Act, 2015.",
  "sourceUrl": "https://cag.gov.in",
  "sourceLabel": "Comptroller and Auditor General of India — Report No. 7 of 2012-13 (Performance Audit of Allocation of Coal Blocks and Augmentation of Coal Production)"
},
{
  "id": "pl006",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "simple",
  "question": "On 15 February 2024, in Association for Democratic Reforms v. Union of India, a five-judge Constitution Bench of the Supreme Court unanimously struck down which instrument of political funding as unconstitutional?",
  "options": [
    "Electoral trusts",
    "The National Electoral Fund",
    "The Electoral Bonds Scheme, 2018",
    "Anonymous cash donations above ₹2,000"
  ],
  "correctIndex": 2,
  "explanation": "The bench held the scheme violated voters' right to information under Article 19(1)(a) and was manifestly arbitrary; SBI was directed to stop issuing bonds and share purchase and redemption data with the ECI, which published it in March 2024.",
  "sourceUrl": "https://www.thehindu.com/news/national/electoral-bonds-scheme-unconstitutional-sbi-should-reveal-the-details-of-donors-rules-sc/article67848211.ece",
  "sourceLabel": "Supreme Court of India — ADR v. Union of India, 2024 INSC 113 (judgment of 15 February 2024)"
},
{
  "id": "pl007",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "Following the 2010 Commonwealth Games, the Prime Minister on 25 October 2010 appointed which body to examine irregularities in the execution of Games projects?",
  "options": [
    "A commission headed by Justice J.A. Patil",
    "The Second Administrative Reforms Commission",
    "The Justice Verma Committee",
    "A High Level Committee chaired by former CAG V.K. Shunglu"
  ],
  "correctIndex": 3,
  "explanation": "The Shunglu Committee submitted a series of reports from January 2011 examining the Organising Committee and executing agencies; the CAG separately tabled its CWG performance audit (Report No. 6 of 2011-12) in August 2011.",
  "sourceUrl": "https://pib.gov.in",
  "sourceLabel": "Government of India — High Level Committee on Commonwealth Games (Shunglu Committee), constituted 25 October 2010"
},
{
  "id": "pl008",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "extreme",
  "question": "The judicial commission that inquired into the Adarsh Cooperative Housing Society matter, and submitted its final report to the Maharashtra government in April 2013, was headed by:",
  "options": [
    "Justice J.A. Patil (retired)",
    "Justice M.B. Shah",
    "Justice B.N. Srikrishna",
    "Justice R.M. Lodha"
  ],
  "correctIndex": 0,
  "explanation": "The two-member commission, headed by retired Bombay High Court judge Justice J.A. Patil, recorded evidence over about two years and reported 25 allotments it found irregular. Findings of commissions of inquiry are recommendatory; criminal proceedings followed separate channels.",
  "sourceUrl": "https://www.indianexpress.com",
  "sourceLabel": "Government of Maharashtra — Adarsh Inquiry Commission (appointed January 2011; final report April 2013)"
},
{
  "id": "pl009",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "On 1 October 2018, acting on the Union government's petition after IL&FS group defaults, which forum superseded the company's board and installed a government-nominated board chaired by Uday Kotak?",
  "options": [
    "Securities Appellate Tribunal",
    "Debt Recovery Tribunal",
    "National Company Law Tribunal",
    "Competition Commission of India"
  ],
  "correctIndex": 2,
  "explanation": "The Centre moved the NCLT under Sections 241-242 of the Companies Act, 2013 after the IL&FS group's payment defaults. The new board pursued a resolution framework for group debt of over ₹90,000 crore.",
  "sourceUrl": "https://pib.gov.in",
  "sourceLabel": "National Company Law Tribunal / Ministry of Corporate Affairs — order of 1 October 2018; SFIO directed to investigate on 30 September 2018"
},
{
  "id": "pl010",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "On 5 March 2020 the RBI superseded the board of Yes Bank and the bank was placed under a moratorium capping deposit withdrawals at:",
  "options": [
    "₹10,000 per depositor",
    "₹50,000 per depositor",
    "₹1,00,000 per depositor",
    "₹5,00,000 per depositor"
  ],
  "correctIndex": 1,
  "explanation": "The moratorium under Section 45 of the Banking Regulation Act was lifted on 18 March 2020 after a reconstruction scheme in which SBI and other banks injected capital. No depositor lost money under the scheme.",
  "sourceUrl": "https://www.rbi.org.in",
  "sourceLabel": "Reserve Bank of India — press releases of 5-6 March 2020; Yes Bank Reconstruction Scheme, 2020"
},
{
  "id": "pl011",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "After imposing All Inclusive Directions on Punjab and Maharashtra Co-operative (PMC) Bank on 23 September 2019, the RBI's resolution eventually amalgamated the bank, effective 25 January 2022, with:",
  "options": [
    "Punjab & Sind Bank",
    "Saraswat Co-operative Bank",
    "India Post Payments Bank",
    "Unity Small Finance Bank"
  ],
  "correctIndex": 3,
  "explanation": "The RBI superseded PMC Bank's board in September 2019 after finding concealed stressed exposure. The amalgamation scheme, sanctioned by the Central government under the Banking Regulation Act, took effect on 25 January 2022. Challenges to the scheme were rejected by the Bombay High Court, and the Supreme Court declined to interfere.",
  "sourceUrl": "https://www.rbi.org.in",
  "sourceLabel": "Reserve Bank of India / Government of India — PMC Bank (Amalgamation with Unity Small Finance Bank) Scheme, 2022"
},
{
  "id": "pl012",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "Weeks after the CBI registered a case (31 January 2018) over fraudulent Letters of Undertaking at Punjab National Bank, the RBI on 13 March 2018 directed banks to discontinue which instruments for trade credit?",
  "options": [
    "Letters of Undertaking (LoUs) and Letters of Comfort",
    "Bank guarantees and inland letters of credit",
    "External commercial borrowings",
    "Bills of exchange and promissory notes"
  ],
  "correctIndex": 0,
  "explanation": "The fraud involved unauthorised LoUs issued from a PNB branch between 2011 and 2017. The RBI's circular barred LoUs and Letters of Comfort as trade-credit instruments with immediate effect; criminal proceedings in the case continue through the courts.",
  "sourceUrl": "https://www.rbi.org.in",
  "sourceLabel": "Reserve Bank of India — circular of 13 March 2018 discontinuing LoUs/LoCs for trade credits"
},
{
  "id": "pl013",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "simple",
  "question": "The Bahujan Samaj Party — whose reserved election symbol is the elephant — was founded by Kanshi Ram on 14 April of which year?",
  "options": [
    "1980",
    "1984",
    "1992",
    "1999"
  ],
  "correctIndex": 1,
  "explanation": "Kanshi Ram founded the BSP on 14 April 1984, the birth anniversary of B.R. Ambedkar. The ECI lists the elephant as the party's reserved symbol and Uttar Pradesh as its principal base.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — list of recognised national parties and party records"
},
{
  "id": "pl014",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "simple",
  "question": "The Bharatiya Janata Party, whose reserved election symbol is the lotus, was founded in which year?",
  "options": [
    "1977",
    "1951",
    "1964",
    "1980"
  ],
  "correctIndex": 3,
  "explanation": "The BJP was founded on 6 April 1980 after the Janata Party split. It is registered with the Election Commission as a national party with the lotus as its reserved symbol.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — list of recognised national parties"
},
{
  "id": "pl015",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "expert",
  "question": "Under the Election Commission's criteria, one route to national-party recognition requires winning at least 2% of Lok Sabha seats — from at least how many different states?",
  "options": [
    "Two",
    "Four",
    "Three",
    "Five"
  ],
  "correctIndex": 2,
  "explanation": "Para 6B sets three routes: 6% of valid votes in four or more states plus four Lok Sabha seats; 2% of Lok Sabha seats (11 seats) from at least three states; or recognition as a state party in at least four states.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — Election Symbols (Reservation and Allotment) Order, 1968, para 6B"
},
{
  "id": "pl016",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "simple",
  "question": "The BJP-led National Democratic Alliance (NDA) was formed in which year, ahead of that year's general election?",
  "options": [
    "1998",
    "1996",
    "1999",
    "2004"
  ],
  "correctIndex": 0,
  "explanation": "The NDA was formed in May 1998 as a BJP-led coalition contesting the 1998 general election. After the 1999 election it formed a government that completed a full five-year term.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Public record — coalition formed May 1998; ECI election statistical reports"
},
{
  "id": "pl017",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "simple",
  "question": "The Congress-led United Progressive Alliance (UPA) was formed after which general election, going on to head the Union government for the following ten years?",
  "options": [
    "1999",
    "2009",
    "2004",
    "2014"
  ],
  "correctIndex": 2,
  "explanation": "The UPA was formed in May 2004 after the 14th Lok Sabha election, with outside support from Left parties under a Common Minimum Programme. It led the Union government from 2004 to 2014.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Public record — UPA constituted May 2004; ECI statistical report, General Elections 2004"
},
{
  "id": "pl018",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "simple",
  "question": "At a two-day Bengaluru meeting ending 18 July 2023, 26 opposition parties named their alliance INDIA. The acronym expands to:",
  "options": [
    "Indian National Democratic Alliance",
    "Inclusive National Development Initiative Alliance",
    "Indian National Development and Integration Alliance",
    "Indian National Developmental Inclusive Alliance"
  ],
  "correctIndex": 3,
  "explanation": "Congress president Mallikarjun Kharge announced the name after the 17-18 July 2023 meeting, which followed a June 2023 Patna meeting. The bloc contested the 2024 general election against the NDA.",
  "sourceUrl": "https://indianexpress.com/article/explained/explained-law/opposition-alliance-india-name-emblems-act-explained-8880854/",
  "sourceLabel": "Joint announcement of 26 parties, Bengaluru, 18 July 2023 (public record)"
},
{
  "id": "pl019",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "expert",
  "question": "The All India Trinamool Congress, founded on 1 January 1998 and allotted the 'flowers and grass' (Jora Ghas Phul) symbol by the ECI, has its principal base in which state?",
  "options": [
    "Assam",
    "West Bengal",
    "Odisha",
    "Tripura"
  ],
  "correctIndex": 1,
  "explanation": "The AITC was founded on 1 January 1998 after separating from the Congress. The ECI lists it as a recognised party with the Jora Ghas Phul (flowers and grass) reserved symbol, primarily active in West Bengal.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — recognised parties and reserved symbols list"
},
{
  "id": "pl020",
  "domain": "politics",
  "region": "India",
  "topic": "Parties & Symbols",
  "subtopic": "Parties & Symbols",
  "difficulty": "expert",
  "question": "The Communist Party of India (Marxist), whose reserved symbol is the hammer, sickle and star, was formed in which year after a split in the Communist Party of India?",
  "options": [
    "1964",
    "1925",
    "1969",
    "1980"
  ],
  "correctIndex": 0,
  "explanation": "The CPI(M) was formed in 1964 following the split in the CPI (which dates to 1925). The ECI's list records the hammer, sickle and star as the CPI(M)'s reserved symbol, distinct from the CPI's ears of corn and sickle.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — recognised national parties list"
},
{
  "id": "pl021",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "The Union Budget — formally the Annual Financial Statement under Article 112 of the Constitution — is presented in the Lok Sabha by the minister in charge of which ministry?",
  "options": [
    "Ministry of Finance",
    "Ministry of Home Affairs",
    "NITI Aayog",
    "Ministry of Commerce and Industry"
  ],
  "correctIndex": 0,
  "explanation": "The Annual Financial Statement is laid before Parliament by the Finance Minister each year; since 2017 it has been presented on 1 February and the Railway Budget stands merged with it.",
  "sourceUrl": "https://www.indiabudget.gov.in",
  "sourceLabel": "Constitution of India, Article 112; Union Budget records"
},
{
  "id": "pl022",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "The decennial Census of India is conducted by the Office of the Registrar General and Census Commissioner of India, which functions under which ministry?",
  "options": [
    "Ministry of Statistics and Programme Implementation",
    "Ministry of Electronics and Information Technology",
    "Ministry of Home Affairs",
    "Ministry of Panchayati Raj"
  ],
  "correctIndex": 2,
  "explanation": "The Census Commissioner is the statutory authority for the decennial census under the Census Act, 1948; the office sits in the Ministry of Home Affairs. Census is a Union subject (Entry 69, Union List).",
  "sourceUrl": "https://censusindia.gov.in",
  "sourceLabel": "Office of the Registrar General and Census Commissioner — institutional mandate under the Census Act, 1948"
},
{
  "id": "pl023",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "expert",
  "question": "Ayushman Bharat PM-JAY, launched on 23 September 2018, is implemented at the national level by which body functioning under the Ministry of Health and Family Welfare?",
  "options": [
    "National Health Mission",
    "Medical Council of India",
    "Employees' State Insurance Corporation",
    "National Health Authority"
  ],
  "correctIndex": 3,
  "explanation": "The National Health Authority is the apex implementing agency for PM-JAY, which provides up to ₹5 lakh per family per year for secondary and tertiary hospitalisation. In 2024 the cover was extended to all citizens aged 70 and above.",
  "sourceUrl": "https://pmjay.gov.in",
  "sourceLabel": "National Health Authority / Ministry of Health and Family Welfare — PM-JAY scheme documents"
},
{
  "id": "pl024",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "At the Centre, the Mahatma Gandhi National Rural Employment Guarantee programme is administered by which ministry?",
  "options": [
    "Ministry of Labour and Employment",
    "Ministry of Rural Development",
    "Ministry of Agriculture and Farmers Welfare",
    "Ministry of Social Justice and Empowerment"
  ],
  "correctIndex": 1,
  "explanation": "The Ministry of Rural Development administers MGNREGA, under which rural households are guaranteed up to 100 days of wage employment a year. Implementation at the local level is mainly through gram panchayats.",
  "sourceUrl": "https://nrega.nic.in",
  "sourceLabel": "Ministry of Rural Development — MGNREGA programme documentation"
},
{
  "id": "pl025",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "Who became the first woman Speaker of the Lok Sabha, elected on 3 June 2009 at the start of the 15th Lok Sabha?",
  "options": [
    "Meira Kumar",
    "Sumitra Mahajan",
    "Pratibha Patil",
    "Sushma Swaraj"
  ],
  "correctIndex": 0,
  "explanation": "Meira Kumar was elected unopposed on 3 June 2009 and served as Speaker through the 15th Lok Sabha (2009-2014). Sumitra Mahajan became the second woman Speaker in June 2014.",
  "sourceUrl": "https://sansad.in",
  "sourceLabel": "Lok Sabha Secretariat — list of Speakers"
},
{
  "id": "pl026",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "Droupadi Murmu, sworn in on 25 July 2022 as the 15th President of India, is documented as the first President from:",
  "options": [
    "the Parsi community",
    "the Anglo-Indian community",
    "a northeastern state",
    "a Scheduled Tribe (tribal) community"
  ],
  "correctIndex": 3,
  "explanation": "Murmu, previously Governor of Jharkhand (2015-2021), is the first person from a tribal community and the second woman to hold the office, and the first President born after Independence.",
  "sourceUrl": "https://presidentofindia.gov.in",
  "sourceLabel": "Office of the President of India / ECI presidential election record, 2022"
},
{
  "id": "pl027",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "simple",
  "question": "Nirmala Sitharaman, who presented the Union Budget on 5 July 2019, holds the documented distinction of being:",
  "options": [
    "the first woman to present a Union Budget",
    "India's first full-time woman Finance Minister",
    "the first Rajya Sabha member to present a Budget",
    "the first Finance Minister to present a February budget"
  ],
  "correctIndex": 1,
  "explanation": "Sitharaman took charge as Finance Minister on 31 May 2019 and presented her first Budget on 5 July 2019. Indira Gandhi was the first woman to present a Budget (1970-71), while holding the portfolio additionally as Prime Minister.",
  "sourceUrl": "https://www.pib.gov.in",
  "sourceLabel": "Ministry of Finance / PIB — Union Budget 2019-20 records"
},
{
  "id": "pl028",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "expert",
  "question": "The no-confidence motion moved by then Leader of Opposition Sonia Gandhi against the Vajpayee government was defeated in the Lok Sabha on 19 August 2003 with what tally?",
  "options": [
    "271 against, 225 in favour",
    "336 against, 111 in favour",
    "314 against, 189 in favour",
    "325 against, 126 in favour"
  ],
  "correctIndex": 2,
  "explanation": "The 2003 motion was debated for over 21 hours and defeated 314-189. It was the last no-confidence motion discussed in the Lok Sabha until July 2018.",
  "sourceUrl": "https://prsindia.org/articles-by-prs-team/the-story-of-no-confidence",
  "sourceLabel": "Lok Sabha records / PRS Legislative Research — history of no-confidence motions"
},
{
  "id": "pl029",
  "domain": "politics",
  "region": "India",
  "topic": "Ministries & Machinery",
  "subtopic": "Ministries & Machinery",
  "difficulty": "expert",
  "question": "The no-confidence motion against the Modi government moved by a Telugu Desam Party member was voted on in the Lok Sabha on 20 July 2018 and:",
  "options": [
    "passed by a margin of one vote",
    "was defeated 271-225",
    "was defeated 314-189",
    "was defeated with 325 votes against and 126 in favour"
  ],
  "correctIndex": 3,
  "explanation": "It was the first no-confidence motion discussed in 15 years and was defeated 325-126. A further no-confidence motion was moved in August 2023 and defeated by voice vote after an opposition walkout.",
  "sourceUrl": "https://prsindia.org/articles-by-prs-team/the-story-of-no-confidence",
  "sourceLabel": "Lok Sabha records / PRS Legislative Research — no-confidence motion of 20 July 2018"
},
{
  "id": "pl030",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "simple",
  "question": "In the 2024 general election to the 18th Lok Sabha, how many of the 543 seats did the Bharatiya Janata Party win, per the Election Commission of India?",
  "options": [
    "272",
    "240",
    "303",
    "282"
  ],
  "correctIndex": 1,
  "explanation": "The BJP won 240 seats, short of the 272 majority mark; the BJP-led NDA won 293 seats and formed the government, while the INC won 99. Polling ran in seven phases from 19 April to 1 June 2024, with results on 4 June 2024.",
  "sourceUrl": "https://results.eci.gov.in",
  "sourceLabel": "Election Commission of India — General Election 2024 results/statistical data"
},
{
  "id": "pl031",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "simple",
  "question": "Per ECI data, the highest voter turnout recorded in any Lok Sabha election came in 2019, at approximately:",
  "options": [
    "58.2%",
    "64.8%",
    "66.4%",
    "67.4%"
  ],
  "correctIndex": 3,
  "explanation": "Turnout was 58.2% in 2009, 66.4% in 2014 and about 67.4% in 2019 — the 2019 figure being the highest in a general election. The 2024 election recorded 65.79% turnout at polling stations.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — statistical report, General Election 2019"
},
{
  "id": "pl032",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "expert",
  "question": "In its statement of 6 June 2024, the Election Commission recorded what overall turnout at polling stations for the 2024 general election (postal ballots excluded)?",
  "options": [
    "65.79%",
    "67.40%",
    "69.16%",
    "63.05%"
  ],
  "correctIndex": 0,
  "explanation": "The ECI put polling-station turnout at 65.79% (male 68.80%, female 65.78%) and said over 64.2 crore electors voted. Detailed statistical reports including postal ballots follow on the ECI website.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — press note on voter turnout, 6 June 2024"
},
{
  "id": "pl033",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "simple",
  "question": "The 'None of the Above' (NOTA) button on EVMs and ballot papers followed which Supreme Court judgment of 27 September 2013?",
  "options": [
    "ADR v. Union of India",
    "Lily Thomas v. Union of India",
    "People's Union for Civil Liberties v. Union of India",
    "Subramanian Swamy v. Election Commission of India"
  ],
  "correctIndex": 2,
  "explanation": "The Court directed the ECI to provide a NOTA option, linking negative voting to secrecy and Article 19(1)(a). NOTA was first used in the November 2013 assembly elections in five states.",
  "sourceUrl": "https://main.sci.gov.in",
  "sourceLabel": "Supreme Court of India — PUCL v. Union of India, (2013) 10 SCC 1"
},
{
  "id": "pl034",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "extreme",
  "question": "The Voter Verifiable Paper Audit Trail (VVPAT) was used for the first time in an Indian election during which constituency's assembly by-election in September 2013?",
  "options": [
    "Nandigram (West Bengal)",
    "Noksen (Nagaland)",
    "Chikmagalur (Karnataka)",
    "Hisar (Haryana)"
  ],
  "correctIndex": 1,
  "explanation": "VVPAT was piloted in the Noksen assembly by-election in Nagaland in September 2013. Its use was progressively expanded after the Supreme Court's October 2013 Subramanian Swamy judgment, and covered all polling stations in the 2019 general election.",
  "sourceUrl": "https://www.eci.gov.in",
  "sourceLabel": "Election Commission of India — VVPAT deployment records"
},
{
  "id": "pl035",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "expert",
  "question": "The High-Level Committee on Simultaneous Elections, chaired by former President Ram Nath Kovind and constituted on 2 September 2023, submitted its report to the President on:",
  "options": [
    "14 March 2024",
    "17 December 2024",
    "2 September 2024",
    "25 July 2024"
  ],
  "correctIndex": 0,
  "explanation": "The committee's 18,626-page report recommended simultaneous Lok Sabha and assembly elections as a first step, with local-body polls within 100 days. The Constitution (129th Amendment) Bill was introduced in the Lok Sabha on 17 December 2024 and referred to a Joint Parliamentary Committee.",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2014497",
  "sourceLabel": "Ministry of Law and Justice / PIB — report submission release"
},
{
  "id": "pl036",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "expert",
  "question": "Under the Constitution (84th Amendment) Act, 2001, the freeze on the inter-state allocation of Lok Sabha and assembly seats runs until the publication of the relevant figures of:",
  "options": [
    "the 2011 Census",
    "the 2021 Census",
    "the first census taken after the year 2026",
    "every decennial census"
  ],
  "correctIndex": 2,
  "explanation": "The 42nd Amendment (1976) first froze seat allocation on 1971 Census figures; the 84th Amendment extended the freeze until after the first census taken after 2026, while allowing intra-state boundary readjustment, done by the 2002 Delimitation Commission on 2001 Census data.",
  "sourceUrl": "https://legislative.gov.in",
  "sourceLabel": "Constitution (84th Amendment) Act, 2001 (assent 21 February 2002), amending Articles 82 and 170"
},
{
  "id": "pl037",
  "domain": "politics",
  "region": "India",
  "topic": "Elections & Institutions",
  "subtopic": "Elections & Institutions",
  "difficulty": "expert",
  "question": "The ECI announced a Special Intensive Revision (SIR) of Bihar's electoral rolls on 24 June 2025. The final roll, published on 30 September 2025, contained approximately how many electors?",
  "options": [
    "7.89 crore",
    "6.50 crore",
    "8.20 crore",
    "7.42 crore"
  ],
  "correctIndex": 3,
  "explanation": "The roll stood at 7.89 crore electors on 24 June 2025; the draft roll of 1 August 2025 listed 7.24 crore after about 65 lakh removals, and the final roll of 30 September 2025 listed about 7.42 crore. As of late 2025 the ECI extended the SIR to further states, and related petitions were heard by the Supreme Court (as of early 2026).",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173316",
  "sourceLabel": "Election Commission of India / PIB — completion release for Bihar SIR, 30 September 2025"
},
{
  "id": "pl038",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The National Rural Employment Guarantee Act, 2005 (renamed after Mahatma Gandhi in 2009) was notified in September 2005 and first came into force on 2 February 2006 in how many districts?",
  "options": [
    "100",
    "625",
    "200",
    "330"
  ],
  "correctIndex": 2,
  "explanation": "NREGA was notified in the Gazette on 7 September 2005 and took effect in 200 districts on 2 February 2006, extending in phases until nationwide rural coverage from 1 April 2008. It guarantees up to 100 days of wage employment per rural household per year.",
  "sourceUrl": "https://nrega.nic.in",
  "sourceLabel": "Ministry of Rural Development — NREGA/MGNREGA Act and notification records"
},
{
  "id": "pl039",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The Right to Information Act, 2005 — which received presidential assent on 15 June 2005 — came fully into force on:",
  "options": [
    "12 October 2005",
    "26 January 2006",
    "15 August 2005",
    "2 October 2005"
  ],
  "correctIndex": 0,
  "explanation": "The Act received assent on 15 June 2005 and, per its Section 1(3), came into force on 12 October 2005 (the 120th day). It repealed the Freedom of Information Act, 2002 and created the Central and State Information Commissions.",
  "sourceUrl": "https://rti.gov.in",
  "sourceLabel": "Right to Information Act, 2005 (Act 22 of 2005) — text and commencement"
},
{
  "id": "pl040",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "expert",
  "question": "The Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 received presidential assent in March 2016 after being passed by the Lok Sabha as:",
  "options": [
    "an ordinary bill passed by both Houses",
    "a Constitution amendment bill",
    "an ordinance later ratified",
    "a Money Bill under Article 110"
  ],
  "correctIndex": 3,
  "explanation": "The bill was introduced on 3 March 2016, certified by the Speaker as a Money Bill, and received assent on 25 March 2016 (gazetted 26 March). The Money Bill certification was later challenged in the Supreme Court; in 2018 the Court upheld the Act with certain provisions read down or struck.",
  "sourceUrl": "https://uidai.gov.in",
  "sourceLabel": "Aadhaar Act, 2016 (Act 18 of 2016) — legislative record"
},
{
  "id": "pl041",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The Goods and Services Tax, enabled by the Constitution (101st Amendment) Act that received presidential assent on 8 September 2016, was rolled out nationwide on:",
  "options": [
    "1 April 2017",
    "1 July 2017",
    "8 September 2016",
    "31 March 2017"
  ],
  "correctIndex": 1,
  "explanation": "The amendment inserted Articles 246A and 279A (creating the GST Council). GST was launched at a midnight sitting of Parliament on the night of 30 June-1 July 2017, subsuming multiple central and state indirect taxes.",
  "sourceUrl": "https://gstcouncil.gov.in",
  "sourceLabel": "Constitution (101st Amendment) Act, 2016; GST Council / Central Board of Indirect Taxes and Customs records"
},
{
  "id": "pl042",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "expert",
  "question": "On 5 August 2019, which presidential instrument applied all provisions of the Constitution of India to Jammu and Kashmir, preceding the Jammu and Kashmir Reorganisation Act, 2019 (assent 9 August 2019, effective 31 October 2019)?",
  "options": [
    "Constitution Order 273 of 6 August 2019",
    "The Constitution (103rd Amendment) Act",
    "The Constitution (Application to Jammu and Kashmir) Order, 2019 (C.O. 272)",
    "A proclamation of President's Rule under Article 356"
  ],
  "correctIndex": 2,
  "explanation": "C.O. 272 superseded the 1954 order; C.O. 273 then rendered most of Article 370 inoperative. Parliament also passed the Reorganisation Act creating the Union Territories of Jammu & Kashmir and Ladakh from 31 October 2019. In December 2023 a Constitution Bench upheld the 2019 measures.",
  "sourceUrl": "https://egazette.gov.in",
  "sourceLabel": "The Gazette of India — C.O. 272 (5 August 2019) and C.O. 273 (6 August 2019); J&K Reorganisation Act, 2019"
},
{
  "id": "pl043",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The three farm Acts of 2020, which received presidential assent on 27 September 2020, stood repealed after Parliament passed the Farm Laws Repeal Bill on:",
  "options": [
    "29 November 2021",
    "26 January 2021",
    "19 November 2021",
    "1 December 2020"
  ],
  "correctIndex": 0,
  "explanation": "The three Acts were assented on 27 September 2020. The Prime Minister announced the repeal decision on 19 November 2021; Parliament passed the repeal bill on 29 November 2021 and it received assent days later, repealing all three Acts.",
  "sourceUrl": "https://www.indiacode.nic.in",
  "sourceLabel": "Farm Laws Repeal Act, 2021 — parliamentary and gazette record"
},
{
  "id": "pl044",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The Citizenship (Amendment) Act, 2019, amending the Citizenship Act of 1955, received presidential assent on:",
  "options": [
    "5 August 2019",
    "10 December 2019",
    "9 December 2019",
    "12 December 2019"
  ],
  "correctIndex": 3,
  "explanation": "The bill was passed by the Lok Sabha on 9 December and the Rajya Sabha on 11 December 2019, and assented on 12 December 2019. Rules under the amended Act were notified on 11 March 2024.",
  "sourceUrl": "https://www.indiacode.nic.in",
  "sourceLabel": "Citizenship (Amendment) Act, 2019 (Act 47 of 2019) — gazette record"
},
{
  "id": "pl045",
  "domain": "politics",
  "region": "India",
  "topic": "Schemes & Policy Timeline (politics of)",
  "subtopic": "Schemes & Policy Timeline (politics of)",
  "difficulty": "simple",
  "question": "The Constitution (106th Amendment) Act, 2023 (Nari Shakti Vandan Adhiniyam) — assented on 28 September 2023 — reserves one-third of Lok Sabha and state assembly seats for women, with the reservation taking effect after:",
  "options": [
    "the 2024 general election",
    "a census conducted after its commencement and a subsequent delimitation exercise",
    "ratification by all state legislatures",
    "a notification by the President alone"
  ],
  "correctIndex": 1,
  "explanation": "Passed 454-2 in the Lok Sabha (20 September 2023) and unanimously in the Rajya Sabha (21 September 2023), it inserted Articles 330A, 332A and 334A; Article 334A links operation to the first census after commencement and the ensuing delimitation. As of early 2026 the reservation is not yet operational.",
  "sourceUrl": "https://legislative.gov.in",
  "sourceLabel": "Constitution (106th Amendment) Act, 2023 — Gazette of India, 28 September 2023"
},
{
  "id": "pl046",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "In Vineet Narain v. Union of India, the Supreme Court's judgment of 18 December 1997 — arising from the 'hawala diaries' investigation — directed which institutional arrangement?",
  "options": [
    "That the Central Vigilance Commission be given statutory status and supervise the CBI",
    "That the CBI be merged into the Central Vigilance Commission",
    "That all corruption probes be conducted only by Supreme Court benches",
    "That the CBI be placed directly under the Cabinet Secretariat"
  ],
  "correctIndex": 0,
  "explanation": "The Court issued a continuing mandamus over the investigations, invalidated the 'single directive' requiring prior government approval to probe senior officials, and directed statutory status for the CVC with supervision of the CBI. Parliament enacted the CVC Act, 2003, giving effect to these directions.",
  "sourceUrl": "https://main.sci.gov.in",
  "sourceLabel": "Supreme Court of India — Vineet Narain v. Union of India, (1998) 1 SCC 226"
},
{
  "id": "pl047",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "simple",
  "question": "A Joint Parliamentary Committee (JPC), such as the one constituted in 1992 to examine the securities scam, is best described as:",
  "options": [
    "A permanent committee of the Rajya Sabha for financial oversight",
    "A judicial tribunal appointed by the Chief Justice of India",
    "An ad hoc committee of members of both Houses of Parliament formed to examine a specific matter",
    "A statutory commission under the Ministry of Finance"
  ],
  "correctIndex": 2,
  "explanation": "The 1992 JPC, chaired by Ram Niwas Mirdha, examined the securities scam associated with broker Harshad Mehta and tabled its report in December 1993. JPC findings are recommendatory; the inquiry preceded reforms that strengthened SEBI's regulatory powers.",
  "sourceUrl": "https://sansad.in",
  "sourceLabel": "Parliament of India — Joint Parliamentary Committee records (1992 securities scam inquiry)"
},
{
  "id": "pl048",
  "domain": "politics",
  "region": "India",
  "topic": "The Record: Audits & Courts",
  "subtopic": "The Record: Audits & Courts",
  "difficulty": "expert",
  "question": "On 26 September 2018, a five-judge Constitution Bench of the Supreme Court ruled on the Aadhaar Act, 2016. What was the outcome?",
  "options": [
    "The Act was struck down in full as unconstitutional",
    "The Act was upheld as constitutional, with certain provisions read down or restricted",
    "The petitions were referred to a nine-judge bench with no finding",
    "The Act was held valid only for direct tax purposes"
  ],
  "correctIndex": 1,
  "explanation": "By a 4:1 majority the Court upheld the Act, including Section 7 (subsidies) and PAN-Aadhaar linkage, while reading down Section 57 so private entities could not compel Aadhaar authentication; Justice Chandrachud dissented. The Money Bill question was later referred to a larger bench in Rojer Mathew (2019).",
  "sourceUrl": "https://main.sci.gov.in",
  "sourceLabel": "Supreme Court of India — K.S. Puttaswamy v. Union of India (Aadhaar), (2019) 1 SCC 1"
},
{
  "id": "gs001",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "In which year was the Pradhan Mantri Jan Dhan Yojana (PMJDY), the national mission for financial inclusion, launched?",
  "options": [
    "2013",
    "2014",
    "2015",
    "2017"
  ],
  "correctIndex": 1,
  "explanation": "PMJDY was launched on 28 August 2014, offering zero-balance accounts with a RuPay debit card. PIB records 59.09 crore accounts as of August 2026.",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2303643",
  "sourceLabel": "PIB — PM Jan Dhan Yojana Completes 12 Years (release, 27 Aug 2026)"
},
{
  "id": "gs002",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "How many days of guaranteed wage employment per rural household per financial year does the MGNREGA Act provide as a legal entitlement?",
  "options": [
    "50 days",
    "75 days",
    "100 days",
    "150 days"
  ],
  "correctIndex": 2,
  "explanation": "Parliament passed NREGA in 2005; it came into force on 2 February 2006. It was renamed Mahatma Gandhi NREGA on 2 October 2009.",
  "sourceUrl": "https://nrega.nic.in/",
  "sourceLabel": "Ministry of Rural Development — MGNREGA portal (nrega.nic.in)"
},
{
  "id": "gs003",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "What annual hospitalisation cover does Ayushman Bharat – PM Jan Arogya Yojana (PM-JAY) provide per eligible family?",
  "options": [
    "₹5 lakh",
    "₹2 lakh",
    "₹3 lakh",
    "₹10 lakh"
  ],
  "correctIndex": 0,
  "explanation": "PM-JAY was launched on 23 September 2018 at Ranchi. It provides ₹5 lakh per family per year for secondary and tertiary hospitalisation, administered by the National Health Authority.",
  "sourceUrl": "https://pmjay.gov.in/",
  "sourceLabel": "National Health Authority — PM-JAY portal"
},
{
  "id": "gs004",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "What annual income support does PM-KISAN provide to eligible landholding farmer families?",
  "options": [
    "₹3,000",
    "₹4,000",
    "₹5,000",
    "₹6,000"
  ],
  "correctIndex": 3,
  "explanation": "PM-KISAN was launched on 24 February 2019 at Gorakhpur. The ₹6,000 is paid in three instalments of ₹2,000 via Direct Benefit Transfer (DBT, the government payment mechanism launched on 1 January 2013).",
  "sourceUrl": "https://pmkisan.gov.in/",
  "sourceLabel": "PM-KISAN portal, Ministry of Agriculture & Farmers Welfare"
},
{
  "id": "gs005",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "The PM Ujjwala Yojana, providing deposit-free LPG connections to poor households, was launched on 1 May 2016 from which place?",
  "options": [
    "Lucknow",
    "Varanasi",
    "Ballia (Uttar Pradesh)",
    "Gorakhpur"
  ],
  "correctIndex": 2,
  "explanation": "PMUY was launched at Ballia, UP, on 1 May 2016, with financial assistance of ₹1,600 per connection. Ujjwala 2.0 followed on 10 August 2021 from Mahoba, UP.",
  "sourceUrl": "https://www.pib.gov.in/FactsheetDetails.aspx?Id=148555",
  "sourceLabel": "PIB — PM Ujjwala Yojana factsheet, Ministry of Petroleum & Natural Gas"
},
{
  "id": "gs006",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "In which year was the Pradhan Mantri Awas Yojana (Urban) launched with the 'Housing for All' goal?",
  "options": [
    "2015",
    "2014",
    "2016",
    "2019"
  ],
  "correctIndex": 0,
  "explanation": "PMAY-U was launched on 25 June 2015, originally targeting Housing for All by 2022. The rural counterpart, PMAY-Gramin, restructured the earlier Indira Awaas Yojana from 2016.",
  "sourceUrl": "https://pmay-urban.gov.in/",
  "sourceLabel": "Ministry of Housing & Urban Affairs — PMAY-Urban portal"
},
{
  "id": "gs007",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "The Startup India initiative (launched 16 January 2016) is anchored by which government body for recognition of startups?",
  "options": [
    "NITI Aayog",
    "SIDBI",
    "SEBI",
    "Department for Promotion of Industry and Internal Trade (DPIIT)"
  ],
  "correctIndex": 3,
  "explanation": "Startup India was unveiled on 16 January 2016; DPIIT handles startup recognition and the action plan. The related Stand-Up India loan scheme followed on 5 April 2016.",
  "sourceUrl": "https://www.startupindia.gov.in/",
  "sourceLabel": "Startup India portal, DPIIT, Ministry of Commerce & Industry"
},
{
  "id": "gs008",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "Under the Pradhan Mantri MUDRA Yojana (launched 8 April 2015), the 'Shishu' category covers collateral-free loans of up to what amount?",
  "options": [
    "₹25,000",
    "₹50,000",
    "₹1 lakh",
    "₹5 lakh"
  ],
  "correctIndex": 1,
  "explanation": "PMMY's original tiers were Shishu (up to ₹50,000), Kishore (up to ₹5 lakh) and Tarun (up to ₹10 lakh). Budget 2024-25 announced a 'Tarun Plus' tier up to ₹20 lakh, notified in October 2024 for borrowers who repaid an earlier Tarun loan.",
  "sourceUrl": "https://www.mudra.org.in/",
  "sourceLabel": "MUDRA Ltd. — PMMY portal"
},
{
  "id": "gs009",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "Under Stand-Up India (launched 5 April 2016), scheduled commercial banks facilitate loans in what range for greenfield enterprises of SC/ST and women entrepreneurs?",
  "options": [
    "₹1 lakh to ₹10 lakh",
    "₹5 lakh to ₹25 lakh",
    "₹50,000 to ₹5 lakh",
    "₹10 lakh to ₹1 crore"
  ],
  "correctIndex": 3,
  "explanation": "The scheme covers composite loans of ₹10 lakh–₹1 crore for greenfield ventures, with each bank branch asked to serve at least one SC/ST and one woman borrower. It is monitored through the StandUp Mitra portal.",
  "sourceUrl": "https://www.standupmitra.in/",
  "sourceLabel": "Stand-Up India portal (standupmitra.in), SIDBI / Department of Financial Services"
},
{
  "id": "gs010",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "The Sukanya Samriddhi Yojana, a small-savings scheme for the girl child, was launched on 22 January 2015 as part of which campaign?",
  "options": [
    "Digital India",
    "Beti Bachao, Beti Padhao",
    "Skill India",
    "Swachh Bharat Mission"
  ],
  "correctIndex": 1,
  "explanation": "Launched at Panipat, Haryana, on 22 January 2015 under Beti Bachao, Beti Padhao. Accounts are opened for girls below age 10 and mature 21 years from opening; deposits qualify under Section 80C.",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2216748",
  "sourceLabel": "PIB — Sukanya Samriddhi Yojana backgrounder (21 Jan 2026)"
},
{
  "id": "gs011",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "What is the guaranteed monthly pension range a subscriber can choose under the Atal Pension Yojana (payable from age 60)?",
  "options": [
    "₹1,000 to ₹5,000",
    "₹500 to ₹2,000",
    "₹3,000 to ₹10,000",
    "₹2,000 to ₹8,000"
  ],
  "correctIndex": 0,
  "explanation": "APY was launched on 9 May 2015 and is administered by PFRDA under the NPS architecture. Entry age is 18–40; since 1 October 2022, income-tax payers are not eligible to enrol afresh.",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2254487",
  "sourceLabel": "PIB — Atal Pension Yojana milestone release / PFRDA"
},
{
  "id": "gs012",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "The Production Linked Incentive (PLI) scheme pays manufacturers an incentive calculated on what basis?",
  "options": [
    "Total exports in a year",
    "A fixed percentage of the total investment",
    "Incremental sales of manufactured goods over a defined base year",
    "Number of new employees hired"
  ],
  "correctIndex": 2,
  "explanation": "PLI was first notified in March–April 2020 for mobile manufacturing and specified electronic components; in November 2020 the Union Cabinet extended it to 10 more sectors, taking coverage to 14 sectors with a total outlay of about ₹1.97 lakh crore.",
  "sourceUrl": "https://dpiit.gov.in/",
  "sourceLabel": "DPIIT, Ministry of Commerce & Industry — PLI schemes"
},
{
  "id": "gs013",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "Which is the nodal ministry for the Jal Jeevan Mission, the rural tap-water programme announced on 15 August 2019?",
  "options": [
    "Ministry of Jal Shakti",
    "Ministry of Rural Development",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Health and Family Welfare"
  ],
  "correctIndex": 0,
  "explanation": "JJM targets a Functional Household Tap Connection (FHTC) supplying at least 55 litres per person per day to every rural household. The original 2024 target was extended to 2028 in Budget 2025-26.",
  "sourceUrl": "https://jaljeevanmission.gov.in/",
  "sourceLabel": "Jal Jeevan Mission portal, Department of Drinking Water & Sanitation"
},
{
  "id": "gs014",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "What is the first-cycle collateral-free working-capital loan offered to street vendors under PM SVANidhi (launched 1 June 2020)?",
  "options": [
    "₹5,000",
    "₹7,500",
    "₹10,000",
    "₹25,000"
  ],
  "correctIndex": 2,
  "explanation": "PM SVANidhi offers an initial ₹10,000 working-capital loan with a 7% interest subsidy, and subsequent cycles of ₹20,000 and ₹50,000. It also pays cashback for digital transactions.",
  "sourceUrl": "https://pmsvanidhi.mohua.gov.in/",
  "sourceLabel": "PM SVANidhi portal, Ministry of Housing & Urban Affairs"
},
{
  "id": "gs015",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "expert",
  "question": "The Antyodaya Anna Yojana, which supplies highly subsidised foodgrains to the 'poorest of the poor' families through the PDS, was launched in which year?",
  "options": [
    "1997",
    "2000",
    "2005",
    "2013"
  ],
  "correctIndex": 1,
  "explanation": "AAY was launched on 25 December 2000, initially covering one crore poorest families at 35 kg of grain a month at ₹3/kg rice and ₹2/kg wheat. The national school meal programme began earlier, on 15 August 1995, as the NP-NSPE (now PM POSHAN).",
  "sourceUrl": "https://dfpd.gov.in/",
  "sourceLabel": "Department of Food & Public Distribution, Ministry of Consumer Affairs"
},
{
  "id": "gs016",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "The Pradhan Mantri Gram Sadak Yojana (PMGSY), providing all-weather road connectivity to eligible unconnected rural habitations, was launched on 25 December 2000 with which nodal ministry?",
  "options": [
    "Ministry of Road Transport and Highways",
    "Ministry of Rural Development",
    "Ministry of Panchayati Raj",
    "Ministry of Housing and Urban Affairs"
  ],
  "correctIndex": 1,
  "explanation": "PMGSY began on 25 December 2000 as a fully centrally sponsored programme (funding later shared 60:40 with states). It is implemented by the Ministry of Rural Development; a fourth phase (2024-29) targets a further 25,000 habitations.",
  "sourceUrl": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2208381",
  "sourceLabel": "PIB — PMGSY completes 25 years (release, 25 December 2025); Ministry of Rural Development"
},
{
  "id": "gs017",
  "domain": "finance",
  "region": "India",
  "topic": "Government Schemes",
  "subtopic": "Government Schemes",
  "difficulty": "simple",
  "question": "The Sarva Shiksha Abhiyan, the flagship programme for universalisation of elementary education for children aged 6-14, was launched in 2001 under which ministry?",
  "options": [
    "Ministry of Women and Child Development",
    "Ministry of Social Justice and Empowerment",
    "Ministry of Labour and Employment",
    "Ministry of Human Resource Development (now Ministry of Education)"
  ],
  "correctIndex": 3,
  "explanation": "SSA ran as a centrally sponsored scheme from 2001, aligned with the 86th Constitutional Amendment (2002) inserting Article 21A. In 2018 it was subsumed into Samagra Shiksha, which covers schooling from pre-primary to Class 12.",
  "sourceUrl": "https://dsel.education.gov.in/",
  "sourceLabel": "Ministry of Education — Department of School Education & Literacy, SSA programme records"
},
{
  "id": "mm016",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "simple",
  "question": "In which year was the Reserve Bank of India established?",
  "options": [
    "1947",
    "1950",
    "1955",
    "1935"
  ],
  "correctIndex": 3,
  "explanation": "RBI was set up under the Reserve Bank of India Act, 1934 and began operations on 1 April 1935. It was nationalised on 1 January 1949.",
  "sourceUrl": "https://www.rbi.org.in/",
  "sourceLabel": "RBI — History / About Us"
},
{
  "id": "mm017",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "simple",
  "question": "The 'repo rate' announced by the RBI is best described as:",
  "options": [
    "The rate at which RBI lends short-term funds to banks against government securities",
    "The interest banks pay on savings accounts",
    "The rate at which banks park surplus funds with RBI",
    "The yield on 10-year government bonds"
  ],
  "correctIndex": 0,
  "explanation": "The repo rate is set by the Monetary Policy Committee. The reverse repo is the rate at which banks park funds with RBI, and the Cash Reserve Ratio (CRR) is the share of deposits banks must hold as cash with RBI.",
  "sourceUrl": "https://www.rbi.org.in/",
  "sourceLabel": "RBI — Monetary Policy / Policy Rates"
},
{
  "id": "mm018",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "How many members does the RBI's Monetary Policy Committee (MPC) have?",
  "options": [
    "4",
    "6",
    "8",
    "10"
  ],
  "correctIndex": 1,
  "explanation": "The MPC was constituted in 2016 under the amended RBI Act, 1934, and held its first meeting in October 2016. It has three RBI members (including the Governor as chair) and three external members nominated by the Government.",
  "sourceUrl": "https://www.rbi.org.in/",
  "sourceLabel": "RBI — Monetary Policy Committee framework"
},
{
  "id": "mm019",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "In India, the Consumer Price Index (CPI) used as the RBI's inflation target benchmark is compiled and released by which body?",
  "options": [
    "Office of the Economic Adviser, DPIIT",
    "Reserve Bank of India",
    "National Statistical Office (MoSPI)",
    "Finance Commission"
  ],
  "correctIndex": 2,
  "explanation": "CPI (retail inflation) is released monthly by the NSO under MoSPI; the Wholesale Price Index (WPI) is released by the Office of the Economic Adviser, DPIIT. The RBI's target since 2016 is CPI of 4% within a 2–6% band.",
  "sourceUrl": "https://www.mospi.gov.in/",
  "sourceLabel": "Ministry of Statistics & Programme Implementation — CPI releases"
},
{
  "id": "mm020",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "simple",
  "question": "The BSE Sensex, India's benchmark stock index, tracks how many companies?",
  "options": [
    "20",
    "30",
    "50",
    "100"
  ],
  "correctIndex": 1,
  "explanation": "The Sensex was launched in 1986 with base year 1978-79 = 100. It first crossed 1,000 points in July 1990 and 10,000 points on 7 February 2006.",
  "sourceUrl": "https://www.bseindia.com/",
  "sourceLabel": "BSE Ltd. — Sensex index information"
},
{
  "id": "mm021",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "simple",
  "question": "Which is Asia's oldest stock exchange, tracing its origins to 1875?",
  "options": [
    "National Stock Exchange (NSE)",
    "Calcutta Stock Exchange",
    "Madras Stock Exchange",
    "Bombay Stock Exchange (BSE)"
  ],
  "correctIndex": 3,
  "explanation": "BSE was founded in 1875 as the Native Share & Stock Brokers' Association. The NSE was incorporated in 1992 and commenced trading in 1994.",
  "sourceUrl": "https://www.bseindia.com/",
  "sourceLabel": "BSE Ltd. — Exchange history"
},
{
  "id": "mm022",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "In which year did SEBI acquire statutory powers through an Act of Parliament?",
  "options": [
    "1988",
    "1990",
    "1992",
    "2003"
  ],
  "correctIndex": 2,
  "explanation": "SEBI was set up administratively on 12 April 1988 and gained statutory status on 30 January 1992 (the SEBI Act, 1992 received presidential assent on 4 April 1992). Its remit covers the securities market and mutual funds.",
  "sourceUrl": "https://www.sebi.gov.in/",
  "sourceLabel": "SEBI — About / History"
},
{
  "id": "mm023",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "Under India's NPS architecture, which statutory regulator administers the National Pension System and the Atal Pension Yojana?",
  "options": [
    "IRDAI",
    "SEBI",
    "RBI",
    "PFRDA"
  ],
  "correctIndex": 3,
  "explanation": "The Pension Fund Regulatory and Development Authority was set up in 2003 (statutory status in 2013). NPS opened to government employees from 1 January 2004 and to all citizens from 1 May 2009.",
  "sourceUrl": "https://pfrda.org.in/",
  "sourceLabel": "PFRDA — About / NPS & APY"
},
{
  "id": "mm024",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "On which date was the Goods and Services Tax rolled out across India?",
  "options": [
    "1 April 2017",
    "8 September 2016",
    "1 July 2017",
    "31 December 2016"
  ],
  "correctIndex": 2,
  "explanation": "The Constitution (101st Amendment) Act received assent on 8 September 2016, inserting Articles 246A and 279A and creating the GST Council. GST subsumed central excise, service tax and state VAT.",
  "sourceUrl": "https://gstcouncil.gov.in/",
  "sourceLabel": "GST Council — GST history"
},
{
  "id": "mm025",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "Since 2017, on which date is the Union Budget conventionally presented in Parliament?",
  "options": [
    "The last working day of February",
    "1 February",
    "15 February",
    "31 March"
  ],
  "correctIndex": 1,
  "explanation": "From Budget 2017-18, presented by Arun Jaitley on 1 February 2017, the Budget moved from end-February to 1 February, and the Railway Budget was merged into the Union Budget. The budget process is completed before the financial year begins on 1 April.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — Union Budget records"
},
{
  "id": "mm026",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "extreme",
  "question": "When was the separate Railway Budget, first presented in 1924, merged into the Union Budget?",
  "options": [
    "2015",
    "2017",
    "2019",
    "2021"
  ],
  "correctIndex": 1,
  "explanation": "The merger took effect from Budget 2017-18, presented on 1 February 2017, ending a 92-year practice that began with the Acworth Committee's 1921 recommendations (implemented 1924).",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance / Indian Railways — Budget merger, 2017"
},
{
  "id": "mm027",
  "domain": "finance",
  "region": "India",
  "topic": "Money & Markets",
  "subtopic": "Money & Markets",
  "difficulty": "expert",
  "question": "In the RBI's prompt corrective action (PCA) framework, which of these is a trigger metric?",
  "options": [
    "Capital to risk-weighted assets ratio (CRAR)",
    "Repo rate",
    "Forex reserves",
    "Currency in circulation"
  ],
  "correctIndex": 0,
  "explanation": "PCA, introduced in December 2002 and revised in November 2021, triggers restrictions when a bank breaches thresholds on CRAR/CET1, net NPA ratio, or return on assets. Yes Bank was resolved separately in March 2020 by moratorium and a reconstruction scheme.",
  "sourceUrl": "https://www.rbi.org.in/",
  "sourceLabel": "RBI — PCA framework (revised circular, Nov 2021)"
},
{
  "id": "ia028",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "simple",
  "question": "A mutual fund 'SIP' (Systematic Investment Plan) means:",
  "options": [
    "Investing a fixed amount at regular intervals",
    "A one-time lump-sum investment",
    "A government insurance scheme",
    "A stock-market order type"
  ],
  "correctIndex": 0,
  "explanation": "SIPs automate periodic purchases of fund units, giving rupee-cost averaging. India had about 9.79 crore SIP accounts as of May 2025 (AMFI data).",
  "sourceUrl": "https://www.amfiindia.com/",
  "sourceLabel": "AMFI — Investor education / SIP"
},
{
  "id": "ia029",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "In a mutual fund, the Total Expense Ratio (TER) is:",
  "options": [
    "The annual charge the fund house levies, expressed as a percentage of the fund's assets",
    "A tax paid to the government on redemptions",
    "A one-time entry load on every purchase",
    "The brokerage charged on the investor's demat account"
  ],
  "correctIndex": 0,
  "explanation": "SEBI caps TER by fund size under the Mutual Fund Regulations and banned entry loads in 2009. Direct plans carry a lower TER than regular plans because no distributor commission is embedded.",
  "sourceUrl": "https://www.sebi.gov.in/",
  "sourceLabel": "SEBI — Mutual fund regulations (TER caps)"
},
{
  "id": "ia030",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "SEBI's 'risk-o-meter' on mutual fund schemes labels product risk on a scale of how many levels?",
  "options": [
    "3",
    "5",
    "6",
    "7"
  ],
  "correctIndex": 2,
  "explanation": "The risk-o-meter runs from Low to Very High across six levels, and must be updated whenever the portfolio's risk changes materially. It was introduced in 2013 and revised to six levels in 2020.",
  "sourceUrl": "https://www.sebi.gov.in/",
  "sourceLabel": "SEBI circulars — Product labelling / Risk-o-meter"
},
{
  "id": "ia031",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "Under the DICGC scheme, bank deposits (principal plus interest) per depositor per bank are insured up to:",
  "options": [
    "₹1 lakh",
    "₹5 lakh",
    "₹10 lakh",
    "₹50 lakh"
  ],
  "correctIndex": 1,
  "explanation": "The limit was raised from ₹1 lakh to ₹5 lakh effective 4 February 2020 (Budget 2020-21). DICGC is a wholly owned RBI subsidiary established in 1978; claims were payable within 90 days under the 2021 amendment.",
  "sourceUrl": "https://www.dicgc.org.in/",
  "sourceLabel": "DICGC — Deposit insurance cover limit"
},
{
  "id": "ia032",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "In the old income-tax regime, Section 80C of the Income-tax Act allows a deduction of up to how much per financial year for specified investments and expenses (EPF, PPF, ELSS, life insurance premia, etc.)?",
  "options": [
    "₹1,00,000",
    "₹2,00,000",
    "₹1,50,000",
    "₹2,50,000"
  ],
  "correctIndex": 2,
  "explanation": "The ₹1.5 lakh 80C ceiling has applied since FY 2014-15. ELSS (Equity Linked Savings Scheme) mutual funds are an eligible 80C instrument with a three-year lock-in.",
  "sourceUrl": "https://incometaxindia.gov.in/",
  "sourceLabel": "Income Tax Department — Section 80C"
},
{
  "id": "ia033",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "An ELSS mutual fund differs from other diversified equity funds chiefly because it:",
  "options": [
    "Guarantees a fixed return of 12%",
    "Has no lock-in period",
    "Qualifies for Section 80C deduction and carries a statutory three-year lock-in",
    "Invests only in government bonds"
  ],
  "correctIndex": 2,
  "explanation": "ELSS investments are deductible under Section 80C (old regime) up to ₹1.5 lakh a year and locked in for three years — the shortest lock-in among 80C options. Returns remain market-linked, not guaranteed.",
  "sourceUrl": "https://www.amfiindia.com/",
  "sourceLabel": "AMFI — ELSS investor guidance"
},
{
  "id": "ia034",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "simple",
  "question": "Which of these small-savings schemes is available only to resident senior citizens aged 60 and above?",
  "options": [
    "Public Provident Fund (PPF)",
    "Senior Citizens Savings Scheme (SCSS)",
    "Kisan Vikas Patra (KVP)",
    "National Savings Certificate (NSC)"
  ],
  "correctIndex": 1,
  "explanation": "SCSS (launched 2004) is open to those 60+ (55+ for specified retirees), with a ₹30 lakh deposit cap since April 2023 and quarterly interest payouts. PPF accounts carry a 15-year term, extendable in blocks of five years.",
  "sourceUrl": "https://www.indiapost.gov.in/",
  "sourceLabel": "India Post — Small Savings Schemes"
},
{
  "id": "ia035",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "The Public Provident Fund (PPF) account, notified in 1968, has an original maturity period of:",
  "options": [
    "5 years",
    "10 years",
    "21 years",
    "15 years"
  ],
  "correctIndex": 3,
  "explanation": "PPF accounts run 15 years, extendable in blocks of 5 years; annual deposits can range from ₹500 to ₹1.5 lakh. Its interest enjoys EEE (exempt-exempt-exempt) tax treatment.",
  "sourceUrl": "https://www.indiapost.gov.in/",
  "sourceLabel": "India Post — PPF scheme details"
},
{
  "id": "ia036",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "expert",
  "question": "The 'Hindu Undivided Family' (HUF) is recognised for separate tax assessment primarily under which of the following?",
  "options": [
    "The Companies Act, 2013",
    "Section 2(31) of the Income-tax Act, 1961",
    "The Partnership Act, 1932",
    "The Banking Regulation Act, 1949"
  ],
  "correctIndex": 1,
  "explanation": "The HUF is taxed as a distinct 'person' under the Income-tax Act, with its own PAN and basic exemption. Its funds are managed by the 'karta'. Dayabhaga and Mitakshara schools govern succession.",
  "sourceUrl": "https://incometaxindia.gov.in/",
  "sourceLabel": "Income Tax Department — definition of 'person', s.2(31)"
},
{
  "id": "ia037",
  "domain": "finance",
  "region": "India",
  "topic": "Investment Awareness",
  "subtopic": "Investment Awareness",
  "difficulty": "extreme",
  "question": "The National Pension System (NPS) was extended to all citizens of India on a voluntary basis in which year?",
  "options": [
    "2004",
    "2007",
    "2011",
    "2009"
  ],
  "correctIndex": 3,
  "explanation": "NPS was notified for new central-government recruits from 1 January 2004, then opened to all citizens from 1 May 2009. It is administered by PFRDA, with a Tier-I (retirement) and Tier-II (voluntary) account structure.",
  "sourceUrl": "https://pfrda.org.in/",
  "sourceLabel": "PFRDA — NPS history"
},
{
  "id": "bd038",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "Which article of the Indian Constitution defines the Union Budget as the 'Annual Financial Statement'?",
  "options": [
    "Article 110",
    "Article 112",
    "Article 114",
    "Article 118"
  ],
  "correctIndex": 1,
  "explanation": "Article 112 mandates the Annual Financial Statement; Article 110 defines a Money Bill; Article 114 covers Appropriation Bills. The FRBM Act, 2003 later added fiscal-policy statements to the budget documents.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Constitution of India / Ministry of Finance — Budget basics"
},
{
  "id": "bd039",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "The 'fiscal deficit' of the Union government equals:",
  "options": [
    "Revenue expenditure minus revenue receipts",
    "Total expenditure minus total receipts excluding borrowings",
    "Interest payments minus tax revenue",
    "The primary deficit plus subsidies"
  ],
  "correctIndex": 1,
  "explanation": "Fiscal deficit = total expenditure − total receipts other than borrowings. The FRBM Act, 2003 set targets for fiscal and revenue deficits; the primary deficit is the fiscal deficit minus interest payments.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — Budget at a Glance / FRBM documents"
},
{
  "id": "bd040",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "India's Fiscal Responsibility and Budget Management (FRBM) Act was enacted in which year?",
  "options": [
    "2000",
    "2003",
    "2005",
    "2008"
  ],
  "correctIndex": 1,
  "explanation": "The FRBM Act, 2003 (assent 26 August 2003) mandates fiscal-policy statements (Medium-Term Fiscal Policy, Fiscal Policy Strategy, Macroeconomic Framework) alongside the Budget, and deficit targets.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — FRBM Act, 2003"
},
{
  "id": "bd041",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "The annual Economic Survey, tabled ahead of the Union Budget, is prepared under the guidance of the Chief Economic Adviser by which ministry's department?",
  "options": [
    "Department of Economic Affairs, Ministry of Finance",
    "NITI Aayog",
    "MoSPI",
    "Department of Expenditure"
  ],
  "correctIndex": 0,
  "explanation": "The Economic Survey reviews the economy over the year and is presented in Parliament a day or two before the Budget. The first Economic Survey was presented for 1950-51.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — Economic Survey archives"
},
{
  "id": "bd042",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "A 'Vote on Account' or the Interim Budget, presented in a general-election year, primarily allows the government to:",
  "options": [
    "Change income-tax slabs mid-year",
    "Present a full five-year fiscal plan",
    "Meet expenditure for part of the year until the new government presents a full Budget",
    "Amend the Constitution's financial provisions"
  ],
  "correctIndex": 2,
  "explanation": "In election years the outgoing government seeks Parliament's approval for essential spending for a few months; the full Budget follows after the election — as in 2019 (Interim Budget 1 February 2019; full Budget 5 July 2019) and 2024 (Interim 1 February; full 23 July 2024).",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — Interim Budget records (2019, 2024)"
},
{
  "id": "bd043",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "extreme",
  "question": "The GST Council is a constitutional body created by which amendment?",
  "options": [
    "The 101st Constitutional Amendment (2016)",
    "The 100th Amendment (2015)",
    "The 42nd Amendment (1976)",
    "The 73rd Amendment (1992)"
  ],
  "correctIndex": 0,
  "explanation": "The 101st Amendment (assent 8 September 2016) inserted Article 279A, constituting the GST Council chaired by the Union Finance Minister with state finance ministers as members, recommending rates and rules.",
  "sourceUrl": "https://gstcouncil.gov.in/",
  "sourceLabel": "GST Council — Constitutional basis (Article 279A)"
},
{
  "id": "bd044",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "expert",
  "question": "The Budget document 'Expenditure Profile' primarily contains:",
  "options": [
    "Only defence spending",
    "Tax proposals for the year",
    "Ministry-wise and scheme-wise allocations and estimates",
    "State government budgets"
  ],
  "correctIndex": 2,
  "explanation": "Alongside the Annual Financial Statement, the Budget papers include the Expenditure Budget/Profile, Receipts Budget, Finance Bill and FRBM statements. The Finance Bill gives legislative effect to tax proposals.",
  "sourceUrl": "https://www.indiabudget.gov.in/",
  "sourceLabel": "Ministry of Finance — Union Budget documents"
},
{
  "id": "bd045",
  "domain": "finance",
  "region": "India",
  "topic": "Budgets & Documents",
  "subtopic": "Budgets & Documents",
  "difficulty": "extreme",
  "question": "Which constitutional article bars withdrawal of money from the Consolidated Fund of India except under appropriation made by law?",
  "options": [
    "Article 112",
    "Article 266",
    "Article 280",
    "Article 360"
  ],
  "correctIndex": 1,
  "explanation": "Article 266 creates the Consolidated Fund and Public Account and requires parliamentary appropriation for withdrawals; Article 267 creates the Contingency Fund of India for unforeseen expenditure.",
  "sourceUrl": "https://legislative.gov.in/",
  "sourceLabel": "Constitution of India — Articles 266-267"
}
]);
