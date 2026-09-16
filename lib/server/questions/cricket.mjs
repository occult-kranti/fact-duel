// Server-only editorial bank: Cricket, tranche 1 (59 questions).
// Never import this module from client components.
// Every fact below was checked against the page at sourceUrl when written.
export const CRICKET = Object.freeze([
  // ---------------------------------------------------------------- Bodyline
  {
    id: 'cr001',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bodyline',
    difficulty: 'simple',
    question:
      "Which England captain directed the 'Bodyline' leg-theory attack on the 1932-33 tour of Australia?",
    options: ['Gubby Allen', 'Wally Hammond', 'Percy Chapman', 'Douglas Jardine'],
    correctIndex: 3,
    explanation: 'Jardine played to win; his fast bowlers were told to aim at the batsman, not the stumps.',
    sourceUrl:
      "https://www.thecricketer.com/topics/features/bodyline_85_years_on_from_cricket's_dramatic_episode.html",
    sourceLabel: "The Cricketer: Bodyline, 85 years on from cricket's dramatic episode",
  },
  {
    id: 'cr002',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bodyline',
    difficulty: 'simple',
    question:
      "Which Nottinghamshire fast bowler was England's principal strike weapon in the Bodyline series?",
    options: ['Bill Voce', 'Harold Larwood', 'Bill Bowes', 'Gubby Allen'],
    correctIndex: 1,
    explanation: 'Larwood refused to sign an apology afterwards and never played for England again.',
    sourceUrl:
      "https://www.thecricketer.com/topics/features/bodyline_85_years_on_from_cricket's_dramatic_episode.html",
    sourceLabel: "The Cricketer: Bodyline, 85 years on from cricket's dramatic episode",
  },
  {
    id: 'cr003',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bodyline',
    difficulty: 'expert',
    question:
      "Which Australian captain, struck over the heart at Adelaide, told Plum Warner 'there are two teams out there, one is trying to play cricket'?",
    options: ['Vic Richardson', 'Bert Oldfield', 'Stan McCabe', 'Bill Woodfull'],
    correctIndex: 3,
    explanation: 'Woodfull said it in the dressing room when the MCC manager came to check on him.',
    sourceUrl: 'https://www.saca.com.au/news/4407977/bodyline-series',
    sourceLabel: 'South Australian Cricket Association: Bodyline Series',
  },
  {
    id: 'cr004',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bodyline',
    difficulty: 'extreme',
    question: 'Which England fast bowler refused to bowl Bodyline for Jardine on the 1932-33 tour?',
    options: ['Bill Voce', 'Maurice Tate', 'Gubby Allen', 'Bill Bowes'],
    correctIndex: 2,
    explanation: 'Allen would not bowl to the packed leg-side field, and Jardine let him bowl his own way.',
    sourceUrl:
      "https://www.thecricketer.com/topics/features/bodyline_85_years_on_from_cricket's_dramatic_episode.html",
    sourceLabel: "The Cricketer: Bodyline, 85 years on from cricket's dramatic episode",
  },
  {
    id: 'cr005',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bodyline',
    difficulty: 'extreme',
    question:
      'By how many runs did England win the riotous Adelaide Test of January 1933, the match of the Woodfull and Oldfield injuries?',
    options: ['192', '338', '226', '412'],
    correctIndex: 1,
    explanation: 'Mounted police were readied for a riot; England went on to take the series 4-1.',
    sourceUrl: 'https://www.saca.com.au/news/4407977/bodyline-series',
    sourceLabel: 'South Australian Cricket Association: Bodyline Series',
  },

  // ----------------------------------------------------------------- Bradman
  {
    id: 'cr006',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bradman',
    difficulty: 'simple',
    question: "What was Don Bradman's final Test batting average?",
    options: ['98.76', '96.12', '100.00', '99.94'],
    correctIndex: 3,
    explanation: 'He made 6,996 runs in 52 Tests; a boundary in his last innings would have made it 100.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-donald-bradman',
    sourceLabel: 'ICC Hall of Fame: Donald Bradman',
  },
  {
    id: 'cr007',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bradman',
    difficulty: 'expert',
    question:
      'How many runs did Bradman score in the 1930 Ashes series, still the record aggregate for any Test series?',
    options: ['905', '974', '839', '810'],
    correctIndex: 1,
    explanation:
      "The 974 came at an average of 139.14, with 254 at Lord's, 334 at Headingley and 232 at The Oval.",
    sourceUrl: 'https://theanalyst.com/articles/who-has-the-most-ashes-runs-in-a-series',
    sourceLabel: 'Opta Analyst: Who has scored the most Ashes runs in a series?',
  },
  {
    id: 'cr008',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Bradman',
    difficulty: 'extreme',
    question:
      "Whose 905 runs in 1928-29 is the only Ashes series aggregate within a hundred of Bradman's 974?",
    options: ['Len Hutton', 'Herbert Sutcliffe', 'Jack Hobbs', 'Wally Hammond'],
    correctIndex: 3,
    explanation:
      'Hammond averaged 113.12 that winter; the next best are Mark Taylor (839) and Bradman again (810).',
    sourceUrl: 'https://theanalyst.com/articles/who-has-the-most-ashes-runs-in-a-series',
    sourceLabel: 'Opta Analyst: Who has scored the most Ashes runs in a series?',
  },

  // ----------------------------------------------------------- Ashes classics
  {
    id: 'cr009',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'simple',
    question:
      "Which England batsman was bowled by Shane Warne's 'Ball of the Century' at Old Trafford in 1993?",
    options: ['Graham Gooch', 'Mike Gatting', 'Alec Stewart', 'Robin Smith'],
    correctIndex: 1,
    explanation: "It was Warne's first ball in Ashes cricket; it pitched outside leg and hit the top of off.",
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-shane-warne',
    sourceLabel: 'ICC Hall of Fame: Shane Warne',
  },
  {
    id: 'cr010',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'expert',
    question:
      'How many wickets did Jim Laker take in the 1956 Old Trafford Test, still the record for a Test match?',
    options: ['17', '18', '19', '20'],
    correctIndex: 2,
    explanation:
      'Laker took 19 for 90 off 68 overs; Tony Lock, bowling at the other end, got the one that got away.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-jim-laker',
    sourceLabel: 'ICC Hall of Fame: Jim Laker',
  },
  {
    id: 'cr011',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'expert',
    question:
      'By how many runs did England win the 2005 Edgbaston Test, sealed when Kasprowicz gloved Harmison to Geraint Jones?',
    options: ['1', '2', '3', '5'],
    correctIndex: 1,
    explanation: 'Brett Lee was left stranded on 43; the image of Flintoff consoling him defines the series.',
    sourceUrl:
      'https://www.skysports.com/cricket/news/12123/11985369/edgbaston-2005-key-moments-as-england-edge-ashes-epic',
    sourceLabel: 'Sky Sports: Edgbaston 2005, key moments as England edge Ashes epic',
  },
  {
    id: 'cr012',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'expert',
    question:
      'What odds did Ladbrokes post against an England win at tea on the Saturday of the 1981 Headingley Test?',
    options: ['100-1', '250-1', '500-1', '1000-1'],
    correctIndex: 2,
    explanation: 'England had followed on; Botham and then Willis, with 8 of the last 9 wickets, turned it.',
    sourceUrl: 'https://www.thecricketer.com/topics/england/from_the_archive_headingley_%E2%80%9881.html',
    sourceLabel: "The Cricketer: From the archive, Headingley '81",
  },
  {
    id: 'cr013',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'extreme',
    question:
      "What were Jim Laker's first-innings figures at Old Trafford in 1956, before he took all ten in the second?",
    options: ['9 for 52', '8 for 43', '7 for 46', '9 for 37'],
    correctIndex: 3,
    explanation: 'Nine for 37, then all ten for 53: 19 for 90 off 68 overs in a single Test.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-jim-laker',
    sourceLabel: 'ICC Hall of Fame: Jim Laker',
  },
  {
    id: 'cr014',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Ashes classics',
    difficulty: 'extreme',
    question:
      'In the 1882 Oval Test that spawned the Ashes obituary, England were bowled out for how many chasing 85?',
    options: ['84', '68', '81', '77'],
    correctIndex: 3,
    explanation:
      "Fred 'The Demon' Spofforth did the damage; the Sporting Times then printed its mock obituary of English cricket.",
    sourceUrl:
      'https://www.lords.org/lords/our-history/father-time-wall/1928-the-ashes-urn-is-presented-to-mcc',
    sourceLabel: "Lord's: 1928, the Ashes urn is presented to MCC",
  },

  // ----------------------------------------------------------- Underarm 1981
  {
    id: 'cr015',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Underarm 1981',
    difficulty: 'simple',
    question: 'Who bowled the infamous underarm final delivery at the MCG on 1 February 1981?',
    options: ['Greg Chappell', 'Ian Chappell', 'Trevor Chappell', 'Dennis Lillee'],
    correctIndex: 2,
    explanation: 'Trevor rolled it along the ground on the orders of his elder brother and captain, Greg.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/icc/underarm-incident-still-resonates-before-final-1.1480619',
    sourceLabel: 'Gulf News: Underarm incident still resonates before final',
  },
  {
    id: 'cr016',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Underarm 1981',
    difficulty: 'simple',
    question:
      'Which team was batting when Australia bowled the underarm delivery in the 1981 World Series Cup final?',
    options: ['England', 'West Indies', 'India', 'New Zealand'],
    correctIndex: 3,
    explanation: 'Batsman Brian McKechnie blocked it and threw his bat away in disgust.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/icc/underarm-incident-still-resonates-before-final-1.1480619',
    sourceLabel: 'Gulf News: Underarm incident still resonates before final',
  },
  {
    id: 'cr017',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Underarm 1981',
    difficulty: 'expert',
    question: 'How many runs did New Zealand need off the underarm ball to tie the 1981 final?',
    options: ['Four', 'Six', 'Two', 'One'],
    correctIndex: 1,
    explanation:
      'Only a six would do, which is exactly why Greg Chappell ordered the ball rolled along the ground.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/icc/underarm-incident-still-resonates-before-final-1.1480619',
    sourceLabel: 'Gulf News: Underarm incident still resonates before final',
  },
  {
    id: 'cr018',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Underarm 1981',
    difficulty: 'extreme',
    question:
      "Which prime minister called the underarm ball 'the most disgusting episode in the history of cricket'?",
    options: ['Malcolm Fraser', 'Robert Muldoon', 'David Lange', 'Bob Hawke'],
    correctIndex: 1,
    explanation: "New Zealand's Muldoon said it; Australia's Fraser merely called on Chappell to apologise.",
    sourceUrl:
      'https://gulfnews.com/sport/cricket/icc/underarm-incident-still-resonates-before-final-1.1480619',
    sourceLabel: 'Gulf News: Underarm incident still resonates before final',
  },

  // ------------------------------------------------------- Packer revolution
  {
    id: 'cr019',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Packer revolution',
    difficulty: 'simple',
    question:
      'Kerry Packer launched World Series Cricket in 1977 after being refused TV rights for which network?',
    options: ['The ABC', 'Channel Seven', 'Channel Nine', 'Channel Ten'],
    correctIndex: 2,
    explanation: 'Nine kept the broadcast rights after the 1979 peace deal, and held them for decades.',
    sourceUrl:
      'https://www.thecricketer.com/topics/features/kerry_packer_revolution_australia_cricket_world_series.html',
    sourceLabel: 'The Cricketer: Back to the future, the Kerry Packer revolution',
  },
  {
    id: 'cr020',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Packer revolution',
    difficulty: 'expert',
    question:
      "Which serving England captain became Packer's recruiter and went 'from darling of the establishment to pariah' within two months?",
    options: ['Keith Fletcher', 'Mike Denness', 'Ray Illingworth', 'Tony Greig'],
    correctIndex: 3,
    explanation:
      'Greig lost the England captaincy once his role in signing players for Packer became public.',
    sourceUrl:
      'https://www.thecricketer.com/topics/features/kerry_packer_revolution_australia_cricket_world_series.html',
    sourceLabel: 'The Cricketer: Back to the future, the Kerry Packer revolution',
  },
  {
    id: 'cr021',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Packer revolution',
    difficulty: 'extreme',
    question:
      "In WSC's first coloured-clothing one-dayer in January 1979, the Australians wore wattle yellow and the West Indians wore what?",
    options: ['Emerald green', 'Maroon', 'Sky blue', 'Coral pink'],
    correctIndex: 3,
    explanation:
      'The pink kit was mocked at the time; coloured clothing, night cricket and drop-in pitches all outlived WSC.',
    sourceUrl:
      'https://www.thecricketer.com/topics/features/kerry_packer_revolution_australia_cricket_world_series.html',
    sourceLabel: 'The Cricketer: Back to the future, the Kerry Packer revolution',
  },

  // ------------------------------------------------------- Cronje match-fixing
  {
    id: 'cr022',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Cronje match-fixing',
    difficulty: 'simple',
    question: 'How did disgraced former South Africa captain Hansie Cronje die in June 2002?',
    options: ['Car crash', 'Plane crash', 'Heart attack', 'Drowning'],
    correctIndex: 1,
    explanation:
      'The Hawker Siddeley 748 he was travelling on hit the Outeniqua mountains near George; he was 32.',
    sourceUrl: 'https://mg.co.za/article/2002-06-01-hansie-cronje-killed-in-plane-crash/',
    sourceLabel: 'Mail & Guardian: Hansie Cronje killed in plane crash',
  },
  {
    id: 'cr023',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Cronje match-fixing',
    difficulty: 'expert',
    question:
      'Which two teammates did Cronje admit offering money to underperform in one-day internationals in India in 2000?',
    options: [
      'Shaun Pollock and Allan Donald',
      'Nicky Boje and Pieter Strydom',
      'Lance Klusener and Jacques Kallis',
      'Herschelle Gibbs and Henry Williams',
    ],
    correctIndex: 3,
    explanation:
      'Cronje admitted taking money from bookmakers but insisted he never actually fixed a match; he was banned for life.',
    sourceUrl: 'https://mg.co.za/article/2002-06-01-hansie-cronje-killed-in-plane-crash/',
    sourceLabel: 'Mail & Guardian: Hansie Cronje killed in plane crash',
  },
  {
    id: 'cr024',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Cronje match-fixing',
    difficulty: 'extreme',
    question:
      'Alongside about $6,000, what gift did Cronje receive from a bookmaker for engineering a result in the Centurion Test against England in January 2000?',
    options: ['A set of golf clubs', 'A gold watch', 'A mobile phone', 'A leather jacket'],
    correctIndex: 3,
    explanation:
      "Cronje was paid to pre-arrange the conditions of the Centurion finish; the jacket became the scandal's shorthand.",
    sourceUrl:
      'https://gulfnews.com/sport/cricket/twenty-years-on-cricket-yet-to-recover-from-hansie-cronje-scandal-1.70952432',
    sourceLabel: 'Gulf News: Twenty years on, cricket yet to recover from Hansie Cronje scandal',
  },
  {
    id: 'cr025',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Cronje match-fixing',
    difficulty: 'extreme',
    question: 'Into which mountain range did the aircraft carrying Hansie Cronje crash in 2002?',
    options: ['Drakensberg', 'Cederberg', 'Outeniqua', 'Magaliesberg'],
    correctIndex: 2,
    explanation: 'The plane was trying to land at George in bad weather; all three on board died.',
    sourceUrl: 'https://mg.co.za/article/2002-06-01-hansie-cronje-killed-in-plane-crash/',
    sourceLabel: 'Mail & Guardian: Hansie Cronje killed in plane crash',
  },

  // ----------------------------------------------------------- Sandpapergate
  {
    id: 'cr026',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Sandpapergate',
    difficulty: 'simple',
    question:
      'Which Australian opener was caught on camera hiding sandpaper down his trousers at Newlands in March 2018?',
    options: ['Steve Smith', 'David Warner', 'Cameron Bancroft', 'Mitchell Starc'],
    correctIndex: 2,
    explanation:
      'Bancroft first claimed the yellow object was sticky tape; the ICC fined him 75% of his match fee.',
    sourceUrl:
      'https://www.icc-cricket.com/media-releases/steve-smith-suspended-and-bancroft-handed-three-demerit-points',
    sourceLabel: 'ICC: Steve Smith suspended and Bancroft handed three demerit points',
  },
  {
    id: 'cr027',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Sandpapergate',
    difficulty: 'simple',
    question:
      'Which wicketkeeper took over as Australia Test captain from Steve Smith after the Cape Town scandal?',
    options: ['Mitchell Marsh', 'Pat Cummins', 'Aaron Finch', 'Tim Paine'],
    correctIndex: 3,
    explanation: 'Paine led in the Johannesburg Test days later, with coach Darren Lehmann stepping down.',
    sourceUrl:
      'https://www.skysports.com/cricket/news/12123/11677366/story-of-the-australian-ball-tampering-scandal-sandpaper-sackings-and-the-future',
    sourceLabel: 'Sky Sports: Story of the Australian ball-tampering scandal',
  },
  {
    id: 'cr028',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Sandpapergate',
    difficulty: 'expert',
    question:
      'How long were Smith and Warner banned from international and state cricket by Cricket Australia for the sandpaper plot?',
    options: ['Six months', 'Nine months', 'Twelve months', 'Two years'],
    correctIndex: 2,
    explanation:
      'Bancroft got nine months; Warner was told he would never again be considered for a leadership role.',
    sourceUrl:
      'https://www.aljazeera.com/sports/2018/3/28/cricket-australia-ban-smith-warner-in-ball-tampering-scandal',
    sourceLabel: 'Al Jazeera: Australia ban Smith, Warner in ball-tampering scandal',
  },
  {
    id: 'cr029',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Sandpapergate',
    difficulty: 'extreme',
    question:
      'How many demerit points did the ICC give Cameron Bancroft for his Level 2 ball-condition charge at Newlands?',
    options: ['One', 'Two', 'Three', 'Four'],
    correctIndex: 2,
    explanation:
      "Smith's own ICC sanction was a one-Test ban and a 100% match-fee fine; the far harsher bans came from Cricket Australia.",
    sourceUrl:
      'https://www.icc-cricket.com/media-releases/steve-smith-suspended-and-bancroft-handed-three-demerit-points',
    sourceLabel: 'ICC: Steve Smith suspended and Bancroft handed three demerit points',
  },

  // ---------------------------------------------------------- 2019 WC final
  {
    id: 'cr030',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2019 World Cup final',
    difficulty: 'simple',
    question:
      "At which ground was the 2019 men's World Cup final, the one decided by a super over and boundary count?",
    options: ['The Oval', 'Edgbaston', "Lord's", 'Old Trafford'],
    correctIndex: 2,
    explanation: 'England and New Zealand both made 241, then both made 15 in the super over.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/england-win-cricket-world-cup-after-super-over-drama-1.1563101583313',
    sourceLabel: 'Gulf News: England win Cricket World Cup after Super Over drama',
  },
  {
    id: 'cr031',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2019 World Cup final',
    difficulty: 'simple',
    question: 'After the tied super over, on what basis was England declared 2019 World Cup winner?',
    options: ['A second super over', 'Fewer wickets lost', 'Boundary count', 'Net run rate'],
    correctIndex: 2,
    explanation:
      "England had hit 26 boundaries to New Zealand's 17; the rule was scrapped three months later.",
    sourceUrl:
      'https://www.malaymail.com/news/sports/2019/07/15/england-win-world-cup-in-super-over-drama-to-end-44-year-wait/1771468',
    sourceLabel: 'Malay Mail (AFP): England win World Cup in super over drama to end 44-year wait',
  },
  {
    id: 'cr032',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2019 World Cup final',
    difficulty: 'expert',
    question: 'What score did Ben Stokes finish on, not out, in the main innings of the 2019 final?',
    options: ['91', '76', '84', '99'],
    correctIndex: 2,
    explanation:
      'He dragged England from 86 for 4 to a tie, then made 8 of the 15 in the super over against Trent Boult.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/england-win-cricket-world-cup-after-super-over-drama-1.1563101583313',
    sourceLabel: 'Gulf News: England win Cricket World Cup after Super Over drama',
  },
  {
    id: 'cr033',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2019 World Cup final',
    difficulty: 'extreme',
    question: "How many did Jimmy Neesham make, not out, in New Zealand's super over against Jofra Archer?",
    options: ['11', '13', '9', '15'],
    correctIndex: 1,
    explanation:
      'Neesham hit a six off the second ball; Guptill was run out for 1 going for the winning second run.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/england-win-cricket-world-cup-after-super-over-drama-1.1563101583313',
    sourceLabel: 'Gulf News: England win Cricket World Cup after Super Over drama',
  },
  {
    id: 'cr034',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2019 World Cup final',
    difficulty: 'extreme',
    question:
      'Under the ICC rules adopted in October 2019, a tied super over in a World Cup group match is resolved how?',
    options: [
      'The match is declared a tie',
      'By boundary count',
      'By a further super over',
      'By fewer wickets lost',
    ],
    correctIndex: 0,
    explanation: 'Only in semi-finals and finals is the super over repeated until one side scores more.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/icc-scraps-boundary-count-rule-that-decided-2019-world-cup-1.1571130745332',
    sourceLabel: 'Gulf News: ICC scraps boundary count rule that decided 2019 World Cup',
  },

  // --------------------------------------------------------------- India 2011
  {
    id: 'cr035',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'India 2011',
    difficulty: 'simple',
    question: "Who hit the six over long-on that sealed India's 2011 World Cup final win over Sri Lanka?",
    options: ['Yuvraj Singh', 'MS Dhoni', 'Gautam Gambhir', 'Virat Kohli'],
    correctIndex: 1,
    explanation: 'Dhoni finished 91 not out from 79 balls and was named player of the match.',
    sourceUrl:
      'https://www.outlookindia.com/sports/cricket/on-this-day-april-2-2011-ms-dhoni-india-icc-world-cup-victory',
    sourceLabel: "Outlook India: On this day in 2011, Dhoni's men ended India's 28-year wait",
  },
  {
    id: 'cr036',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'India 2011',
    difficulty: 'simple',
    question: 'At which stadium did India win the 2011 World Cup final?',
    options: [
      'Eden Gardens, Kolkata',
      'Wankhede Stadium, Mumbai',
      'M Chinnaswamy Stadium, Bengaluru',
      'Feroz Shah Kotla, Delhi',
    ],
    correctIndex: 1,
    explanation: 'India became the first team to win a World Cup on home soil.',
    sourceUrl:
      'https://www.outlookindia.com/sports/cricket/on-this-day-april-2-2011-ms-dhoni-india-icc-world-cup-victory',
    sourceLabel: "Outlook India: On this day in 2011, Dhoni's men ended India's 28-year wait",
  },
  {
    id: 'cr037',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'India 2011',
    difficulty: 'expert',
    question: 'Gautam Gambhir fell three short of a final hundred in 2011; what did he score?',
    options: ['97', '91', '89', '85'],
    correctIndex: 0,
    explanation: 'Gambhir and Dhoni rebuilt after Sehwag went for 0 and Tendulkar for 18, chasing 275.',
    sourceUrl:
      'https://www.outlookindia.com/sports/cricket/on-this-day-april-2-2011-ms-dhoni-india-icc-world-cup-victory',
    sourceLabel: "Outlook India: On this day in 2011, Dhoni's men ended India's 28-year wait",
  },
  {
    id: 'cr038',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'India 2011',
    difficulty: 'expert',
    question: 'Off which Sri Lankan bowler did Dhoni hit the winning six in the 2011 final?',
    options: ['Lasith Malinga', 'Nuwan Kulasekara', 'Thisara Perera', 'Muttiah Muralitharan'],
    correctIndex: 1,
    explanation: 'Kulasekara bowled the 49th over; Jayawardene had earlier made 103 not out for Sri Lanka.',
    sourceUrl:
      'https://www.outlookindia.com/sports/cricket/on-this-day-april-2-2011-ms-dhoni-india-icc-world-cup-victory',
    sourceLabel: "Outlook India: On this day in 2011, Dhoni's men ended India's 28-year wait",
  },
  {
    id: 'cr039',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'India 2011',
    difficulty: 'extreme',
    question: 'Why was the coin toss for the 2011 World Cup final taken twice?',
    options: [
      "Referee Jeff Crowe couldn't hear Sangakkara's call over the crowd",
      'The coin landed on its edge',
      'The wrong commemorative coin was used',
      'Both captains claimed to have won',
    ],
    correctIndex: 0,
    explanation: "Sri Lanka won the retaken toss and batted; Dilshan (500) was the tournament's top scorer.",
    sourceUrl: 'https://gulfnews.com/sport/cricket/icc/flashback-2011-cricket-world-cup-1.64225347',
    sourceLabel: 'Gulf News: Flashback, 2011 Cricket World Cup',
  },

  // --------------------------------------------------------------------- IPL
  {
    id: 'cr040',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'IPL',
    difficulty: 'simple',
    question: 'Which franchise won the inaugural IPL in 2008, beating Chennai Super Kings in the final?',
    options: ['Chennai Super Kings', 'Rajasthan Royals', 'Kolkata Knight Riders', 'Deccan Chargers'],
    correctIndex: 1,
    explanation:
      "The cheapest franchise at auction won by three wickets; Sohail Tanvir's 6 for 14 that season stood as the IPL's best figures until 2019.",
    sourceUrl: 'https://www.crictracker.com/ipl-the-first-ever-happenings-in-the-history-of-the-tournament/',
    sourceLabel: 'CricTracker: IPL, the first-ever happenings in the history of the tournament',
  },
  {
    id: 'cr041',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'IPL',
    difficulty: 'simple',
    question:
      'Who blasted an unbeaten 158 for Kolkata Knight Riders in the very first IPL match on 18 April 2008?',
    options: ['Chris Gayle', 'Adam Gilchrist', 'Brendon McCullum', 'Virender Sehwag'],
    correctIndex: 2,
    explanation:
      'McCullum faced 73 balls against Royal Challengers Bangalore and was on nought after his first eight.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/ipl/on-this-day-mccullum-blasted-unbeaten-158-for-kolkata-exactly-15-years-ago-to-give-ipl-dream-start-1.87260480',
    sourceLabel: 'Gulf News: On this day, McCullum blasted unbeaten 158 for Kolkata',
  },
  {
    id: 'cr042',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'IPL',
    difficulty: 'expert',
    question:
      'Which two IPL seasons did Chennai Super Kings and Rajasthan Royals sit out after the Lodha committee suspended them?',
    options: ['2014 and 2015', '2015 and 2016', '2016 and 2017', '2017 and 2018'],
    correctIndex: 2,
    explanation:
      'The July 2015 verdict followed the 2013 spot-fixing arrests; officials Meiyappan and Kundra were banned for life.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/ipl/csk-and-rajasthan-to-serve-two-year-suspensions-1.1602573',
    sourceLabel: 'Gulf News: CSK and Rajasthan to serve two-year suspensions',
  },
  {
    id: 'cr043',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'IPL',
    difficulty: 'extreme',
    question: 'Who bowled the first ball in IPL history, to Sourav Ganguly in Bangalore in 2008?',
    options: ['Praveen Kumar', 'Zaheer Khan', 'Ishant Sharma', 'Ashley Noffke'],
    correctIndex: 0,
    explanation: 'McCullum then hit the first four and first six of the league in the second over.',
    sourceUrl: 'https://www.crictracker.com/ipl-the-first-ever-happenings-in-the-history-of-the-tournament/',
    sourceLabel: 'CricTracker: IPL, the first-ever happenings in the history of the tournament',
  },

  // --------------------------------------------------------- Tendulkar v Lara
  {
    id: 'cr045',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Tendulkar v Lara',
    difficulty: 'simple',
    question: 'How many international centuries did Sachin Tendulkar finish with across all formats?',
    options: ['95', '100', '105', '110'],
    correctIndex: 1,
    explanation: '51 in Tests and 49 in ODIs; the hundredth came in his penultimate ODI in 2012.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-sachin-tendulkar',
    sourceLabel: 'ICC Hall of Fame: Sachin Tendulkar',
  },
  {
    id: 'cr046',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Tendulkar v Lara',
    difficulty: 'simple',
    question:
      "Against which team did Brian Lara make his 400 not out in Antigua in 2004, Test cricket's only quadruple century?",
    options: ['England', 'Australia', 'South Africa', 'India'],
    correctIndex: 0,
    explanation:
      'Lara is the only player to have broken the Test highest-score record twice, with 375 and then 400.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-brian-lara',
    sourceLabel: 'ICC Hall of Fame: Brian Lara',
  },
  {
    id: 'cr047',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Tendulkar v Lara',
    difficulty: 'expert',
    question: "Whose 36-year-old record did Lara's 375 in 1994 break?",
    options: ["Garfield Sobers's", "Len Hutton's", "Hanif Mohammad's", "Don Bradman's"],
    correctIndex: 0,
    explanation:
      "Sobers's 365 not out had stood since 1958; Lara later became the only man to break the record twice.",
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-brian-lara',
    sourceLabel: 'ICC Hall of Fame: Brian Lara',
  },
  {
    id: 'cr048',
    domain: 'sports',
    region: 'India',
    topic: 'Cricket',
    subtopic: 'Tendulkar v Lara',
    difficulty: 'expert',
    question:
      "In which city did Tendulkar make the first men's ODI double century, against South Africa in February 2010?",
    options: ['Gwalior', 'Nagpur', 'Indore', 'Rajkot'],
    correctIndex: 0,
    explanation: 'He reached 200 with a single off Charl Langeveldt in the last over; India made 401 for 3.',
    sourceUrl: 'https://www.aljazeera.com/sports/2010/2/24/tendulkar-breaks-one-day-record',
    sourceLabel: 'Al Jazeera: Tendulkar breaks one-day record',
  },
  {
    id: 'cr049',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Tendulkar v Lara',
    difficulty: 'extreme',
    question: "Which Zimbabwean shared the ODI record of 194 that Tendulkar's 200 not out overtook?",
    options: ['Charles Coventry', 'Andy Flower', 'Grant Flower', 'Brendan Taylor'],
    correctIndex: 0,
    explanation:
      "Coventry had equalled Saeed Anwar's 1997 mark against Bangladesh in Bulawayo the previous August.",
    sourceUrl: 'https://www.aljazeera.com/sports/2010/2/24/tendulkar-breaks-one-day-record',
    sourceLabel: 'Al Jazeera: Tendulkar breaks one-day record',
  },

  // ----------------------------------------------------- Mankading and the Laws
  {
    id: 'cr050',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Mankading and the Laws',
    difficulty: 'expert',
    question:
      "Which Australian did Vinoo Mankad run out at the non-striker's end on 13 December 1947, giving the dismissal its name?",
    options: ['Sid Barnes', 'Arthur Morris', 'Lindsay Hassett', 'Bill Brown'],
    correctIndex: 3,
    explanation:
      'Don Bradman, the Australian captain, defended Mankad: the Laws say the non-striker must stay in his ground.',
    sourceUrl:
      'https://www.wionews.com/sports/1947-when-real-vinoo-mankad-mankaded-australian-batsman-bill-brown-205811',
    sourceLabel: "WION: 1947, when the real Vinoo Mankad 'mankaded' Bill Brown",
  },
  {
    id: 'cr051',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Mankading and the Laws',
    difficulty: 'expert',
    question:
      'Under the current Laws of Cricket, running out a non-striker who leaves early sits in which Law?',
    options: [
      'Law 38 (Run out)',
      'Law 41 (Unfair play)',
      "Law 42 (Players' conduct)",
      "Law 24 (Fielder's absence)",
    ],
    correctIndex: 0,
    explanation:
      "Law 38.3 makes the non-striker liable until the bowler's arm reaches the top of the delivery swing.",
    sourceUrl: 'https://www.lords.org/mcc/the-laws/run-out',
    sourceLabel: "Lord's / MCC: Law 38, Run out",
  },
  {
    id: 'cr052',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Mankading and the Laws',
    difficulty: 'extreme',
    question:
      "In MCC's 2022 Code, the non-striker run-out was moved into Law 38 from which Law, to strip it of stigma?",
    options: ['Law 41', 'Law 42', 'Law 40', 'Law 24'],
    correctIndex: 0,
    explanation: 'The same Code, in force from 1 October 2022, also banned saliva on the ball.',
    sourceUrl: 'https://www.lords.org/lords/news-stories/mcc-announces-new-code-of-laws-from-1-october-2022',
    sourceLabel: "Lord's: MCC's new code of Laws for 2022 come into force",
  },
  {
    id: 'cr053',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'Mankading and the Laws',
    difficulty: 'extreme',
    question:
      'How many runs did Vinoo Mankad and Pankaj Roy add for the first wicket against New Zealand at Chennai in 1956?',
    options: ['413', '387', '451', '359'],
    correctIndex: 0,
    explanation: 'Mankad made 231 in what was then a record opening stand in Tests.',
    sourceUrl: 'https://www.icc-cricket.com/hall-of-fame/hall-of-famers/hall-of-famer-vinoo-mankad',
    sourceLabel: 'ICC Hall of Fame: Vinoo Mankad',
  },

  // -------------------------------------------------------------------- DRS
  {
    id: 'cr054',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'DRS',
    difficulty: 'expert',
    question:
      'The Decision Review System was first trialled in 2008 in a Test series between which two teams?',
    options: [
      'India and Sri Lanka',
      'England and South Africa',
      'Australia and West Indies',
      'New Zealand and Pakistan',
    ],
    correctIndex: 0,
    explanation:
      "ODIs got DRS in 2011 and T20Is in 2017; an inconclusive review leaves the umpire's call standing.",
    sourceUrl: 'https://www.britannica.com/topic/What-is-DRS-in-cricket',
    sourceLabel: 'Britannica: What is DRS in cricket?',
  },

  // ---------------------------------------------------------- 2007 World T20
  {
    id: 'cr055',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2007 World T20',
    difficulty: 'simple',
    question: 'Whom did India beat by five runs in Johannesburg to win the inaugural World Twenty20 in 2007?',
    options: ['Pakistan', 'Australia', 'South Africa', 'Sri Lanka'],
    correctIndex: 0,
    explanation: "India defended 157 for 5; it was MS Dhoni's first title as captain.",
    sourceUrl:
      'https://gulfnews.com/sport/cricket/this-day-2007-when-dhoni--co-were-crowned-world-t20-champions-1.1569316147854',
    sourceLabel: 'Gulf News: This day, 2007, when Dhoni and Co were crowned World T20 champions',
  },
  {
    id: 'cr056',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2007 World T20',
    difficulty: 'simple',
    question:
      'Which England bowler did Yuvraj Singh hit for six sixes in an over at the 2007 World Twenty20?',
    options: ['Andrew Flintoff', 'Stuart Broad', 'James Anderson', 'Ryan Sidebottom'],
    correctIndex: 1,
    explanation: 'Yuvraj made 58 off 14 balls after a spat with Flintoff; India won by 18 runs.',
    sourceUrl: 'https://gulfnews.com/sport/cricket/yuvraj-singh-recalls-2007-six-sixes-1.1587910039270',
    sourceLabel: 'Gulf News: Yuvraj Singh recalls 2007 six sixes',
  },
  {
    id: 'cr057',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2007 World T20',
    difficulty: 'expert',
    question:
      'Who bowled the final over of the 2007 World Twenty20 final, in which Misbah-ul-Haq scooped to Sreesanth?',
    options: ['RP Singh', 'Harbhajan Singh', 'Joginder Sharma', 'Irfan Pathan'],
    correctIndex: 2,
    explanation: 'Joginder started with a wide and was hit for six, then held his nerve with a slower ball.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/this-day-2007-when-dhoni--co-were-crowned-world-t20-champions-1.1569316147854',
    sourceLabel: 'Gulf News: This day, 2007, when Dhoni and Co were crowned World T20 champions',
  },
  {
    id: 'cr058',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: '2007 World T20',
    difficulty: 'extreme',
    question:
      "After Joginder Sharma's wide and Misbah's hit over long-off, how many did Pakistan need from the last four balls of the 2007 final?",
    options: ['Four', 'Six', 'Nine', 'Thirteen'],
    correctIndex: 1,
    explanation: 'Pakistan had one wicket left; the scoop to short fine leg ended it.',
    sourceUrl:
      'https://gulfnews.com/sport/cricket/this-day-2007-when-dhoni--co-were-crowned-world-t20-champions-1.1569316147854',
    sourceLabel: 'Gulf News: This day, 2007, when Dhoni and Co were crowned World T20 champions',
  },

  // ----------------------------------------------------------- ODI classics
  {
    id: 'cr059',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'ODI classics',
    difficulty: 'expert',
    question:
      'Which South African batsman was run out to tie the 1999 World Cup semi-final at Edgbaston and send Australia through?',
    options: ['Lance Klusener', 'Allan Donald', 'Shaun Pollock', 'Mark Boucher'],
    correctIndex: 1,
    explanation:
      'Donald, the last man, dropped his bat; Australia advanced on their higher Super Six finish.',
    sourceUrl:
      'https://www.wisden.com/series/icc-mens-cricket-world-cup-2023-24/cricket-news/needed-therapy-to-get-over-it-allan-donald-reveals-how-infamous-1999-world-cup-run-out-led-to-long-lasting-trauma',
    sourceLabel: "Wisden: 'Needed therapy to get over it', Allan Donald on the 1999 World Cup run out",
  },
  {
    id: 'cr060',
    domain: 'sports',
    region: 'Global',
    topic: 'Cricket',
    subtopic: 'ODI classics',
    difficulty: 'extreme',
    question:
      "How many runs did Australia's Mick Lewis concede without a wicket in the 438 game at the Wanderers in 2006?",
    options: ['113', '106', '97', '120'],
    correctIndex: 0,
    explanation:
      'Nought for 113 from ten overs, the most expensive analysis in ODI history, as South Africa chased 434.',
    sourceUrl:
      'https://www.cricket.com.au/news/3305469/miracle-at-the-wanderers-an-oral-history-of-the-438-game',
    sourceLabel: "cricket.com.au: Miracle at the Wanderers, an oral history of 'The 438 Game'",
  },
]);
