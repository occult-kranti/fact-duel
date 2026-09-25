// Server-shaped, client-bundled. The edition's stand-in for lib/server/bank.mjs: vite.config.hisaab.ts
// aliases that module here, so the duel service, practice, expeditions and the catalogue all deal from
// the civics bank. Same three exports, same meaning:
//   ALL_QUESTIONS — every registered item (editions/hisaab/bank/index.mjs `BANK`)
//   QUESTIONS     — what the product serves, cut to the enabled domains (all of them: 'civics')
//   HIDDEN_COUNT  — how many the domain filter hid (0 unless a lane ships a non-civics item)
import { BANK } from '../bank/index.mjs';
import { enabledOnly } from '../engine/content.mjs';

export const ALL_QUESTIONS = BANK;

export const QUESTIONS = Object.freeze(enabledOnly(ALL_QUESTIONS));

export const HIDDEN_COUNT = ALL_QUESTIONS.length - QUESTIONS.length;
