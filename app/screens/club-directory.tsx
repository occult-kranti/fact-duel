'use client';
import { ArrowUpRight } from 'lucide-react';
import { useLocale } from '../use-locale';

type ClubSection = 'explore' | 'progress' | 'answers';
type ClubLink = { route: string; label: string; hindi: string; detail: string; hindiDetail: string };

const LINKS: Record<ClubSection, ClubLink[]> = {
  explore: [
    { route: 'journeys', label: 'Expeditions', hindi: 'अभियान', detail: 'Learn without a clock', hindiDetail: 'बिना घड़ी के सीखें' },
    { route: 'collections', label: 'Topics', hindi: 'विषय', detail: 'Sports & science', hindiDetail: 'खेल और विज्ञान' },
    { route: 'discovery', label: 'Discover facts', hindi: 'तथ्य खोजें', detail: 'Follow your curiosity', hindiDetail: 'अपनी जिज्ञासा के साथ' },
    { route: 'events', label: 'Fixtures & challenges', hindi: 'मैच और चुनौतियाँ', detail: 'Event-inspired play', hindiDetail: 'आयोजनों से जुड़े सवाल' },
    { route: 'practice', label: 'Custom practice', hindi: 'अपना अभ्यास', detail: 'Choose topic & format', hindiDetail: 'विषय और मोड चुनें' },
  ],
  progress: [
    { route: 'passport', label: 'Your progress', hindi: 'आपकी प्रगति', detail: 'Records & achievements', hindiDetail: 'रिकॉर्ड और उपलब्धियाँ' },
    { route: 'analytics', label: 'Activity & data', hindi: 'गतिविधि और डेटा', detail: 'Inspect or export', hindiDetail: 'देखें या निर्यात करें' },
    { route: 'showroom', label: 'Art collection', hindi: 'कला संग्रह', detail: 'Explore the game artwork', hindiDetail: 'खेल की कला देखें' },
  ],
  answers: [
    { route: 'journal', label: 'Answers & recall', hindi: 'जवाब और दोहराव', detail: 'Saved facts & sources', hindiDetail: 'सहेजे तथ्य और स्रोत' },
    { route: 'discovery', label: 'Find something new', hindi: 'कुछ नया खोजें', detail: 'Build your fact collection', hindiDetail: 'अपना तथ्य संग्रह बढ़ाएँ' },
  ],
};

/** Contextual links above existing screens, rather than another intermediate hub. */
export function ClubDirectory({ section, current, go }: { section: ClubSection; current?: string; go: (route: string) => void }) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const labels = { explore: hi ? 'खोजने के तरीके' : 'Explore the club', progress: hi ? 'प्रगति और डेटा' : 'Progress & data', answers: hi ? 'जवाब और सीखना' : 'Answers & learning' };
  return (
    <nav className="gc-directory" aria-label={labels[section]}>
      {LINKS[section].map(link => (
        <button className="gc-directory-link" type="button" aria-current={current === link.route ? 'page' : undefined} key={link.route} onClick={() => go(link.route)}>
          <span><strong>{hi ? link.hindi : link.label}</strong><small>{hi ? link.hindiDetail : link.detail}</small></span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
