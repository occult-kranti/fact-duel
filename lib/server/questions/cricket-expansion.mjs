// Server-only, original wording. Primary reports inspected 2026-10-29.
// Difficulty is editorial, not an empirical timing or accuracy estimate.
export const CRICKET_EXPANSION_SOURCES = Object.freeze({
  firstCup: { publisher: 'ICC', date: '2017-01-18', title: "ICC Women's World Cup History", url: 'https://www.icc-cricket.com/news/icc-womens-world-cup-history', locator: '1973 opening section; leading runs and wickets' },
  cupHistory: { publisher: 'ICC', date: '2025-09-09', title: 'From 1973–2025: A historic look at the Women’s World Cup', url: 'https://www.icc-cricket.com/tournaments/womens-cricket-worldcup-2025/news/from-1973-2025-an-historic-look-at-the-women-s-world-cup', locator: '1978, 2000 and 2009 sections' },
  windies16: { publisher: 'ICC', date: '2016-04-03', title: 'Taylor, Matthews take West Indies Women to maiden World T20 title', url: 'https://www.icc-cricket.com/news/taylor-matthews-take-west-indies-women-to-maiden-world-t20-title', locator: 'Opening paragraphs and chase report' },
  australia20: { publisher: 'ICC', date: '2020-03-08', title: 'Australia lift fifth T20 World Cup title', url: 'https://www.icc-cricket.com/news/australia-lift-fifth-t20-world-cup-title', locator: 'Opening partnership, Mooney innings and Schutt bowling' },
  australia22: { publisher: 'ICC', date: '2022-04-03', title: 'Australia win ICC Women’s Cricket World Cup 2022', url: 'https://www.icc-cricket.com/media-releases/australia-win-icc-womens-cricket-world-cup-2022-with-special-victory-over-england', locator: 'Healy innings, opening partnership and scores in brief' },
  nz24: { publisher: 'New Zealand Cricket', date: '2024-10-20', title: "New Zealand's first T20 World Cup win!", url: 'https://www.nzc.nz/match-reports/archive/new-zealands-first-t20-world-cup-win/', locator: 'Match report and scores in brief' },
  ipl19: { publisher: 'IPL', date: '2019-05-12', title: 'Match Report: FINAL – MI vs CSK', url: 'https://www.iplt20.com/news/article/match-report-final-mi-vs-csk', locator: 'Brief scores and Deepak Chahar bowling paragraph' },
  men07: { publisher: 'ICC', date: '2019-03-09', title: "Men's Cricket World Cup 2007 – Overview", url: 'https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-2007-overview', locator: 'Semi-finals, final, top wicket-taker' },
  men99: { publisher: 'ICC', date: '2019-03-11', title: "Men's Cricket World Cup 1999 – Overview", url: 'https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1999-overview', locator: 'Semi-finals and player of the series' },
  men03: { publisher: 'ICC', date: '2019-03-11', title: "Men's Cricket World Cup 2003 – Overview", url: 'https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-2003-overview', locator: 'Semi-final and final paragraphs' },
  men15: { publisher: 'ICC', date: '2018-03-29', title: 'On this day: Australia win ICC CWC 2015', url: 'https://www.icc-cricket.com/tournaments/cricketworldcup/news/on-this-day-australia-win-icc-cwc-2015', locator: 'Clarke, Elliott and Player of the Match paragraphs' },
  wtc21: { publisher: 'ICC', date: '2021-06-23', title: 'New Zealand crowned World Test Champions after thrilling final day', url: 'https://www.icc-cricket.com/news/new-zealand-crowned-world-test-champions-after-thrilling-final-day', locator: 'Opening chase summary and Watling final Test' },
  afghanistan24: { publisher: 'ICC', date: '2024-06-23', title: 'Afghanistan seals first-ever win over Australia', url: 'https://www.icc-cricket.com/news/live-aussies-send-in-afghanistan-in-crucial-super-eight-clash-in-st-vincent', locator: 'Result, Maxwell dismissal and Gulbadin wickets' },
  usa24: { publisher: 'ICC', date: '2024-06-06', title: 'USA stun Pakistan in dramatic Super Over', url: 'https://www.icc-cricket.com/news/live-pakistan-open-t20-world-cup-campaign-against-hosts-usa-in-dallas', locator: 'Super Over total, final-ball boundary and bowling summary' },
  dutch23: { publisher: 'ICC', date: '2023-10-17', title: 'Dutch Delight: Netherlands register famous victory against South Africa', url: 'https://www.icc-cricket.com/tournaments/cricketworldcup/news/dutch-delight-netherlands-register-famous-victory-against-south-africa', locator: 'Opening result and innings summary' },
  pioneers: { publisher: 'ICC', date: '2023-07-28', title: "The World Cup that pioneered Women's cricket", url: 'https://www.icc-cricket.com/media-releases/the-world-cup-that-pioneered-womens-cricket', locator: 'Individual milestones paragraph; only Wilson, Hunter and Kerr claims used' },
});

