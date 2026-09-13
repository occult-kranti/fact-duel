# The events calendar and limited-time modes — how to keep it current

FACT//DUEL ships a curated calendar of real sports and science events. Each month the app derives up
to four limited-time modes from it. The calendar is **static data in the repository**: there is no
feed, no scores service and no results API anywhere in the app, and every surface says so.

## What the player sees

- **Events** lists what is on now, this month's limited modes, what is coming up, and what recently
  finished. Every entry links to the source a human checked it against.
- A **limited mode** pairs one event with one of eight templates (`MODE_TEMPLATES` in
  `lib/events.mjs`) — for example *Final whistle* (Quick Draw, 10s) while a tournament is on, or
  *Replay* (The Gauntlet) once it has finished. Arming a mode sets up that exact duel.
- Clearing a mode pays a one-off XP bonus (`XP.eventMode` × the template multiplier) and mints its
  badge the first time only. Replaying is welcome; it simply never pays the bonus twice.
- Home carries a two-line strip and Play carries a row of open modes. Neither exists when nothing is
  open, which is exactly why the monthly refresh matters.

## How the rotation works

`monthlyModes(at)` is deterministic for a given month and dataset: it seeds a PRNG from the month key
and the event count, ranks candidates (live first, then soonest upcoming, then most recent past) and
pairs each with a template matching its timing and domain. **Nothing needs to be scheduled or
deployed for a new month to appear** — the month changes, the modes change. What needs human work is
keeping the underlying events true.

## The monthly refresh, in order

1. `node scripts/events-check.mjs` — reports the calendar's age, what is live, how many modes are
   open, thin topics, and events ending within a week. It exits non-zero when the calendar needs work.
2. Retire what has finished long ago and add the next two to three months of events. Keep roughly
   even coverage across the nine question topics; the check reports thin ones.
3. For every new or changed entry: confirm the dates **and** any result against a primary or
   reference source, and put that URL in `sourceUrl`. An entry whose result you cannot confirm gets
   no result — a blurb may describe what is at stake instead.
4. Only use the nine topics in `TOPIC_DOMAINS` (`lib/journal.mjs`). An event whose sport has no
   matching topic does not belong in the calendar: arming it would launch an unrelated duel. Two
   events were dropped at launch for exactly this reason.
5. Update `CALENDAR_ASOF` to the day you finished checking. This is the date the app shows the player.
6. `node --test tests/*.test.mjs` and `node scripts/events-check.mjs` again; both must pass.

## Rules that must not drift

- Never state a result the source does not confirm, and never imply live data.
- Keep entries short: the sanitiser clamps the name at 80 characters and prose at 160, and a truncated
  sentence reads worse than a written one.
- `readEvents` silently drops malformed entries, so a mistake shows up as a missing card rather than a
  crash. Run the check after editing rather than trusting the screen.
- The bonus is deliberately small and flat. Limited modes are there to point players at something
  real that is happening, not to become the most efficient way to earn XP.
