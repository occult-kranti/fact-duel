'use client';
/**
 * Collections — pick the subject that feeds the duel configurator.
 *
 * A "Mixed bag" ticket comes first, then one card per topic: domain colour, sample-question count
 * and three mastery mini-bars (encountered / opened / recalled) read from the passport. Choosing a
 * card still calls `onChoose(domain, topic)`, which is what the Play screen listens for.
 */
import { DOMAIN_CHIPS, domainEnabled } from '@/lib/content.mjs';
import { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Atom,
  Brain,
  CircleDot,
  Code,
  Flag,
  Goal,
  Layers,
  Orbit,
  Search,
  Shuffle,
  Target,
} from 'lucide-react';
import { Chip, MasteryBar, usePress } from './screens/vault';
import './screens/vault/vault.css';

export const TOPIC_STYLE: any = {
  Cricket: { icon: Flag, detail: 'World Cup memories & legendary innings', color: 'sport' },
  Football: { icon: Goal, detail: 'Clubs, icons & the beautiful game', color: 'sport' },
  Basketball: { icon: CircleDot, detail: 'The players behind the numbers', color: 'sport' },
  'American football': { icon: Target, detail: 'Super Bowl stories & NFL history', color: 'sport' },
  Tennis: { icon: Activity, detail: 'Majors, rivalries & defining moments', color: 'sport' },
  Baseball: { icon: CircleDot, detail: 'October, the record books & the scandals', color: 'sport' },
  'Formula 1': { icon: Flag, detail: 'Title deciders, team orders & the rows that followed', color: 'sport' },
  Space: { icon: Orbit, detail: 'Small questions. An enormous universe.', color: 'science' },
  Physics: { icon: Atom, detail: 'The rules behind the everyday', color: 'science' },
  Biology: { icon: Brain, detail: 'Life, cells & remarkable discoveries', color: 'science' },
  Computing: { icon: Code, detail: 'The ideas that made the digital world', color: 'science' },
};

/* Kept for the Play lobby's picture tickets (legacy markup + CSS). */
export function CollectionCover({
  domain,
  onSelect,
}: {
  domain: 'sports' | 'science';
  onSelect: () => void;
}) {
  return (
    <button className={`collection-cover ${domain}`} onClick={onSelect}>
      <img
        src={`/${domain === 'sports' ? 'sports' : 'science'}-club.webp`}
        alt=""
        width="1536"
        height="1024"
        loading="lazy"
      />
      <span className="cover-copy">
        <span className="eyebrow">{domain === 'sports' ? 'FOR THE FANS' : 'FOR THE CURIOUS'}</span>
        <strong>{domain === 'sports' ? 'The sporting life.' : 'A world of why.'}</strong>
        <span>
          {domain === 'sports' ? 'Explore sports' : 'Explore science'}
          <ArrowUpRight size={18} />
        </span>
      </span>
    </button>
  );
}

/* Only the domains the product shows; with one domain there is no 'all' and no switcher. */
const DOMAINS: { id: string; label: string }[] = [...DOMAIN_CHIPS];

export default function Collections({
  catalogue,
  passport,
  onChoose,
}: {
  catalogue: any;
  passport: any;
  onChoose: (domain: string, topic: string) => void;
}) {
  const press = usePress();
  const [domain, setDomain] = useState(DOMAINS[0].id),
    [search, setSearch] = useState('');
  const query = search.toLowerCase().trim();
  const topics =
    catalogue?.topics?.filter(
      (t: any) =>
        domainEnabled(t.domain) &&
        (domain === 'all' || t.domain === domain) &&
        `${t.topic} ${TOPIC_STYLE[t.topic]?.detail || ''}`.toLowerCase().includes(query),
    ) || [];
  const facts: any[] = Object.values(passport?.facts || {});
  const mastery = (topic: string) => {
    const mine = facts.filter((f: any) => f.topic === topic);
    return {
      encountered: mine.length,
      opened: mine.filter((f: any) => f.opened).length,
      recalled: mine.filter((f: any) => f.recalled).length,
    };
  };

  return (
    <section className="fd-learn fd-collections">
      <header className="fd-learn__head">
        <p className="fd-eyebrow">KNOW YOUR SUBJECT</p>
        <div className="fd-learn__title">
          <h1>Pick your home ground.</h1>
          <span className="fd-tag fd-tag--cool">
            <Layers />
            {catalogue?.count ?? '…'} sample questions
          </span>
        </div>
        <p className="fd-lede">
          Sport, science, or your specialist subject. Choose a collection and the duel configurator follows
          you back to Play. The mini-bars show what you have already met, opened and recalled.
        </p>
        <div className="fd-toolbar">
          <div className="fd-chips">
            {DOMAINS.map((d) => (
              <Chip key={d.id} active={domain === d.id} onClick={() => setDomain(d.id)}>
                {d.label}
              </Chip>
            ))}
          </div>
          <span className="fd-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              aria-label="Search collections"
              placeholder="Find your subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
        </div>
      </header>

      <div className="fd-coll-grid">
        <button
          type="button"
          className="fd-coll fd-coll--mixed"
          onPointerDown={press}
          onClick={() => onChoose('all', 'all')}
        >
          <span className="fd-coll__top">
            <span className="fd-coll__icon">
              <Shuffle aria-hidden="true" />
            </span>
            <span className="fd-coll__title">
              <strong>Mixed bag</strong>
              <span>{catalogue?.count ?? '…'} questions · sports + science</span>
            </span>
            <ArrowUpRight className="fd-coll__go" aria-hidden="true" />
          </span>
          <span className="fd-coll__detail">
            Everything in the sample bank, shuffled. The quickest way into a duel when you cannot pick.
          </span>
        </button>

        {topics.map((t: any) => {
          const style = TOPIC_STYLE[t.topic] || TOPIC_STYLE.Physics,
            Icon = style.icon,
            m = mastery(t.topic);
          return (
            <button
              type="button"
              key={t.topic}
              className="fd-coll"
              data-domain={t.domain}
              onPointerDown={press}
              onClick={() => onChoose(t.domain, t.topic)}
            >
              <span className="fd-coll__top">
                <span className="fd-coll__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="fd-coll__title">
                  <strong>{t.topic}</strong>
                  <span>{t.count} sample questions</span>
                </span>
                <ArrowUpRight className="fd-coll__go" aria-hidden="true" />
              </span>
              <span className="fd-coll__detail">{style.detail}</span>
              <span className="fd-mastery">
                <MasteryBar label="Encountered" value={m.encountered} total={t.count} tone="cyan" />
                <MasteryBar label="Opened" value={m.opened} total={t.count} tone="gold" />
                <MasteryBar label="Recalled" value={m.recalled} total={t.count} tone="volt" />
              </span>
            </button>
          );
        })}
      </div>

      {catalogue && topics.length === 0 && (
        <div className="fd-empty">
          <span className="fd-empty__badge">
            <Search aria-hidden="true" />
          </span>
          <h2>No collection found.</h2>
          <p>Nothing matches “{search}”. Clear the search to see every subject in the sample bank.</p>
          <button
            type="button"
            className="fd-btn fd-btn--primary"
            onPointerDown={press}
            onClick={() => {
              setSearch('');
              setDomain('all');
            }}
          >
            Show all collections
          </button>
        </div>
      )}
    </section>
  );
}
