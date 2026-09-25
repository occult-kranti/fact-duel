/**
 * editions/hisaab/engine/events-data.mjs — the edition's stand-in for lib/events-data.mjs.
 *
 * JHK's event calendar is sports and science fixtures; none of it belongs in this edition, and its
 * topics are not civics topics (lib/events.mjs would drop every entry anyway). Aliasing the data
 * module to an empty calendar keeps 43 KB of sports fixtures out of the edition bundle while every
 * shared importer (lib/events.mjs, lib/fixtures.mjs, the duel service's `fixture` action) keeps
 * working and simply finds nothing open.
 */
export const CALENDAR_ASOF = '2026-09-25';

export const EVENTS = Object.freeze([]);
