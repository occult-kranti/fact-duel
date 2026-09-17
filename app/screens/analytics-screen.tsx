'use client';
/**
 * Analytics — the measurement surface (`/analytics`).
 *
 * This screen exists to make one claim checkable: the app measures whether this player comes back,
 * and the player can see the whole measurement. Everything on it is read from `player.analytics`
 * through the pure engine in lib/analytics.mjs — there is no analytics SDK in this app, no beacon on
 * this path, and no number here that was not recorded on this device.
 *
 * The three rules it must never break:
 *  1. No percentage and no rate. One device is a sample of one; `SAMPLE_CAVEAT` says so once, at the
 *     top, where it cannot be missed.
 *  2. A retention window that has not elapsed is `null`, and `null` reads as "still ahead" — never
 *     as a premature zero.
 *  3. Wherever a session count appears, the 30-minute inactivity convention is named (SESSION_NOTE).
 */
import { useCallback } from 'react';
import {
  Activity,
  ArrowLeft,
  CloudOff,
  Database,
  FileJson,
  Flag,
  Info,
  ShieldCheck,
  Table,
  Trash2,
} from 'lucide-react';
import {
  dailySeries,
  emptyAnalytics,
  exportAnalytics,
  SAMPLE_CAVEAT,
  SESSION_NOTE,
  summary,
  toCsv,
} from '@/lib/analytics.mjs';
import { ActivityChart, type ActivityRow } from './analytics/activity-chart';
import { Comeback } from './analytics/comeback';
import { FunnelList, type Funnel } from './analytics/funnel';
import { downloadText, formatDay, formatDuration, plural, useMeasurementNow } from './analytics/util';
import type { AnalyticsScreenProps } from './types';
import './analytics/analytics.css';

