// lib/events-data.mjs — the curated FACT//DUEL calendar.
//
// Hand-assembled from a research pass in which every date and result was checked against a primary
// or reference source, then re-checked by a second independent pass. It is STATIC: there is no live
// feed, no score service and no results API anywhere in this app. `CALENDAR_ASOF` is the day a
// human last verified the whole list; anything after it may be stale, and the UI says so.
//
// Shape is validated and sanitised by `readEvents` in lib/events.mjs — a malformed entry is dropped
// rather than shown. Topics must match TOPIC_DOMAINS in lib/journal.mjs.

export const CALENDAR_ASOF = '2026-09-13';

export const EVENTS = Object.freeze([
  {
    id: 'ashes-2025-26',
    name: 'The Ashes 2025-26',
    domain: 'sports',
    topic: 'Cricket',
    start: '2025-11-21',
    end: '2026-01-08',
    blurb:
      'Australia won the series 4-1, retaining the urn inside 11 days of play; Mitchell Starc took 31 wickets and won the Compton-Miller Medal.',
    whyQuiz:
      "Australia's 4-1 win, the Ashes retained after just three Tests, Starc's 31 wickets, and England's Melbourne win ending an 18-match winless run in Australia.",
    sourceUrl: 'https://en.wikipedia.org/wiki/2025%E2%80%9326_Ashes_series',
  },
  {
    id: 'mens-t20-world-cup-2026',
    name: "ICC Men's T20 World Cup 2026",
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-02-07',
    end: '2026-03-08',
    blurb:
      'India beat New Zealand by 96 runs in Ahmedabad (India 255/5, New Zealand 159) to retain the title; Sanju Samson was player of the tournament.',
    whyQuiz:
      "India's third T20 World Cup and first successful defence, the first host nation to win it, Samson's 89 off 46 (highest individual score in a men's final) and…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Men%27s_T20_World_Cup',
  },
  {
    id: 'super-bowl-lx',
    name: 'Super Bowl LX',
    domain: 'sports',
    topic: 'American football',
    start: '2026-02-08',
    end: '2026-02-08',
    blurb:
      "The Seattle Seahawks beat the New England Patriots 29-13 at Levi's Stadium, with running back Kenneth Walker III named MVP after 135 rushing yards.",
    whyQuiz:
      "Seattle's second Lombardi, a 29-13 defensive rout, and Walker becoming the first running back to win Super Bowl MVP since Terrell Davis in 1998.",
    sourceUrl: 'https://en.wikipedia.org/wiki/Super_Bowl_LX',
  },
  {
    id: 'turing-award-2025-bennett-brassard',
    name: '2025 ACM A.M. Turing Award: Bennett and Brassard',
    domain: 'science',
    topic: 'Computing',
    start: '2026-03-18',
    end: '2026-03-18',
    blurb:
      'Charles Bennett and Gilles Brassard won the 2025 Turing Award for founding quantum information science.',
    whyQuiz:
      'BB84 quantum key distribution, quantum teleportation, the $1m ACM prize, IBM Research and Universite de Montreal, and the four-decade Bennett-Brassard…',
    sourceUrl:
      'https://newsroom.ibm.com/2026-03-18-ibm-fellow-and-quantum-pioneer-charles-h-bennett-receives-a-m-turing-award-computings-highest-honor',
  },
  {
    id: 'artemis-ii-crewed-lunar-flyby',
    name: 'Artemis II crewed lunar flyby and splashdown',
    domain: 'science',
    topic: 'Space',
    start: '2026-04-01',
    end: '2026-04-10',
    blurb:
      "NASA's Artemis II sent four astronauts around the Moon, splashing down off San Diego after nine days.",
    whyQuiz:
      "First crewed lunar mission since Apollo 17; crew Reid Wiseman, Victor Glover, Christina Koch and CSA's Jeremy Hansen; SLS from Pad 39B;",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_spaceflight',
  },
  {
    id: 'breakthrough-prize-2026-laureates',
    name: 'Breakthrough Prize 2026 laureates announced',
    domain: 'science',
    topic: 'Biology',
    start: '2026-04-18',
    end: '2026-04-18',
    blurb: 'The 2026 Breakthrough Prizes honoured gene therapy pioneers and the Muon g-2 collaborations.',
    whyQuiz:
      'Bennett/High/Maguire on inherited blindness gene therapy, Orkin and Thein on sickle cell and beta-thalassemia, Rademakers and Traynor on C9orf72 in ALS, Muon…',
    sourceUrl: 'https://breakthroughprize.org/News/98',
  },
  {
    id: 'psyche-mars-gravity-assist',
    name: 'NASA Psyche Mars gravity assist',
    domain: 'science',
    topic: 'Space',
    start: '2026-05-15',
    end: '2026-05-15',
    blurb:
      "NASA's Psyche used a Mars gravity assist to slingshot toward the metal asteroid Psyche, arriving 2029.",
    whyQuiz:
      'Gravity-assist mechanics, the metal-rich asteroid 16 Psyche, solar electric propulsion, 2029 arrival, and instrument checkout during the Mars flyby.',
    sourceUrl: 'https://science.nasa.gov/mission/psyche/',
  },
  {
    id: 'shenzhou-23-tiangong-crew',
    name: 'Shenzhou 23 launches to Tiangong',
    domain: 'science',
    topic: 'Space',
    start: '2026-05-24',
    end: '2026-05-24',
    blurb: "Shenzhou 23 launched three taikonauts to Tiangong, including Hong Kong's first person in space.",
    whyQuiz:
      'Launch at 15:08:36 UTC on a Long March 2F/G from Jiuquan; commander Zhu Yangzhu, pilot Zhang Zhiyuan, payload specialist Lai Ka-ying as the first Hong Konger…',
    sourceUrl: 'https://en.wikipedia.org/wiki/Shenzhou_23',
  },
  {
    id: 'uefa-champions-league-final-2026',
    name: 'UEFA Champions League Final 2026',
    domain: 'sports',
    topic: 'Football',
    start: '2026-05-30',
    end: '2026-05-30',
    blurb:
      'PSG retained the trophy, drawing 1-1 with Arsenal after extra time at the Puskas Arena and winning 4-3 on penalties.',
    whyQuiz:
      "Back-to-back PSG titles, Havertz's 6th-minute opener for Arsenal, Dembele's 61st-minute penalty equaliser, and Gabriel Magalhaes' decisive shootout miss.",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_UEFA_Champions_League_final',
  },
  {
    id: 'stanley-cup-final-2026',
    name: 'Stanley Cup Final 2026',
    domain: 'sports',
    topic: 'Basketball',
    start: '2026-06-02',
    end: '2026-06-14',
    blurb:
      'Carolina beat the Vegas Golden Knights 4-2, sealing it 3-0 in Game 6, with Jordan Staal winning the Conn Smythe.',
    whyQuiz:
      "Carolina's first Cup since 2006, Jordan Staal's Conn Smythe, a 16-3 playoff run, and the two overtime games (one double-OT) in the first three games.",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Stanley_Cup_Final',
  },
  {
    id: 'nba-finals-2026',
    name: 'NBA Finals 2026',
    domain: 'sports',
    topic: 'Basketball',
    start: '2026-06-03',
    end: '2026-06-13',
    blurb:
      'The New York Knicks beat the San Antonio Spurs 4-1, clinching 94-90 in Game 5 with Jalen Brunson scoring 45 points en route to Finals MVP.',
    whyQuiz:
      "New York's first NBA title since 1973, Brunson's 32.6 points per game and 45-point clincher, and the Spurs' run to the Finals after a Game 7 win over Oklahoma…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_NBA_Finals',
  },
  {
    id: 'tianwen-2-kamooalewa-rendezvous',
    name: "Tianwen-2 arrives at asteroid Kamo'oalewa",
    domain: 'science',
    topic: 'Space',
    start: '2026-06-07',
    end: '2026-07-02',
    blurb:
      "China's Tianwen-2 entered orbit at asteroid Kamo'oalewa and began close proximity and sampling operations.",
    whyQuiz:
      "Orbital insertion 7 June, approach within 20 km on 4 July, Earth quasi-satellite 469219 Kamo'oalewa possibly lunar debris, CNSA sample return capsule due 29…",
    sourceUrl: 'https://en.wikipedia.org/wiki/Tianwen-2',
  },
  {
    id: 'fifa-world-cup-2026',
    name: 'FIFA World Cup 2026 (USA/Canada/Mexico)',
    domain: 'sports',
    topic: 'Football',
    start: '2026-06-11',
    end: '2026-07-19',
    blurb:
      "Spain beat Argentina 1-0 after extra time at MetLife Stadium, Ferran Torres scoring in the 106th minute for Spain's second title.",
    whyQuiz:
      "First 48-team, three-host World Cup: Spain's 1-0 extra-time win, Ferran Torres' 106th-minute winner, Enzo Fernandez's red card, Emiliano Martinez's…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final',
  },
  {
    id: 'womens-t20-world-cup-2026',
    name: "ICC Women's T20 World Cup 2026",
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-06-12',
    end: '2026-07-05',
    blurb:
      "Australia beat hosts England by seven wickets at Lord's, chasing 151 in 17.1 overs for a record seventh title; Beth Mooney was player of the tournament.",
    whyQuiz:
      "Australia's seventh women's T20 crown, a first Lord's final, England's 150/4 chased down with 17 balls to spare, and the tournament's expansion to 12 teams.",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Women%27s_T20_World_Cup',
  },
  {
    id: 'alice-run3-heavy-ion-finale',
    name: 'ALICE closes LHC Run 3 heavy-ion programme',
    domain: 'science',
    topic: 'Physics',
    start: '2026-06-14',
    end: '2026-06-14',
    blurb: 'ALICE closed LHC Run 3 heavy-ion running with about 53 billion lead-lead collisions recorded.',
    whyQuiz:
      'Quark-gluon plasma physics, 53 billion zero-bias Pb-Pb collisions, 6.9 inverse nanobarns integrated luminosity, final beams at 05:37 on 14 June, and planned…',
    sourceUrl: 'https://alice-collaboration.web.cern.ch/2026-ALICE-Run3-Finale',
  },
  {
    id: 'lhc-run3-ends-long-shutdown-3',
    name: 'LHC Run 3 ends and Long Shutdown 3 begins',
    domain: 'science',
    topic: 'Physics',
    start: '2026-06-27',
    end: '2026-06-27',
    blurb:
      'The LHC ended Run 3 at 05:52 on 27 June; ATLAS banked 332 inverse femtobarns, with beams back only in 2030.',
    whyQuiz:
      'Final protons at 05:52 on 27 June 2026, ATLAS lifetime total of 505 fb-1 with 332 fb-1 from Run 3, Long Shutdown 3 starting 29 June, the High-Luminosity LHC…',
    sourceUrl: 'https://atlas.cern/Updates/Press-Statement/ATLAS-Enters-HiLumi-Era',
  },
  {
    id: 'wimbledon-2026',
    name: 'Wimbledon Championships 2026',
    domain: 'sports',
    topic: 'Tennis',
    start: '2026-06-29',
    end: '2026-07-12',
    blurb: "Jannik Sinner retained the men's title over Alexander Zverev 6-7(7-9), 7-6(7-2), 6-3, 6-4;",
    whyQuiz:
      "Sinner's second straight Wimbledon and fifth major, Zverev's continued wait for a first slam, and Noskova's maiden Grand Slam in an all-Czech final at 21.",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Wimbledon_Championships_%E2%80%93_Men%27s_singles',
  },
  {
    id: 'india-tour-of-england-2026',
    name: "India men's white-ball tour of England 2026",
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-07-01',
    end: '2026-07-19',
    blurb:
      'England swept the five-match T20I series 4-0 and won the ODI series 2-1, taking the world number one T20I ranking.',
    whyQuiz:
      "England's 4-0 T20I sweep, the first time India lost four consecutive matches in a T20I series, and England topping the T20I rankings off the back of it.",
    sourceUrl: 'https://en.wikipedia.org/wiki/Indian_cricket_team_in_England_in_2026',
  },
  {
    id: 'tour-de-france-2026',
    name: 'Tour de France 2026',
    domain: 'sports',
    topic: 'Football',
    start: '2026-07-04',
    end: '2026-07-26',
    blurb:
      'Tadej Pogacar won his fifth Tour, 6:26 ahead of Remco Evenepoel, on a Barcelona-to-Paris route at a record 43.227 km/h average.',
    whyQuiz:
      "Pogacar's fifth title and third in a row, the fastest Tour on record, a Barcelona Grand Depart, and jersey winners Pedersen (green), Carapaz (polka dot) and…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Tour_de_France',
  },
  {
    id: 'soyuz-ms-29-iss-crew-launch',
    name: 'Soyuz MS-29 crew launch to the ISS',
    domain: 'science',
    topic: 'Space',
    start: '2026-07-14',
    end: '2026-07-14',
    blurb:
      "Soyuz MS-29 carried Dubrov, Kikina and NASA's Anil Menon to the ISS, docking about three hours later.",
    whyQuiz:
      "Launch 14:47:43 UTC from Baikonur Site 31/6 on a Soyuz-2.1a, docking to the Prichal nadir port at 17:52 UTC, Expedition 74/75, Anil Menon's first flight, and…",
    sourceUrl: 'https://en.wikipedia.org/wiki/Soyuz_MS-29',
  },
  {
    id: 'commonwealth-games-2026',
    name: 'Commonwealth Games 2026 (Glasgow)',
    domain: 'sports',
    topic: 'Football',
    start: '2026-07-23',
    end: '2026-08-02',
    blurb:
      'A scaled-back Glasgow Games of 10 sports and 215 medal events; Australia topped the table with 70 golds and 171 medals, ahead of England (29 gold, 110) and…',
    whyQuiz:
      "Glasgow stepping in as host, the slimmed-down 10-sport programme, Australia's 70 golds, and Chad le Clos becoming the most decorated athlete in Games history…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Commonwealth_Games_medal_table',
  },
  {
    id: 'fields-medals-2026-icm-philadelphia',
    name: 'Fields Medals 2026 at ICM Philadelphia',
    domain: 'science',
    topic: 'Computing',
    start: '2026-07-23',
    end: '2026-07-23',
    blurb: 'Four Fields Medals went to Deng, Pardon, Tsimerman and Wang at the ICM opening in Philadelphia.',
    whyQuiz:
      "Yu Deng on Hilbert's sixth problem and the Boltzmann equation, John Pardon on symplectic geometry and the MNOP conjecture, Jacob Tsimerman on o-minimality…",
    sourceUrl:
      'https://www.simonsfoundation.org/2026/07/23/2026-fields-medals-awarded-to-four-of-worlds-top-mathematicians/',
  },
  {
    id: 'lhcb-beauty-strange-resonance',
    name: 'LHCb observes new beauty-strange particle',
    domain: 'science',
    topic: 'Physics',
    start: '2026-08-01',
    end: '2026-08-01',
    blurb: 'LHCb reported a new beauty-strange resonance above seven sigma, presented at ICHEP 2026.',
    whyQuiz:
      "Resonance in the Bs0 pi0 spectrum, significance beyond seven standard deviations, the 43rd International Conference on High Energy Physics, and LHCb's 2026 run…",
    sourceUrl: 'https://lhcb-outreach.web.cern.ch/category/physics-results/',
  },
  {
    id: 'total-solar-eclipse-12-august-2026',
    name: 'Total solar eclipse of 12 August 2026',
    domain: 'science',
    topic: 'Space',
    start: '2026-08-12',
    end: '2026-08-12',
    blurb:
      "A total solar eclipse crossed Greenland, Iceland and northern Spain, Europe's first over land since 1999.",
    whyQuiz:
      'Greatest eclipse at 17:47:06 UTC, maximum totality 2 minutes 18 seconds, magnitude 1.0386, a 294 km wide path over Siberia, Greenland, Iceland, northern Spain…',
    sourceUrl: 'https://en.wikipedia.org/wiki/Solar_eclipse_of_August_12,_2026',
  },
  {
    id: 'premier-league-2026-27',
    name: 'Premier League 2026-27',
    domain: 'sports',
    topic: 'Football',
    start: '2026-08-21',
    end: '2027-05-30',
    blurb:
      'The Premier League season started 21 August 2026 and ends 30 May 2027, delayed a week by the 48-team World Cup.',
    whyQuiz:
      'Opening night Arsenal v Coventry City at the Emirates, 33 weekends plus five midweek rounds, the 60-hour minimum rest rule over Christmas, and the simultaneous…',
    sourceUrl:
      'https://www.premierleague.com/en/news/4468487/dates-for-202627-premier-league-season-confirmed',
  },
  {
    id: 'daraxonrasib-pancreatic-cancer-approval',
    name: 'FDA approves daraxonrasib for pancreatic cancer',
    domain: 'science',
    topic: 'Biology',
    start: '2026-08-26',
    end: '2026-08-26',
    blurb:
      'FDA approved daraxonrasib for metastatic pancreatic cancer after survival rose from 6.6 to 13.2 months.',
    whyQuiz:
      'RAS(ON) multi-selective inhibition, the phase 3 result published 31 May 2026 in the New England Journal of Medicine roughly doubling median overall survival in…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_science',
  },
  {
    id: 'fifa-intercontinental-cup-2026',
    name: 'FIFA Intercontinental Cup 2026',
    domain: 'sports',
    topic: 'Football',
    start: '2026-08-26',
    end: '2026-12-31',
    blurb:
      "No Club World Cup until 2029; FIFA's Intercontinental Cup started 26 August 2026 but its final date is still TBA.",
    whyQuiz:
      'The six-confederation knockout ladder, Al-Ahli beating Auckland FC 1-0 in Jeddah on 26 August, holders Paris Saint-Germain entering straight at the final, and…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_FIFA_Intercontinental_Cup',
  },
  {
    id: 'womens-t20-asia-cup-2026',
    name: "Women's T20 Asia Cup 2026",
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-08-28',
    end: '2026-09-13',
    blurb:
      "Eight teams in Dubai; India face Sri Lanka in today's final, which has not been played yet, so there is no result to report.",
    whyQuiz:
      'India chasing the title back after losing the 2024 final to Sri Lanka, and a rematch of that final in Dubai.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_Women%27s_Twenty20_Asia_Cup',
  },
  {
    id: 'roman-space-telescope-launch',
    name: 'Nancy Grace Roman Space Telescope launch',
    domain: 'science',
    topic: 'Space',
    start: '2026-08-30',
    end: '2026-08-30',
    blurb:
      "NASA's Nancy Grace Roman Space Telescope launched toward L2 to survey dark energy and exoplanets.",
    whyQuiz:
      'Launch on 30 August 2026 aboard a SpaceX Falcon Heavy, cruise to Sun-Earth L2, a wide-field infrared survey of a billion galaxies, the Coronagraph Instrument…',
    sourceUrl: 'https://science.nasa.gov/mission/roman-space-telescope/',
  },
  {
    id: 'us-open-tennis-2026',
    name: 'US Open 2026 (tennis)',
    domain: 'sports',
    topic: 'Tennis',
    start: '2026-08-30',
    end: '2026-09-13',
    blurb:
      "Elena Rybakina beat Aryna Sabalenka 6-4, 5-7, 6-2 for the women's title; the men's final between Alexander Zverev and Ben Shelton is being played today and has…",
    whyQuiz:
      "Rybakina ending Sabalenka's two-year New York reign, and the men's final pitting top seed Zverev against Ben Shelton, who is chasing the first American men's…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_US_Open_(tennis)',
  },
  {
    id: 'lhc-long-shutdown-3',
    name: 'CERN Long Shutdown 3 (LHC offline for HL-LHC upgrade)',
    domain: 'science',
    topic: 'Physics',
    start: '2026-08-31',
    end: '2028-01-01',
    blurb:
      "No collider milestone falls in this window: the LHC fell silent in June 2026 and the rest of CERN's complex switched off at 06:00 on 31 August 2026, with…",
    whyQuiz:
      "The LHC's 27 km ring, the Higgs discovery in 2012, what 'high luminosity' means, and the long-shutdown cycle that punctuates every collider's life.",
    sourceUrl:
      'https://home.cern/accelerator-report-final-countdown-cerns-injector-complex-enters-its-last-stretch-before-ls3/',
  },
  {
    id: 'pig-kidney-xenotransplant-271-days',
    name: 'Pig kidney xenotransplant reaches 271 days',
    domain: 'science',
    topic: 'Biology',
    start: '2026-09-03',
    end: '2026-09-03',
    blurb: 'A gene-edited pig kidney worked in a living human recipient for 271 days before removal.',
    whyQuiz:
      'Xenotransplantation, gene-edited donor pigs, a record nine months free of dialysis, immune rejection limits, and the organ-shortage case for animal-to-human…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_science',
  },
  {
    id: 'ucl-2026-27-league-phase',
    name: 'UEFA Champions League 2026-27 league phase',
    domain: 'sports',
    topic: 'Football',
    start: '2026-09-08',
    end: '2027-01-27',
    blurb:
      'The Champions League league phase began 8-10 September 2026 and closes with matchday 8 on 27 January 2027.',
    whyQuiz:
      'All eight matchday windows, the 36-team single-table format, knockout play-off draw 29 Jan with legs 16-17 and 23-24 Feb, round of 16 in March, and the final…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_UEFA_Champions_League',
  },
  {
    id: 'nfl-2026-regular-season',
    name: 'NFL 2026 regular season',
    domain: 'sports',
    topic: 'American football',
    start: '2026-09-09',
    end: '2027-01-10',
    blurb:
      'The NFL regular season runs 9 September 2026 to 10 January 2027, with the Wild Card round opening 16-18 January.',
    whyQuiz:
      'Kickoff game (Seattle hosting New England), the nine international games from Melbourne on 11 Sep to Mexico City on 22 Nov, the Thanksgiving triple-header…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_NFL_season',
  },
  {
    id: 'presidents-cup-2026',
    name: 'Presidents Cup 2026, Medinah',
    domain: 'sports',
    topic: 'Tennis',
    start: '2026-09-22',
    end: '2026-09-27',
    blurb:
      "Golf's Presidents Cup is at Medinah on 22-27 September 2026; there is no 2026 Ryder Cup, the next is 2027 at Adare Manor.",
    whyQuiz:
      'USA v an International team excluding Europe, Medinah Course No. 3 in Illinois, 12 players per side, and why the Ryder Cup skipped 2026 after the COVID-era…',
    sourceUrl: 'https://www.presidentscup.com/',
  },
  {
    id: 'laver-cup-2026-london',
    name: 'Laver Cup 2026',
    domain: 'sports',
    topic: 'Tennis',
    start: '2026-09-25',
    end: '2026-09-27',
    blurb:
      'The ninth Laver Cup returns to The O2 in London on 25-27 September 2026, Team Europe versus Team World.',
    whyQuiz:
      "Rod Laver naming, the escalating 1-2-3 point-per-day scoring, London's second time hosting after 2022, and the Europe v World head-to-head record across…",
    sourceUrl: 'https://www.atptour.com/en/news/laver-cup-2026-london-o2-announcement',
  },
  {
    id: 'west-indies-tour-of-india-2026',
    name: 'West Indies tour of India 2026',
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-09-27',
    end: '2026-10-17',
    blurb:
      "West Indies open India's home season with three ODIs and five T20Is from 27 September to 17 October 2026.",
    whyQuiz:
      'ODI venues Trivandrum, Guwahati and New Chandigarh; T20I venues Lucknow, Ranchi, Indore, Hyderabad and Bengaluru;',
    sourceUrl:
      'https://www.bcci.tv/news/article/fixtures-unveiled-for-team-india-s-international-home-season-2026-27',
  },
  {
    id: 'nobel-announcement-week-2026',
    name: '2026 Nobel Prize announcement week',
    domain: 'science',
    topic: 'Physics',
    start: '2026-10-05',
    end: '2026-10-12',
    blurb:
      'All six 2026 prizes are revealed 5-12 October: Medicine 5th, Physics 6th, Chemistry 7th, Literature 8th (13:00 CEST), Peace 9th (11:00 CEST, Oslo), Economic…',
    whyQuiz:
      'The order of the disciplines across the week, which prize is announced in Oslo rather than Stockholm, and the fact that the economics prize is funded by…',
    sourceUrl: 'https://www.nobelprize.org/press-release/the-2026-nobel-prize-announcements/',
  },
  {
    id: 'nobel-medicine-2026',
    name: '2026 Nobel Prize in Physiology or Medicine announcement',
    domain: 'science',
    topic: 'Biology',
    start: '2026-10-05',
    end: '2026-10-05',
    blurb:
      'The Nobel Assembly at Karolinska Institutet announces the 2026 medicine laureates on Monday 5 October, 11:30 CEST at the earliest.',
    whyQuiz:
      "Past medicine laureates and their discoveries, the Karolinska Institutet's role, the record for youngest and oldest laureates, and the rule that the prize is…",
    sourceUrl: 'https://www.nobelprize.org/press-release/the-2026-nobel-prize-announcements/',
  },
  {
    id: 'nobel-physics-2026',
    name: '2026 Nobel Prize in Physics announcement',
    domain: 'science',
    topic: 'Physics',
    start: '2026-10-06',
    end: '2026-10-06',
    blurb:
      'The Royal Swedish Academy of Sciences announces the 2026 physics laureates on Tuesday 6 October, 11:45 CEST at the earliest, in Stockholm.',
    whyQuiz:
      "Landmark physics Nobels — relativity, the neutron, the Higgs boson, gravitational waves, attosecond pulses — plus Marie Curie's double win and the handful of…",
    sourceUrl: 'https://www.nobelprize.org/press-release/the-2026-nobel-prize-announcements/',
  },
  {
    id: 'nobel-chemistry-2026',
    name: '2026 Nobel Prize in Chemistry announcement',
    domain: 'science',
    topic: 'Biology',
    start: '2026-10-07',
    end: '2026-10-07',
    blurb:
      'Announced Wednesday 7 October, 11:45 CEST at the earliest; mapped to Biology as the closest listed topic since chemistry has no category of its own and modern…',
    whyQuiz:
      'CRISPR, protein structure prediction, click chemistry and quantum dots — plus the running joke that the chemistry prize is often won by biologists.',
    sourceUrl: 'https://www.nobelprize.org/press-release/the-2026-nobel-prize-announcements/',
  },
  {
    id: 'nba-2026-27-season-tip-off',
    name: 'NBA 2026-27 season tip-off',
    domain: 'sports',
    topic: 'Basketball',
    start: '2026-10-20',
    end: '2027-04-11',
    blurb:
      'NBA tips off 20 October 2026 with an NBC tripleheader and ends 11 April 2027; the NBA Cup final is 11 December.',
    whyQuiz:
      'Opening tripleheader (Boston at Detroit, Philadelphia at New York, Oklahoma City at San Antonio), the Knicks banner raising, Emirates NBA Cup knockouts 4-11…',
    sourceUrl: 'https://www.nba.com/news/2026-27-nba-regular-season-schedule',
  },
  {
    id: 'orionid-meteor-shower-2026',
    name: 'Orionid meteor shower peak',
    domain: 'science',
    topic: 'Space',
    start: '2026-10-21',
    end: '2026-10-22',
    blurb:
      'NASA lists the Orionids as active 2 October to 7 November 2026, peaking the night of 21-22 October; the meteors are debris from Comet Halley.',
    whyQuiz:
      'Which comet feeds which shower — Halley supplies both the Orionids and the Eta Aquariids — and how showers are named after their radiant constellation.',
    sourceUrl: 'https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/',
  },
  {
    id: 'sfn-neuroscience-2026',
    name: 'SfN Neuroscience 2026 annual meeting',
    domain: 'science',
    topic: 'Biology',
    start: '2026-11-14',
    end: '2026-11-18',
    blurb:
      'The Society for Neuroscience meets 14-18 November 2026 at the Walter E. Washington Convention Center in Washington, D.C.',
    whyQuiz:
      'Brain anatomy, neurotransmitters, the history of connectomics and optogenetics, and why SfN is one of the largest single-discipline science meetings on Earth.',
    sourceUrl: 'https://www.sfn.org/meetings/neuroscience-2026',
  },
  {
    id: 'atp-finals-2026-turin',
    name: 'Nitto ATP Finals 2026',
    domain: 'sports',
    topic: 'Tennis',
    start: '2026-11-15',
    end: '2026-11-22',
    blurb: "The Nitto ATP Finals run 15-22 November 2026 on indoor hard courts at Turin's Inalpi Arena.",
    whyQuiz:
      'Eight-player round-robin format, two groups, the sixth consecutive year in Turin, qualification via the ATP Race, and the season-ending No.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_ATP_Finals',
  },
  {
    id: 'bepicolombo-mercury-orbit-insertion',
    name: 'BepiColombo enters orbit around Mercury',
    domain: 'science',
    topic: 'Space',
    start: '2026-11-21',
    end: '2026-11-21',
    blurb:
      'The ESA/JAXA composite spacecraft enters Mercury orbit on 21 November 2026 after an eight-year cruise; the transfer module separated on 3 September 2026.',
    whyQuiz:
      'Mercury facts — smallest planet, no real atmosphere, a 3:2 spin-orbit resonance — and the fact that only Mariner 10, MESSENGER and now BepiColombo have visited…',
    sourceUrl:
      'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo/Latest_updates_BepiColombo_s_arrival_at_Mercury',
  },
  {
    id: 'neurips-2026',
    name: 'NeurIPS 2026',
    domain: 'science',
    topic: 'Computing',
    start: '2026-12-06',
    end: '2026-12-13',
    blurb:
      'The 40th Conference on Neural Information Processing Systems runs across three sites: Sydney 6-12 December, Atlanta and Paris both 9-13 December 2026.',
    whyQuiz:
      "Machine-learning milestones, the transformer paper, what the acronym NeurIPS stands for, and the conference's unusual multi-continent format this year.",
    sourceUrl: 'https://neurips.cc/Conferences/2026/Dates',
  },
  {
    id: 'neurips-2026-sydney',
    name: 'NeurIPS 2026 (Sydney, Atlanta, Paris)',
    domain: 'science',
    topic: 'Computing',
    start: '2026-12-06',
    end: '2026-12-13',
    blurb: 'NeurIPS 2026 runs in Sydney with satellite sites in Atlanta and Paris.',
    whyQuiz:
      'The distributed multi-site format, Sydney main conference 8-10 December with workshops 11-12, Atlanta and Paris satellites from 9 December, and NeurIPS as the…',
    sourceUrl: 'https://neurips.cc/Conferences/2026/Dates',
  },
  {
    id: 'bepicolombo-orbiter-separation',
    name: 'BepiColombo MPO and Mio orbiter separation',
    domain: 'science',
    topic: 'Space',
    start: '2026-12-09',
    end: '2026-12-10',
    blurb:
      "ESA's Mercury Planetary Orbiter and JAXA's Mio separate on 9-10 December 2026 to take up their own polar orbits; science operations begin April 2027.",
    whyQuiz:
      "The first mission to orbit Mercury with two spacecraft at once, the ESA-JAXA partnership, and who Giuseppe 'Bepi' Colombo was.",
    sourceUrl:
      'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo/Latest_updates_BepiColombo_s_arrival_at_Mercury',
  },
  {
    id: 'trans-tasman-test-series-2026-27',
    name: 'Australia v New Zealand four-Test Trans-Tasman series',
    domain: 'sports',
    topic: 'Cricket',
    start: '2026-12-09',
    end: '2027-01-08',
    blurb:
      'Australia host New Zealand for a first four-Test series, Perth from 9 December to the SCG Test ending 8 January.',
    whyQuiz:
      'Perth 9-13 Dec, Adelaide 17-21 Dec, Boxing Day MCG 26-30 Dec and SCG 4-8 Jan; four Tests inside 31 days;',
    sourceUrl:
      'https://www.cricket.com.au/news/4473637/australian-cricket-schedule-2026-27-summer-tests-odi-t20i-bangladesh-new-zealand-england-150th-women-fixtures-dates-start-times',
  },
  {
    id: 'nobel-award-ceremony-2026',
    name: 'Nobel Prize award ceremonies 2026',
    domain: 'science',
    topic: 'Physics',
    start: '2026-12-10',
    end: '2026-12-10',
    blurb:
      "The laureates receive their medals on 10 December, the anniversary of Alfred Nobel's death — science and literature in Stockholm, peace in Oslo.",
    whyQuiz:
      'Why 10 December, the Stockholm Concert Hall and Oslo City Hall venues, the medal and diploma, and who physically hands over the Swedish prizes.',
    sourceUrl: 'https://www.nobelprize.org/',
  },
  {
    id: 'geminid-meteor-shower-2026',
    name: 'Geminid meteor shower peak',
    domain: 'science',
    topic: 'Space',
    start: '2026-12-13',
    end: '2026-12-14',
    blurb:
      "NASA lists the Geminids as active 4-17 December 2026 with a peak on the night of 13-14 December; usually the year's strongest shower.",
    whyQuiz:
      'The Geminids come from asteroid 3200 Phaethon rather than a comet, which makes them an oddity among major meteor showers.',
    sourceUrl: 'https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/',
  },
  {
    id: 'quadrantid-meteor-shower-2027',
    name: 'Quadrantid meteor shower peak',
    domain: 'science',
    topic: 'Space',
    start: '2027-01-03',
    end: '2027-01-04',
    blurb:
      'Active 28 December 2026 to 12 January 2027 per NASA, with a famously narrow peak on the night of 3-4 January 2027.',
    whyQuiz:
      'The shower is named for Quadrans Muralis, a constellation that no longer officially exists, and its peak lasts only a few hours.',
    sourceUrl: 'https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/',
  },
  {
    id: 'ces-2027',
    name: 'CES 2027',
    domain: 'science',
    topic: 'Computing',
    start: '2027-01-06',
    end: '2027-01-09',
    blurb: "The Consumer Technology Association's annual show runs 6-9 January 2027 in Las Vegas, Nevada.",
    whyQuiz:
      'Technologies that debuted at CES — the VCR, the camcorder, HDTV, Blu-ray — and the scale of the Las Vegas Convention Center takeover.',
    sourceUrl: 'https://www.ces.tech/',
  },
  {
    id: 'australian-open-2027',
    name: 'Australian Open 2027',
    domain: 'sports',
    topic: 'Tennis',
    start: '2027-01-11',
    end: '2027-01-31',
    blurb:
      'Australian Open 2027 spans 11-31 January at Melbourne Park, main draw from 17 January and singles finals 30-31.',
    whyQuiz:
      'The 15-day main draw and Sunday start, qualifying during Opening Week 11-16 Jan, wheelchair events 26-31 Jan, and the Rod Laver Arena finals weekend.',
    sourceUrl: 'https://ausopen.com/articles/news/australian-open-2027-dates-announced',
  },
  {
    id: 'border-gavaskar-trophy-2027',
    name: 'Border-Gavaskar Trophy 2027, India v Australia',
    domain: 'sports',
    topic: 'Cricket',
    start: '2027-01-21',
    end: '2027-03-03',
    blurb:
      "India host Australia for five Border-Gavaskar Tests from 21 January to 3 March 2027, closing India's home season.",
    whyQuiz:
      "Five Tests across five venues in roughly six weeks, its World Test Championship stakes, and the rest of India's season: Sri Lanka 13-27 Dec 2026 and Zimbabwe…",
    sourceUrl:
      'https://www.bcci.tv/news/article/fixtures-unveiled-for-team-india-s-international-home-season-2026-27',
  },
  {
    id: 'annular-solar-eclipse-2027',
    name: 'Annular solar eclipse',
    domain: 'science',
    topic: 'Space',
    start: '2027-02-06',
    end: '2027-02-06',
    blurb:
      "A 'ring of fire' eclipse visible from Chile, Argentina, Uruguay, Brazil and across West Africa including Ghana, Togo, Benin and Nigeria.",
    whyQuiz:
      'Why an annular eclipse leaves a ring instead of totality — the Moon near apogee appears too small to cover the Sun — versus the total eclipse of 2 August 2027.',
    sourceUrl: 'https://science.nasa.gov/eclipses/future-eclipses/',
  },
  {
    id: 'super-bowl-lxi',
    name: 'Super Bowl LXI',
    domain: 'sports',
    topic: 'American football',
    start: '2027-02-14',
    end: '2027-02-14',
    blurb:
      'Super Bowl LXI is set for 14 February 2027 at SoFi Stadium in Inglewood, the latest-ever NFL season finish.',
    whyQuiz:
      "Second Super Bowl at SoFi Stadium in five years (after LVI), the Valentine's Day date, the 18-game schedule that pushed the finish back, and the traditional…",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_NFL_season',
  },
  {
    id: 'nba-all-star-2027-phoenix',
    name: 'NBA All-Star 2027, Phoenix',
    domain: 'sports',
    topic: 'Basketball',
    start: '2027-02-19',
    end: '2027-02-21',
    blurb: 'NBA All-Star weekend runs 19-21 February 2027 in Phoenix, the weekend after Super Bowl LXI.',
    whyQuiz:
      'Host city and arena, the three-day Friday-to-Sunday format, event line-up (Rising Stars, skills, three-point, dunk contest), and how All-Star break sits in the…',
    sourceUrl: 'https://www.nba.com/news/2026-27-nba-regular-season-schedule',
  },
  {
    id: 'penumbral-lunar-eclipse-2027',
    name: 'Penumbral lunar eclipse',
    domain: 'science',
    topic: 'Space',
    start: '2027-02-20',
    end: '2027-02-21',
    blurb:
      'A subtle penumbral lunar eclipse on 20-21 February 2027, visible from the Americas, Europe, Africa, Asia, Australia and Antarctica.',
    whyQuiz:
      'The three kinds of lunar eclipse, why penumbral ones are easy to miss, and why lunar eclipses are visible to half the planet at once while solar ones are not.',
    sourceUrl: 'https://science.nasa.gov/eclipses/future-eclipses/',
  },
  {
    id: 'cricket-world-cup-2027-qualifier',
    name: 'ICC Cricket World Cup 2027 Qualifier',
    domain: 'sports',
    topic: 'Cricket',
    start: '2027-02-22',
    end: '2027-03-23',
    blurb:
      'The CWC 2027 Qualifier runs 22 February to 23 March 2027; the 14-team World Cup itself is 4 October to 21 November 2027.',
    whyQuiz:
      'Four qualifying spots on offer, the 30 September 2026 ODI ranking cut-off for the eight automatic places, hosts South Africa, Zimbabwe and Namibia, and the new…',
    sourceUrl: 'https://en.wikipedia.org/wiki/2027_Cricket_World_Cup',
  },
  {
    id: 'mwc-2027-barcelona',
    name: 'MWC27 Barcelona',
    domain: 'science',
    topic: 'Computing',
    start: '2027-03-01',
    end: '2027-03-04',
    blurb:
      "The GSMA's Mobile World Congress runs 1-4 March 2027 at Fira Gran Via, Barcelona, drawing over 100,000 attendees.",
    whyQuiz:
      'Mobile generations from 1G to 6G, what GSMA stands for, and the satellite-to-smartphone and telco-AI themes dominating recent editions.',
    sourceUrl: 'https://www.mwcbarcelona.com/',
  },
]);
