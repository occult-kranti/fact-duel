'use client';
/**
 * Countdown: one giant kinetic numeral (display face, CSS scale-in re-keyed on every tick) and,
 * when the upcoming round is a Wild Round, a gold call-out that only lives here.
 *
 * This is NOT the question card — it may animate. Arena already fires the countdown/go cues
 * through `signal`, so nothing here plays a sound.
 */
import { Radio, Sparkles } from 'lucide-react';
import { wildRound } from '@/lib/progression.mjs';
import { useLocale } from '../../use-locale';

export function CountdownStage({ countdown, roundId }: { countdown: number; roundId?: string | null }) {
  const { t } = useLocale();
  const wild = roundId ? wildRound(roundId) : 1;
  return (
    <section className="fd-panel fd-count">
      <p className="fd-eyebrow">{t('count.eyebrow')}</p>
      <h1>{countdown > 0 ? t('count.go') : t('count.opening')}</h1>
      {wild > 1 && (
        <p className="fd-wild">
          <Sparkles size={16} />
          {t('count.wild', { n: wild })}
        </p>
      )}
      <strong className="fd-count-num" key={countdown} aria-hidden="true">
        {countdown > 0 ? countdown : <Radio />}
      </strong>
      <p className="fd-count-status" role="status">
        {countdown > 0 ? t('count.getReady') : t('count.waitingQ')}
      </p>
    </section>
  );
}
