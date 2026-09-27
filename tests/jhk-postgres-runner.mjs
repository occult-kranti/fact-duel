/** Isolated real PostgreSQL WASM execution; no remote mutations. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(process.env.PGLITE_MODULE_PATH?pathToFileURL(process.env.PGLITE_MODULE_PATH).href:'@electric-sql/pglite');
const db=new PGlite();
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
try {
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 await db.exec(read('supabase/hisaab/schema.sql')); // Existing sibling remains isolated.
 await db.exec(read('supabase/jhk/schema.sql'));await db.exec(read('supabase/jhk/schema.sql'));
 await db.exec(read('supabase/jhk/seed-bank.sql'));
 for(const file of ['tests/jhk-online-security.sql','tests/jhk-online-economy.sql']) {
  const result=await db.exec(read(file));const evidence=result.flatMap(r=>r.rows??[]).find(r=>r.evidence)?.evidence;
  assert.ok(evidence?.checks>0);console.log(JSON.stringify({suite:evidence.suite,checks:evidence.checks,result:'pass'}));
 }
 assert.equal((await db.query('select count(*)::int n from jhk_private.sessions')).rows[0].n,0);
 const result=await db.exec("begin;set local role service_role;select public.jhk_command(repeat('a',64),'session','{\"nickname\":\"Service test\"}'::jsonb,'runner') as response;rollback;");
 assert.equal(result.flatMap(r=>r.rows??[]).find(r=>r.response)?.response?.session?.balance,100);
 console.log(JSON.stringify({suite:'jhk-upgrade-and-role',checks:3,result:'pass',concurrency:'single-connection; not measured'}));
} finally{await db.close();}
