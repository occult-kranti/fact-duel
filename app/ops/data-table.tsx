/**
 * A compact ranked table: first column is the key (left-aligned, may wrap), the rest are
 * right-aligned tabular figures. Scrolls horizontally inside its own box on a narrow phone and
 * never widens the page.
 */
export type Column<T> = {
  readonly header: string;
  readonly cell: (row: T) => string;
  /** The key column; left-aligned and allowed to wrap. */
  readonly key?: boolean;
};

type Props<T> = {
  caption: string;
  rows: readonly T[];
  columns: readonly Column<T>[];
  rowKey: (row: T) => string;
  empty: string;
};

export function DataTable<T>({ caption, rows, columns, rowKey, empty }: Props<T>) {
  if (rows.length === 0) return <p className="fd-ops-empty">{empty}</p>;
  return (
    <div className="fd-ops-table-scroll">
      <table className="fd-ops-table fd-ops-table--ranked">
        <caption className="fd-ops-sr">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" data-key={column.key ? 'on' : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) =>
                column.key ? (
                  <th key={column.header} scope="row" data-key="on">
                    {column.cell(row)}
                  </th>
                ) : (
                  <td key={column.header} className="fd-mono">
                    {column.cell(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
