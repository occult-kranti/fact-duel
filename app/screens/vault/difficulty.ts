/** Difficulty → card finish. Unknown difficulty stays deliberately plain (never invent a tier). */
export type Finish = 'simple' | 'expert' | 'extreme' | 'plain';

export const finishOf = (difficulty?: string | null): Finish =>
  difficulty === 'simple' || difficulty === 'expert' || difficulty === 'extreme' ? difficulty : 'plain';

export const FINISH_LABEL: Record<Finish, string> = {
  simple: 'Simple',
  expert: 'Expert',
  extreme: 'Extreme',
  plain: '',
};
