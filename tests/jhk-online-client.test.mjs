import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnlineClient, OnlineError } from '../lib/jhk-online/client.mjs';
const STORAGE = { serverSession: 'jhk-live-session-v1', serverRoom: 'jhk-live-room-v1' };

const token = 'a'.repeat(64);
const memory = () => { const values = new Map(); return { getItem:k=>values.get(k) || null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k), values }; };
const response = (data, status=200) => new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json'} });
const session = { id:'player-one', nickname:'Rani', email:'rani@example.org', profileComplete:true, expiresAt:Date.now()+86400000, onlineXp: 90 };
const details = { nickname:'Rani', email:'rani@example.org', adultConfirmed:true, termsVersion:'beta-1' };

test('online transport does not contact an unconfigured or insecure endpoint', async () => {
  let calls=0;
  for (const url of ['', 'http://remote.example/game', 'javascript:bad']) {
    const client=createOnlineClient({url,fetcher:async()=>{calls++;}});
    await assert.rejects(client.connect('Rani'), e=>e.code==='UNCONFIGURED');
  }
  assert.equal(calls,0);
});
test('profile credential stays in header and resumes without creating another profile', async () => {
  const storage=memory(); const calls=[];
  const fetcher=async(url,opts)=>{calls.push({url,opts}); return response({ok:true,serverNow:5000,session,...(JSON.parse(opts.body).action==='session'?{token}:{})});};
  const client=createOnlineClient({url:'https://server.example/game',storage,fetcher});
  await client.createProfile(details);
  assert.equal(calls[0].opts.headers['x-jhk-session'],undefined);
  assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).token,token);
  const resumed=createOnlineClient({url:'https://server.example/game',storage,fetcher});
  await resumed.connect();
  assert.equal(JSON.parse(calls[1].opts.body).action,'profile');
  assert.equal(calls[1].opts.headers['x-jhk-session'],token);
  assert.equal(calls[1].opts.headers['x-region'],'ap-south-1');
  assert.ok(!calls[1].url.includes(token));
  assert.ok(!calls[1].opts.body.includes(token));
  assert.equal(calls[1].opts.credentials,'omit');
  assert.equal(resumed.session.onlineXp,90, 'cumulative XP comes from the server profile, not local progression');
});
test('server projection clock uses monotonic request midpoint and best RTT', async () => {
  let now=1000; let server=9000; let delay=20;
  const client=createOnlineClient({url:'https://server.example/game',clock:()=>now,fetcher:async()=>{now+=delay;return response({ok:true,serverNow:server,session,token});}});
  await client.createProfile(details);
  assert.equal(client.now(),9010); now+=40;assert.equal(client.now(),9050);
  server=20000;delay=100;await client.request('profile');
  assert.equal(client.latencyMs,20);assert.equal(client.now(),9150);
});
test('malformed and expired credentials cannot silently become a fresh identity',async()=>{
 const storage=memory();storage.setItem(STORAGE.serverSession,JSON.stringify({token:'bad',session}));
 const bad=createOnlineClient({url:'https://server.example/game',storage});assert.equal(bad.session,null);
 storage.setItem(STORAGE.serverSession,JSON.stringify({token,session}));let calls=0;
 const expired=createOnlineClient({url:'https://server.example/game',storage,fetcher:async()=>{calls++;return response({ok:false,error:{code:'SESSION_EXPIRED',message:'Guest identity expired.'}},401);}});
 await assert.rejects(expired.connect('Rani'),e=>e.code==='SESSION_EXPIRED');assert.equal(calls,1);assert.equal(expired.session.id,session.id);
 expired.forget();assert.equal(expired.session,null);assert.equal(storage.getItem(STORAGE.serverSession),null);
});
test('answer retry sends identical idempotency payload; transport does not score locally',async()=>{
 const storage=memory();storage.setItem(STORAGE.serverSession,JSON.stringify({token,session}));const payloads=[];let attempts=0;
 const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(_,opts)=>{payloads.push(JSON.parse(opts.body));if(attempts++===0)throw new Error('Dropped after commit');return response({ok:true,serverNow:5000,match:{receipt:{correct:true,xp:30}}});}});
 const answer={roomId:'room',round:1,choice:2,requestId:'stable-request'};
 await assert.rejects(client.request('answer',answer),e=>e.code==='NETWORK' && e.message==='Connection interrupted. Retry to check the server’s latest state.');const data=await client.request('answer',answer);
 assert.deepEqual(payloads[0],payloads[1]);assert.equal(data.match.receipt.xp,30);assert.equal(storage.values.size,1);
});
test('abort signals stop poll requests; denied storage still permits current-tab profile play',async()=>{
 const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');},removeItem(){throw new Error('denied');}};
 const client=createOnlineClient({url:'https://server.example/game',storage:denied,fetcher:async(_,opts)=>{if(opts.signal.aborted)throw new Error('aborted');return response({ok:true,serverNow:1,session,token});}});
 await client.createProfile(details);assert.equal(client.session.id,session.id);assert.equal(client.rememberedRoom(),null);client.rememberRoom('room');
 const controller=new AbortController();controller.abort();await assert.rejects(client.request('snapshot',{roomId:'room'},{signal:controller.signal}),e=>e.code==='CANCELLED');
});
test('session subscriptions expose stable immutable snapshots and trusted XP only',async()=>{
 const storage=memory();let emitted=0;let reply={ok:true,serverNow:1,session:{...session,balance:100,savings:100},token};
 const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async()=>response(reply)});
 const stop=client.subscribe(()=>emitted++);
 await client.createProfile(details);const first=client.session;
 assert.equal(client.session,first);assert.equal(emitted,1);
 reply={ok:true,serverNow:2,match:{economy:{balance:60,reserved:40,savings:100},receipt:{xp:9999}}};
 await client.request('snapshot',{roomId:'room'});assert.notEqual(client.session,first);assert.equal(first.balance,100);assert.equal(client.session.onlineXp,90);assert.equal(client.session.savings,100);assert.equal(emitted,2);
 const second=client.session;await client.request('snapshot',{roomId:'room'});assert.equal(client.session,second);assert.equal(emitted,2);
 assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).session.onlineXp,90);
 reply={ok:true,serverNow:3,session:{...session,onlineXp:120,balance:60,savings:100}};
 await client.request('profile');assert.equal(client.session.onlineXp,120);assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).session.onlineXp,120);assert.equal(emitted,3);
 client.forget();assert.equal(client.session,null);assert.equal(emitted,4);stop();client.forget();assert.equal(emitted,4);
});
test('late old-identity profile cannot overwrite a new guest or resurrect forgotten credentials',async()=>{
 const storage=memory();storage.setItem(STORAGE.serverSession,JSON.stringify({token,session}));let finishOld;
 const newer={id:'player-two',nickname:'New guest',expiresAt:session.expiresAt,onlineXp:0,balance:100,savings:100};
 const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(_,opts)=>JSON.parse(opts.body).action==='profile'?new Promise(resolve=>{finishOld=resolve;}):response({ok:true,serverNow:2,session:newer,token:'b'.repeat(64)})});
 const old=client.request('profile');client.forget();await client.createProfile({ ...details, nickname:'New player' });
 finishOld(response({ok:true,serverNow:1,session:{...session,onlineXp:9999,title:{name:'stale'}}}));
 await assert.rejects(old,{code:'SESSION_CHANGED'});assert.equal(client.session.id,newer.id);assert.equal(client.session.onlineXp,0);assert.equal(client.session.title,undefined);
 assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).session.id,newer.id);
});

