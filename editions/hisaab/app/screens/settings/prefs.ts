/**
 * screens/settings/prefs.ts — the Settings screen's writes, wrapped locally.
 *
 * Effects "Off": lib/fx/prefs `setPref('motion', 'off')` stores 'full' (it only knows 'reduced' and
 * 'full'), although `getPrefs()` reads 'off' fine. Until the shared setter learns 'off', this writes the
 * value under the same storage name (STORAGE via PREF_STORAGE_KEYS — never a literal key) and tells the
 * prefs store the way another tab would, so every subscriber (the shell's data-effects, SceneHost, the
 * fx layer) sees it at once.
 *
 * Quiet everything (charter §7, bible §9 rule 6): sound, haptics and effects off, and every toast goes
 * to Activity. The toast switch lives in app/budget.ts and is not persisted yet: it needs a `toasts`
 * name in lib/storage-names.mjs (never a literal key, ENGINE §13) that createHisaabBudget reads on start
 * and setToastsOff writes — a foundation change this screen cannot make. Until it lands toasts come back
 * on the next visit (the other three are stored), and Settings SAYS so under the switches whenever
 * toasts are off (TOASTS_OFF_PERSISTS false), so the choice never undoes itself silently. When the
 * budget persists it, flip TOASTS_OFF_PERSISTS and the note goes.
 */
import { getPrefs, PREF_STORAGE_KEYS, setPref, type MotionPref } from '@/lib/fx/prefs';
import { budget } from '../../budget';

/** Whether app/budget.ts keeps "toasts off" across a reload (not yet: see the header). */
export const TOASTS_OFF_PERSISTS: boolean = false;

export function setEffects(motion: MotionPref) {
  if (motion !== 'off') {
    setPref('motion', motion);
    return;
  }
  try {
    localStorage.setItem(PREF_STORAGE_KEYS.motion, 'off');
  } catch {
    /* storage blocked: the setting lasts for this visit only */
  }
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: PREF_STORAGE_KEYS.motion }));
  } catch {
    /* very old browsers: the next pref change re-reads storage */
  }
}

type Before = { sound: boolean; haptics: boolean; motion: MotionPref; toastsOff: boolean };
/** What Quiet everything switched off, so switching it back restores the player's own choices. */
let before: Before | null = null;

export const isQuiet = (p: { sound: boolean; haptics: boolean; motion: MotionPref }, toastsOff: boolean) =>
  !p.sound && !p.haptics && p.motion === 'off' && toastsOff;

export function setQuietEverything(on: boolean) {
  const p = getPrefs();
  if (on) {
    before = { sound: p.sound, haptics: p.haptics, motion: p.motion, toastsOff: budget.getSnapshot().toastsOff };
    setPref('sound', false);
    setPref('haptics', false);
    setEffects('off');
    budget.setToastsOff(true);
    return;
  }
  const back = before ?? { sound: true, haptics: true, motion: 'full' as MotionPref, toastsOff: false };
  before = null;
  // If everything was already quiet before, "off" means the defaults.
  const restore = isQuiet(back, back.toastsOff) ? { sound: true, haptics: true, motion: 'full' as MotionPref, toastsOff: false } : back;
  setPref('sound', restore.sound);
  setPref('haptics', restore.haptics);
  setEffects(restore.motion);
  budget.setToastsOff(restore.toastsOff);
}
