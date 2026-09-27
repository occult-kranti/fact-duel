// Online duel events stay server-owned. Only these device missions have a learning path
// that can advance the existing local progression reducer in a configured live build.
const DESTINATIONS = Object.freeze({
  'answer-3': 'journeys',
  'correct-6': 'journeys',
  'expedition-cards-2': 'journeys',
  'expedition-finish-1': 'journeys',
  'bold-4': 'journeys',
  'open-2': 'journal',
  'save-2': 'journal',
  'review-5': 'journal',
  'discovery-1': 'discovery',
});

export const practiceMissionDestination = (template) => DESTINATIONS[template] ?? null;
export const visiblePracticeMissions = (items) => items.filter((item) => practiceMissionDestination(item.template));
