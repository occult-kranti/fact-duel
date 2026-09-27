// Server seed from the existing JHK sports/science bank; no new editorial material.
import fs from 'node:fs';
import { ALL_QUESTIONS } from '../../lib/server/bank.mjs';
const topics = new Map([['Cricket','cricket'],['Football','football'],['Basketball','basketball'],['Baseball','baseball'],['Formula 1','formula-1'],['Space','space'],['Physics','physics'],['Biology','biology'],['Computing','computing']]);
const rows=ALL_QUESTIONS.filter(q=>['sports','science'].includes(q.domain)).map(q=>{
 if(q.options?.length!==4 || new Set(q.options).size!==4 || !Number.isInteger(q.correctIndex) || q.correctIndex<0 || q.correctIndex>3 || !q.sourceUrl) throw new Error(`Invalid JHK source item ${q.id}`);
 return {id:q.id,prompt:{en:q.question},options:q.options.map(en=>({en})),category:q.topic,domain:q.domain,topic:q.topic,subtopic:q.subtopic,difficulty:q.difficulty,files:[q.domain,...(topics.has(q.topic)?[topics.get(q.topic)]:[])],correctIndex:q.correctIndex,explanation:{en:q.explanation},sourceUrl:q.sourceUrl};
});
const sql="-- Existing reviewed JHK sports/science questions; private table.\ninsert into jhk_private.questions(id,payload) select item->>'id',item from jsonb_array_elements($jhk_bank$"+JSON.stringify(rows)+"$jhk_bank$::jsonb) item on conflict(id) do update set payload=excluded.payload;\n";
const target=new URL('./seed-bank.sql',import.meta.url);
if(process.argv.includes('--check')) {if(fs.readFileSync(target,'utf8')!==sql)throw new Error('JHK seed is stale');} else fs.writeFileSync(target,sql);
console.log(JSON.stringify({seed:'jhk',questions:rows.length,checked:process.argv.includes('--check')}));
