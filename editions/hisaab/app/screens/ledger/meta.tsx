/**
 * screens/ledger/meta.tsx — display words for the ledger's modes and levels (names from edition.ts
 * MONEY_MODES) and their icons. A mode is always an icon + its name; it is never a colour on a row.
 */
import type { ReactNode } from 'react';
import { LifeBuoy, Vote, Wallet } from 'lucide-react';
import { MONEY_MODES } from '../../../edition';
import { stateName, stateNameHi } from '../../data';
import type { LedgerLevel, LedgerMode, LedgerRow } from './lib';

export type ModeMeta = Readonly<{ title: string; hi: string; gloss: string; icon: (size?: number) => ReactNode }>;

const ICONS: Readonly<Record<LedgerMode, (size?: number) => ReactNode>> = {
  distribution: (size = 18) => <Wallet size={size} strokeWidth={2.2} aria-hidden="true" />,
  relief: (size = 18) => <LifeBuoy size={size} strokeWidth={2.2} aria-hidden="true" />,
  'pre-election': (size = 18) => <Vote size={size} strokeWidth={2.2} aria-hidden="true" />,
};

export const MODE_META: Readonly<Record<LedgerMode, ModeMeta>> = Object.freeze(
  Object.fromEntries(
    MONEY_MODES.map((m) => [m.tag, { title: m.title, hi: m.titleDevanagari, gloss: m.gloss, icon: ICONS[m.tag as LedgerMode] }]),
  ) as Record<LedgerMode, ModeMeta>,
);

export const LEVEL_WORDS: Readonly<Record<LedgerLevel, { en: string; hi: string }>> = Object.freeze({
  Centre: { en: 'Centre', hi: 'केंद्र' },
  State: { en: 'State', hi: 'राज्य' },
});

/** A state code for a menu or a row: 'India-wide' for IN, else the state's name (Devanagari in Hindi). */
export function placeName(code: string, isHi: boolean): string {
  if (code === 'IN') return isHi ? 'पूरा देश' : 'India-wide';
  return isHi ? stateNameHi(code) : stateName(code);
}

/** "Centre · Uttar Pradesh" in the reader's language. */
export const placeLine = (row: Pick<LedgerRow, 'level' | 'state'>, isHi: boolean) =>
  `${isHi ? LEVEL_WORDS[row.level].hi : LEVEL_WORDS[row.level].en} · ${placeName(row.state, isHi)}`;
