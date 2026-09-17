'use client';
import { useMemo } from 'react';
import {
  ArrowRight,
  Atom,
  CircleDot,
  Cpu,
  Dna,
  Flag,
  Rocket,
  Shuffle,
  Trophy,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';
import { usePlayJuice } from './press';
import { useLocale } from '../../use-locale';

const TOPIC_ICONS: Record<string, LucideIcon> = {
  Cricket: Flag,
  Football: CircleDot,
  Basketball: Trophy,
  'American football': Trophy,
  Tennis: Volleyball,
  Space: Rocket,
  Physics: Atom,
  Biology: Dna,
  Computing: Cpu,
};
const iconFor = (topic: string, domain: string) =>
  TOPIC_ICONS[topic] ?? (domain === 'science' ? Atom : Trophy);

export type TopicChipsProps = {
  catalogue: any;
  domain: string;
  topic: string;
  onChoose: (domain: string, topic: string) => void;
  onAll: () => void;
  /** How many catalogue topics to show beside the mixed bag. */
  limit?: number;
};

/* Topic chips: the mixed bag first, then an alternating sports / science slice of the catalogue so
 * both territories are always one tap away. No chip carries a question count: pool sizes are never
 * shown in the product (tests/no-pool-counts.test.mjs). "All subjects" keeps `data-nav="collections"` — the
 * screenshot script (scripts/screens.mjs) reaches the Collections screen through this button. */
export function TopicChips({ catalogue, domain, topic, onChoose, onAll, limit = 6 }: TopicChipsProps) {
  const { press } = usePlayJuice();
  const { t, topic: topicName } = useLocale();
  const chips = useMemo(() => {
    const all: { topic: string; domain: string }[] = catalogue?.topics ?? [];
    const sports = all.filter((t) => t.domain === 'sports');
    const science = all.filter((t) => t.domain === 'science');
    const mixed: typeof all = [];
    for (let i = 0; mixed.length < limit && (i < sports.length || i < science.length); i++) {
      if (sports[i]) mixed.push(sports[i]);
      if (science[i] && mixed.length < limit) mixed.push(science[i]);
    }
    return mixed;
  }, [catalogue, limit]);
  return (
    <section className="fd-block" aria-labelledby="play-topics">
      <div className="fd-block-head">
        <h2 id="play-topics">{t('topics.pick')}</h2>
        <button
          type="button"
          className="fd-link fd-pressable"
          data-nav="collections"
          {...press}
          onClick={onAll}
        >
          {t('topics.all')}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="fd-subjects">
        <button
          type="button"
          className="fd-subject fd-pressable"
          data-domain="mix"
          aria-pressed={topic === 'all' && domain === 'all'}
          {...press}
          onClick={() => onChoose('all', 'all')}
        >
          <Shuffle size={16} aria-hidden="true" />
          {t('topics.mixed')}
        </button>
        {chips.map((chip) => {
          const Icon = iconFor(chip.topic, chip.domain);
          return (
            <button
              key={chip.topic}
              type="button"
              className="fd-subject fd-pressable"
              data-domain={chip.domain}
              aria-pressed={topic === chip.topic}
              {...press}
              onClick={() => onChoose(chip.domain, chip.topic)}
            >
              <Icon size={16} aria-hidden="true" />
              {topicName(chip.topic)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
