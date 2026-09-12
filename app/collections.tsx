'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Atom,
  Flag,
  Orbit,
  Brain,
  Code,
  Activity,
  Goal,
  CircleDot,
  Target,
  ArrowUpRight,
  Search,
  Shuffle,
} from 'lucide-react';
export const TOPIC_STYLE: any = {
  Cricket: { icon: Flag, detail: 'World Cup memories & legendary innings', color: 'sport' },
  Football: { icon: Goal, detail: 'Clubs, icons & the beautiful game', color: 'sport' },
  Basketball: { icon: CircleDot, detail: 'The players behind the numbers', color: 'sport' },
  'American football': { icon: Target, detail: 'Super Bowl stories & NFL history', color: 'sport' },
  Tennis: { icon: Activity, detail: 'Majors, rivalries & defining moments', color: 'sport' },
  Space: { icon: Orbit, detail: 'Small questions. An enormous universe.', color: 'science' },
  Physics: { icon: Atom, detail: 'The rules behind the everyday', color: 'science' },
  Biology: { icon: Brain, detail: 'Life, cells & remarkable discoveries', color: 'science' },
  Computing: { icon: Code, detail: 'The ideas that made the digital world', color: 'science' },
};
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
export default function Collections({
  catalogue,
  passport,
  onChoose,
}: {
  catalogue: any;
  passport: any;
  onChoose: (domain: string, topic: string) => void;
}) {
  const [domain, setDomain] = useState('all'),
    [search, setSearch] = useState('');
  const topics =
    catalogue?.topics?.filter(
      (t: any) =>
        (domain === 'all' || t.domain === domain) &&
        `${t.topic} ${TOPIC_STYLE[t.topic]?.detail || ''}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
    ) || [];
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">FIND YOUR PEOPLE. KNOW YOUR SUBJECT.</p>
          <h1>Pick your home ground.</h1>
        </div>
        <span className="tag">{catalogue?.count ?? '…'} sample questions</span>
      </div>
      <p className="muted">
        Sport, science, or your specialist subject. Choose a collection, then pick your format. Each currently
        contains six sample questions.
      </p>
      <div className="collection-worlds">
        <button
          aria-pressed={domain === 'sports'}
          className="world-ticket sports"
          onClick={() => setDomain('sports')}
        >
          <img src="/sports-club.webp" alt="" width="1536" height="1024" loading="lazy" />
          <span>
            <small>THE SPORTING WORLD</small>
            <strong>
              For the fans.
              <br />
              And the fanatics.
            </strong>
            <em>
              Explore sports <ArrowUpRight size={18} />
            </em>
          </span>
        </button>
        <button
          aria-pressed={domain === 'science'}
          className="world-ticket science"
          onClick={() => setDomain('science')}
        >
          <img src="/science-club.webp" alt="" width="1536" height="1024" loading="lazy" />
          <span>
            <small>THE SCIENTIFIC WORLD</small>
            <strong>
              Big ideas.
              <br />
              Beautiful questions.
            </strong>
            <em>
              Explore science <ArrowUpRight size={18} />
            </em>
          </span>
        </button>
      </div>
      <div className="collection-toolbar">
        <div className="segmented">
          {[
            ['all', 'All'],
            ['sports', 'Sports'],
            ['science', 'Science'],
          ].map(([id, label]) => (
            <Button key={id} variant="ghost" aria-pressed={id === domain} onClick={() => setDomain(id)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="search-field">
          <Search />
          <Input
            aria-label="Search collections"
            placeholder="Find your subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="collection-grid">
        {topics.map((t: any) => {
          const style = TOPIC_STYLE[t.topic] || TOPIC_STYLE.Physics,
            Icon = style.icon,
            encountered = Object.values(passport?.facts || {}).filter((f: any) => f.topic === t.topic).length;
          return (
            <button
              className={`collection-card ${style.color}`}
              key={t.topic}
              onClick={() => onChoose(t.domain, t.topic)}
            >
              <span className="collection-icon">
                <Icon />
              </span>
              <ArrowUpRight className="collection-arrow" />
              <h2>{t.topic}</h2>
              <p>{style.detail}</p>
              <span className="collection-count">
                {t.count} sample questions · {encountered} encountered
              </span>
              <span className="collection-track" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (100 * encountered) / t.count)}%` }} />
              </span>
            </button>
          );
        })}
      </div>
      {catalogue && topics.length === 0 && (
        <div className="empty-surface">
          <Search />
          <h2>No collection found.</h2>
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              setDomain('all');
            }}
          >
            Show all collections
          </Button>
        </div>
      )}
      <div className="mix-strip">
        <Shuffle />
        <div>
          <h2>A bit of everything?</h2>
          <p>Start with the full sports and science sample.</p>
        </div>
        <Button variant="outline" onClick={() => onChoose('all', 'all')}>
          Choose mixed bag
          <ArrowUpRight />
        </Button>
      </div>
    </section>
  );
}
