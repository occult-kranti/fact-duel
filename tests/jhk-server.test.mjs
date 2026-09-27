import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateInput,DUEL_FILES,ECONOMY_RULES} from '../supabase/jhk/functions/jhk-game/core.mjs';
test('JHK requires human server protocol with zero-default simulated stake',()=>{
 assert.deepEqual(validateInput({action:'queue'}),{action:'queue',payload:{stake:0,file:'all'}});
 for(const stake of [-1,1.5,'20',10001])assert.throws(()=>validateInput({action:'queue',stake}),{code:'BAD_STAKE'});
 assert.throws(()=>validateInput({action:'queue',file:'media'}),{code:'BAD_FILE'});
 assert.equal(ECONOMY_RULES.completionReward,10);assert.ok(DUEL_FILES.every(f=>f.rewardMultiplier===1));
});
test('JHK currency assertions stay server-only',()=>{
 assert.deepEqual(validateInput({action:'queue',file:'science',stake:0,score:900,xp:9999,reward:9999,balance:9999,payout:9999}),{action:'queue',payload:{file:'science',stake:0}});
});
test('JHK server contracts contain isolated names and neutral labels',()=>{
 const schema=fs.readFileSync(new URL('../supabase/jhk/schema.sql',import.meta.url),'utf8');const edge=fs.readFileSync(new URL('../supabase/jhk/functions/jhk-game/index.ts',import.meta.url),'utf8');
 assert.match(schema,/create schema if not exists jhk_private/);assert.match(schema,/public\.jhk_command/);assert.match(edge,/x-jhk-session/);assert.match(edge,/rpc\/jhk_command/);
 assert.doesNotMatch(schema+edge,/hisaab|UPI|[Aa]nti.?[Nn]ational|[Dd]esh.?[Bb]hakt/);assert.match(schema,/'coin-champion'/);
});
