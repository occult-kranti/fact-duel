'use client';
/**
 * The 30-day activity chart: two small multiples that share one x axis of days.
 *
 * Sessions per day is the headline read; engaged time per day is the second read, drawn as its own
 * chart underneath rather than as a second y axis on the first one — two measures on two scales in
 * one frame is the mistake that makes a chart lie about correlation.
 *
 * Everything comes from `dailySeries`, which fills absent days with zeros, so the chart can never
 * imply activity the record does not have: a day with nothing shows a baseline tick, not a gap.
 * The exact numbers are one disclosure away in the table below the plots, which is also the
 * accessible twin of the pointer readout.
 */
import { useState } from 'react';
import { formatDuration, formatWeekday, plural } from './util';

export type ActivityRow = {
  readonly day: string;
  readonly sessions: number;
  readonly ms: number;
  readonly rounds: number;
  readonly active: boolean;
};

type PlotProps = {
  rows: readonly ActivityRow[];
  /** Which field the bar height stands for. */
  pick: (row: ActivityRow) => number;
  label: string;
  /** The top of the y scale, printed beside the title in its own unit. */
  max: number;
  /** How that peak reads to a person — a count, or a duration rather than raw milliseconds. */
  peak: string;
  tone: 'sessions' | 'time';
  summary: string;
  hover: number | null;
  onHover: (index: number | null) => void;
};

/**
 * One plot. Bars are 4px-rounded at the data end and anchored to the baseline; a zero day keeps a
 * 2px tick on that baseline so the reader can count the days without counting the bars.
 */
function Plot({ rows, pick, label, max, peak, tone, summary, hover, onHover }: PlotProps) {
  return (
    <div className="fd-an-plot-row">
      <div className="fd-an-plot-head">
        <span className="fd-an-plot-label">{label}</span>
        <span className="fd-an-plot-max fd-mono">{max > 0 ? `peak ${peak}` : 'none yet'}</span>
      </div>
      <div
        className="fd-an-plot"
        data-tone={tone}
        role="img"
        aria-label={summary}
        onPointerLeave={() => onHover(null)}
      >
        {rows.map((row, i) => {
          const value = pick(row);
          const pct = max > 0 && value > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
          return (
            <div
              key={row.day}
              className="fd-an-col"
              data-hover={hover === i ? 'on' : undefined}
              onPointerEnter={() => onHover(i)}
            >
              {pct > 0 ? (
                <span className="fd-an-bar" style={{ height: `${pct}%` }} />
              ) : (
                <span className="fd-an-bar fd-an-bar--zero" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityChart({ rows }: { rows: readonly ActivityRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return null;

  const maxSessions = rows.reduce((n, r) => Math.max(n, r.sessions), 0);
  const maxMs = rows.reduce((n, r) => Math.max(n, r.ms), 0);
  const activeDays = rows.filter((r) => r.sessions > 0).length;
  const totalSessions = rows.reduce((n, r) => n + r.sessions, 0);
  const shown = rows[hover ?? rows.length - 1];
  const first = rows[0],
    last = rows[rows.length - 1];

  return (
    <figure className="fd-an-chart">
      <figcaption className="fd-an-chart-cap">
        <span className="fd-an-chart-title">Day by day</span>
        <output className="fd-an-readout" aria-live="off">
          <b>{formatWeekday(shown.day)}</b>
          <span aria-hidden="true">·</span>
          <span>{plural(shown.sessions, 'session')}</span>
          <span aria-hidden="true">·</span>
          <span>{shown.ms > 0 ? `${formatDuration(shown.ms)} engaged` : 'no engaged time'}</span>
        </output>
      </figcaption>

      <Plot
        rows={rows}
        pick={(r) => r.sessions}
        label="Sessions per day"
        max={maxSessions}
        peak={String(maxSessions)}
        tone="sessions"
        summary={
          maxSessions > 0
            ? `Sessions per day over the last ${rows.length} days: ${totalSessions} in total across ${plural(activeDays, 'day')}, at most ${maxSessions} on any one day. Exact values are in the table below.`
            : `Sessions per day over the last ${rows.length} days: none recorded. Exact values are in the table below.`
        }
        hover={hover}
        onHover={setHover}
      />
      <Plot
        rows={rows}
        pick={(r) => r.ms}
        label="Engaged time per day"
        max={maxMs}
        peak={formatDuration(maxMs)}
        tone="time"
        summary={
          maxMs > 0
            ? `Engaged time per day over the last ${rows.length} days, at most ${formatDuration(maxMs)} on any one day. Exact values are in the table below.`
            : `Engaged time per day over the last ${rows.length} days: none recorded. Exact values are in the table below.`
        }
        hover={hover}
        onHover={setHover}
      />

      <div className="fd-an-axis fd-mono" aria-hidden="true">
        <span>{formatWeekday(first.day)}</span>
        <span>{formatWeekday(last.day)}</span>
      </div>

      <details className="fd-an-table-wrap">
        <summary>Show these {rows.length} days as a table</summary>
        <div className="fd-an-table-scroll">
          <table className="fd-an-table">
            <caption className="fd-an-sr">
              Sessions, engaged time and duel rounds for each of the last {rows.length} days on this device.
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sessions</th>
                <th scope="col">Engaged</th>
                <th scope="col">Rounds</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.day} data-quiet={row.active ? undefined : 'on'}>
                  <th scope="row">{formatWeekday(row.day)}</th>
                  <td className="fd-mono">{row.sessions}</td>
                  <td className="fd-mono">{row.ms > 0 ? formatDuration(row.ms) : '—'}</td>
                  <td className="fd-mono">{row.rounds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
