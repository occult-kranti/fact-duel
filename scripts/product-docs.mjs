// Convert the gamification markdown records into Studio article nodes.
// Usage: node scripts/product-docs.mjs   (npm: pnpm docs:product)
//
// Reads public/product/gamification/*.md and writes lib/product/gamification.json as
// { generatedAt, articles: [{ id, title, source, nodes }] }. Nodes use the same shape the
// Studio `Article` component already renders: heading { level, text }, paragraph { text },
// bullet { text } and table { rows }. Inline markdown (links, **bold**, `code`) is kept verbatim
// because `Inline` handles it at render time.
//
// Idempotent: the same sources always produce the same file, `generatedAt` is the newest source
// mtime rather than the run time, and the file is left untouched when the articles are unchanged.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'public', 'product', 'gamification');
const outFile = join(root, 'lib', 'product', 'gamification.json');

const fixed = [
  { id: 'design-bible', title: 'Design bible', file: 'design-bible.md' },
  { id: 'roadmap', title: 'Roadmap', file: 'roadmap.md' },
  { id: 'decision-record', title: 'Decision record', file: 'decision-record.md' },
  { id: 'research-brief', title: 'Research brief', file: 'research-brief.md' },
];

const naturalCompare = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const advisorLoops = readdirSync(sourceDir)
  .filter((name) => /^advisor-loop.*\.md$/i.test(name))
  .sort(naturalCompare)
  .map((file) => {
    const suffix = file.replace(/^advisor-loop/i, '').replace(/\.md$/i, '');
    const number = suffix.match(/\d+/)?.[0];
    return {
      id: `advisor-loop${suffix.toLowerCase()}`,
      title: number ? `Advisor loop ${number}` : 'Advisor loop',
      file,
    };
  });
const optional = existsSync(join(sourceDir, 'verification.md'))
  ? [{ id: 'verification', title: 'Verification', file: 'verification.md' }]
  : [];

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|?\s*$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const FENCE = /^\s*(```|~~~)/;
const CONTINUATION = /^\s{2,}\S/;

const collapse = (text) => text.replace(/\s+/g, ' ').trim();
const splitRow = (line) => {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
};
const isBlockStart = (line) =>
  HEADING.test(line) ||
  RULE.test(line) ||
  BULLET.test(line) ||
  NUMBERED.test(line) ||
  TABLE_ROW.test(line) ||
  FENCE.test(line);

function toNodes(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (FENCE.test(line)) {
      const body = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
      i++;
      if (body.length) nodes.push({ type: 'paragraph', text: `\`${body.join(' ').replace(/`/g, "'")}\`` });
      continue;
    }
    if (RULE.test(line)) {
      i++;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      nodes.push({ type: 'heading', level: heading[1].length, text: collapse(heading[2]) });
      i++;
      continue;
    }
    if (TABLE_ROW.test(line)) {
      const rows = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        if (!TABLE_SEPARATOR.test(lines[i])) rows.push(splitRow(lines[i]));
        i++;
      }
      if (rows.length) {
        const width = rows[0].length;
        nodes.push({
          type: 'table',
          rows: rows.map((row) => Array.from({ length: width }, (_, k) => collapse(row[k] ?? ''))),
        });
      }
      continue;
    }
    const item = line.match(BULLET) ?? line.match(NUMBERED);
    if (item) {
      const parts = [item[1]];
      i++;
      while (i < lines.length && lines[i].trim() && CONTINUATION.test(lines[i]) && !isBlockStart(lines[i]))
        parts.push(lines[i++]);
      nodes.push({ type: 'bullet', text: collapse(parts.join(' ')) });
      continue;
    }
    const parts = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) parts.push(lines[i++]);
    nodes.push({ type: 'paragraph', text: collapse(parts.join(' ')) });
  }
  return nodes;
}

let newest = 0;
const articles = [...fixed, ...advisorLoops, ...optional]
  .filter((entry) => {
    const ok = existsSync(join(sourceDir, entry.file));
    if (!ok) console.warn(`product-docs: missing ${entry.file}, skipped`);
    return ok;
  })
  .map((entry) => {
    const path = join(sourceDir, entry.file);
    newest = Math.max(newest, statSync(path).mtimeMs);
    const nodes = toNodes(readFileSync(path, 'utf8'));
    console.log(`product-docs: ${entry.id} ← ${entry.file} (${nodes.length} nodes)`);
    return { id: entry.id, title: entry.title, source: `/product/gamification/${entry.file}`, nodes };
  });

const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : null;
if (previous && JSON.stringify(previous.articles) === JSON.stringify(articles)) {
  console.log(`product-docs: lib/product/gamification.json unchanged (${articles.length} articles)`);
} else {
  const generatedAt = new Date(Math.floor(newest / 1000) * 1000).toISOString();
  writeFileSync(outFile, `${JSON.stringify({ generatedAt, articles }, null, 2)}\n`);
  console.log(`product-docs: wrote lib/product/gamification.json (${articles.length} articles)`);
}
