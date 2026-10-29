/** Earned practice stadiums. Trophies describe participation, not mastery or a human rank. */
export const TROPHY_RULES = Object.freeze({ attemptedRound: 4, correctAnswer: 2 });
export const STADIUM_LEVELS = Object.freeze([
  Object.freeze({
    id: 'gully', level: 1, name: 'Gully Ground', threshold: 0, mode: 'gauntlet', duration: 30,
    art: '/art/arena-gully.webp', label: 'The home innings', hindiLabel: 'अपनी पहली पारी',
    description: 'Five deliveries. A proper cricket duel. Find your rhythm and start your climb.',
    hindiDescription: 'पाँच सवाल की पारी। अपनी लय खोजें और आगे बढ़ें।',
    action: 'Play the home innings', hindiAction: 'अपनी पारी खेलें',
    perks: Object.freeze(['Standard innings', 'Quick single', 'Your starting ground']),
    hindiPerks: Object.freeze(['सामान्य पारी', 'एक सवाल का शॉट', 'आपका पहला मैदान']),
    color: 'gully',
  }),
  Object.freeze({
    id: 'riverside', level: 2, name: 'Riverside Park', threshold: 60, mode: 'chase', duration: 30,
    art: '/art/arena-riverside.webp', label: 'Chase the target', hindiLabel: 'लक्ष्य का पीछा करें',
    description: 'First to three correct answers wins. Up to five deliveries; reach the target together for a draw.',
    hindiDescription: 'पहले तीन सही जवाब देने वाला जीतेगा। अधिकतम पाँच सवाल; एक साथ लक्ष्य मिलने पर बराबरी।',
    action: 'Play the chase', hindiAction: 'चेज़ खेलें',
    perks: Object.freeze(['First-to-three chase', 'Correct answers count', 'Riverside setting']),
    hindiPerks: Object.freeze(['तीन सही जवाब का लक्ष्य', 'सही जवाब ही स्कोर', 'नदी किनारे का मैदान']),
    color: 'riverside',
  }),
  Object.freeze({
    id: 'crown', level: 3, name: 'Crown Lights', threshold: 180, mode: 'superover', duration: 15,
    art: '/art/arena-crown.webp', label: 'Own the super over', hindiLabel: 'सुपर ओवर आपका',
    description: 'Six deliveries, fifteen seconds each. Correct answers score six, four or two runs; the highest total wins.',
    hindiDescription: 'छह सवाल, हर सवाल पर पंद्रह सेकंड। सही जवाब पर छह, चार या दो रन; सबसे अधिक रन वाला जीतेगा।',
    action: 'Play the super over', hindiAction: 'सुपर ओवर खेलें',
    perks: Object.freeze(['Six / four / two runs', '15-second shot clock', 'Championship lights']),
    hindiPerks: Object.freeze(['छह / चार / दो रन', '15 सेकंड की घड़ी', 'चैंपियनशिप की रोशनी']),
    color: 'crown',
  }),
]);
const MAX_ROUNDS = 10_000_000;
const nat = (value) => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, MAX_ROUNDS) : 0;
export function stadiumById(id) { return STADIUM_LEVELS.find((stage) => stage.id === id) ?? null; }
export function stadiumForMode(mode) { return STADIUM_LEVELS.find((stage) => stage.mode === mode) ?? (['quick', 'trilogy'].includes(mode) ? STADIUM_LEVELS[0] : null); }

/** Existing profiles can prove historical correct answers, but not historical non-answer timeouts.
 * readProgression also seeds the new attemptedRounds counter conservatively before future writes.
 * No capped journal, clock, claimed local wallet or spendable points can alter these gates. */
export function clubTrophyProgress(profile) {
  const counters = profile?.progression?.counters ?? {};
  const rounds = nat(counters.rounds);
  const correctAnswers = Math.min(rounds, nat(counters.correct));
  const answeredRounds = Math.min(rounds, Math.max(correctAnswers, nat(counters.attemptedRounds)));
  return { trophies: answeredRounds * TROPHY_RULES.attemptedRound + correctAnswers * TROPHY_RULES.correctAnswer, answeredRounds, correctAnswers };
}
export function stadiumRoad(profile, humanTrophies = 0) {
  const practice = clubTrophyProgress(profile);
  const human = Number.isSafeInteger(humanTrophies) && humanTrophies > 0 ? Math.min(humanTrophies, 60_000_000) : 0;
  const progress = { ...practice, practiceTrophies: practice.trophies, humanTrophies: human, trophies: Math.max(practice.trophies, human), unlockSource: human > practice.trophies ? 'human' : 'practice' };
  const levels = STADIUM_LEVELS.map((stage) => ({ ...stage, unlocked: progress.trophies >= stage.threshold }));
  const current = [...levels].reverse().find((stage) => stage.unlocked) ?? levels[0];
  const next = levels.find((stage) => !stage.unlocked) ?? null;
  const remaining = next ? Math.max(0, next.threshold - progress.trophies) : 0;
  const span = next ? next.threshold - current.threshold : 1;
  const fraction = next ? Math.max(0, Math.min(1, (progress.trophies - current.threshold) / span)) : 1;
  return { ...progress, levels, current, next, remaining, fraction };
}
export function canPlayStadiumMode(profile, mode, humanTrophies = 0) {
  const stage = stadiumForMode(mode);
  return !!stage && stadiumRoad(profile, humanTrophies).trophies >= stage.threshold;
}
/** Corrupt, retired or reset-profile selections fall back to the highest currently earned ground. */
export function eligibleStadiumSelection(profile, id, humanTrophies = 0) {
  const road = stadiumRoad(profile, humanTrophies);
  const stage = road.levels.find((level) => level.id === id && level.unlocked);
  return stage ?? road.current;
}
