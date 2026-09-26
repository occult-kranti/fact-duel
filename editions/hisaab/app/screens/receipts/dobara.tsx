/**
 * screens/receipts/dobara.tsx — Dobara Jaanch ("check again"): the engine's review queue played as
 * untimed cards inside a sheet (design bible §11.15; JHK's recall lab, lib/journal-review.mjs).
 *
 * Untimed and quiet: no timer, fixed option order (the bank's), the first answer locks; the stamp,
 * the receipt and the noting appear only after the lock. Toasts are held while the sheet is open and
 * released at the end (bible §9). Each answer is one `review` dispatch — the engine moves the card's
 * box and pays its own review XP (6 right / 3 otherwise, only on a card that was due).
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useJuice } from '@/components/fx';
import { useHoldToasts } from '../../budget';
import { formatNumber, itemById } from '../../data';
import { useAppPlayer } from '../../shell/player';
import { Button } from '../../ui/button';
import { useLang } from '../../ui/lang';
import { NotingSheet } from '../../ui/noting-sheet';
import { OptionList } from '../../ui/option';
import { Receipt } from '../../ui/receipt';
import { Stamp } from '../../ui/stamp';
import { receiptKicker } from './detail';
import type { ReceiptRow } from './lib';

export type DobaraProps = {
  /** The queue, frozen when the sheet opened (factIds). */
  queue: readonly string[];
  rows: ReadonlyMap<string, ReceiptRow>;
  onDone: () => void;
};

export function Dobara({ queue, rows, onDone }: DobaraProps) {
  const player = useAppPlayer();
  const juice = useJuice();
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [failed, setFailed] = useState(false);
  const finished = index >= queue.length;
  useHoldToasts(!finished);
  const next = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const id = queue[index];
  const row = id ? rows.get(id) ?? null : null;
  const item = id ? itemById(id) : null;

  useEffect(() => {
    if (chosen !== null) next.current?.focus({ preventScroll: true });
  }, [chosen]);

  if (finished || !row) {
    return (
      <div className="h-dobara h-dobara--done">
        <div className="h-stamp-stage h-dobara__stage">
          <Stamp kind="noted" seed={`dobara-${queue.length}`} size="l" text={`JAANCH · ${score}/${queue.length}`} animate label={t('Re-check done', 'जाँच पूरी')} />
        </div>
        <p className="h-dobara__summary" role="status">
          {t(`Dobara Jaanch done: ${score} of ${queue.length} right.`, `दोबारा जाँच पूरी: ${queue.length} में से ${score} सही।`)}{' '}
          {t('The ones you missed come back sooner; the rest wait longer.', 'जो छूटे वे जल्दी लौटेंगे; बाक़ी देर से।')}
        </p>
        <Button variant="primary" onClick={onDone}>
          {t('Back to the vault', 'तिजोरी पर वापस')}
        </Button>
      </div>
    );
  }

  const correctIndex = row.correctIndex;
  const answered = chosen !== null;
  const right = answered && chosen === correctIndex;

  const choose = async (i: number) => {
    if (answered) return;
    setChosen(i);
    setFailed(false);
    juice.sound('select');
    const ok = i === correctIndex;
    if (ok) setScore((n) => n + 1);
    try {
      await player.review({ factId: row.id, roundId: null, choice: i, chose: row.options[i], correct: ok, revealed: false });
    } catch {
      setFailed(true);
    }
    juice.sound(ok ? 'correct' : 'wrong');
    juice.haptic(ok ? 'success' : 'error');
  };

  return (
    <div className="h-dobara">
      <div className="h-dobara__bar" aria-hidden="true">
        {queue.map((q, i) => (
          <span key={q} className={i < index ? 'h-dobara__seg h-dobara__seg--done' : i === index ? 'h-dobara__seg h-dobara__seg--now' : 'h-dobara__seg'} />
        ))}
      </div>
      <p className="h-kicker">
        {t('Card', 'कार्ड')} {formatNumber(index + 1)} / {formatNumber(queue.length)} · {receiptKicker(row)}
      </p>
      <h3 className="h-dobara__q">{row.question}</h3>
      <OptionList
        options={row.options}
        chosen={chosen}
        correctIndex={answered ? correctIndex : null}
        onChoose={(i) => void choose(i)}
        disabled={answered}
        keys
        label={t('Answers', 'जवाब')}
      />
      {!answered ? (
        <p className="h-dobara__hint">{t('No timer — take your time. First answer locks.', 'कोई टाइमर नहीं — आराम से। पहला जवाब लॉक होगा।')}</p>
      ) : (
        <div className="h-dobara__after">
          <div className="h-stamp-stage h-dobara__stage" aria-live="polite">
            <Stamp kind={right ? 'pass' : 'fail'} seed={row.id} size="m" animate label={right ? t('Correct', 'सही') : t('Wrong', 'ग़लत')} />
          </div>
          {failed ? <p className="h-note h-note--wait">{t('Could not save this answer on this device. It still counts on screen.', 'यह जवाब सेव नहीं हो पाया।')}</p> : null}
          {item ? <Receipt item={item} printing /> : null}
          <NotingSheet collapsible summary={t('Read the noting', 'नोटिंग पढ़ो')} defaultOpen={!right}>
            <p>{row.explanation}</p>
          </NotingSheet>
          <Button
            ref={next}
            variant="primary"
            block
            icon={index + 1 >= queue.length ? <RotateCcw size={20} strokeWidth={2.4} /> : undefined}
            trailing={index + 1 >= queue.length ? null : <ArrowRight size={20} strokeWidth={2.4} />}
            onClick={() => {
              setIndex((n) => n + 1);
              setChosen(null);
            }}
          >
            {index + 1 >= queue.length ? t('Finish', 'पूरा करो') : t('Next card', 'अगला कार्ड')}
          </Button>
        </div>
      )}
    </div>
  );
}
