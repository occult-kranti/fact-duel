'use client';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FORMAT_COPY } from '@/lib/duel-presentation.mjs';
import {
  Zap,
  Swords,
  ArrowRight,
  Check,
  Timer,
  Coins,
  ShieldCheck,
  Trophy,
  Atom,
  Flag,
  CircleDot,
  Bot,
  Users,
  ChevronRight,
  ChevronDown,
  Compass,
  Brain,
  Rocket,
} from 'lucide-react';
import type { PlayScreenProps } from './types';

function Picker({
  label,
  value,
  items,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  items: [string, string][];
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([v, t]) => (
            <SelectItem value={v} key={v}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* Play tab: duel configurator (bot / friend / join), poster, formats and the secondary
 * sections. Pure presentation over the DuelController — all state lives in arena.tsx. */
export function PlayScreen({ duel, player, catalogue, joinView, joinLink }: PlayScreenProps) {
  const { config, name, busy, modeInfo, MODES, actions } = duel;
  const { go, change, create, join, setName, setJoinView, setJoinLink, clearFilters, chooseCollection } =
    actions;
  const facets = catalogue?.facets || [];
  const pool = useMemo(
    () =>
      facets.filter((q: any) =>
        ['domain', 'region', 'topic', 'subtopic', 'difficulty'].every(
          (k) => (config as any)[k] === 'all' || q[k] === (config as any)[k],
        ),
      ),
    [facets, config],
  );
  const topics =
    catalogue?.topics?.filter((t: any) => config.domain === 'all' || t.domain === config.domain) || [];
  const subtopics = [
    ...new Set<string>(
      facets
        .filter(
          (q: any) =>
            (config.topic === 'all' || q.topic === config.topic) &&
            (config.domain === 'all' || q.domain === config.domain),
        )
        .map((q: any) => q.subtopic),
    ),
  ];
  const canPlay = player.loaded && !!catalogue && pool.length >= modeInfo.rounds && !!name.trim();
  return (
    <>
      <div className="rivalry-heading">
        <div>
          <p className="eyebrow">THE KNOWLEDGE ARENA</p>
          <h1>Your knowledge. Your next win.</h1>
        </div>
        <button className="profile-chip" onClick={() => go('passport')}>
          <span className="profile-monogram">{name.charAt(0).toUpperCase() || 'P'}</span>
          <span>
            <strong>{name}</strong>
            <small>{player.summary.points} activity pts · on this device</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="rivalry-lobby">
        <section className={`duel-builder format-${config.mode}`} aria-labelledby="match-setup">
          <div className="builder-heading">
            <span className="eyebrow">YOUR NEXT MATCH</span>
            <span className="free-tag">FREE PLAY</span>
          </div>
          <div className="builder-format">
            <div className="builder-format-title">
              <h2 id="match-setup">{joinView ? 'Join a friend.' : modeInfo.name}</h2>
              {!joinView && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const target = document.getElementById('formats');
                    target?.focus();
                    target?.scrollIntoView({ block: 'center' });
                  }}
                >
                  Change
                  <ChevronDown size={15} />
                </Button>
              )}
            </div>
            <p>{joinView ? 'Bring the full invitation link.' : (FORMAT_COPY as any)[config.mode].rule}</p>
          </div>
          <div className="segmented opponent-tabs">
            <Button
              variant="ghost"
              aria-pressed={!joinView && config.opponent === 'bot'}
              onClick={() => {
                setJoinView(false);
                change({ opponent: 'bot' });
              }}
            >
              <Bot />
              Bot
            </Button>
            <Button
              variant="ghost"
              aria-pressed={!joinView && config.opponent === 'friend'}
              onClick={() => {
                setJoinView(false);
                change({ opponent: 'friend' });
              }}
            >
              <Users />
              Friend
            </Button>
            <Button variant="ghost" aria-pressed={joinView} onClick={() => setJoinView(true)}>
              Join
            </Button>
          </div>
          {joinView ? (
            <>
              <div className="field">
                <Label htmlFor="join-name">Your name</Label>
                <Input
                  id="join-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value, 'join');
                  }}
                  maxLength={24}
                  autoComplete="nickname"
                />
              </div>
              <div className="field">
                <Label htmlFor="invite">Invitation link</Label>
                <Input
                  id="invite"
                  value={joinLink}
                  onChange={(e) => {
                    setJoinLink(e.target.value);
                  }}
                  placeholder="Paste your friend’s invitation"
                />
              </div>
              <Button
                className="primary-action wide match-launch"
                onClick={join}
                disabled={!player.loaded || busy || !name.trim() || !joinLink.trim()}
              >
                {busy ? 'Joining…' : 'Join the duel'}
                <ArrowRight />
              </Button>
              <p className="small-note">
                Both screens need access to this private site. Room invitations do not grant site access.
              </p>
            </>
          ) : (
            <>
              <div className="lobby-versus">
                <div>
                  <span className="seat-avatar you">{name.charAt(0).toUpperCase() || 'P'}</span>
                  <strong>You</strong>
                </div>
                <span className="versus-mark">VS</span>
                <div>
                  <span className="seat-avatar opponent">
                    {config.opponent === 'bot' ? <Bot /> : <Users />}
                  </span>
                  <strong>{config.opponent === 'bot' ? 'Lucky Guess' : 'Your friend'}</strong>
                  <small>{config.opponent === 'bot' ? 'RANDOM BOT' : 'INVITE ONLY'}</small>
                </div>
              </div>
              <Button
                className="primary-action wide match-launch"
                onClick={() => create()}
                disabled={busy || !canPlay}
              >
                <Zap />
                {busy
                  ? 'Setting the arena…'
                  : !player.loaded
                    ? 'Loading your player…'
                    : config.opponent === 'bot'
                      ? 'Play Lucky Guess'
                      : 'Create friend duel'}
                <ArrowRight />
              </Button>
              <div className="launch-terms">
                <span>
                  <Timer size={14} />
                  {config.duration}s per question
                </span>
                <span>
                  <Coins size={14} />
                  {config.stake ? `${config.stake} demo coins` : 'No entry cost'}
                </span>
              </div>
              <p className="live-round-note">
                Live rounds: stay on this screen. Switching away cancels and refunds.
              </p>
              <button className="topic-select-row" onClick={() => go('collections')}>
                <span>
                  <small>PLAYING</small>
                  <strong>
                    {config.topic === 'all'
                      ? config.domain === 'all'
                        ? 'Sports + science mix'
                        : config.domain === 'sports'
                          ? 'All sports'
                          : 'All science'
                      : config.topic}
                  </strong>
                </span>
                <span>
                  Change
                  <ChevronRight size={16} />
                </span>
              </button>
              <details className="match-options">
                <summary>
                  Match settings <span>name · timer · topics · coins</span>
                </summary>
                <div className="field">
                  <Label htmlFor="player-name">Your player name</Label>
                  <Input
                    id="player-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value, 'create');
                    }}
                    maxLength={24}
                    autoComplete="nickname"
                    placeholder="Choose a name"
                  />
                </div>
                <div className="options-grid">
                  <Picker
                    label="Territory"
                    value={config.domain}
                    onChange={(v) => change({ domain: v, topic: 'all', subtopic: 'all', region: 'all' })}
                    items={[
                      ['all', 'Sports + science'],
                      ['sports', 'Sports'],
                      ['science', 'Science'],
                    ]}
                  />
                  <Picker
                    label="Topic"
                    value={config.topic}
                    onChange={(v) => change({ topic: v, subtopic: 'all' })}
                    items={[
                      ['all', 'All topics'],
                      ...topics.map((t: any) => [t.topic, t.topic] as [string, string]),
                    ]}
                  />
                  <Picker
                    label="Region"
                    value={config.region}
                    onChange={(v) => change({ region: v })}
                    items={['all', 'US', 'India', 'Europe', 'Global'].map((v) => [
                      v,
                      v === 'all' ? 'All regions' : v,
                    ])}
                  />
                  <Picker
                    label="Level"
                    value={config.difficulty}
                    onChange={(v) => change({ difficulty: v })}
                    items={['all', 'simple', 'expert', 'extreme'].map((v) => [
                      v,
                      v === 'all' ? 'All levels' : v,
                    ])}
                  />
                  <Picker
                    label="Subtopic"
                    value={config.subtopic}
                    onChange={(v) => change({ subtopic: v })}
                    items={[['all', 'Any subtopic'], ...subtopics.map((v) => [v, v] as [string, string])]}
                  />
                  <Picker
                    label="Time per question"
                    value={String(config.duration)}
                    onChange={(v) => change({ duration: Number(v) })}
                    items={[
                      ['10', '10 seconds'],
                      ['15', '15 seconds'],
                      ['30', '30 seconds'],
                    ]}
                  />
                </div>
                <Label className="entry-label">Optional demo coins · once per match</Label>
                <div className="stakes">
                  {[0, 10, 25, 50, 100].map((stake) => (
                    <Button
                      key={stake}
                      variant={stake === config.stake ? 'default' : 'outline'}
                      aria-pressed={stake === config.stake}
                      onClick={() => change({ stake })}
                    >
                      {stake || 'Free'}
                    </Button>
                  ))}
                </div>
                <p className="small-note">
                  Coins have no cash value. Draws refund the entry. Every new room starts with 1,000 per
                  player.
                </p>
              </details>

              <div className="pool-count">
                <span>{catalogue ? `${pool.length} questions in this selection` : 'Loading questions…'}</span>
                <span>{modeInfo.rounds} needed</span>
              </div>
              {catalogue && pool.length < modeInfo.rounds && (
                <div className="pool-warning" role="status">
                  Not enough questions for {modeInfo.name}.
                  <Button variant="link" onClick={clearFilters}>
                    Use all topics
                  </Button>
                  {pool.length > 0 && config.mode !== 'quick' && (
                    <Button variant="link" onClick={() => change({ mode: 'quick' })}>
                      Play one question
                    </Button>
                  )}
                </div>
              )}
              <details className="fair-play">
                <summary>
                  <ShieldCheck size={15} />
                  Know the rules
                  <ChevronDown size={15} />
                </summary>
                <p>
                  {config.opponent === 'bot'
                    ? `Lucky Guess chooses each answer with equal probability and waits a random 1–${config.duration - 0.5}s. It never reacts to your answer.`
                    : 'Each player sees the full question on their own screen. You both ready up before a round.'}
                </p>
                <p>
                  Correctness comes first, then reported answer time. Both correct within 150 ms is a draw.
                  Stay on this screen: switching away or reloading during a round cancels and refunds the
                  match.
                </p>
                <p>Coins are free simulations and have no cash value.</p>
                <Button variant="link" onClick={() => go('rules')}>
                  Full rules & timing
                </Button>
              </details>
            </>
          )}
        </section>
        <section className={`arena-poster format-${config.mode}`} aria-label="FACT DUEL arena">
          <img
            src="/art/rivalry-stage.webp"
            alt="Polished lightning token and a metallic sports sphere surrounded by luminous science orbits"
            width="1672"
            height="941"
          />
          <div className="poster-copy">
            <span className="poster-label">SPORTS × SCIENCE</span>
            <h2>
              KNOW IT.
              <br />
              <em>PROVE IT.</em>
            </h2>
            <p>
              One rival. Four answers.
              <br />
              Make yours count.
            </p>
          </div>
          <div className="poster-bottom">
            <span>
              <Swords size={15} />1 v 1 knowledge duels
            </span>
            <button onClick={() => go('showroom')}>
              <Atom size={15} />
              Enter the 3D arena
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <section id="formats" tabIndex={-1} className="format-section" aria-label="Choose your format">
          <div className="minor-heading">
            <h2>Choose your format</h2>
            <span>One attempt per question</span>
          </div>
          <div className="format-cards">
            {MODES.map((m) => {
              const Icon = m.icon,
                f = (FORMAT_COPY as any)[m.id];
              return (
                <button
                  key={m.id}
                  className={`format-card format-${m.id} ${config.mode === m.id && !joinView ? 'selected' : ''}`}
                  aria-pressed={config.mode === m.id && !joinView}
                  onClick={() => {
                    setJoinView(false);
                    change({ mode: m.id });
                  }}
                >
                  <span className="format-top">
                    <Icon />
                    <span>{f.number}</span>
                  </span>
                  <small>{f.tag}</small>
                  <strong>{m.name}</strong>
                  <p>{f.short}</p>
                  <span className="format-select">
                    {config.mode === m.id && !joinView ? (
                      <>
                        <Check size={15} />
                        Selected
                      </>
                    ) : (
                      <>
                        Choose format
                        <ArrowRight size={15} />
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <div className="home-secondary">
        <section className="topic-spotlight">
          <div className="minor-heading">
            <h2>Pick your obsession</h2>
            <Button variant="ghost" data-nav="collections" onClick={() => go('collections')}>
              All subjects
              <ArrowRight size={16} />
            </Button>
          </div>
          <div className="topic-chips">
            {[
              ['Cricket', Flag, 'sports'],
              ['Football', CircleDot, 'sports'],
              ['Basketball', Trophy, 'sports'],
              ['Space', Rocket, 'science'],
              ['Physics', Atom, 'science'],
            ].map(([topic, Icon, domain]: any) => (
              <button
                key={topic}
                aria-pressed={config.topic === topic}
                onClick={() => chooseCollection(domain, topic)}
              >
                <Icon size={18} />
                {topic}
                <span>{catalogue?.topics.find((t: any) => t.topic === topic)?.count ?? '…'}</span>
              </button>
            ))}
          </div>
          <div className="form-row">
            <span>YOUR LAST FIVE</span>
            {player.journal.matches.length ? (
              player.journal.matches
                .slice(0, 5)
                .reverse()
                .map((m: any) => (
                  <span
                    className={`form-result form-${m.outcome}`}
                    key={m.id}
                    title={`${m.bot ? 'Bot' : 'Friend'} match: ${m.outcome}`}
                  >
                    {m.outcome === 'win' ? 'W' : m.outcome === 'loss' ? 'L' : 'D'}
                  </span>
                ))
            ) : (
              <p>Your first result goes here.</p>
            )}
            <button onClick={() => go('journal')}>
              Match history
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section className="warmup-card">
          <span className="warmup-icon">
            <Brain />
          </span>
          <div>
            <span className="eyebrow">NO CLOCK. NO OPPONENT.</span>
            <h2>Warm up your brain.</h2>
            <p>Three facts, at your pace.</p>
          </div>
          <Button variant="outline" onClick={() => go('discovery')}>
            Start Discovery
            <ArrowRight size={16} />
          </Button>
        </section>
      </div>
      <div className="home-foot">
        <button onClick={() => go('passport')}>
          <Compass size={16} />
          {player.summary.complete} / 3 side quests complete
          <span>
            Open Passport
            <ChevronRight size={15} />
          </span>
        </button>
        <p>{catalogue?.count ?? '…'} sourced sample questions · Private playtest</p>
      </div>
    </>
  );
}
