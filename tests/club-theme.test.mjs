import test from 'node:test';
import assert from 'node:assert/strict';
import {activeClubPalette,applyClubPalette,clubColourMode,emptyClubIdentity,reconcileClubIdentity,CLUB_PALETTES} from '../lib/club-theme.mjs';
import {createOnlineClient} from '../lib/jhk-online/client.mjs';
const profile=(id,tag=null,palette=null)=>({id,nickname:'Rani',profileComplete:true,expiresAt:Date.now()+86400000,teamTag:tag,teamName:tag?'Gully Club':null,teamPalette:palette,teamSize:tag?5:null});
const fullTeam=(id,tag,palette)=>({id:`club-${tag}`,tag,name:'Gully Club',palette,capacity:5,members:[{id}]});
const response=data=>new Response(JSON.stringify({ok:true,...data}),{status:200,headers:{'Content-Type':'application/json'}});

test('100 membership cycles retain only current verified identity and independently respect colour preference',()=>{
 let state=emptyClubIdentity('player'),stamp=1;const root={dataset:{cricketTheme:'floodlights',theme:'dark',motion:'reduced'}};
 for(let cycle=0;cycle<100;cycle++) {
  const palette=CLUB_PALETTES[cycle%4], tag=`GUL-${cycle.toString(16).toUpperCase().padStart(4,'0')}`;
  state=reconcileClubIdentity(state,{serverNow:stamp++,session:profile('player',tag,palette),team:fullTeam('player',tag,palette)},{identityId:'player',action:'team'});
  assert.equal(state.teamTag,tag);assert.equal(activeClubPalette(state),palette);applyClubPalette(root,activeClubPalette(state));assert.equal(root.dataset.clubPalette,palette);
  const confirmed=state;
  state=reconcileClubIdentity(state,{serverNow:stamp-2,session:profile('player','OLD-0000','blue')},{identityId:'player'});assert.equal(state,confirmed,'late old profile never restores old club');
  state=reconcileClubIdentity(state,{serverNow:stamp++,session:profile('other','BAD-0000','berry')},{identityId:'player'});assert.equal(state,confirmed,'previous recovery identity cannot lend its club');
  applyClubPalette(root,activeClubPalette(state,'default'));assert.equal(root.dataset.clubPalette,undefined);assert.equal(root.dataset.cricketTheme,'floodlights');assert.equal(root.dataset.motion,'reduced');
  const switched=CLUB_PALETTES[(cycle+1)%4];state=reconcileClubIdentity(state,{serverNow:stamp++,session:profile('player',tag,switched)},{identityId:'player'});assert.equal(activeClubPalette(state),switched);
  state=reconcileClubIdentity(state,{serverNow:stamp++,session:profile('player'),team:null},{identityId:'player',action:'team'});assert.equal(state.teamTag,null);assert.equal(activeClubPalette(state),null);
  applyClubPalette(root,activeClubPalette(state));assert.equal(root.dataset.clubPalette,undefined);assert.equal(root.dataset.theme,'dark');
 }
 assert.equal(clubColourMode('nonsense'),'club');assert.equal(clubColourMode('default'),'default');
});

test('unverified cache, malformed public tags, foreign teams and unknown palettes never colour the game',()=>{
 assert.equal(activeClubPalette({...emptyClubIdentity('p'),teamTag:'OK-1234',teamPalette:'blue'}),null);
 let s=reconcileClubIdentity(emptyClubIdentity('p'),{serverNow:1,session:profile('p','PRIVATEINVITECODE','blue')},{identityId:'p'});assert.equal(s.teamTag,null);
 s=reconcileClubIdentity(s,{serverNow:2,session:profile('p'),team:fullTeam('another','YES-1234','blue')},{identityId:'p',action:'team'});assert.equal(s.teamTag,null);
 s=reconcileClubIdentity(s,{serverNow:3,session:profile('p','YES-1234','css-injection')},{identityId:'p'});assert.equal(s.teamTag,'YES-1234');assert.equal(activeClubPalette(s),null);
 const root={dataset:{}};applyClubPalette(root,'bad');assert.equal(root.dataset.clubPalette,undefined);
});

