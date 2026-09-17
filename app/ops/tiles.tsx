/**
 * Stat tiles: label (sentence case, no colon), a value in the UI sans with proportional figures,
 * and an optional one-line note. No delta and no sparkline here — a delta needs a comparison
 * period the sources are not asked for, and a made-up baseline is a made-up number.
 */
export type Tile = { readonly label: string; readonly value: string; readonly note?: string };

export function Tiles({ tiles }: { tiles: readonly Tile[] }) {
  return (
    <dl className="fd-ops-tiles">
      {tiles.map((tile) => (
        <div key={tile.label}>
          <dt>{tile.label}</dt>
          <dd>{tile.value}</dd>
          {tile.note ? <p>{tile.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}
