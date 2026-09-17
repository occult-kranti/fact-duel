'use client';
/**
 * One series over days, as an inline SVG line with a light area wash, a crosshair-and-tooltip
 * hover layer, and a table twin under a disclosure so no value is gated behind the pointer.
 *
 * Marks follow the dataviz card: a 2px round-joined line, an area at ~10% of the series hue, an
 * 8px end marker with a 2px surface ring, hairline solid gridlines one step off the surface, and
 * y ticks at round numbers. Text never wears the series colour — the tooltip and axis are ink.
 * A single series carries no legend box: the figure's title names it.
 *
 * Width is measured with a ResizeObserver so the plot is drawn in pixels rather than stretched
 * from a fixed viewBox, which would distort the stroke and the marker.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { niceCeiling, shortDay, weekday } from './format';

export type LinePoint = { readonly day: string; readonly value: number };

type Props = {
  title: string;
  rows: readonly LinePoint[];
  /** How a value reads in the tooltip, the ticks and the table. */
  format: (n: number) => string;
  /** Column header for the table twin. */
  unit: string;
  tone: 'traffic' | 'search' | 'adsense' | 'game';
};

const HEIGHT = 150;
const PAD = { top: 10, right: 12, bottom: 4, left: 6 };
const TICK_W = 44;

export function LineChart({ title, rows, format, unit, tone }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (prev === w ? prev : w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = rows.length;
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  const ceiling = niceCeiling(max);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const plotW = Math.max(0, width - PAD.left - PAD.right - TICK_W);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / ceiling) * plotH;
  const line = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
  const area = n > 0 ? `${line} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : '';
  const ticks = [0, ceiling / 2, ceiling];
  const shown = hover !== null ? rows[hover] : null;
  const last = rows[n - 1];

  const pick = (clientX: number) => {
    const el = host.current;
    if (!el || n === 0) return;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left - PAD.left;
    const i = n > 1 ? Math.round((px / plotW) * (n - 1)) : 0;
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const onPointer = (event: PointerEvent<HTMLDivElement>) => pick(event.clientX);
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const base = hover ?? n - 1;
      setHover(Math.max(0, Math.min(n - 1, base + (event.key === 'ArrowLeft' ? -1 : 1))));
    } else if (event.key === 'Escape') setHover(null);
  };

  const summary =
    max > 0
      ? `${title} over the last ${n} days: ${format(total)} in total, at most ${format(max)} on any one day. Exact values are in the table below.`
      : `${title} over the last ${n} days: nothing recorded. Exact values are in the table below.`;

  // Tooltip flips to the left of the crosshair once it would leave the plot on the right.
  const tipLeft = shown && hover !== null ? x(hover) : 0;
  const tipFlip = width > 0 && tipLeft > width - 150;

  return (
    <figure className="fd-ops-chart" data-tone={tone}>
      <figcaption className="fd-ops-chart-cap">
        <span className="fd-ops-chart-title">{title}</span>
        <output className="fd-ops-readout" aria-live="off">
          {shown ? (
            <>
              <b>{weekday(shown.day)}</b> {format(shown.value)}
            </>
          ) : last ? (
            <>
              <b>latest</b> {format(last.value)} · <b>total</b> {format(total)}
            </>
          ) : (
            'no days'
          )}
        </output>
      </figcaption>

      <div
        ref={host}
        className="fd-ops-plot"
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={onKey}
      >
        {width > 0 && n > 0 ? (
          <svg width={width} height={HEIGHT} aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                <line className="fd-ops-gridline" x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
                <text className="fd-ops-tick" x={PAD.left + plotW + 8} y={y(t)} dominantBaseline="middle">
                  {format(t)}
                </text>
              </g>
            ))}
            {max > 0 ? <path className="fd-ops-area" d={area} /> : null}
            <path className="fd-ops-line" d={line} />
            {hover !== null ? (
              <line className="fd-ops-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} />
            ) : null}
            <circle className="fd-ops-marker" cx={x(hover ?? n - 1)} cy={y(rows[hover ?? n - 1].value)} r={4} />
          </svg>
        ) : (
          <div style={{ height: HEIGHT }} />
        )}
        {shown ? (
          <div className="fd-ops-tip" data-flip={tipFlip ? 'on' : undefined} style={{ left: tipLeft }} aria-hidden="true">
            <span>{weekday(shown.day)}</span>
            <b>{format(shown.value)}</b>
          </div>
        ) : null}
      </div>

      {n > 0 ? (
        <div className="fd-ops-axis fd-mono" aria-hidden="true">
          <span>{shortDay(rows[0].day)}</span>
          {n > 2 ? <span>{shortDay(rows[Math.floor((n - 1) / 2)].day)}</span> : null}
          <span>{shortDay(last.day)}</span>
        </div>
      ) : null}

      <details className="fd-ops-table-wrap">
        <summary>Show these {n} days as a table</summary>
        <div className="fd-ops-table-scroll">
          <table className="fd-ops-table">
            <caption className="fd-ops-sr">
              {title} for each of the last {n} days.
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.day} data-quiet={row.value === 0 ? 'on' : undefined}>
                  <th scope="row">{weekday(row.day)}</th>
                  <td className="fd-mono">{row.value === 0 ? '0' : format(row.value)}</td>
                </tr>
              ))}
              <tr className="fd-ops-table-total">
                <th scope="row">Total</th>
                <td className="fd-mono">{format(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
