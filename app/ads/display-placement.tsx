'use client';
import './display-placement.css';

export type DisplayPlacementName = 'home-footer' | 'learn-footer' | 'results-footer';

/** Layout preview only. This component deliberately has no advertising SDK or network code.
 * No DOM or reserved space exists unless a developer explicitly opts into a nonproduction preview.
 * A future publisher integration needs its own reviewed consent, route and lifecycle adapter. */
export function DisplayPlacement({
  placement,
  preview = false,
}: {
  placement: DisplayPlacementName;
  preview?: boolean;
}) {
  if (!preview || process.env.NODE_ENV === 'production') return null;
  if (!['home-footer', 'learn-footer', 'results-footer'].includes(placement)) return null;
  return (
    <aside
      className="jhk-display-placement"
      data-display-placement={placement}
      data-ad-preview="true"
      aria-label="Advertisement placement preview"
    >
      <p className="jhk-display-placement__label">Advertisements</p>
      <div className="jhk-display-placement__box">
        <span>Layout preview · no advertisement loaded</span>
      </div>
    </aside>
  );
}
