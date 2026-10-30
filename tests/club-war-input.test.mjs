import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateInput,TEAM_OPERATIONS} from '../supabase/jhk/functions/jhk-game/core.mjs';
const members=Array.from({length:11},()=>randomUUID()), fixtureId=randomUUID();
test('club operations validate IDs, lineups, roles, badges and fresh rematch payloads',()=>{
 for(const op of ['selectLineup','fixtureLineup'])for(const size of [5,11])assert.equal(validateInput({action:'team',op,memberIds:members.slice(0,size),fixtureId}).payload.memberIds.length,size);
 for(const memberIds of [[],members.slice(0,4),[...members.slice(0,4),members[0]],['no',...members.slice(0,4)]])assert.throws(()=>validateInput({action:'team',op:'selectLineup',memberIds}),{code:'BAD_LINEUP'});
 for(const op of ['substitute','readyLineup','stopRecurrence','sendRematch','startBattle','assignRole','assignBadge'])assert.ok(TEAM_OPERATIONS.includes(op));
 assert.throws(()=>validateInput({action:'team',op:'assignRole',memberId:members[0],role:'captain'}),{code:'BAD_ROLE'});
 assert.throws(()=>validateInput({action:'team',op:'assignBadge',memberId:members[0],badge:'admin'}),{code:'BAD_BADGE'});
 assert.throws(()=>validateInput({action:'team',op:'roleConsent',consent:'true'}),{code:'BAD_BADGE'});
 assert.throws(()=>validateInput({action:'team',op:'readyLineup',fixtureId,ready:1}),{code:'BAD_READY'});
 assert.throws(()=>validateInput({action:'team',op:'sendRematch',fixtureId:'no'}),{code:'BAD_TEAM_ID'});
 assert.throws(()=>validateInput({action:'team',op:'accept',fixtureId,recurrence:'daily'}),{code:'BAD_RECURRENCE'});
 const p=validateInput({action:'team',op:'readyLineup',fixtureId,ready:true,permissions:{manageClub:true},draftSentAt:1,warVersion:1,homeReady:true,prepEndsAt:2,stake:100}).payload;
 assert.equal(p.ready,true);for(const key of ['permissions','draftSentAt','warVersion','homeReady','prepEndsAt','stake'])assert.equal(Object.hasOwn(p,key),false);
});
