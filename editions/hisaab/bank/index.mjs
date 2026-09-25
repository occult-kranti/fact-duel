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
});

export const BANK = Object.freeze(Object.values(LANES).flat());
