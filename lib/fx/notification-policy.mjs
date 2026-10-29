/** Cricket-first feedback: scores and rewards stay in the scorecard, not overlays.
 * A deliberate operation (connection status, copy result, error) may still report through an
 * info toast. The `roundFeedback` guard also covers progression that was styled as info.
 */
export function allowToastOverlay(input, { rewardOverlays = false } = {}) {
  if (!input || typeof input !== 'object') return false;
  return rewardOverlays || (input.kind === 'info' && input.roundFeedback !== true);
}

/** Celebration dialogs are opt-in in playgrounds; the game itself does not open them. */
export function allowCeremonyOverlay({ rewardOverlays = false } = {}) {
  return rewardOverlays;
}
