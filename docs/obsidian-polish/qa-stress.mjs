/** Local assertions and instrumented audio cleanup accounting; no browser or network calls. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { cricketOutcome, createCricketMomentGate } from '../../lib/cricket-outcomes.mjs';
import { getPrefs, setPref, reducedMotion, subscribePrefs, PREF_STORAGE_KEYS } from '../../lib/fx/prefs.ts';

const started=performance.now();
const gate=createCricketMomentGate();
let accepted=0, replayed=0;
for(let i=0;i<1000;i++) {
  accepted+=Number(gate.claim(`stress-${i}`));
  replayed+=Number(gate.claim(`stress-${i}`));
  const kind=i%4;
  assert.equal(cricketOutcome({outcome:kind===0?'win':kind===3?'draw':'loss',settled:true,ourScore:kind===1?0:2,theirScore:kind===1?5:3}),['boundary','wicket','run-out','level'][kind]);
  assert.equal(cricketOutcome({outcome:'win',settled:false}),null);
}
assert.equal(accepted,512);assert.equal(replayed,0);assert.equal(gate.claim('stress-0'),false);
const helperMs=performance.now()-started;

const storage=new Map();let prefCallbacks=0;
globalThis.window={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},addEventListener(){},matchMedia(){return {matches:false,addEventListener(){}}}};
const unsubscribe=subscribePrefs(()=>prefCallbacks++);
const prefStart=performance.now();
for(let i=0;i<1000;i++){
  const motion=['full','reduced','off'][i%3];
  setPref('motion',motion);assert.equal(getPrefs().motion,motion);assert.equal(reducedMotion(),motion!=='full');
}
unsubscribe();assert.equal(prefCallbacks,1000);
for(const [raw,expected] of [['-9',0],['9',1],['0.42',.42],['NaN',.35],['Infinity',.35]]){storage.set(PREF_STORAGE_KEYS.volume,raw);assert.equal(getPrefs().volume,expected);}
const prefMs=performance.now()-prefStart;

let prefs={sound:true,volume:.35,motion:'full',haptics:false};
const subscribers=new Set(), visibility=new Set(), timers=new Map();
let timerId=0, createdNodes=0, disconnectedNodes=0, allocatedSamples=0;
let liveNodes=0, maxLiveNodes=0;
function parameter(){return {value:0,setValueAtTime(value){this.value=value},exponentialRampToValueAtTime(value){this.value=value},setTargetAtTime(value){this.value=value}}}
function node(){createdNodes++;liveNodes++;maxLiveNodes=Math.max(maxLiveNodes,liveNodes);let disconnected=false;return {gain:parameter(),frequency:parameter(),Q:parameter(),threshold:parameter(),knee:parameter(),ratio:parameter(),attack:parameter(),release:parameter(),connect(target){return target},disconnect(){if(!disconnected){disconnected=true;disconnectedNodes++;liveNodes--}},start(){},stop(){}}}
const ctx={state:'running',sampleRate:48000,currentTime:0,destination:{},createGain:node,createDynamicsCompressor:node,createBiquadFilter:node,createBufferSource:node,createOscillator:node,createBuffer(_channels,frames){allocatedSamples+=frames;return {getChannelData(){return new Float32Array(frames)}}}};
const document={hidden:false,addEventListener(name,fn){assert.equal(name,'visibilitychange');visibility.add(fn)},removeEventListener(name,fn){visibility.delete(fn)}};
const source=fs.readFileSync(new URL('../../app/cricket-fx/cricket-audio.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const audioModule={exports:{}};
const require=name=>name.endsWith('/prefs')?{getPrefs:()=>prefs,subscribePrefs:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn)}}:name.endsWith('/sound')?{sound:{context:ctx}}:assert.fail(name);
new Function('require','module','exports','document','setTimeout','clearTimeout',js)(require,audioModule,audioModule.exports,document,(fn,ms)=>{assert.equal(ms,2200);const id=++timerId;timers.set(id,fn);return id},id=>timers.delete(id));
const play=audioModule.exports.playCricketCue;
const audioStart=performance.now();
for(let i=0;i<100;i++){
  const stop=play(['boundary','wicket','run-out','level'][i%4]);
  assert.equal(subscribers.size,1);assert.equal(visibility.size,1);assert.equal(timers.size,1);
  if(i%4===0)stop();
  if(i%4===1){prefs={...prefs,sound:false};for(const cb of [...subscribers])cb(prefs);prefs={...prefs,sound:true};}
  if(i%4===2){document.hidden=true;for(const cb of [...visibility])cb();document.hidden=false;}
  if(i%4===3){for(const callback of [...timers.values()])callback();}
  stop();stop();
  assert.equal(liveNodes,0);assert.equal(subscribers.size,0);assert.equal(visibility.size,0);assert.equal(timers.size,0);
}
const afterAudio=createdNodes;
for(const blocked of ['mute','zero','hidden','suspended']){
  prefs={...prefs,sound:blocked!=='mute',volume:blocked==='zero'?0:.35};document.hidden=blocked==='hidden';ctx.state=blocked==='suspended'?'suspended':'running';
  play('boundary')();assert.equal(createdNodes,afterAudio);assert.equal(liveNodes,0);
}
assert.equal(createdNodes,disconnectedNodes);
const audioMs=performance.now()-audioStart;
console.log(JSON.stringify({helpers:{events:1000,claims:2001,accepted,deduplicated:1000,cap:512,elapsedMs:+helperMs.toFixed(2)},prefs:{transitions:1000,notifications:prefCallbacks,volumeEdges:5,elapsedMs:+prefMs.toFixed(2)},audioUnitDouble:{replays:100,createdNodes,disconnectedNodes,remainingNodes:liveNodes,maxLiveNodes,remainingPrefsSubscribers:subscribers.size,remainingVisibilityListeners:visibility.size,remainingTimers:timers.size,allocatedSamples,blockedCases:4,elapsedMs:+audioMs.toFixed(2)},limitations:'Audio graph uses instrumented local unit doubles; browser replay and paint performance require the managed preview.'},null,2));
