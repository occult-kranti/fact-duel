/**
 * ui/tape.tsx — `h-tape`, the red tape (लाल फ़ीता) on an unopened file (bible §5, motion #5).
 *
 *   <Tape />                                  idle band across a card (in the flow — never over text)
 *   <Tape placement="edge" />                 along the bottom edge of a tile
 *   <Tape state="snapping" onSnapped={…} />   the two halves rotate ±12° and fall, once
 *
 * A prop, never meaning alone: the card or tile says "Sealed" in words too.
 */
import { cx } from './cx';
import './tape.css';

export type TapeProps = {
  state?: 'idle' | 'snapping';
  placement?: 'card' | 'edge';
  /** Called when the snap animation ends (or at once under reduced motion). */
  onSnapped?: () => void;
  className?: string;
};

export function Tape({ state = 'idle', placement = 'card', onSnapped, className }: TapeProps) {
  return (
    <span
      className={cx('h-tape', `h-tape--${placement}`, state === 'snapping' && 'h-tape--snapping', className)}
      aria-hidden="true"
      onAnimationEnd={state === 'snapping' ? (e) => e.target === e.currentTarget.lastElementChild && onSnapped?.() : undefined}
    >
      <span className="h-tape__half h-tape__half--l" />
      <span className="h-tape__half h-tape__half--r" />
    </span>
  );
}
