import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT_FALLBACK_MS, startMatchSearch } from '../lib/jhk-online/match-search.mjs';

const flush = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
function fixture(overrides = {}) {
  let clock=0,id=0;const timers=new Map(),events=[];
  const waiting={match:{id:'room-one',phase:'waiting',players:[{id:'self'}]}};
  const human={match:{...waiting.match,players:[{id:'self'},{id:'human'}]}};
  const options={queue:async()=>waiting,snapshot:async()=>waiting,leave:async room=>events.push(['leave',room]),onHuman:data=>events.push(['human',data.match.id]),onBot:()=>events.push(['bot']),onError:()=>events.push(['error']),setTimer:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimer:key=>timers.delete(key),...overrides};
  const search=startMatchSearch(options);
  const advance=async ms=>{const end=clock+ms;while(true){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}clock=end;await flush();};
  return {search,events,advance,waiting,human,timers};
}
test('no rival starts one bot at five seconds and abandons zero-stake queue',async()=>{
 const f=fixture();await flush();await f.advance(BOT_FALLBACK_MS-1);assert.equal(f.search.state,'searching');assert.deepEqual(f.events,[]);
 await f.advance(1);assert.equal(f.search.state,'bot');assert.deepEqual(f.events,[['bot'],['leave','room-one']]);await f.advance(20000);assert.equal(f.events.filter(e=>e[0]==='bot').length,1);assert.equal(f.timers.size,0);
});
test('human before the deadline cancels fallback and is never left by cleanup',async()=>{
 const f=fixture({snapshot:async()=>({match:{id:'room-one',phase:'waiting',players:[{id:'self'},{id:'rival'}]}})});await flush();await f.advance(500);assert.equal(f.search.state,'human');f.search.cancel();await f.advance(10000);assert.deepEqual(f.events,[['human','room-one']]);
});
test('late queue response after fallback is left and cannot replace the bot',async()=>{
 let resolve;const f=fixture({queue:()=>new Promise(r=>{resolve=r;})});await flush();await f.advance(5000);assert.deepEqual(f.events,[['bot']]);resolve(f.human);await flush();assert.deepEqual(f.events,[['bot'],['leave','room-one']]);assert.equal(f.search.state,'bot');
});
test('cancelled search has no bot or human and cleans a late response once',async()=>{
 let resolve;const f=fixture({queue:()=>new Promise(r=>{resolve=r;})});await flush();f.search.cancel();f.search.cancel();resolve(f.waiting);await flush();await f.advance(10000);assert.equal(f.search.state,'cancelled');assert.deepEqual(f.events,[['leave','room-one']]);
});
test('network error retains five-second fallback rather than trapping quick play',async()=>{
 const f=fixture({queue:async()=>{throw new Error('offline');}});await flush();assert.deepEqual(f.events,[['error']]);await f.advance(4999);assert.equal(f.search.state,'searching');await f.advance(1);assert.equal(f.search.state,'bot');assert.deepEqual(f.events,[['error'],['bot']]);
});
test('slow identity creation may finish but must not queue after fallback',async()=>{
 let identityReady;let queued=0;const f=fixture({queue:async isActive=>{await new Promise(r=>{identityReady=r;});if(!isActive())return null;queued++;return f.waiting;}});await flush();await f.advance(5000);identityReady();await flush();assert.equal(queued,0);assert.deepEqual(f.events,[['bot']]);
});
test('a delayed snapshot cannot launch a human duel after the bot deadline',async()=>{
 let finishSnapshot;const f=fixture({snapshot:()=>new Promise(resolve=>{finishSnapshot=resolve;})});await flush();await f.advance(500);await f.advance(4500);assert.equal(f.search.state,'bot');finishSnapshot(f.human);await flush();assert.deepEqual(f.events,[['bot'],['leave','room-one']]);
});
test('unconfigured backend still reaches one bot at the deadline',async()=>{
 const f=fixture({queue:async()=>{throw Object.assign(new Error('No backend'),{code:'UNCONFIGURED'});}});await flush();await f.advance(5000);assert.equal(f.search.state,'bot');assert.deepEqual(f.events,[['error'],['bot']]);
});