export function AnalyticsScreen({ player, onErase, go }: AnalyticsScreenProps) {
  const now = useMeasurementNow();
  const analytics = player.analytics ?? emptyAnalytics();
  const ready = player.loaded && now > 0;

  const exportJson = useCallback(() => {
    downloadText(
      'fact-duel-measurement.json',
      `${JSON.stringify(exportAnalytics(analytics), null, 2)}\n`,
      'application/json',
    );
  }, [analytics]);
  const exportCsv = useCallback(() => {
    downloadText('fact-duel-measurement.csv', toCsv(analytics), 'text/csv');
  }, [analytics]);

  const head = (
    <header className="fd-an-head">
      <button type="button" className="fd-an-back" onClick={() => go('passport')}>
        <ArrowLeft aria-hidden="true" />
        Player
      </button>
      <p className="fd-an-eyebrow">
        <Database aria-hidden="true" />
        MEASUREMENT · THIS DEVICE
      </p>
      <h1 id="fd-an-title">What this app records</h1>
      <p className="fd-an-lede">
        Everything Jaanta Hai Kya records about how this device is used is on this page, in full, and it is kept
        only in this browser. There is no analytics service behind it and nothing on this screen is uploaded.
      </p>
      <p className="fd-an-caveat" role="note">
        <Info aria-hidden="true" />
        <span>{SAMPLE_CAVEAT}</span>
      </p>
    </header>
  );

  if (!ready)
    return (
      <section className="fd-an" aria-labelledby="fd-an-title">
        {head}
        <p className="fd-an-loading" role="status">
          Reading this device’s record…
        </p>
      </section>
    );

  const s = summary(analytics, now);
  const rows = dailySeries(analytics, now, 30) as readonly ActivityRow[];
  const installed = s.installDay !== null;
  const counted = [
    { label: 'Duel rounds', value: s.totals.rounds },
    { label: 'Matches', value: s.totals.matches },
    { label: 'Expedition cards', value: s.totals.cards },
    { label: 'Quests completed', value: s.totals.quests },
  ];

  return (
    <section className="fd-an" aria-labelledby="fd-an-title">
      {head}

      {/* ---------- retention ---------- */}
      <section className="fd-an-sec" aria-labelledby="fd-an-ret">
        <div className="fd-an-sec-head">
          <div>
            <p className="fd-an-sec-eyebrow">DID YOU COME BACK</p>
            <h2 id="fd-an-ret">Retention</h2>
          </div>
          <span>Three yes/no answers · never a rate</span>
        </div>

        <dl className="fd-an-facts">
          <div>
            <dt>Install day</dt>
            <dd className="fd-mono">{installed ? formatDay(s.installDay) : 'Not recorded yet'}</dd>
          </div>
          <div>
            <dt>Days since install</dt>
            <dd className="fd-mono">{installed ? plural(s.daysSinceInstall, 'day') : '—'}</dd>
          </div>
          <div>
            <dt>Active days</dt>
            <dd className="fd-mono">{plural(s.activeDays, 'day')}</dd>
          </div>
        </dl>

        <Comeback returned={s.returned} daysSinceInstall={s.daysSinceInstall} installed={installed} />

        <p className="fd-an-note">
          Each card is one fact about one device: it came back, it did not, or that day has not finished yet.
          A day that has not arrived is left open rather than counted as a miss, and a day older than the 120
          days this browser keeps is marked as not stored rather than as a no.
        </p>
      </section>

      {/* ---------- activity ---------- */}
      <section className="fd-an-sec" aria-labelledby="fd-an-act">
        <div className="fd-an-sec-head">
          <div>
            <p className="fd-an-sec-eyebrow">HOW THE APP IS USED</p>
            <h2 id="fd-an-act">
              <Activity aria-hidden="true" className="fd-an-sec-icon" />
              Activity
            </h2>
          </div>
          <span>Last 30 days</span>
        </div>

        <div className="fd-an-activity">
          <ActivityChart rows={rows} />

          <dl className="fd-an-facts fd-an-facts--four">
            <div>
              <dt>Sessions</dt>
              <dd className="fd-mono">{s.sessions}</dd>
              <p>Since install, on this device.</p>
            </div>
            <div>
              <dt>Typical session</dt>
              <dd className="fd-mono">{formatDuration(s.medianSessionMs)}</dd>
              <p>Median of each active day’s average — not of individual sessions.</p>
            </div>
            <div>
              <dt>Engaged time</dt>
              <dd className="fd-mono">{formatDuration(s.totalMs)}</dd>
              <p>Counted only while the app is on screen.</p>
            </div>
            <div>
              <dt>Sessions per active day</dt>
              <dd className="fd-mono">{s.sessionsPerActiveDay}</dd>
              <p>Across the {plural(s.activeDays, 'day')} with any activity.</p>
            </div>
          </dl>
        </div>

        <p className="fd-an-note" role="note">
          {SESSION_NOTE}
        </p>

        <div className="fd-an-counted">
          <p className="fd-an-counted-title">What the screens counted</p>
          <ul>
            {counted.map((item) => (
              <li key={item.label}>
                <span className="fd-mono">{item.value}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <p className="fd-an-note">
            Counted once each as they happen — a round when it reveals, a match when it settles, an expedition
            card when it is answered, a quest when it completes. Nothing here earns XP and nothing here leaves
            the device.
          </p>
        </div>
      </section>

      {/* ---------- funnel ---------- */}
      <section className="fd-an-sec" aria-labelledby="fd-an-fun">
        <div className="fd-an-sec-head">
          <div>
            <p className="fd-an-sec-eyebrow">THE FIRST TIME OF EACH</p>
            <h2 id="fd-an-fun">
              <Flag aria-hidden="true" className="fd-an-sec-icon" />
              First steps
            </h2>
          </div>
          <span>Stamped once, ever</span>
        </div>
        <FunnelList funnel={s.funnel as Partial<Funnel>} />
      </section>

      {/* ---------- your data ---------- */}
      <section className="fd-an-sec" aria-labelledby="fd-an-data">
        <div className="fd-an-sec-head">
          <div>
            <p className="fd-an-sec-eyebrow">YOURS TO TAKE OR DELETE</p>
            <h2 id="fd-an-data">Your data</h2>
          </div>
          <span>Built in this browser</span>
        </div>

        <p className="fd-an-note">
          Both files are produced here, in this tab, from the record above — the JSON is the whole stored
          object, the CSV is one row per day with sessions, engaged milliseconds and the four counters.
        </p>

        <div className="fd-an-actions">
          <button type="button" className="fd-an-btn" onClick={exportJson}>
            <FileJson aria-hidden="true" />
            Export JSON
          </button>
          <button type="button" className="fd-an-btn" onClick={exportCsv}>
            <Table aria-hidden="true" />
            Export CSV
          </button>
          <button type="button" className="fd-an-btn fd-an-btn--danger" onClick={onErase}>
            <Trash2 aria-hidden="true" />
            Erase measurement data
          </button>
        </div>

        <p className="fd-an-note">
          <b>Erase</b> opens the same confirmation as <b>Reset local activity</b> in Settings, because it is
          the same single action: there is one reset, and it erases this measurement record together with your
          Vault, expeditions, XP and stamps. Export first if you want to keep a copy.
        </p>

        <ul className="fd-an-privacy">
          <li>
            <CloudOff aria-hidden="true" />
            <span>
              Nothing on this screen is sent anywhere. There is no account, no name, no email, no IP log and
              no device fingerprint in this record.
            </span>
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            <span>
              {s.consent === 'granted'
                ? 'You have opted in to the separate anonymous cohort beacon; the id it uses is in the JSON export. This screen still sends nothing on its own.'
                : 'No anonymous id is stored on this device, and the separate cohort beacon is off.'}
            </span>
          </li>
          <li>
            <Database aria-hidden="true" />
            <span>
              The day-by-day record keeps at most the last 120 days. Older days are dropped from this browser
              entirely rather than summarised.
            </span>
          </li>
        </ul>
      </section>
    </section>
  );
}