test('JHK never reuses another edition guest or remembered room', () => {
 const storage=memory();
 storage.setItem('hd-server-session', JSON.stringify({token,session}));
 storage.setItem('hd-server-room', 'other-edition-room');
 const client=createOnlineClient({url:'https://server.example/game',storage});
 assert.equal(client.session,null);
 assert.equal(client.rememberedRoom(),null);
});

test('configured play requires server-complete profile and never mints nickname-only guest', async () => {
  const calls=[]; const storage=memory();
  const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(_,options)=>{calls.push(JSON.parse(options.body));return response({ok:true,token,recoveryCode:'save-this-code',session});}});
  await assert.rejects(client.connect(), {code:'PROFILE_REQUIRED'});
  assert.equal(calls.length,0);
  const created=await client.createProfile(details);
  assert.equal(calls[0].action,'session');assert.deepEqual(calls[0],{...details,action:'session'});
  assert.equal(created.recoveryCode,'save-this-code');assert.equal(client.session.profileComplete,true);
  assert.equal(storage.getItem(STORAGE.serverSession).includes('save-this-code'),false,'recovery code never enters session storage');
});

test('recovery rotates bearer without sending the code in URL or the old bearer header',async()=>{
  const storage=memory();storage.setItem(STORAGE.serverSession,JSON.stringify({token,session}));
  const calls=[];const freshToken='b'.repeat(64);
  const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(url,options)=>{
    calls.push({url,headers:options.headers,body:JSON.parse(options.body)});
    return response({ok:true,token:freshToken,session:{...session,onlineXp:140}});
  }});
  const restored=await client.recover('private-code');
  assert.equal(restored.onlineXp,140);
  assert.equal(calls[0].headers['x-jhk-session'],undefined);
  assert.equal(calls[0].body.recoveryCode,'private-code');
  assert.equal(calls[0].url.includes('private-code'),false);
  assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).token,freshToken);
  await client.request('profile');assert.equal(calls[1].headers['x-jhk-session'],freshToken);
  assert.equal(storage.getItem(STORAGE.serverSession).includes('private-code'),false);
});

test('legacy profile upgrade preserves its bearer and server XP, and exposes code once',async()=>{
  const storage=memory();const legacy={...session,email:null,profileComplete:false,onlineXp:330,balance:77};
  storage.setItem(STORAGE.serverSession,JSON.stringify({token,session:legacy}));
  const actions=[];
  const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(_,options)=>{
    const data=JSON.parse(options.body);actions.push({data,token:options.headers['x-jhk-session']});
    return response({ok:true,session:{...legacy,email:details.email,profileComplete:true},recoveryCode:data.email?'legacy-code':undefined});
  }});
  assert.equal((await client.connect()).profileComplete,true);
  const upgraded=await client.updateProfile(details);
  assert.equal(upgraded.recoveryCode,'legacy-code');
  assert.equal(upgraded.session.onlineXp,330);assert.equal(upgraded.session.balance,77);
  assert.deepEqual(actions.map(item=>item.token),[token,token]);
  assert.equal(JSON.parse(storage.getItem(STORAGE.serverSession)).token,token);
  assert.equal(storage.getItem(STORAGE.serverSession).includes('legacy-code'),false);
});
