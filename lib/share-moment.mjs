/** Public result data only. Never include room URLs, recovery codes, email or session IDs. */
export const JHK_SHARE_URL = 'https://occult-kranti.github.io/fact-duel/';
const clean = (value, fallback, length = 48) => typeof value === 'string' && value.trim() ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, length) : fallback;
const score = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000) : 0;
export function shareMoment(input = {}) {
  const rounds = Number.isSafeInteger(input.rounds) && input.rounds > 0 && input.rounds <= 100 ? input.rounds : 3;
  const correct = Math.min(rounds, score(input.correct));
  const mode = input.mode === 'superover' ? 'Superover' : input.mode === 'chase' ? 'The Chase' : input.mode === 'quick' ? 'Quick single' : (input.mode === 'trilogy' || input.mode === 'mini' || !input.mode) && rounds === 3 ? 'Mini over' : (input.mode === 'gauntlet' || input.mode === 'full' || !input.mode) && rounds === 6 ? 'Full over' : 'Cricket duel';
  const rival = input.human ? 'Human duel' : 'Practice bot';
  const title = clean(input.title, 'Gully Starter');
  const nickname = clean(input.nickname, 'Cricket fan', 24);
  const xp = score(input.xp);
  const headline = correct === rounds ? 'Perfect answers.' : correct > 0 ? 'That was my over.' : 'One over wiser.';
  return { nickname, title, rounds, correct, xp, mode, rival, headline, url: JHK_SHARE_URL,
    text: `Jaanta Hai Kya · ${mode}\n${nickname} · ${title}\n${correct}/${rounds} correct · +${xp} XP · ${rival}\nCan you beat this over?\n${JHK_SHARE_URL}` };
}
