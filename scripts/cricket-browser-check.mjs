/** Bounded desktop/mobile visual and behavior smoke; run with CHROMIUM_PATH if needed. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
const root=process.cwd(), out=path.join(root,'docs/cricket-redesign/verification');
await fs.mkdir(out,{recursive:true});
process.env.VITE_JHK_SERVER_URL ||= 'https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game';
const server=await createServer({configFile:path.join(root,'vite.config.static.ts'),server:{host:'127.0.0.1',port:5188,strictPort:true}});
await server.listen();
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
const checks=[],errors=[];
const check=(message,condition)=>{checks.push({message,ok:Boolean(condition)});assert.ok(condition,message);console.log('PASS '+message);};
const home=async page=>{await page.goto('http://127.0.0.1:5188/fact-duel/');await page.getByRole('heading',{name:/Know the game/}).waitFor();};
try{
if(!process.env.CRICKET_SKIP_LAYOUT) for(const width of [320,390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await home(page);
 check(`${width}px fresh home has no modal`,await page.locator('[role=dialog]:visible,dialog[open]').count()===0);
 for(const theme of ['floodlights','pavilion']){
  if(theme==='pavilion')await page.getByRole('button',{name:'Switch to Pavilion design'}).click();
  const bounds=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));check(`${width}px ${theme} no horizontal overflow`,bounds.document<=bounds.viewport);
  if(width!==320)await page.screenshot({path:path.join(out,`${width===1440?'desktop':'mobile'}-${theme}.png`),fullPage:true});
 }
 await page.reload();await page.getByRole('heading',{name:/Know the game/}).waitFor();check(`${width}px theme persists`,await page.locator('html').getAttribute('data-cricket-theme')==='pavilion');
 await page.getByRole('button',{name:/Challenge a friend/}).click();check(`${width}px friend entry is focused`,await page.locator('.jhk-live-desk').getAttribute('data-intent')==='friend');check(`${width}px no required email`,await page.locator('input[type=email]:visible').count()===0);await context.close();
}
if(!process.env.CRICKET_SKIP_SEARCH){
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
// A dead/slow authority must not extend the five-second search deadline.
await page.route('**/functions/v1/jhk-game',route=>route.abort());await home(page);
await page.getByRole('button',{name:'Play cricket',exact:true}).click();check('cricket CTA chooses cricket',await page.locator('#jhk-live-topic').inputValue()==='cricket');
await page.locator('#jhk-live-adult').check();const begin=Date.now();await page.getByRole('button',{name:'Play now',exact:true}).click();await page.getByRole('button',{name:'Cancel search',exact:true}).waitFor();await page.screenshot({path:path.join(out,'mobile-search.png'),fullPage:true});
await page.locator('.cr-practice-label').waitFor({timeout:8500});const elapsed=Date.now()-begin;check('bot fallback begins after five seconds despite failed network',elapsed>=4800&&elapsed<7500);check('bot fallback clearly labelled',await page.locator('.cr-practice-label').textContent().then(t=>t.includes('Separate from human rankings')));
await page.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:10000});check('fallback delivers playable question',await page.locator('.fd-answer').count()===4);await page.screenshot({path:path.join(out,'mobile-bot-question.png'),fullPage:true});
await context.close();
const cancelContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const cancel=await cancelContext.newPage();await cancel.route('**/functions/v1/jhk-game',route=>route.abort());await home(cancel);await cancel.getByRole('button',{name:'Play cricket',exact:true}).click();await cancel.locator('#jhk-live-adult').check();await cancel.getByRole('button',{name:'Play now',exact:true}).click();await cancel.getByRole('button',{name:'Cancel search',exact:true}).click();await new Promise(r=>setTimeout(r,5300));check('cancel prevents delayed bot match',await cancel.locator('.cr-practice-label').count()===0&&await cancel.getByRole('button',{name:'Play now',exact:true}).isVisible());await cancelContext.close();
}
const practiceContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const practice=await practiceContext.newPage();practice.on('pageerror',e=>errors.push(e.message));await home(practice);await practice.getByRole('button',{name:/One-question warm-up/}).click();await practice.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:10000});await practice.screenshot({path:path.join(out,'mobile-bot-question.png'),fullPage:true});await practice.locator('.fd-answer:not(:disabled)').first().click();await practice.locator('.fd-finish').waitFor({timeout:40000});check('guest can finish a game without signup',await practice.locator('input[type=email]:visible').count()===0);check('result exposes replay and collapses stats',await practice.locator('.fd-finish-actions .fd-cta').isVisible()&&await practice.locator('.fd-result-details').evaluateAll(nodes=>nodes.every(e=>!e.open)));check('result has no coin ad upsell',await practice.locator('.fd-adcard').count()===0);await practice.screenshot({path:path.join(out,'mobile-result.png'),fullPage:true});await practice.locator('.fd-finish-actions .fd-cta').click();await practice.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:10000});check('guest replay starts another question',true);await practiceContext.close();
const modes=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await home(modes);await modes.getByRole('button',{name:/All topics & game modes/}).click();await modes.locator('.fd-launch-btn').click();await modes.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:10000});check('all-mode launcher still starts guest practice',true);await modes.close();
check('no runtime errors',errors.length===0);
await fs.writeFile(path.join(out,process.env.CRICKET_SKIP_SEARCH?'browser-results-checks.json':'browser-checks.json'),JSON.stringify({checks,errors},null,2));
console.log(JSON.stringify({suite:'cricket-browser',passed:checks.length,result:'pass'}));
}finally{await browser.close();await server.close();}
