// Server seed from the reviewed JHK bank. Archives are retained in source, not dealt.
import fs from 'node:fs';
import { ALL_QUESTIONS } from '../../lib/server/bank.mjs';
import { CRICKET_SPICY } from '../../lib/server/questions/cricket-spicy.mjs';
import { CRICKET_EXPANSION } from '../../lib/server/questions/cricket-expansion.mjs';
import { rotationKey, QUESTION_FAMILIES } from '../../lib/question-rotation.mjs';
import { curatedQuestions, RETIRED_QUESTION_IDS } from '../../lib/server/question-curation.mjs';
const topics = new Map([['Cricket','cricket'],['Football','football'],['Basketball','basketball'],['Baseball','baseball'],['Formula 1','formula-1'],['Space','space'],['Physics','physics'],['Biology','biology'],['Computing','computing']]);
const rows=curatedQuestions(ALL_QUESTIONS).filter(q=>['sports','science'].includes(q.domain)).map(q=>{
 if(q.options?.length!==4 || new Set(q.options).size!==4 || !Number.isInteger(q.correctIndex) || q.correctIndex<0 || q.correctIndex>3 || !q.sourceUrl) throw new Error(`Invalid JHK source item ${q.id}`);
 return {id:q.id,prompt:{en:q.question},options:q.options.map(en=>({en})),category:q.topic,domain:q.domain,topic:q.topic,subtopic:q.subtopic,difficulty:q.difficulty,files:[q.domain,...(topics.has(q.topic)?[topics.get(q.topic)]:[]),...(q.subtopic==='Spicy'?['spicy']:[])],correctIndex:q.correctIndex,explanation:{en:q.explanation},sourceUrl:q.sourceUrl,familyKey:rotationKey(q)};
});
const retirement="delete from jhk_private.questions where id in ("+RETIRED_QUESTION_IDS.map(id=>"'"+id+"'").join(',')+");\n";
const insert=(items)=>"insert into jhk_private.questions(id,payload) select item->>'id',item from jsonb_array_elements($jhk_bank$"+JSON.stringify(items)+"$jhk_bank$::jsonb) item on conflict(id) do update set payload=excluded.payload;\n";
const sql="-- Reviewed JHK sports/science questions; private table. Existing room snapshots stay intact.\nbegin;\n"+retirement+insert(rows)+"commit;\n";
const target=new URL('./seed-bank.sql',import.meta.url);
if(process.argv.includes('--check')) {if(fs.readFileSync(target,'utf8')!==sql)throw new Error('JHK seed is stale');} else fs.writeFileSync(target,sql);
const spicyIds=new Set(CRICKET_SPICY.map(q=>q.id));
const delta="-- 2026-10-29 editorial release: retire 4 law cards and upsert 24 sourced Spicy cards only.\n-- Does not modify rooms, answers, profiles, wallets, or other question rows.\nbegin;\n"+retirement+insert(rows.filter(q=>spicyIds.has(q.id)).map(({familyKey,...q})=>q))+"commit;\n";
const deltaTarget=new URL('./migrations/20261029_spicy_content.sql',import.meta.url);
if(process.argv.includes('--check')) {if(fs.readFileSync(deltaTarget,'utf8')!==delta)throw new Error('JHK Spicy delta is stale');} else fs.writeFileSync(deltaTarget,delta);
console.log(JSON.stringify({seed:'jhk',questions:rows.length,checked:process.argv.includes('--check')}));

const expansionIds=new Set(CRICKET_EXPANSION.map(q=>q.id));
const aliasUpdates=Object.entries(QUESTION_FAMILIES).map(([id,family])=>`update jhk_private.questions set payload=jsonb_set(payload,'{familyKey}',to_jsonb('${family}'::text)) where id='${id}';\n`).join('');
const expansionDelta='-- Trophy-road editorial release: exactly 48 new cards and six equivalent-fact family annotations.\n-- No room, answer, profile, reward, or unrelated question rows are modified.\nbegin;\n'+aliasUpdates+insert(rows.filter(q=>expansionIds.has(q.id)))+'commit;\n';
const expansionTarget=new URL('./migrations/20261029223049_jhk_cricket_expansion.sql',import.meta.url);
if(process.argv.includes('--check')) {if(fs.readFileSync(expansionTarget,'utf8')!==expansionDelta)throw new Error('JHK Cricket expansion delta is stale');} else fs.writeFileSync(expansionTarget,expansionDelta);
