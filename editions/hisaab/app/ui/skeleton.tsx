/**
 * ui/skeleton.tsx — `h-skeleton`: ruled lines on paper with a static "F.No. ——" tab. No shimmer
 * (calmer, reduced-motion safe). Use while a lazy screen or data loads.
 */
import { cx } from './cx';
import './skeleton.css';

export function Skeleton({ lines = 4, label = 'Loading', className }: { lines?: number; label?: string; className?: string }) {
  return (
    <div className={cx('h-skeleton', className)} role="status" aria-busy="true" style={{ ['--h-skel-lines' as string]: lines }}>
      <span className="h-skeleton__tab" aria-hidden="true">
        F.No. ——
      </span>
      <span className="h-skeleton__lines" aria-hidden="true" />
      <span className="h-sr">{label}…</span>
    </div>
  );
}
