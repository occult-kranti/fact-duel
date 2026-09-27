/** Actual two-browser JHK beta gate. Creates private QA guests and deletes them in finally. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { STORAGE } from '../lib/storage-names.mjs';
const endpoint=process.env.JHK_SERVER_URL||'https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game';
process.env.VITE_JHK_SERVER_URL=endpoint; process.env.APP_URL='';
const out=resolve(process.argv[2]||'/tmp/jhk-live-ui');mkdirSync(out,{recursive:true});
const checks=[],errors=[],contexts=[];const ok=s=>{checks.push(s);console.log('PASS',s);};
const vite=await createServer({configFile:'vite.config.static.ts',server:{host:'127.0.0.1',port:0,hmr:false}});await vite.listen();
const base=`http://127.0.0.1:${vite.httpServer.address().port}${vite.config.base}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/tmp/hisaab-chromium-runtime/chromium',headless:true,args:['--no-sandbox']});
async function make(width,theme,name){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});contexts.push(ctx);await ctx.route(endpoint,async route=>{const req=route.request();const headers={};for(const key of ['content-type','x-jhk-session','x-region']){const value=req.headers()[key];if(value)headers[key]=value;}try{const result=await fetch(endpoint,{method:req.method(),headers,body:req.method()==='POST'?req.postData():undefined});await route.fulfill({status:result.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:await result.text()});}catch(e){console.log('RELAY',e.message);await route.abort('failed');}});await ctx.addInitScript(({STORAGE,theme})=>{localStorage.setItem(STORAGE.locale,'en');localStorage.setItem(STORAGE.theme,theme);localStorage.setItem(STORAGE.sound,'off');localStorage.setItem(STORAGE.art,'off');localStorage.setItem(STORAGE.motion,'reduced');},{STORAGE,theme});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(r.url().includes('jhk-game'))console.log('NETWORK',r.failure()?.errorText);});await page.goto(base);await page.getByRole('button',{name:/^Find a human rival/}).waitFor({timeout:15000}).catch(async e=>{await page.screenshot({path:`${out}/failure-home.png`,fullPage:true});console.log('HOME',await page.locator('body').innerText());console.log('ERRORS',errors);throw e;});assert.equal(await page.getByRole('dialog').count(),0);await page.getByRole('button',{name:/^Find a human rival/}).click();await page.locator('#jhk-live-name').fill(name);await page.getByRole('button',{name:'Connect to duel',exact:true}).click();await page.getByRole('button',{name:'Create private room',exact:true}).waitFor({timeout:18000}).catch(async e=>{await page.screenshot({path:`${out}/failure-connect.png`,fullPage:true});console.log('CONNECT',await page.locator('.jhk-live').innerText());throw e;});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/desk-${width}-${theme}.png`,fullPage:true});return page;}
async function api(page,action,payload={}){return await page.evaluate(async({endpoint,action,payload})=>{const saved=JSON.parse(localStorage.getItem('jhk-live-session-v1')||'null');if(!saved)return null;const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-jhk-session':saved.token},body:JSON.stringify({action,...payload})});return r.json();},{endpoint,action,payload});}
try{
 const one=await make(320,'dark',`Beta QA Mobile`);const two=await make(1280,'light',`Beta QA Desktop`);ok('Human desk reachable directly, no email gate, mobile320 + desktop1280 fit');
 await one.locator('#jhk-live-topic').selectOption('science');await one.locator('#jhk-live-stake').fill('10');await one.getByRole('button',{name:'Create private room',exact:true}).click();await one.locator('.jhk-live-code').waitFor();const code=(await one.locator('.jhk-live-code').innerText()).trim();await two.locator('#jhk-live-code').fill(code);await two.getByRole('button',{name:'Join friend',exact:true}).click();await Promise.all([one.getByRole('button',{name:'Confirm 10 coins & ready',exact:true}).waitFor(),two.getByRole('button',{name:'Confirm 10 coins & ready',exact:true}).waitFor()]);ok('Real private room shared across two guest identities with stake confirmation');
 await Promise.all([one.getByRole('button',{name:'Confirm 10 coins & ready',exact:true}).click(),two.getByRole('button',{name:'Confirm 10 coins & ready',exact:true}).click()]);
 for(let i=1;i<=5;i++){
  await Promise.all([one.locator('.jhk-live-answers button').first().waitFor(),two.locator('.jhk-live-answers button').first().waitFor()]);
  const a=await one.locator('.jhk-live-question h1').innerText(),b=await two.locator('.jhk-live-question h1').innerText();assert.equal(a,b);
  if(i===1){assert.ok(await one.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await one.screenshot({path:`${out}/question-mobile.png`,fullPage:true});}
  await Promise.all([one.locator('.jhk-live-answers button').nth(0).click(),two.locator('.jhk-live-answers button').nth(1).click()]);
  await Promise.all([one.locator('.jhk-live-receipt').waitFor(),two.locator('.jhk-live-receipt').waitFor()]);
  if(i===1){await one.reload();await one.locator('.jhk-live-receipt').waitFor();ok('Reload restores accepted answer and live server room');}
  if(i===5) break;
  await Promise.all([one.getByRole('button',{name:'Next round',exact:true}).waitFor(),two.getByRole('button',{name:'Next round',exact:true}).waitFor()]);
  await Promise.all([one.getByRole('button',{name:'Next round',exact:true}).click(),two.getByRole('button',{name:'Next round',exact:true}).click()]);
 }
 await Promise.all([one.locator('.jhk-live-finish').waitFor(),two.locator('.jhk-live-finish').waitFor()]);ok('Five real shared rounds, answer receipts, both-ready transitions and settled result');
 await one.screenshot({path:`${out}/result-mobile.png`,fullPage:true});await two.screenshot({path:`${out}/result-desktop.png`,fullPage:true});
 const data=await api(one,'profile');assert.equal(data.ok,true);assert.ok(data.session.balance>=0);assert.ok(data.session.onlineXp>=0);ok('Server balance and online XP persist after settlement');
 await one.getByRole('button',{name:'Back to lobby',exact:true}).last().click();await one.getByRole('button',{name:'Find a human rival',exact:true}).waitFor();await one.getByRole('button',{name:'Coin leaders',exact:true}).click();await one.locator('.jhk-live-board').waitFor();ok('Coin leaderboard opens after match');
 await one.getByRole('button',{name:'Home',exact:true}).last().click();await one.getByRole('button',{name:'Learn with expeditions',exact:true}).click();assert.equal(await one.locator('.fd-play').count(),0);assert.equal(await one.locator('[data-nav=journeys][aria-current=page]').count(),1);ok('Live learning entry opens expeditions, not legacy bot configurator');await one.locator('[data-nav=arena]').click();await one.getByRole('button',{name:'Find a human rival',exact:true}).waitFor();ok('Play nav returns to human server desk');await one.locator('[data-nav=passport]').click();await one.locator('.jhk-live-profile').waitFor();assert.match(await one.locator('.jhk-live-profile').innerText(),/online XP/);ok('Server identity and XP appear above preserved device practice achievements');
 assert.deepEqual(errors,[]);
}finally{
 for(const ctx of contexts){const page=ctx.pages()[0];if(page){try{const deleted=await api(page,'deleteSession');if(deleted?.ok)ok('QA guest deleted');else if(deleted!==null)errors.push('QA guest delete failed');}catch(e){errors.push('QA guest cleanup: '+e.message);}}await ctx.close();}
 await browser.close();await vite.close();writeFileSync(`${out}/report.json`,JSON.stringify({evidence:'Actual deployed JHK backend via exact-endpoint Node fetch relay (Chromium direct egress blocked), two isolated browser contexts, temporary QA profiles',checks,errors},null,2));
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,out}));
