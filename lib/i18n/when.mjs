/**
 * lib/i18n/when.mjs — the calendar's whole-day lines, as keys.
 *
 * lib/fixtures.mjs `countdownCopy` and app/screens/events/util.ts `whenLabel` print English day
 * lines ("Starts in 3 days", "Ends tomorrow", "2 weeks ago"). Those modules are tested on their
 * English output, so rather than change them this parser turns the line back into a dictionary
 * key and a count, which the hook then renders in the current locale. Unknown text → null, and
 * the caller prints it as it came.
 */

const FORMS = [
  [/^Starts tomorrow$/, 'when.startsTomorrow'],
  [/^Starts today$/, 'when.startsToday'],
  [/^Starts in (\d+) days?$/, 'when.startsIn'],
  [/^On now$/, 'when.onNow'],
  [/^Ended yesterday$/, 'when.endedYesterday'],
  [/^Ended (\d+) days? ago$/, 'when.endedAgo'],
  [/^Ends today$/, 'when.endsToday'],
  [/^Ends tomorrow$/, 'when.endsTomorrow'],
  [/^Ends in (\d+) days?$/, 'when.endsIn'],
  [/^Tomorrow$/, 'when.tomorrow'],
  [/^In (\d+) days?$/, 'when.inDays'],
  [/^In (\d+) weeks?$/, 'when.inWeeks'],
  [/^Just finished$/, 'when.justFinished'],
  [/^Yesterday$/, 'when.yesterday'],
  [/^(\d+) days? ago$/, 'when.daysAgo'],
  [/^(\d+) weeks? ago$/, 'when.weeksAgo'],
];

/** `{ key, count }` for a known English day line, else null. `count` is null for the fixed lines. */
export function whenKey(copy) {
  if (typeof copy !== 'string') return null;
  for (const [re, key] of FORMS) {
    const m = re.exec(copy);
    if (m) return { key, count: m[1] === undefined ? null : Number(m[1]) };
  }
  return null;
}

/** The line in the current locale: a plural key when it carries a count, a plain key otherwise. */
export function localizeWhen(copy, t, n) {
  const parsed = whenKey(copy);
  if (!parsed) return copy;
  return parsed.count === null ? t(parsed.key) : n(parsed.key, parsed.count);
}