// Each row gives [stem, correct answer, three distractors, original explanation].
// Authored correct slots rotate; the serving engine still shuffles options per deal.
const groups = [
  ['firstCup', "Women's World Cup 1973", 'Global', [
    ['Which team lifted the inaugural Women’s Cricket World Cup in 1973?', 'England', 'Australia', 'New Zealand', 'West Indies', 'England finished top of the round-robin table to become the first cricket World Cup winners.'],
    ['Who led the run-scoring at the 1973 Women’s World Cup with 264 runs?', 'Enid Bakewell', 'Rachael Heyhoe Flint', 'Lynne Thomas', 'Margaret Jennings', 'Bakewell topped the batting list across six matches in the inaugural tournament.'],
    ['Which Young England bowler took a tournament-leading 12 wickets at the 1973 Women’s World Cup?', 'Rosalind Heggs', 'Sharon Tredrea', 'Lyn Fullston', 'Sharyn Hill', 'Heggs led the wicket tally while representing Young England, a separate entrant in that edition.'],
  ]],
  ['cupHistory', "Women's World Cup history", 'Global', [
    ['Who held off Australia by four runs to win the 2000 Women’s World Cup final?', 'New Zealand', 'England', 'India', 'South Africa', 'The White Ferns won a close final at home, overcoming Belinda Clark’s innings of 91.'],
    ['Which bowler took 4 for 34 for England in the 2009 Women’s World Cup final?', 'Nicki Shaw', 'Katherine Brunt', 'Jenny Gunn', 'Laura Marsh', 'Shaw’s four wickets helped England beat New Zealand by four wickets in the final.'],
    ['Which Hyderabad ground hosted the decisive Australia–England match at the 1978 Women’s World Cup?', 'Lal Bahadur Shastri Stadium', 'Rajiv Gandhi International Stadium', 'Gymkhana Ground', 'Nehru Stadium', 'The last match of the tournament was played at Lal Bahadur Shastri Stadium.'],
  ]],
  ['windies16', "Women's T20 World Cup 2016", 'Global', [
    ['Who struck 66 from 45 balls to power West Indies’ chase in the 2016 Women’s World T20 final?', 'Hayley Matthews', 'Deandra Dottin', 'Britney Cooper', 'Stafanie Taylor', 'Matthews gave the chase its momentum with six fours and three sixes.'],
    ['Which West Indies captain scored 59 in the 2016 Women’s World T20 final?', 'Stafanie Taylor', 'Merissa Aguilleira', 'Anisa Mohammed', 'Deandra Dottin', 'Taylor anchored the successful chase against Australia before falling late in the innings.'],
    ['How many balls remained when West Indies completed the chase in the 2016 Women’s World T20 final?', '3', '1', '6', '9', 'West Indies reached their target with eight wickets and three deliveries remaining.'],
  ]],
  ['australia20', "Women's T20 World Cup 2020", 'Global', [
    ['Who finished unbeaten on 78 for Australia in the 2020 Women’s T20 World Cup final?', 'Beth Mooney', 'Meg Lanning', 'Alyssa Healy', 'Rachael Haynes', 'Mooney batted through Australia’s innings as they built a winning total at the MCG.'],
    ['Which Australian seamer took four wickets in the 2020 Women’s T20 World Cup final?', 'Megan Schutt', 'Ellyse Perry', 'Delissa Kimmince', 'Nicola Carey', 'Schutt led the attack as India were dismissed for 99.'],
    ['How many runs did Australia’s opening pair add in the 2020 Women’s T20 World Cup final?', '115', '96', '128', '147', 'The opening stand ended when Radha Yadav dismissed Healy, giving Australia a commanding platform.'],
  ]],
  ['australia22', "Women's World Cup 2022", 'Global', [
    ['Who made 170 for Australia in the 2022 Women’s World Cup final?', 'Alyssa Healy', 'Beth Mooney', 'Rachael Haynes', 'Meg Lanning', 'Healy’s 138-ball innings drove Australia to 356 for five against England.'],
    ['Which ground hosted the 2022 Women’s World Cup final?', 'Hagley Oval', 'Basin Reserve', 'Eden Park', 'Bay Oval', 'Australia and England contested the final at Hagley Oval in Christchurch.'],
    ['How many runs did Healy and Haynes add for Australia’s first wicket in the 2022 Women’s World Cup final?', '160', '138', '175', '191', 'Their partnership ended when Sophie Ecclestone dismissed Haynes for 68.'],
  ]],
  ['nz24', "Women's T20 World Cup 2024", 'Global', [
    ['Who top-scored for New Zealand with 43 in the 2024 Women’s T20 World Cup final?', 'Amelia Kerr', 'Sophie Devine', 'Suzie Bates', 'Georgia Plimmer', 'Kerr led New Zealand’s scoring in their title-winning innings against South Africa.'],
    ['Who contributed 38 from 28 balls for New Zealand in the 2024 Women’s T20 World Cup final?', 'Brooke Halliday', 'Maddy Green', 'Georgia Plimmer', 'Sophie Devine', 'Halliday helped lift the innings through the middle overs before Chloe Tryon dismissed her.'],
    ['Which New Zealand seamer finished with 3 for 25 in the 2024 Women’s T20 World Cup final?', 'Rosemary Mair', 'Lea Tahuhu', 'Hannah Rowe', 'Jess Kerr', 'Mair took three wickets, including two in the penultimate over of South Africa’s chase.'],
  ]],
  ['ipl19', 'IPL final 2019', 'India', [
    ['Who top-scored for Chennai Super Kings with 80 in the 2019 IPL final?', 'Shane Watson', 'Faf du Plessis', 'Suresh Raina', 'MS Dhoni', 'Watson kept Chennai in the chase before being run out with two balls remaining.'],
    ['Who finished unbeaten on 41 to lead Mumbai Indians’ scoring in the 2019 IPL final?', 'Kieron Pollard', 'Hardik Pandya', 'Quinton de Kock', 'Suryakumar Yadav', 'Pollard’s late hitting helped Mumbai reach 149 for eight.'],
    ['Which Chennai bowler took 3 for 26 in the 2019 IPL final?', 'Deepak Chahar', 'Shardul Thakur', 'Imran Tahir', 'Harbhajan Singh', 'Chahar recovered from an expensive start to finish with Chennai’s best wicket tally.'],
  ]],
  ['men07', "Men's World Cup 2007", 'Global', [
    ['What unusual object did Adam Gilchrist keep inside his batting glove during the 2007 World Cup final?', 'A squash ball', 'A cork stopper', 'A golf ball', 'A rubber eraser', 'Gilchrist used the squash ball to support his grip during his innings of 149.'],
    ['Who led the wickets list at the 2007 men’s World Cup with 26?', 'Glenn McGrath', 'Muttiah Muralitharan', 'Shaun Tait', 'Lasith Malinga', 'McGrath also received the player-of-the-series award in his final World Cup.'],
    ['Which Sri Lankan captain scored 115 in the 2007 World Cup semi-final against New Zealand?', 'Mahela Jayawardena', 'Kumar Sangakkara', 'Sanath Jayasuriya', 'Tillakaratne Dilshan', 'Jayawardena’s 109-ball innings helped Sri Lanka reach 289 for five.'],
  ]],
  ['men99', "Men's World Cup 1999", 'Global', [
    ['Who was named player of the series at the 1999 men’s World Cup?', 'Lance Klusener', 'Shane Warne', 'Steve Waugh', 'Rahul Dravid', 'Klusener earned the tournament award despite South Africa’s tied semi-final ending their campaign.'],
    ['What were Shane Warne’s bowling figures in the tied 1999 World Cup semi-final?', '4 for 29', '4 for 33', '3 for 27', '5 for 36', 'Warne took four wickets for 29 against South Africa; his four for 33 came in the final.'],
    ['Who made an unbeaten 133 for Pakistan in the 1999 World Cup semi-final against New Zealand?', 'Saeed Anwar', 'Saeed Ahmed', 'Ijaz Ahmed', 'Inzamam-ul-Haq', 'Anwar’s century guided Pakistan to a nine-wicket win and a place in the final.'],
  ]],
  ['men03', "Men's World Cup 2003", 'Global', [
    ['Who finished unbeaten on 88 alongside Ricky Ponting in the 2003 World Cup final?', 'Damien Martyn', 'Michael Bevan', 'Andrew Symonds', 'Darren Lehmann', 'Martyn stayed with Ponting until the end as Australia built a huge final total.'],
    ['How many runs did Ponting and Martyn add in their unbroken stand in the 2003 World Cup final?', '234', '189', '212', '258', 'The third-wicket partnership took Australia from two wickets down to 359 for two.'],
    ['Who rescued Australia with an unbeaten 91 in the 2003 World Cup semi-final against Sri Lanka?', 'Andrew Symonds', 'Michael Bevan', 'Damien Martyn', 'Darren Lehmann', 'Symonds anchored Australia’s 212 for seven before rain affected Sri Lanka’s chase.'],
  ]],
  ['men15', "Men's World Cup 2015", 'Global', [
    ['Which bowler was player of the match in the 2015 men’s World Cup final?', 'James Faulkner', 'Mitchell Starc', 'Mitchell Johnson', 'Josh Hazlewood', 'Faulkner’s three wickets included Ross Taylor, Corey Anderson and Grant Elliott.'],
    ['Who top-scored for New Zealand with 83 in the 2015 World Cup final?', 'Grant Elliott', 'Ross Taylor', 'Kane Williamson', 'Martin Guptill', 'Elliott supplied the largest contribution in New Zealand’s innings of 183.'],
    ['How many runs did Michael Clarke score in the 2015 World Cup final, his last ODI?', '74', '62', '81', '93', 'Clarke’s 72-ball innings led Australia’s successful chase at the MCG.'],
  ]],
  ['wtc21', 'World Test Championship 2021', 'Global', [
    ['Who hit the winning runs for New Zealand in the 2021 World Test Championship final?', 'Ross Taylor', 'Kane Williamson', 'Tom Latham', 'Devon Conway', 'Taylor struck the decisive boundary to complete New Zealand’s chase.'],
    ['Which New Zealand wicketkeeper played his final Test in the 2021 World Test Championship final?', 'BJ Watling', 'Luke Ronchi', 'Tom Blundell', 'Brendon McCullum', 'Watling ended his Test career in the victory at Southampton.'],
    ['How many runs did Williamson and Taylor add in their unbroken stand to win the 2021 WTC final?', '96', '82', '104', '118', 'Their partnership carried New Zealand from 44 for two to the winning target.'],
  ]],
  ['afghanistan24', "Men's T20 World Cup 2024 upsets", 'Global', [
    ['Who took four wickets in Afghanistan’s first victory over Australia at the 2024 T20 World Cup?', 'Gulbadin Naib', 'Rashid Khan', 'Fazalhaq Farooqi', 'Mohammad Nabi', 'Gulbadin’s wickets helped Afghanistan defend their total in the Super Eight match.'],
    ['Who caught Glenn Maxwell off Gulbadin Naib in Afghanistan’s 2024 T20 World Cup win over Australia?', 'Noor Ahmad', 'Rashid Khan', 'Ibrahim Zadran', 'Azmatullah Omarzai', 'Noor held the chance behind point to end Maxwell’s dangerous innings.'],
    ['By how many runs did Afghanistan beat Australia in their 2024 T20 World Cup Super Eight match?', '21', '17', '24', '32', 'Australia were dismissed for 127 as Afghanistan secured their first win over them.'],
  ]],
  ['usa24', "USA at the 2024 T20 World Cup", 'US', [
    ['Who hit the last-ball boundary that forced a Super Over in USA’s 2024 T20 World Cup match against Pakistan?', 'Nitish Kumar', 'Aaron Jones', 'Monank Patel', 'Andries Gous', 'Kumar’s four levelled the scores and gave USA another chance to win.'],
    ['How many runs did USA score in their Super Over against Pakistan at the 2024 T20 World Cup?', '18', '15', '21', '24', 'USA reached 18 with help from wides and overthrows during Mohammad Amir’s over.'],
    ['Which USA spinner took 3 for 30 in Pakistan’s regular innings in their 2024 T20 World Cup meeting?', 'Nosthush Kenjige', 'Harmeet Singh', 'Steven Taylor', 'Nisarg Patel', 'Kenjige’s three wickets helped USA limit Pakistan to 159 for seven.'],
  ]],
  ['dutch23', 'Netherlands at the 2023 World Cup', 'Europe', [
    ['Which Netherlands captain made an unbeaten 78 in the 2023 World Cup upset of South Africa?', 'Scott Edwards', 'Peter Borren', 'Pieter Seelaar', 'Ryan ten Doeschate', 'Edwards led the late recovery that gave the Netherlands a defendable total.'],
    ['Who hit 23 from nine balls at No. 10 for the Netherlands against South Africa at the 2023 World Cup?', 'Aryan Dutt', 'Paul van Meekeren', 'Logan van Beek', 'Roelof van der Merwe', 'Dutt’s late burst helped the Netherlands reach 245 for eight.'],
    ['Rain reduced the Netherlands–South Africa match at the 2023 World Cup to how many overs per side?', '43', '40', '45', '47', 'A delayed start at Dharamsala shortened each scheduled innings to 43 overs.'],
  ]],
  ['pioneers', "Women's cricket pioneers", 'Global', [
    ['Which Ireland batter celebrated her 16th birthday with an ODI century in 2021?', 'Amy Hunter', 'Gaby Lewis', 'Orla Prendergast', 'Laura Delany', 'Hunter’s hundred against Zimbabwe established a new youngest-ODI-centurion mark at the time.'],
    ['Which New Zealand player combined an ODI double century and a five-wicket haul in one match in 2018?', 'Amelia Kerr', 'Sophie Devine', 'Suzie Bates', 'Amy Satterthwaite', 'Kerr achieved the batting-and-bowling double at the age of 17.'],
    ['Who became the first cricketer to score a century and take ten wickets in the same Test?', 'Betty Wilson', 'Keith Miller', 'Vinoo Mankad', 'Enid Bakewell', 'Wilson combined the batting and bowling milestones in a Test for Australia.'],
  ]],
];

export const CRICKET_EXPANSION = Object.freeze(groups.flatMap(([sourceId, subtopic, region, rows], groupIndex) => rows.map((row, levelIndex) => {
  const index = groupIndex * 3 + levelIndex;
  const source = CRICKET_EXPANSION_SOURCES[sourceId];
  const [question, correct, ...tail] = row;
  const explanation = tail.pop();
  const correctIndex = index % 4;
  const options = [...tail];
  options.splice(correctIndex, 0, correct);
  return Object.freeze({ id: `cr${624 + index}`, domain: 'sports', region, topic: 'Cricket', subtopic,
    difficulty: ['simple', 'expert', 'extreme'][levelIndex], question, options: Object.freeze(options), correctIndex,
    explanation, sourceUrl: source.url, sourceLabel: `${source.publisher}: ${source.title}` });
})));
