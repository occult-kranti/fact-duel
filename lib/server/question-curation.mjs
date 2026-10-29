/** Product editorial gate. Archives and already-earned facts remain intact. */
export const RETIRED_QUESTION_IDS = Object.freeze([
  'cr034', // How a tied Super Over is resolved under a regulation.
  'cr051', // Recall a Law number.
  'cr052', // Recall the previous Law number.
  'cr491', // Recall the introduction date of a substitution rule.
]);
const retired = new Set(RETIRED_QUESTION_IDS);
const fundamentals = [
  /how many (?:legal )?(?:balls|deliveries) (?:are (?:there )?)?(?:in|make|constitute) (?:an?|one) over/i,
  /how many players (?:are (?:there )?)?(?:in|on|make up) (?:an? |each )?(?:cricket )?(?:team|side)/i,
  /(?:length|long|wide|width) (?:is |of )?(?:a |the )?(?:cricket )?pitch/i,
  /how many (?:runs|points) (?:are |is )?(?:awarded|scored) (?:for|by) (?:a )?(?:six|four|boundary)/i,
  /how many stumps (?:are|make|form)/i,
  /what does (?:lbw|drs) stand for/i,
];

/** Explicit curation plus a narrow guard against newly imported Cricket 101 cards. */
export function questionPlayable(question) {
  if (!question || retired.has(question.id)) return false;
  if (question.topic !== 'Cricket') return true;
  if (['rules', 'basics', 'cricket basics', 'laws of cricket'].includes(String(question.subtopic).trim().toLowerCase())) return false;
  return !fundamentals.some((pattern) => pattern.test(String(question.question ?? question.prompt?.en ?? '')));
}

export const curatedQuestions = (questions) => (questions ?? []).filter(questionPlayable);
