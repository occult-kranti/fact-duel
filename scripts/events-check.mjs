/**
 * scripts/events-check.mjs — calendar health check, run this when you refresh the month.
 *
 * The calendar in lib/events-data.mjs is curated by hand and goes stale on its own: events finish,
 * "upcoming" becomes "past", and a month with nothing live has no limited modes to offer. This
 * reports what needs attention so the monthly refresh is a checklist, not a guess.
 *
 *   node scripts/events-check.mjs [YYYY-MM-DD]     # defaults to today
 *
 * Exits non-zero when the calendar needs work, so it can gate a release if you want it to.
 */
import { CALENDAR_ASOF } from '../lib/events-data.mjs';
import { readEvents, groupEvents, monthlyModes, activeModes, dayIndex, monthKey } from '../lib/events.mjs';

const arg = process.argv[2];
const at = arg ? Date.parse(`${arg}T12:00:00`) : Date.now();
if (!Number.isFinite(at)) {
  console.error(`Not a date: ${arg}`);
  process.exit(2);
}

const today = new Date(at);
const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const events = readEvents();
const group = groupEvents(at);
const modes = monthlyModes(at);
const open = activeModes(at);
const asOfAge = dayIndex(todayIso) - dayIndex(CALENDAR_ASOF);

const problems = [];
const notes = [];

notes.push(`Calendar: ${events.length} events, verified as of ${CALENDAR_ASOF} (${asOfAge} days ago).`);
notes.push(`On ${todayIso}: ${group.live.length} live, ${group.upcoming.length} upcoming, ${group.recent.length} recently finished.`);
notes.push(`${monthKey(at)}: ${modes.length} limited modes generated, ${open.length} open today.`);

if (asOfAge > 45) problems.push(`The calendar was last verified ${asOfAge} days ago. Re-check every date and refresh CALENDAR_ASOF.`);
if (!group.live.length) problems.push('Nothing is live. Add events that span today, or the Events screen leads with an empty section.');
if (!open.length) problems.push('No limited mode is open today. Home and Play will not surface Events at all.');
if (group.upcoming.length < 4) problems.push(`Only ${group.upcoming.length} upcoming events. Add more so the calendar keeps its horizon.`);

const ending = group.live.filter((e) => dayIndex(e.end) - dayIndex(todayIso) <= 7);
if (ending.length) notes.push(`Ending within a week: ${ending.map((e) => `${e.name} (${e.end})`).join(', ')}.`);

const topics = new Map();
for (const e of events) topics.set(e.topic, (topics.get(e.topic) ?? 0) + 1);
const thin = [...topics.entries()].filter(([, n]) => n < 3).map(([t, n]) => `${t} (${n})`);
if (thin.length) notes.push(`Thin topics, worth topping up: ${thin.join(', ')}.`);

for (const line of notes) console.log(`  ${line}`);
if (problems.length) {
  console.log('\nNeeds attention:');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\nCalendar is healthy.');
