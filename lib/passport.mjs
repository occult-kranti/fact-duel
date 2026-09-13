import { readJournal, recordRoom, EMPTY_JOURNAL, TOPIC_DOMAINS, DIFFICULTIES } from './journal.mjs';
import { readExpeditions, reduceExpeditions, expeditionById } from './expeditions.mjs';
import {
  emptyProgression,
  readProgression,
  deriveEvents,
  reduceProgression,
  reduceCosmetics,
} from './progression.mjs';
export { TOPIC_DOMAINS };
export const FACT_LIMIT = 1200;
const modes = ['quick', 'trilogy', 'gauntlet'];
const skins = ['classic', 'orbit', 'grid', 'rally'];
const text = (x) => typeof x === 'string' && x.length > 0 && x.length <= 100;
export function emptyProfile(epoch = 'initial', resetAt = 0) {
  return {
    version: 2,
    epoch,
    resetAt,
    revision: 0,
    issues: [],
    journeys: {},
    journal: readJournal(null),
    passport: { facts: {}, modes: [], openedAny: false, recalledAny: false, played: false, skin: 'classic' },
    progression: emptyProgression(),
  };
}
export function readProfile(value) {
  if (!value || value.version !== 2) return emptyProfile();
  const next = emptyProfile(
    text(value.epoch) ? value.epoch : 'initial',
    Number.isFinite(value.resetAt) ? value.resetAt : 0,
  );
  next.revision = Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision : 0;
  next.journeys = readExpeditions(value.journeys);
  next.issues = (Array.isArray(value.issues) ? value.issues : [])
    .filter(
      (i) =>
        i &&
        typeof i.id === 'string' &&
        i.id.length < 200 &&
        ['incorrect', 'ambiguous', 'source', 'other'].includes(i.reason) &&
        typeof i.note === 'string' &&
        i.note.length <= 800 &&
        Number.isFinite(i.at) &&
        readJournal(JSON.stringify({ version: 1, rounds: [i.fact] })).rounds.length === 1,
    )
    .slice(0, 50);
  next.journal = readJournal(JSON.stringify(value.journal));
  next.progression = readProgression(value.progression);
  const p = value.passport;
  if (p && typeof p === 'object') {
    for (const [id, f] of Object.entries(p.facts || {}).slice(0, FACT_LIMIT))
      if (
        /^[a-zA-Z0-9:_-]{1,80}$/.test(id) &&
        !['__proto__', 'constructor', 'prototype'].includes(id) &&
        f &&
        Object.hasOwn(TOPIC_DOMAINS, f.topic)
      )
        next.passport.facts[id] = {
          topic: f.topic,
          opened: f.opened === true,
          recalled: f.recalled === true,
        };
    next.passport.modes = [
      ...new Set((Array.isArray(p.modes) ? p.modes : []).filter((m) => modes.includes(m))),
    ];
    for (const k of ['openedAny', 'recalledAny', 'played']) next.passport[k] = p[k] === true;
    next.passport.skin = skins.includes(p.skin) ? p.skin : 'classic';
  }
  if (!passportSummary(next.passport).skins.includes(next.passport.skin)) next.passport.skin = 'classic';
  return next;
}
export function passportSummary(p) {
  const facts = Object.values(p.facts),
    opened = facts.filter((f) => f.opened).length,
    recalled = facts.filter((f) => f.recalled).length;
  const topics = [...new Set(facts.map((f) => f.topic))],
    domains = [...new Set(topics.map((t) => TOPIC_DOMAINS[t]))];
  const missions = [
    {
      id: 'first',
      name: 'First field notes',
      description: 'A complete little loop, at your pace.',
      reward: 'Orbit card finish',
      skin: 'orbit',
      steps: [
        {
          label: 'Finish a duel or try an untimed question',
          done: p.played || p.recalledAny,
          action: 'play',
        },
        { label: 'Open a fact explanation', done: p.openedAny, action: 'journal' },
        { label: 'Try an untimed question', done: p.recalledAny, action: 'recall' },
      ],
    },
    {
      id: 'notes',
      name: 'Field notes',
      description: 'Give a few facts a second look.',
      reward: 'Grid card finish',
      skin: 'grid',
      steps: [
        { label: 'Encounter 5 distinct facts', done: facts.length >= 5, action: 'play' },
        { label: 'Open 3 fact explanations', done: opened >= 3, action: 'journal' },
        { label: 'Try 3 distinct untimed questions', done: recalled >= 3, action: 'recall' },
      ],
    },
    {
      id: 'tour',
      name: 'The mode tour',
      description: 'Three ways to settle a friendly debate.',
      reward: 'Rally card finish',
      skin: 'rally',
      steps: modes.map((mode, i) => ({
        label: `Finish ${['Quick Draw', 'Triple Threat', 'The Gauntlet'][i]}`,
        done: p.modes.includes(mode),
        action: mode,
      })),
    },
  ];
  for (const m of missions) m.complete = m.steps.every((s) => s.done);
  const available = ['classic', ...missions.filter((m) => m.complete).map((m) => m.skin)];
  const points = facts.length * 10 + opened * 5 + recalled * 5;
  const tiers = [
    { at: 0, name: 'New arrival' },
    { at: 50, name: 'Curiosity scout' },
    { at: 150, name: 'Field explorer' },
    { at: 350, name: 'Fact collector' },
    { at: 650, name: 'Arcade voyager' },
  ];
  const tier = [...tiers].reverse().find((t) => points >= t.at) || tiers[0],
    next = tiers.find((t) => t.at > points);
  return {
    facts: facts.length,
    opened,
    recalled,
    topics,
    domains,
    points,
    tier,
    next,
    missions,
    skins: available,
    complete: missions.filter((m) => m.complete).length,
  };
}
// All writes pass through this pure reducer inside one read-write browser DB transaction.
export function reduceProfile(profile, action) {
  if (action.type !== 'reset' && action.epoch && action.epoch !== profile.epoch) return profile;
  if (action.type === 'reset')
    return { ...emptyProfile(action.newEpoch, action.at), revision: profile.revision + 1 };
  let next = applyAction(profile, action);
  // Progression runs exactly once per user action on the before/after diff, never on raw polling.
  const at = Number.isFinite(action.at) ? action.at : Date.now();
  const events = deriveEvents(profile, next, action);
  const base = next.progression || emptyProgression();
  const progression = reduceProgression(base, events, at, { epoch: profile.epoch, profile: next });
  if (progression !== next.progression) next = { ...next, progression };
  return next === profile ? profile : { ...next, revision: profile.revision + 1 };
}
function applyAction(profile, action) {
  if (action.type.startsWith('journey-')) {
    const before = profile.journeys || {},
      journeys = reduceExpeditions(before, action);
    if (journeys === before) return profile;
    let next = profile;
    if (action.type === 'journey-answer') {
      const run = journeys[expeditionById(action.routeId).key].run;
      next = applyPractice(profile, {
        at: action.at,
        fact: run.cards[action.index],
        choice: action.choice,
        roundId: `journey:${run.id}:${action.index}`,
      });
    }
    return { ...next, journeys };
  }
  if (action.type === 'practice') return applyPractice(profile, action);
  if (action.type === 'cosmetic-buy' || action.type === 'cosmetic-equip') {
    const progression = reduceCosmetics(profile.progression || emptyProgression(), action, action.at);
    return progression === profile.progression ? profile : { ...profile, progression };
  }
  let next = profile,
    p = profile.passport;
  if (action.type === 'room') {
    const room = action.room;
    if (!room) return profile;
    const journal = recordRoom(profile.journal, room, action.at);
    if (journal !== profile.journal) next = { ...next, journal };
    for (const fact of journal.rounds) {
      if (
        fact.matchId === room.id &&
        text(fact.factId) &&
        Object.hasOwn(TOPIC_DOMAINS, fact.topic) &&
        !Object.hasOwn(p.facts, fact.factId) &&
        Object.keys(p.facts).length < FACT_LIMIT
      )
        p = {
          ...p,
          facts: { ...p.facts, [fact.factId]: { topic: fact.topic, opened: false, recalled: false } },
        };
    }
    if (
      room.phase === 'complete' &&
      modes.includes(room.config?.mode) &&
      (!p.played || !p.modes.includes(room.config.mode))
    )
      p = { ...p, played: true, modes: [...new Set([...p.modes, room.config.mode])] };
  }
  if (['open', 'recall', 'save'].includes(action.type)) {
    // Only an existing revealed journal fact can generate review activity.
    const fact = profile.journal.rounds.find((f) =>
      action.roundId ? f.id === action.roundId : action.type === 'save' && f.question === action.question,
    );
    if (!fact) return profile;
    if (action.type === 'save') {
      const saved = profile.journal.saved.includes(fact.question)
        ? profile.journal.saved.filter((q) => q !== fact.question)
        : [fact.question, ...profile.journal.saved].slice(0, 200);
      next = { ...next, journal: { ...next.journal, saved } };
    } else {
      const field = action.type === 'open' ? 'opened' : 'recalled',
        global = action.type === 'open' ? 'openedAny' : 'recalledAny';
      const known = fact.factId && p.facts[fact.factId];
      if (!p[global] || (known && !known[field]))
        p = {
          ...p,
          [global]: true,
          ...(known ? { facts: { ...p.facts, [fact.factId]: { ...known, [field]: true } } } : {}),
        };
    }
  }
  if (action.type === 'report') {
    const fact = profile.journal.rounds.find((f) => f.id === action.roundId);
    if (
      !fact ||
      !['incorrect', 'ambiguous', 'source', 'other'].includes(action.reason) ||
      typeof action.note !== 'string' ||
      action.note.length > 800
    )
      return profile;
    const id = `issue:${fact.id}:${action.reason}`;
    const existing = (profile.issues || []).find((i) => i.id === id);
    if (existing && existing.note === action.note.trim()) return profile;
    next = {
      ...next,
      issues: [
        { id, fact: { ...fact }, reason: action.reason, note: action.note.trim(), at: action.at },
        ...(profile.issues || []).filter((i) => i.id !== id),
      ].slice(0, 50),
    };
  }
  if (action.type === 'skin' && passportSummary(p).skins.includes(action.skin) && p.skin !== action.skin)
    p = { ...p, skin: action.skin };
  if (p !== profile.passport) next = { ...next, passport: p };
  return next;
}
// One untimed attempt (Discovery card or expedition card): journals it once and marks the fact recalled.
// Shared by the practice action and the journey-answer branch so the progression hook runs once.
export function applyPractice(profile, action) {
  if (profile.journal.rounds.some((r) => r.id === action.roundId)) return profile;
  const f = action.fact;
  if (
    !f ||
    !Number.isInteger(action.choice) ||
    action.choice < 0 ||
    action.choice > 3 ||
    !Number.isInteger(f.correctIndex) ||
    !Object.hasOwn(TOPIC_DOMAINS, f.topic) ||
    !text(f.factId)
  )
    return profile;
  const entry = {
    id: action.roundId,
    matchId: 'practice',
    at: action.at,
    factId: f.factId,
    ...(DIFFICULTIES.includes(f.difficulty) ? { difficulty: f.difficulty } : {}),
    question: f.question,
    options: f.options,
    correctAnswer: f.options[f.correctIndex],
    explanation: f.explanation,
    topic: f.topic,
    subtopic: f.subtopic,
    sourceUrl: f.sourceUrl,
    sourceLabel: f.sourceLabel,
    correct: action.choice === f.correctIndex,
    elapsedMs: null,
    bot: false,
  };
  if (!readJournal(JSON.stringify({ version: 1, rounds: [entry] })).rounds.length) return profile;
  let next = {
    ...profile,
    journal: { ...profile.journal, rounds: [entry, ...profile.journal.rounds].slice(0, 200) },
  };
  let p = profile.passport;
  const prior = p.facts[f.factId];
  if ((prior || Object.keys(p.facts).length < FACT_LIMIT) && (!prior || !prior.recalled))
    p = {
      ...p,
      facts: { ...p.facts, [f.factId]: { topic: f.topic, opened: prior?.opened ?? false, recalled: true } },
    };
  if (!p.recalledAny) p = { ...p, recalledAny: true };
  if (p !== profile.passport) next = { ...next, passport: p };
  return next;
}
