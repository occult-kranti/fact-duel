import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const out = path.resolve('dist-static');
if (!fs.existsSync(path.join(out, 'index.html'))) throw new Error('Build JHK first.');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify({commit, builtAt:new Date().toISOString(),game:'Jaanta Hai Kya',transport:'Supabase human duels',adsEnabled:false},null,2)+'\n');
const teamCanvas = path.resolve('docs/team-redesign/design-board');
if (fs.existsSync(path.join(teamCanvas, 'index.html'))) {
  const canvasOut = path.join(out, 'design/teams');
  fs.cpSync(teamCanvas, canvasOut, { recursive: true });
  const canvasFile = path.join(canvasOut, 'index.html');
  const base = (process.env.STATIC_BASE || '/fact-duel/').replace(/\/?$/, '/');
  fs.writeFileSync(canvasFile, fs.readFileSync(canvasFile, 'utf8').replaceAll('../../../public/', base));
}
const clubCanvas = path.resolve('docs/club-wars/design-board');
if (fs.existsSync(path.join(clubCanvas, 'index.html'))) {
  const canvasOut = path.join(out, 'design/club-wars');
  fs.cpSync(clubCanvas, canvasOut, { recursive: true });
  const canvasFile = path.join(canvasOut, 'index.html');
  const base = (process.env.STATIC_BASE || '/fact-duel/').replace(/\/?$/, '/');
  fs.writeFileSync(canvasFile, fs.readFileSync(canvasFile, 'utf8').replaceAll('../../../public/', base));
  for (const file of ['ROADMAP.md', 'RESEARCH.md', 'PANEL.md', 'DESIGN.md', 'ART.md', 'DEPLOYMENT.md', 'SERVER.md', 'PITCH.md', 'UI.md']) {
    const source = path.resolve('docs/club-wars', file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(canvasOut, file));
  }
}
const moved = 'https://occult-kranti.github.io/andhbhakt-ya-deshbhakt/';
fs.mkdirSync(path.join(out,'hisaab'),{recursive:true});
fs.writeFileSync(path.join(out,'hisaab/index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Andhbhakt ya Deshbhakt</title><link rel="canonical" href="${moved}"><script>location.replace(${JSON.stringify(moved)}+location.search+location.hash)</script><noscript><meta http-equiv="refresh" content="0;url=${moved}"></noscript><main><h1>HISAAB DO is now Andhbhakt ya Deshbhakt</h1><p><a href="${moved}">Play at the new address</a></p></main></html>`);
fs.mkdirSync(path.join(out,'deck'),{recursive:true});
for (const [from,to] of [['deck.site.html','index.html'],['charts','charts'],['shots','shots'],['factduel-seed-deck.pptx','factduel-seed-deck.pptx']]) {
  const source=path.resolve('public/product/investor',from);
  if(fs.existsSync(source)) fs.cpSync(source,path.join(out,'deck',to),{recursive:true});
}
console.log('Assembled JHK, club canvas, updated pitch deck and old-edition redirect.');