test('100 real transport membership cycles ignore stale profiles and recover without creating a new account',async()=>{
 const token='a'.repeat(64);let now=1,club=null,pending=null;const calls=[];
 const values=new Map([['jhk-live-session-v1',JSON.stringify({token,session:profile('p','OLD-1234','berry')})]]);
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const client=createOnlineClient({url:'https://server.example/game',storage,fetcher:async(_,options)=>{
  const body=JSON.parse(options.body);calls.push(body.action);
  if(body.action==='profile'&&pending){const wait=pending;pending=null;return wait;}
  if(body.action==='recover')return response({serverNow:now++,token:'b'.repeat(64),session:profile('recovered','NEW-1234','blue')});
  if(body.action==='team') {
   if(body.op==='join')club=fullTeam('p',body.tag,body.palette);else if(body.op==='leave')club=null;
   return response({serverNow:now++,session:profile('p',club?.tag,club?.palette),team:club});
  }
  return response({serverNow:now++,session:profile('p',club?.tag,club?.palette)});
 }});
 assert.equal(client.club.verified,false,'persisted membership is not freshly verified');await client.connect();assert.equal(client.club.teamTag,null);
 for(let cycle=0;cycle<100;cycle++) {
  const palette=CLUB_PALETTES[cycle%4],tag=`GUL-${cycle.toString(16).toUpperCase().padStart(4,'0')}`;
  await client.team('join',{tag,palette});assert.equal(client.session.teamPalette,palette);assert.equal(activeClubPalette(client.club),palette);
  const oldNow=now++;let release;pending=new Promise(resolve=>{release=resolve;});const delayed=client.connect();
  await client.team('leave');release(response({serverNow:oldNow,session:profile('p',tag,palette)}));await delayed;
  assert.equal(client.session.teamTag,null);assert.equal(client.session.teamPalette,null);assert.equal(activeClubPalette(client.club),null);
 }
 await client.recover('private-test-code');assert.equal(client.club.identityId,'recovered');assert.equal(client.session.teamTag,'NEW-1234');assert.equal(activeClubPalette(client.club),'blue');
 client.forget();assert.equal(client.club.verified,false);assert.equal(activeClubPalette(client.club),null);assert.equal(calls.includes('session'),false,'no fresh profile is ever created');
});

test('expired authority clears club display and a delayed previous credential error cannot clear recovered identity',async()=>{
 const values=new Map([['jhk-live-session-v1',JSON.stringify({token:'a'.repeat(64),session:profile('p')})]]);let expired=false,release,delay=false;
 const client=createOnlineClient({url:'https://server.example/game',storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},fetcher:async(_,options)=>{
  const action=JSON.parse(options.body).action;
  if(action==='recover')return response({serverNow:9,token:'b'.repeat(64),session:profile('q','NEW-1234','blue')});
  if(delay)return new Promise(resolve=>{release=resolve;});
  if(expired)return new Response(JSON.stringify({ok:false,error:{code:'SESSION_EXPIRED',message:'Recover your profile.'}}),{status:401});
  return response({serverNow:1,session:profile('p','GUL-1234','teal')});
 }});
 await client.connect();assert.equal(activeClubPalette(client.club),'teal');expired=true;
 await assert.rejects(client.connect(),e=>e.code==='SESSION_EXPIRED');assert.equal(activeClubPalette(client.club),null);assert.equal(client.hasCredential,true);
 delay=true;const old=client.connect();await client.recover('existing-profile');assert.equal(activeClubPalette(client.club),'blue');
 release(new Response(JSON.stringify({ok:false,error:{code:'UNAUTHORIZED',message:'Old credential.'}}),{status:401}));await assert.rejects(old);assert.equal(activeClubPalette(client.club),'blue');
});

test('all four club fills and readable accent text exceed 4.5:1 in Pavilion and Floodlights',async()=>{
 const fs=await import('node:fs');const css=fs.readFileSync(new URL('../app/club-accent.css',import.meta.url),'utf8');
 const lum=hex=>{const channels=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 for(const palette of CLUB_PALETTES)for(const dark of [false,true]) {
  const selector=dark?`:root[data-cricket-theme='floodlights'][data-club-palette='${palette}']`:`:root[data-club-palette='${palette}']`;
  const block=css.slice(css.indexOf(selector)).split('}')[0];const token=name=>new RegExp(`--club-accent${name}:\\s*(#[a-f0-9]{6})`,'i').exec(block)?.[1];
  const fill=token(''),text=token('-text'),ink=dark?'#122c35':token('-ink');assert.ok(ratio(fill,ink)>=4.5,`${palette} ${dark?'night':'day'} filled control`);assert.ok(ratio(text,dark?'#10272f':'#f7f1e6')>=4.5,`${palette} ${dark?'night':'day'} text`);
 }
});
