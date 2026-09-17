'use client';
/**
 * app/screens/events/parts.tsx — the atoms every Events surface shares.
 * Domain colour lives in one place: `data-domain` on a wrapper, sports = ember, science = cyan
 * (design bible §5). Icons are the same topic set the Play screen's chips use.
 */
import {
  Atom,
  CircleDot,
  Cpu,
  Dna,
  ExternalLink,
  Flag,
  Rocket,
  Trophy,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';
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

export const topicIcon = (topic: string, domain: string): LucideIcon =>
  TOPIC_ICONS[topic] ?? (domain === 'science' ? Atom : Trophy);

/** Domain-coloured topic chip: icon + topic, never colour alone. */
export function TopicChip({ topic, domain }: { topic: string; domain: string }) {
  const { topic: topicName } = useLocale();
  const Icon = topicIcon(topic, domain);
  return (
    <span className="fd-ev-chip" data-domain={domain}>
      <Icon aria-hidden="true" />
      {topicName(topic)}
    </span>
  );
}

/** The live marker. The dot pulses; under reduced motion it simply sits there, still visible. */
export function LiveDot({ label }: { label?: string }) {
  const { t } = useLocale();
  return (
    <span className="fd-ev-live">
      <i className="fd-ev-live-dot" aria-hidden="true" />
      {label ?? t('parts.onNow')}
    </span>
  );
}

/** Every card cites where its entry came from. External, and never a same-tab navigation. */
export function SourceLink({ href, name }: { href: string; name: string }) {
  const { t } = useLocale();
  return (
    <a
      className="fd-ev-source"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('parts.sourceFor', { name })}
    >
      {t('parts.source')}
      <ExternalLink aria-hidden="true" />
    </a>
  );
}
