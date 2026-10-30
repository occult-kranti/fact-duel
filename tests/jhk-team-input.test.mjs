import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInput, TEAM_OPERATIONS} from '../supabase/jhk/functions/jhk-game/core.mjs';

const fixtureId='11111111-1111-4111-8111-111111111111';
const requestId='22222222-2222-4222-8222-222222222222';
test('team protocol preserves only server-derived identity, clocks, scores and progression',()=>{
 const {action,payload}=validateInput({action:'team',op:'create',name:'  Gully\u200b   Eleven ',capacity:11,emblem:'bat',palette:'teal',teamId:fixtureId,tag:'FORGED',captainId:fixtureId,points:999,level:9,score:999,xp:999,winnerTeamId:fixtureId,issuedAt:0,deadlineAt:0,stake:100});
 assert.equal(action,'team');
 assert.deepEqual(payload,{op:'create',name:'Gully Eleven',capacity:11,emblem:'bat',palette:'teal'});
});
test('team sizes, banners, palettes and private invite codes have bounded inputs',()=>{
 for(const capacity of [4,6,12,'5',null])assert.throws(()=>validateInput({action:'team',op:'create',name:'Gully',capacity}),{code:'BAD_TEAM'});
 assert.throws(()=>validateInput({action:'team',op:'create',name:'Gully',capacity:5,palette:'paid'}),{code:'BAD_PALETTE'});
 assert.throws(()=>validateInput({action:'team',op:'settings',emblem:'admin'}),{code:'BAD_BANNER'});
 assert.throws(()=>validateInput({action:'team',op:'settings',joinOpen:'true'}),{code:'BAD_TEAM'});
 assert.throws(()=>validateInput({action:'team',op:'join',code:'GULL-12AB'}),{code:'BAD_CODE'});
 assert.equal(validateInput({action:'team',op:'join',code:' abcdef0123456789 '}).payload.code,'ABCDEF0123456789');
 assert.equal(validateInput({action:'team',op:'challenge',targetTag:' gull-12ab '}).payload.targetTag,'GULL-12AB');
});
test('team answer requests cannot supply elapsed time or an invalid question boundary',()=>{
 const valid={action:'team',op:'answer',fixtureId,round:6,choice:3,requestId};
 assert.deepEqual(validateInput({...valid,elapsedMs:1,correct:true,correctIndex:3,serverNow:0}).payload,{op:'answer',fixtureId,round:6,choice:3,requestId});
 for(const patch of [{round:7},{round:0},{round:'1'},{choice:4},{requestId:'reuse'},{fixtureId:'guess'}])assert.throws(()=>validateInput({...valid,...patch}));
 assert.throws(()=>validateInput({action:'team',op:'promoteMe',captainId:fixtureId}),{code:'BAD_TEAM_ACTION'});
 assert.ok(TEAM_OPERATIONS.includes('tournamentLeave'));
 assert.equal(validateInput({action:'team',op:'tournamentLeave',tournamentId:fixtureId}).payload.tournamentId,fixtureId);
});
