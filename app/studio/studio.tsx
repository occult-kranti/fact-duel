'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  BookOpen,
  Layers,
  Search,
  ExternalLink,
  Sun,
  Moon,
  RotateCcw,
  CheckCircle2,
  Clock,
  Lock,
  CircleDashed,
} from 'lucide-react';
import research from '@/lib/product/research.json';
import sourceData from '@/lib/product/sources.json';
import roadmap from '@/lib/product/roadmap.json';
import expeditionDecisions from '@/lib/product/expedition-decisions.json';
import expeditionResearch from '@/lib/product/expedition-research.json';
import rivalryDecisions from '@/lib/product/rivalry-decisions.json';
import historicalDecisions from '@/lib/product/decisions.json';
import review from '@/lib/product/review-research.json';
import gamification from '@/lib/product/gamification.json';
import './studio.css';

type Status = 'planned' | 'in_progress' | 'blocked' | 'done';
const statuses: { id: Status; label: string }[] = [
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
];
const label = (value: string) => statuses.find((s) => s.id === value)?.label ?? value;
const STORE = 'fact-duel-roadmap-v1';
const G_RELEASE = 'Floodlight';
const G_MILESTONE = 'Floodlight gamification';
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (link)
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
              {link[1]}
            </a>
          );
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
        return part;
      })}
    </>
  );
}
function Article({ nodes }: { nodes: any[] }) {
  return (
    <article className="research-article">
      {nodes.map((node, i) => {
        if (node.type === 'heading')
          return node.level === 1 ? (
            <h2 key={i}>
              <Inline text={node.text} />
            </h2>
          ) : node.level === 2 ? (
            <h3 key={i}>
              <Inline text={node.text} />
            </h3>
          ) : (
            <h4 key={i}>
              <Inline text={node.text} />
            </h4>
          );
        if (node.type === 'table')
          return (
            <div
              className="table-scroll research-table"
              key={i}
              tabIndex={0}
              role="region"
              aria-label={`Research table ${i}: scroll horizontally on small screens`}
            >
              <table>
                <thead>
                  <tr>
                    {node.rows[0].map((cell: string, j: number) => (
                      <th key={j}>
                        <Inline text={cell} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.rows.slice(1).map((row: string[], j: number) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>
                          <Inline text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        if (node.type === 'bullet') {
          if (nodes[i - 1]?.type === 'bullet') return null;
          const items = [];
          for (let j = i; j < nodes.length && nodes[j].type === 'bullet'; j++) items.push(nodes[j]);
          return (
            <ul key={i}>
              {items.map((item, j) => (
                <li key={j}>
                  <Inline text={item.text} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <Inline text={node.text} />
          </p>
        );
      })}
    </article>
  );
}
export default function Studio() {
  const [reviewQuery, setReviewQuery] = useState(''),
    [reviewApp, setReviewApp] = useState('all');
  const [tab, setTab] = useState('overview'),
    [light, setLight] = useState(false),
    [query, setQuery] = useState(''),
    [milestone, setMilestone] = useState('all'),
    [status, setStatus] = useState('all'),
    [changes, setChanges] = useState<Record<string, { status?: Status; note?: string; updatedAt?: string }>>(
      {},
    ),
    [loaded, setLoaded] = useState(false),
    [storageOK, setStorageOK] = useState(true),
    [resetOpen, setResetOpen] = useState(false),
    [doc, setDoc] = useState(gamification.articles[0]?.id ?? '');
  useEffect(() => {
    const initial = window.location.hash.slice(1);
    if (
      ['overview', 'gamification', 'voices', 'roadmap', 'market', 'experience', 'sources'].includes(initial)
    )
      setTab(initial);
    try {
      const theme = localStorage.getItem('fact-duel-online-theme') === 'light';
      setLight(theme);
      document.documentElement.dataset.theme = theme ? 'light' : 'dark';
      const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (raw?.version === 1 && raw?.changes && typeof raw.changes === 'object') {
        const safe: typeof changes = {};
        for (const item of roadmap.items) {
          const v = raw.changes[item.id];
          if (v && typeof v === 'object')
            safe[item.id] = {
              ...(statuses.some((s) => s.id === v.status) ? { status: v.status } : {}),
              ...(typeof v.note === 'string' ? { note: v.note.slice(0, 2000) } : {}),
              ...(typeof v.updatedAt === 'string' ? { updatedAt: v.updatedAt } : {}),
            };
        }
        setChanges(safe);
      }
    } catch {
      setStorageOK(false);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ version: 1, changes }));
      setStorageOK(true);
    } catch {
      setStorageOK(false);
    }
  }, [changes, loaded]);
  const items = useMemo(() => roadmap.items.map((item) => ({ ...item, ...changes[item.id] })), [changes]);
  const visible = items.filter(
    (item) =>
      (milestone === 'all' || item.milestone === milestone) &&
      (status === 'all' || item.status === status) &&
      `${item.id} ${item.title} ${item.goal} ${item.owner} ${item.criteria}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const completed = items.filter((i) => i.status === 'done').length;
  const gItems = items.filter((i) => i.milestone === G_MILESTONE);
  const gCount = (value: Status) => gItems.filter((i) => i.status === value).length;
  const gDone = gCount('done'),
    gActive = gCount('in_progress'),
    gBlocked = gCount('blocked'),
    gPlanned = gCount('planned');
  const gShare = (count: number) => (100 * count) / Math.max(1, gItems.length);
  const article = gamification.articles.find((a) => a.id === doc) ?? gamification.articles[0];
  const go = (value: string) => {
    setTab(value);
    history.replaceState({}, '', `#${value}`);
  };
  const observations = review.evidence.filter(
    (e) =>
      (reviewApp === 'all' || e.product === reviewApp) &&
      `${e.id} ${e.product} ${e.summary} ${e.requirement} ${e.themes.join(' ')}`
        .toLowerCase()
        .includes(reviewQuery.toLowerCase()),
  );
  const update = (id: string, value: { status?: Status; note?: string }) =>
    setChanges((prev) => ({ ...prev, [id]: { ...prev[id], ...value, updatedAt: new Date().toISOString() } }));
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    try {
      localStorage.setItem('fact-duel-online-theme', next ? 'light' : 'dark');
    } catch {}
  };
  return (
    <div className="studio">
      <a href="#studio-content" className="skip-link">
        Skip to product plan
      </a>
      <header className="studio-header">
        <a href="/" className="brand" aria-label="Jaanta Hai Kya home">
          Jaanta Hai <span>Kya</span>
        </a>
        <span className="studio-label">PRODUCT STUDIO</span>
        <div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={light ? 'Use dark theme' : 'Use light theme'}
            onClick={toggleTheme}
          >
            {light ? <Moon /> : <Sun />}
          </Button>
          <a className="studio-back" href="/">
            <ArrowLeft size={16} />
            Back to play
          </a>
        </div>
      </header>
      <main id="studio-content" className="studio-main">
        <div className="studio-hero">
          <p className="eyebrow">DECISIONS, EVIDENCE & THE NEXT MOVE · 12 SEP 2026</p>
          <h1>
            A reason to start.
            <br />
            <span>A reason to finish.</span>
          </h1>
          <p>
            The Clubhouse now leads into finite expeditions and direct duels. Inspect the new scoring rules,
            durable progression, research and advisor repairs below.
          </p>
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            history.replaceState({}, '', `#${value}`);
          }}
        >
          <div className="studio-tab-scroll">
            <TabsList className="studio-tabs" aria-label="Product Studio sections">
              <TabsTrigger value="overview">Decisions</TabsTrigger>
              <TabsTrigger value="gamification">
                Gamification{' '}
                <span>
                  {gDone}/{gItems.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="voices">Player voices · {review.sampleCount}</TabsTrigger>
              <TabsTrigger value="roadmap">
                Roadmap{' '}
                <span>
                  {completed}/{items.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="market">Market & sizing</TabsTrigger>
              <TabsTrigger value="experience">Experience research</TabsTrigger>
              <TabsTrigger value="sources">Sources · {sourceData.length}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview">
            <section className="studio-highlight">
              <div>
                <p className="eyebrow">THE EXECUTIVE DECISION</p>
                <h2>
                  Choose a story.
                  <br />
                  Make your call.
                </h2>
                <p>
                  One new solo mode: nine six-question routes with Steady/Bold scoring, saved chapters and
                  completion stamps. Three competitive duel formats remain directly playable.
                </p>
                <Button onClick={() => setTab('roadmap')}>
                  Open the working roadmap
                  <ArrowRight />
                </Button>
              </div>
              <img
                src="/art/rivalry-stage.webp"
                alt="Original metallic lightning token and a sports sphere with luminous orbital rings"
              />
            </section>
            <div className="studio-summary">
              <article>
                <Layers />
                <strong>9 authored expeditions</strong>
                <p>
                  Three chapters, six existing facts, one deliberate finish. This is one new solo mechanic
                  with nine content packs.
                </p>
              </article>
              <article>
                <BookOpen />
                <strong>Confidence with consequences</strong>
                <p>
                  Steady +2/0 or Bold +3/−1. First answers lock; first-run results stay separate from practice
                  bests.
                </p>
              </article>
              <article>
                <CheckCircle2 />
                <strong>Two independent passes</strong>
                <p>
                  Four concrete repairs: committed-result sounds, settings intent, score feasibility and
                  consistent stamp ownership.
                </p>
              </article>
            </div>
            <div className="studio-note">
              <strong>Current release decisions come first.</strong>
              <p>
                The expedition record supersedes v5’s lobby hierarchy. Existing duel fairness and settlement
                contracts remain in effect. Empirical user, browser, device and WAN gates remain open.
              </p>
            </div>
            <Article nodes={expeditionDecisions} />
            <div className="research-downloads">
              <a href="/product/expeditions/decision-record.md" download>
                Current expedition decisions
                <Download size={16} />
              </a>
              <a href="/product/expeditions/design-research.md" download>
                Research & scoring rationale
                <Download size={16} />
              </a>
              <a href="/product/expeditions/advisor-first.md" download>
                Advisor pass 1<Download size={16} />
              </a>
              <a href="/product/expeditions/advisor-second.md" download>
                Advisor pass 2 + repairs
                <Download size={16} />
              </a>
              <a href="/product/expeditions/verification.md" download>
                Current verification
                <Download size={16} />
              </a>
            </div>
            <details className="brief-disclosure">
              <summary>Expedition research: primary sources, mechanics and limits</summary>
              <Article nodes={expeditionResearch} />
            </details>
            <details className="brief-disclosure">
              <summary>Historical v5 rivalry decisions</summary> <Article nodes={rivalryDecisions} />
              <div className="research-downloads">
                <a href="/product/rivalry/decision-record.md" download>
                  Historical v5 rivalry decisions
                  <Download size={16} />
                </a>
                <a href="/product/rivalry/advisor-first.md" download>
                  Rivalry advisor 1<Download size={16} />
                </a>
                <a href="/product/rivalry/advisor-second.md" download>
                  Rivalry advisor 2<Download size={16} />
                </a>
                <a href="/product/rivalry/verification.md" download>
                  Historical v5 verification
                  <Download size={16} />
                </a>
              </div>
            </details>
            <details className="brief-disclosure">
              <summary>Historical v4 Curiosity Arcade decisions</summary>
              <Article nodes={review.decisions} />
            </details>
            <div className="research-downloads">
              <a href="/product/review-decision-record.md" download>
                Historical v4 decision record
                <Download size={16} />
              </a>
              <a href="/product/advisor-loop1.md" download>
                Arcade advisor loop 1<Download size={16} />
              </a>
              <a href="/product/advisor-loop2.md" download>
                Arcade advisor loop 2<Download size={16} />
              </a>
              <a href="/product/release-verification.md" download>
                Historical v4 verification
                <Download size={16} />
              </a>
            </div>
            <details className="brief-disclosure">
              <summary>Historical v3 decisions and reviews</summary>
              <p className="small-note">
                Preserved as earlier design history. Current decisions above supersede its visual identity,
                journal storage and input details.
              </p>
              <Article nodes={historicalDecisions} />
              <div className="research-downloads">
                <a href="/product/decision-record.md" download>
                  Historical decision record
                  <Download size={16} />
                </a>
                <a href="/product/ux-review-loop1.md" download>
                  Historical review 1<Download size={16} />
                </a>
                <a href="/product/ux-review-loop2.md" download>
                  Historical review 2<Download size={16} />
                </a>
              </div>
            </details>
          </TabsContent>
          <TabsContent value="voices">
            <div className="roadmap-heading">
              <div>
                <p className="eyebrow">REVIEW PANEL · 12 SEPTEMBER 2026</p>
                <h2>Learn from the friction.</h2>
                <p>
                  A purposive sample of 32 distinct public review observations across eight selected products.
                  Dates, locators, official checks and counterexamples are retained. Review-level app versions
                  are unknown; these are reported experiences, not reproduced defects.
                </p>
              </div>
            </div>
            <div className="studio-note">
              <strong>Qualitative evidence, not a league table.</strong>
              <p>
                Searches favored actionable friction, so the sample overweights problems. It cannot estimate
                prevalence, customer satisfaction, global audience preferences or the effect of this redesign.
                Full methods and source-access limitations appear in the briefs below.
              </p>
            </div>
            <div className="review-controls">
              <label className="studio-search">
                <Search size={18} />
                <Input
                  aria-label="Search review observations"
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  placeholder="Search ads, timers, progress, sources…"
                />
              </label>
              <label>
                Product
                <select value={reviewApp} onChange={(e) => setReviewApp(e.target.value)}>
                  <option value="all">All eight products</option>
                  {[...new Set(review.evidence.map((e) => e.product))].map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="small-note" role="status">
              {observations.length} observations shown. Source links may open a shared listing; use the
              retained title/locator and date. Proposed requirements are design judgments; the Decisions and
              Roadmap tabs state shipping status.
            </p>
            <div
              className="table-scroll review-evidence-table"
              tabIndex={0}
              role="region"
              aria-label="Review evidence table; scroll horizontally on narrow screens"
            >
              <table>
                <thead>
                  <tr>
                    <th>Product / date</th>
                    <th>Observed account</th>
                    <th>Proposed requirement</th>
                    <th>Context / source</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((e) => (
                    <tr key={e.id}>
                      <th scope="row">
                        <span>
                          {e.id} · {e.product}
                        </span>
                        <small>
                          {e.date}
                          {e.experienceDate && e.experienceDate !== e.date
                            ? ` · experienced ${e.experienceDate}`
                            : ''}
                        </small>
                        <span className="review-valence">{e.valence}</span>
                      </th>
                      <td>
                        <p>{e.summary}</p>
                        <small>{e.themes.join(' · ')}</small>
                      </td>
                      <td>{e.requirement}</td>
                      <td>
                        <details>
                          <summary>Inspect context</summary>
                          <p>
                            {e.platform} · build {e.version}
                          </p>
                          <p>{e.limits}</p>
                          <p>Locator: {e.locator}</p>
                          <p>
                            Official-check IDs:{' '}
                            {e.officialChecks.length
                              ? e.officialChecks.join(', ')
                              : 'None recorded; do not infer corroboration.'}
                          </p>
                        </details>
                        <a href={e.url} target="_blank" rel="noopener noreferrer">
                          Open review source
                          <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!observations.length && (
              <div className="empty-surface">
                <p>No observations match these filters.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewQuery('');
                    setReviewApp('all');
                  }}
                >
                  Show all observations
                </Button>
              </div>
            )}
            <div className="research-downloads">
              <a href="/product/review-research.md" download>
                Complete research report
                <Download size={16} />
              </a>
              <a href="/product/trivia-evidence.json" download>
                Trivia evidence JSON
                <Download size={16} />
              </a>
              <a href="/product/learning-evidence.json" download>
                Learning evidence JSON
                <Download size={16} />
              </a>
              <a href="/product/skill-application.md" download>
                Skill application panel
                <Download size={16} />
              </a>
            </div>
            <details className="brief-disclosure">
              <summary>Trivia competitors: 16 observations, official checks and method</summary>
              <Article nodes={review.trivia} />
            </details>
            <details className="brief-disclosure">
              <summary>Learning products: 16 observations, official checks and method</summary>
              <Article nodes={review.learning} />
            </details>
            <details className="brief-disclosure">
              <summary>Historical v4 research: psychology, book excerpts and 3D</summary>
              <div className="studio-note">
                <p>
                  Recommendations are proposals. The lead adapted the mission names and counts; current
                  behavior is specified in Decisions. Only accessible source passages and excerpts were read.
                </p>
              </div>
              <Article nodes={review.experience} />
              <div className="research-downloads">
                <a href="/product/experience.md" download>
                  Experience brief
                  <Download size={16} />
                </a>
                <a href="/product/experience-sources.json" download>
                  Design source ledger
                  <Download size={16} />
                </a>
              </div>
            </details>
          </TabsContent>
          <TabsContent value="roadmap">
            <div className="roadmap-heading">
              <div>
                <p className="eyebrow">
                  {items.length} ISSUES · {[...new Set(items.map((i) => i.milestone))].length} MILESTONES
                </p>
                <h2>From built to proven.</h2>
                <p>
                  Status and notes are editable on this browser. This is a planning workspace, not live
                  telemetry or an unattended agent service.
                </p>
              </div>
              <div className="roadmap-actions">
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      { version: 1, exportedAt: new Date().toISOString(), baselineAsOf: roadmap.asOf, items },
                      'fact-duel-roadmap.json',
                    )
                  }
                >
                  <Download />
                  Export plan
                </Button>
                <Button variant="ghost" onClick={() => setResetOpen(true)}>
                  <RotateCcw />
                  Reset edits
                </Button>
              </div>
            </div>
            {!storageOK && (
              <p className="error-box" role="status">
                This browser could not save the plan. Keep an exported copy before leaving.
              </p>
            )}
            <div className="roadmap-progress">
              <div>
                <strong>
                  {completed} of {items.length} marked done
                </strong>
                <span>
                  {Math.round((100 * completed) / items.length)}% of tracked issues · tasks differ in size
                </span>
              </div>
              <progress value={completed} max={items.length} aria-label="Roadmap issues marked done" />
            </div>
            <div className="milestone-overview">
              {[...new Set(items.map((i) => i.milestone))].map((name, i) => {
                const group = items.filter((t) => t.milestone === name),
                  done = group.filter((t) => t.status === 'done').length;
                return (
                  <button
                    key={name}
                    aria-pressed={milestone === name}
                    onClick={() => setMilestone(milestone === name ? 'all' : name)}
                  >
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    <strong>{name}</strong>
                    <span>
                      {done} / {group.length} done
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="roadmap-filters">
              <label className="studio-search">
                <Search size={18} />
                <Input
                  aria-label="Search roadmap issues"
                  placeholder="Find an issue, goal or owner…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Milestone
                <select value={milestone} onChange={(e) => setMilestone(e.target.value)}>
                  <option value="all">All milestones</option>
                  {[...new Set(items.map((i) => i.milestone))].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="small-note" role="status">
              {visible.length} matching issues. P0 = release or trust gate; P1 = next priority; P2 = gated
              expansion. Role owners are assignments for future work, not a claim of staffed employees.
            </p>
            <div className="roadmap-list">
              {visible.map((item) => (
                <details className="roadmap-item" key={item.id}>
                  <summary>
                    <span className={`status-dot status-${item.status}`} aria-label={label(item.status)}>
                      {item.status === 'done' ? (
                        <Check size={16} />
                      ) : item.status === 'blocked' ? (
                        <Lock size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                    </span>
                    <span className="issue-summary">
                      <small>
                        {item.id} · {item.milestone} · {item.priority}
                      </small>
                      <strong>{item.title}</strong>
                      <span>{item.owner}</span>
                    </span>
                    <span className={`status-pill status-${item.status}`}>{label(item.status)}</span>
                  </summary>
                  <div className="issue-body">
                    <p className="issue-goal">{item.goal}</p>
                    <dl>
                      <div>
                        <dt>Acceptance evidence</dt>
                        <dd>{item.criteria}</dd>
                      </div>
                      <div>
                        <dt>Current evidence</dt>
                        <dd>{item.evidence}</dd>
                      </div>
                      <div>
                        <dt>Next action</dt>
                        <dd>{item.next}</dd>
                      </div>
                      <div>
                        <dt>Dependencies</dt>
                        <dd>
                          {item.dependencies.length
                            ? item.dependencies
                                .map((id) => {
                                  const dependency = items.find((i) => i.id === id);
                                  return `${id} · ${label(dependency?.status ?? 'planned')}`;
                                })
                                .join(' / ')
                            : 'No prior task required'}
                        </dd>
                      </div>
                    </dl>
                    <div className="issue-edit">
                      <label htmlFor={`status-${item.id}`}>
                        Planning status
                        <select
                          id={`status-${item.id}`}
                          value={item.status}
                          onChange={(e) => update(item.id, { status: e.target.value as Status })}
                          disabled={!loaded}
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor={`note-${item.id}`}>
                        Decision / evidence note
                        <textarea
                          id={`note-${item.id}`}
                          value={item.note ?? ''}
                          onChange={(e) => update(item.id, { note: e.target.value })}
                          maxLength={2000}
                          disabled={!loaded}
                          placeholder="Add an observation, evidence link or decision date…"
                          rows={3}
                        />
                      </label>
                    </div>
                    {item.updatedAt && <small>Local edit: {new Date(item.updatedAt).toLocaleString()}</small>}
                  </div>
                </details>
              ))}
            </div>
            {visible.length === 0 && (
              <div className="empty-surface">
                <h3>No issues match these filters.</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setMilestone('all');
                  }}
                >
                  Show all issues
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="gamification">
            <div className="roadmap-heading">
              <div>
                <p className="eyebrow">
                  RELEASE RECORD · {G_RELEASE.toUpperCase()} · {gItems.length} ISSUES · {gItems[0]?.id}–
                  {gItems[gItems.length - 1]?.id}
                </p>
                <h2>{G_RELEASE}. Know it, prove it.</h2>
                <p>
                  The gamification release record: design bible, execution roadmap, decision record and
                  research brief. The progress below counts only the “{G_MILESTONE}” milestone and applies the
                  status edits saved in this browser.
                </p>
              </div>
              <div className="roadmap-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMilestone(G_MILESTONE);
                    setStatus('all');
                    setQuery('');
                    go('roadmap');
                  }}
                >
                  Open G-issues in the roadmap
                  <ArrowRight />
                </Button>
              </div>
            </div>
            <section className="gam-progress" aria-labelledby="gam-progress-title">
              <header>
                <strong id="gam-progress-title">
                  {gDone} of {gItems.length} {G_RELEASE} issues marked done
                </strong>
                <span>{Math.round(gShare(gDone))}% of the G-milestone · tasks differ in size</span>
              </header>
              <div
                className="gam-bar"
                role="img"
                aria-label={`${gDone} done, ${gActive} in progress, ${gBlocked} blocked, ${gPlanned} planned`}
              >
                <span className="status-done" style={{ width: `${gShare(gDone)}%` }} />
                <span className="status-in_progress" style={{ width: `${gShare(gActive)}%` }} />
                <span className="status-blocked" style={{ width: `${gShare(gBlocked)}%` }} />
              </div>
              <ul className="gam-counts">
                <li className="status-done">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <strong>{gDone}</strong>
                  <span>Done</span>
                </li>
                <li className="status-in_progress">
                  <Clock size={16} aria-hidden="true" />
                  <strong>{gActive}</strong>
                  <span>In progress</span>
                </li>
                <li className="status-planned">
                  <CircleDashed size={16} aria-hidden="true" />
                  <strong>{gPlanned}</strong>
                  <span>Planned</span>
                </li>
                {gBlocked > 0 && (
                  <li className="status-blocked">
                    <Lock size={16} aria-hidden="true" />
                    <strong>{gBlocked}</strong>
                    <span>Blocked</span>
                  </li>
                )}
              </ul>
            </section>
            <nav className="gam-docnav" aria-label="Gamification records">
              {gamification.articles.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={article?.id === a.id}
                  onClick={() => setDoc(a.id)}
                >
                  {a.title}
                </button>
              ))}
            </nav>
            {article && (
              <>
                <div className="gam-doc-meta">
                  <p className="small-note">
                    {article.title} · generated from <code>{article.source.slice(1)}</code> ·{' '}
                    {gamification.generatedAt.slice(0, 10)}
                  </p>
                  <a href={article.source} download>
                    Download markdown
                    <Download size={16} />
                  </a>
                </div>
                <Article key={article.id} nodes={article.nodes} />
              </>
            )}
            <div className="research-downloads">
              {gamification.articles.map((a) => (
                <a key={a.id} href={a.source} download>
                  {a.title}
                  <Download size={16} />
                </a>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="market">
            <div className="studio-note">
              <strong>Models, not measured demand.</strong>
              <p>
                The 57.6 million base SAM is a future scenario with assumed interest and English readiness.
                Today’s private tester access and sample content are much narrower. The formulas and
                sensitivity table below make those assumptions inspectable.
              </p>
            </div>
            <Article nodes={research.market} />
            <div className="research-downloads">
              <a href="/product/market.md" download>
                Market brief
                <Download size={16} />
              </a>
              <a href="/product/sources-market.json" download>
                Sources and model inputs
                <Download size={16} />
              </a>
            </div>
          </TabsContent>
          <TabsContent value="experience">
            <div className="studio-note">
              <strong>Research recommendations, with deliberate adaptations.</strong>
              <p>
                This historical v3 brief records the earlier psychologist/designer workstream. The historical
                v4 Curiosity Arcade brief is in Player voices; current Jaanta Hai Kya decisions are in Decisions.
                It is not a shipping checklist. The Decisions tab documents the chosen colors, three modes,
                journal and sound behavior; the roadmap tracks deferred screen contracts. Book coverage is
                limited to accessible excerpts, author descriptions and publisher contents.
              </p>
            </div>
            <Article nodes={research.design} />
            <div className="research-downloads">
              <a href="/product/game-design.md" download>
                Experience brief
                <Download size={16} />
              </a>
              <a href="/product/sources-design.json" download>
                Research source ledger
                <Download size={16} />
              </a>
            </div>
          </TabsContent>
          <TabsContent value="sources">
            <div className="roadmap-heading">
              <div>
                <p className="eyebrow">PRIMARY SOURCES & ACCESS BOUNDARIES</p>
                <h2>Evidence you can inspect.</h2>
                <p>
                  Current public product documentation, audience reports, original research and
                  author/publisher material. Sources checked 12 September 2026; individual publication dates
                  are listed below. No proprietary competitor code or full-book access is claimed.
                </p>
              </div>
            </div>
            <div className="research-downloads">
              <a href="/product/sources-all.json" download>
                Complete source ledger
                <Download size={16} />
              </a>
              <a href="/product/resource-notices.md" download>
                Resource notices
                <Download size={16} />
              </a>
            </div>
            <div className="source-list">
              {sourceData.map((s) => (
                <article key={s.id}>
                  <small>
                    {s.id} · {s.publisher} · {s.date}
                  </small>
                  <h3>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                      <ExternalLink size={16} />
                    </a>
                  </h3>
                  <p>{s.scope}</p>
                  <p className="source-limits">
                    <strong>Limits:</strong> {s.limits}
                  </p>
                </article>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer>
        <span>Jaanta Hai Kya · Product Studio</span>
        <span>Private playtest · Free coins · Evidence before expansion</span>
      </footer>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your planning edits?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores the release roadmap and removes status changes and notes saved in this browser.
              Export the plan first if you want to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep edits</AlertDialogCancel>
            <AlertDialogAction onClick={() => setChanges({})}>Reset to release plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
