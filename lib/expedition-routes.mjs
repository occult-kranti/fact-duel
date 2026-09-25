/**
 * lib/expedition-routes.mjs — the expedition route catalogue: data only.
 *
 * lib/expeditions.mjs imports `EXPEDITIONS` from here and owns every rule over it (validation, the
 * run reducer, scoring). The catalogue sits in its own module so an edition build can alias this one
 * file to a catalogue of its own (editions/hisaab/engine/expedition-routes.mjs derives its routes from
 * the civics bank) without forking the rules. A route is `{ id, topic, domain, title, subtitle, code,
 * stamp, chapters, version, key, ids }` with exactly six question ids; optional `topics` (an array)
 * lets a route mix topics — lib/expeditions.mjs `validExpeditionCards` then accepts any of them.
 * JHK's routes carry no `topics`, so for JHK every rule reads exactly as before.
 */
export const EXPEDITIONS = [
  {
    id: 'cricket',
    topic: 'Cricket',
    domain: 'sports',
    title: 'World Cup folklore',
    subtitle: 'India, 1983 and the innings you remember.',
    code: 'IND / 83',
    stamp: 'World Cup stories',
    start: 1,
    chapters: ['The headline', 'The innings', 'The fine print'],
  },
  {
    id: 'football',
    topic: 'Football',
    domain: 'sports',
    title: 'One night in Istanbul',
    subtitle: 'Six details from the 2005 Champions League final.',
    code: 'IST / 05',
    stamp: 'Istanbul 2005',
    start: 7,
    chapters: ['Set the scene', 'The comeback', 'The other side'],
  },
  {
    id: 'basketball',
    topic: 'Basketball',
    domain: 'sports',
    title: 'The Chicago files',
    subtitle: 'Jordan, Pippen and the details behind the legends.',
    code: 'CHI / 23',
    stamp: 'Chicago files',
    start: 13,
    chapters: ['The icon', 'Before the rings', 'Beyond the highlight'],
  },
  {
    id: 'gridiron',
    topic: 'American football',
    domain: 'sports',
    title: 'Green Bay deep cuts',
    subtitle: 'Championship history, from early titles to Super Bowls.',
    code: 'GB / NFL',
    stamp: 'Green Bay archive',
    start: 19,
    chapters: ['Big-game names', 'The stage', 'Old-school detail'],
  },
  {
    id: 'tennis',
    topic: 'Tennis',
    domain: 'sports',
    title: 'Advantage, Nadal',
    subtitle: 'Finals, firsts and the points that made the story.',
    code: 'ATP / RN',
    stamp: 'Nadal notebook',
    start: 25,
    chapters: ['The majors', 'The final set', 'Match-point detail'],
  },
  {
    id: 'space',
    topic: 'Space',
    domain: 'science',
    title: 'Beyond the blue',
    subtitle: 'From Apollo 11 to the Jupiter system.',
    code: 'SPACE / 01',
    stamp: 'Beyond the blue',
    start: 31,
    chapters: ['Look up', 'Meet the mission', 'Further out'],
  },
  {
    id: 'physics',
    topic: 'Physics',
    domain: 'science',
    title: 'Reality, unpacked',
    subtitle: 'Particles, forces and the constants underneath it all.',
    code: 'PHYS / 01',
    stamp: 'Reality notes',
    start: 37,
    chapters: ['The big picture', 'The messengers', 'The small print'],
  },
  {
    id: 'biology',
    topic: 'Biology',
    domain: 'science',
    title: 'Life at small scale',
    subtitle: 'DNA and the machinery inside a cell.',
    code: 'BIO / 01',
    stamp: 'Cell explorer',
    start: 43,
    chapters: ['Inside the cell', 'The information', 'Under the surface'],
  },
  {
    id: 'computing',
    topic: 'Computing',
    domain: 'science',
    title: 'The web & the code',
    subtitle: 'Web origins meet Python essentials.',
    code: 'CODE / 01',
    stamp: 'Code notebook',
    start: 49,
    chapters: ['Familiar names', 'How it works', 'Syntax & history'],
  },
].map((route) =>
  Object.freeze({
    ...route,
    version: 1,
    key: `${route.id}:1`,
    ids: Array.from({ length: 6 }, (_, i) => `q${String(route.start + i).padStart(3, '0')}`),
  }),
);
