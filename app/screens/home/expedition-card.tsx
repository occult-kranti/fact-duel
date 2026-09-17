'use client';
/**
 * app/screens/home/expedition-card.tsx — the Zeigarnik card.
 * An unfinished run always wins the slot ("Continue — 3/6 answered"); with nothing open it shows
 * the next unstamped route instead. Learning surface, so it stays in the cool cyan palette.
 */
import { ArrowRight, Check, Compass, Flag } from 'lucide-react';
import { usePress } from './press';
import { useLocale } from '../../use-locale';

export type ExpeditionCardProps = {
  route: { id: string; code: string; topic: string; title: string; subtitle: string; chapters: string[] };
  cursor: number;
  answers: number;
  continuing: boolean;
  stamped: boolean;
  onOpen: () => void;
};

export function ExpeditionCard({ route, cursor, answers, continuing, stamped, onOpen }: ExpeditionCardProps) {
  const { t, topic } = useLocale();
  const press = usePress();
  const chapter = Math.min(route.chapters.length - 1, Math.floor(cursor / 2));
  const pct = Math.round((Math.min(6, cursor) / 6) * 100);
  return (
    <section className="fd-hub-expedition" aria-labelledby="fd-hub-expedition-title">
      <div className="fd-hub-expedition-head">
        <p className="fd-hub-eyebrow fd-hub-eyebrow--cool">
          <Compass aria-hidden="true" />
          {continuing ? t('exp.continue') : t('exp.featured')}
        </p>
        <span className="fd-hub-code fd-mono">{route.code}</span>
      </div>
      <h2 id="fd-hub-expedition-title">{route.title}</h2>
      <p className="fd-hub-expedition-sub">{route.subtitle}</p>
      <ol className="fd-hub-camps" aria-label={t('exp.camps')}>
        {route.chapters.map((title, i) => (
          <li
            key={title}
            data-state={cursor >= (i + 1) * 2 ? 'done' : i === chapter && cursor > 0 ? 'current' : 'next'}
            aria-current={i === chapter && continuing ? 'step' : undefined}
          >
            <span aria-hidden="true">{cursor >= (i + 1) * 2 ? <Check /> : <Flag />}</span>
            <small>{title}</small>
          </li>
        ))}
      </ol>
      <div
        className="fd-hub-meter fd-hub-meter--cool"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={Math.min(6, cursor)}
        aria-label={t('exp.progress', { title: route.title })}
      >
        <i className="fd-hub-meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="fd-hub-expedition-foot">
        <button
          type="button"
          className="fd-hub-btn fd-hub-btn--cool fd-hub-press"
          onPointerDown={press}
          onClick={onOpen}
        >
          {continuing ? t('exp.continueBtn') : stamped ? t('exp.again') : t('exp.start')}
          <ArrowRight aria-hidden="true" />
        </button>
        <small>
          {continuing
            ? t('exp.answered', { n: answers, topic: topic(route.topic) })
            : t('exp.six', { topic: topic(route.topic) })}
        </small>
      </div>
    </section>
  );
}
