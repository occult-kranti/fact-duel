import test from 'node:test';
import assert from 'node:assert/strict';
import { clubScorecardText } from '../app/screens/teams/club-share.mjs';
const fixture={status:'finished',homeTeam:{id:'a',name:'Banyan',tag:'BANY-1234',inviteCode:'PRIVATE_SECRET',members:[{nickname:'PRIVATE_MEMBER'}]},awayTeam:{id:'b',name:'Neem',tag:'NEEM-5678'},homeScore:{correct:24},awayScore:{correct:20},winnerTeamId:'a',format:'full',capacity:11};
test('public club result shares actual score, tags and format without invite or member data',()=>{const text=clubScorecardText(fixture);assert.match(text,/Banyan #BANY-1234 24–20 Neem #NEEM-5678/);assert.match(text,/Full over · 6 rounds · 11 v 11/);assert.doesNotMatch(text,/PRIVATE/);});
test('unsettled and no-contest fixtures do not create promotional result copy',()=>{for(const status of ['pending','preparation','active','declined'])assert.equal(clubScorecardText({...fixture,status}),null);assert.equal(clubScorecardText({...fixture,settlementReason:'no-contest'}),null);});
test('draw and exact cup seed result stay distinct',()=>{assert.match(clubScorecardText({...fixture,winnerTeamId:null}),/Honours shared/);assert.match(clubScorecardText({...fixture,tieBreak:'lower-seed'}),/declared cup seed rule/);});
