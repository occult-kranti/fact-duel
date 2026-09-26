// HISAAB DO — the bank registry. The ONLY place a lane is wired into the edition.
//
// `LANES` is name → frozen item array, exactly what schema.mjs `checkBank` takes; `BANK` is every
// lane flattened in registry order. The edition's duel service (editions/hisaab/server/bank.mjs), its
// expedition routes (editions/hisaab/engine/routes.mjs) and its daily picker all read `BANK`, so a lane
// registered here is playable everywhere at once, and tests/hisaab-bank.test.mjs checks it on the spot.
//
// Registering a lane (the lead does this as lanes land): import its one exported array and add it to
// LANES under the lane's file name, e.g. `schemes: HISAAB_SCHEMES`. Nothing else changes.
//
// `sample.mjs` was the engine lane's placeholder before the content lanes existed. It stays in the repo
// as a small, stable fixture but is not served: its facts overlap the schemes lane.
import { HISAAB_SCHEMES } from './schemes.mjs';
import { HISAAB_SPENDING } from './spending.mjs';
import { HISAAB_SCAMS } from './scams.mjs';
import { HISAAB_STATES_NORTH } from './states-north.mjs';
import { HISAAB_STATES_WEST_SOUTH } from './states-west-south.mjs';
import { HISAAB_STATES_EAST } from './states-east.mjs';
import { HISAAB_MEDIA } from './media.mjs';
import { HISAAB_ELECTIONS } from './elections.mjs';
import { HISAAB_FORWARDS } from './forwards.mjs';
// The money trail, 2000–2026 (charter §4a): transfers, relief funds, before-the-vote measures.
import { HISAAB_DIST_CENTRE } from './dist-centre.mjs';
import { HISAAB_DIST_NORTH } from './dist-north.mjs';
import { HISAAB_DIST_WEST_SOUTH } from './dist-west-south.mjs';
import { HISAAB_DIST_EAST } from './dist-east.mjs';
import { HISAAB_RELIEF_CENTRE } from './relief-centre.mjs';
import { HISAAB_RELIEF_STATES } from './relief-states.mjs';
import { HISAAB_POLL_UNION } from './poll-union.mjs';
import { HISAAB_POLL_STATES } from './poll-states.mjs';
import { HISAAB_GAPS_DIST } from './money-gaps-dist.mjs';
import { HISAAB_GAPS_RELIEF } from './money-gaps-relief.mjs';
import { HISAAB_GAPS_POLL } from './money-gaps-poll.mjs';

export const LANES = Object.freeze({
  schemes: HISAAB_SCHEMES,
  spending: HISAAB_SPENDING,
  scams: HISAAB_SCAMS,
  'states-north': HISAAB_STATES_NORTH,
  'states-west-south': HISAAB_STATES_WEST_SOUTH,
  'states-east': HISAAB_STATES_EAST,
  media: HISAAB_MEDIA,
  elections: HISAAB_ELECTIONS,
  forwards: HISAAB_FORWARDS,
  'dist-centre': HISAAB_DIST_CENTRE,
  'dist-north': HISAAB_DIST_NORTH,
  'dist-west-south': HISAAB_DIST_WEST_SOUTH,
  'dist-east': HISAAB_DIST_EAST,
  'relief-centre': HISAAB_RELIEF_CENTRE,
  'relief-states': HISAAB_RELIEF_STATES,
  'poll-union': HISAAB_POLL_UNION,
  'poll-states': HISAAB_POLL_STATES,
  'money-gaps-dist': HISAAB_GAPS_DIST,
  'money-gaps-relief': HISAAB_GAPS_RELIEF,
  'money-gaps-poll': HISAAB_GAPS_POLL,
});

export const BANK = Object.freeze(Object.values(LANES).flat());
