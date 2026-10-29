import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
process.env.VITE_JHK_SERVER_URL ||= 'https://wvupsqfevlrmhqfjreyx.supabase.co/functions/v1/jhk-game';
const out=path.resolve('docs/gully-redesign/verification');await fs.mkdir(out,{recursive:true});
const server=await createServer({configFile:path.resolve('vite.config.static.ts'),server:{host:'127.0.0.1',port:5199,strictPort:true,watch:null,hmr:false}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const checks=[],errors=[];let adRequests=0;
const check=(name,pass)=>{checks.push({name,pass:!!pass});console.log((pass?'PASS ':'FAIL ')+name);};
const context=async(viewport)=>{const c=await browser.newContext({viewport,reducedMotion:'reduce'});c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/googlesyndication|doubleclick|googleads/.test(r.url()))adRequests++;});});return c;};
const home=async p=>{await p.goto('http://127.0.0.1:5199/fact-duel/');await p.getByRole('heading',{name:'All talk? Prove it.'}).waitFor();await p.getByRole('button',{name:'Play cricket',exact:true}).waitFor();};
const fit=async(p,name)=>{const okay=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);if(!okay)console.log('OVERFLOW',name,await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,65),width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))));check(name,okay);};
try {
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:1000}]){
  const c=await context(size),p=await c.newPage();await home(p);
  await fit(p,`${size.width} home fits`);
  check(`${size.width} first play above fold`,await p.getByRole('button',{name:'Play cricket',exact:true}).evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  check(`${size.width} no startup modal`,await p.locator('[role=dialog]:visible').count()===0);
  await p.screenshot({path:path.join(out,`home-${size.width}.png`),fullPage:true});
  await p.getByRole('button',{name:'Switch to night match'}).click();await fit(p,`${size.width} night fits`);await p.screenshot({path:path.join(out,`night-${size.width}.png`),fullPage:true});
  await p.reload();await p.getByRole('heading',{name:'All talk? Prove it.'}).waitFor();check(`${size.width} theme persists`,await p.locator('html').getAttribute('data-cricket-theme')==='floodlights');
  await p.getByRole('button',{name:'Switch to day match'}).click();
  if(size.width===390||size.width===1440){
   for(const [nav,cls] of [['Explore','.gc-directory'],['Progress','.fd-player'],['Answers','.fd-vault']]){
    await p.locator(`[data-nav='${nav==='Explore'?'journeys':nav==='Progress'?'passport':'journal'}']`).click();await p.locator(cls).first().waitFor();await fit(p,`${size.width} ${nav} fits`);await p.screenshot({path:path.join(out,`${nav.toLowerCase()}-${size.width}.png`),fullPage:true});
   }
   await p.locator('[data-nav=home]').click();await p.getByRole('button',{name:'All modes',exact:true}).click();await p.locator('.fd-launch-btn').waitFor();await fit(p,`${size.width} custom practice fits`);check(`${size.width} advanced closed`,await p.locator('.gc-advanced').getAttribute('open')===null);await p.locator('.gc-advanced>summary').click();await fit(p,`${size.width} advanced fits`);await p.screenshot({path:path.join(out,`custom-${size.width}.png`),fullPage:true});
  }
  await c.close();
 }
 const c=await context({width:390,height:844}),p=await c.newPage();await home(p);
 await p.getByRole('button',{name:'Play cricket',exact:true}).evaluate(e=>{for(let i=0;i<12;i++)e.click();});
 await p.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});check('one-tap rapid launch reaches four answers',await p.locator('.fd-answer').count()===4);check('practice bot label visible',await p.locator('.cr-practice-label').isVisible());check('first play uses thirty-second simple questions',await p.locator('.fd-hud-format').textContent().then(t=>t.includes('30s'))&&await p.locator('.fd-qtag').textContent().then(t=>/simple/i.test(t)));await fit(p,'question fits');await p.screenshot({path:path.join(out,'question-390.png'),fullPage:true});
 await p.locator('.fd-answer:not(:disabled)').first().focus();await p.keyboard.press('Enter');check('answer lock moves keyboard focus to status',await p.locator('.fd-status').evaluate(e=>e===document.activeElement));await p.locator('.fd-answer').first().evaluate(e=>{for(let i=0;i<8;i++)e.click();});check('rapid answer locks every option',await p.locator('.fd-answer:disabled').count()===4);
 await c.close();
 const r=await context({width:390,height:844}),q=await r.newPage();await home(q);await q.getByRole('button',{name:/The quick single/}).click();await q.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});await q.locator('.fd-answer').first().click();await q.locator('.fd-finish').waitFor({timeout:40000});check('one-question result has replay',await q.locator('.fd-finish-actions .fd-cta').isVisible());check('result review starts collapsed',await q.locator('.fd-result-details').evaluateAll(nodes=>nodes.every(e=>!e.open)));await fit(q,'result fits');await q.screenshot({path:path.join(out,'result-390.png'),fullPage:true});await q.locator('.fd-finish-actions .fd-cta').evaluate(e=>{for(let i=0;i<8;i++)e.click();});await q.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});check('rapid replay starts a labelled practice game',await q.locator('.cr-practice-label').isVisible());await r.close();

 // Narrow-route reachability, unique rule views and recovery controls.
 const navc=await context({width:320,height:568}),navp=await navc.newPage();await home(navp);await navp.locator('[data-nav=journeys]').click();
 for(const label of ['Topics','Discover facts','Fixtures & challenges','Custom practice','Expeditions']){await navp.getByRole('button',{name:new RegExp('^'+label.replace('&','&'))}).first().click();await fit(navp,'320 route '+label);check('320 selected parent for '+label,await navp.locator('[data-nav][aria-current=page]').count()===1);}
 await navp.locator('[data-nav=passport]').click();check('optional progress categories collapsed',await navp.locator('.gc-progress-group').evaluateAll(nodes=>nodes.length===5&&nodes.every(e=>!e.open)));await navp.locator('.gc-progress-group>summary').first().focus();await navp.keyboard.press('Enter');check('progress disclosure opens by keyboard',await navp.locator('.gc-progress-group').first().getAttribute('open')!==null);
 for(const label of ['Activity & data','Art collection','Your progress']){await navp.getByRole('button',{name:new RegExp('^'+label)}).first().click();await fit(navp,'320 route '+label);}
 for(const [label,title] of [['Human duel rules','Human duel rules'],['Rules of the coin','Free game coins'],['Trust','Trust & your data']]){await navp.locator('.fd-footer').getByRole('button',{name:label,exact:true}).click();await navp.getByRole('heading',{level:1}).waitFor();check('distinct rules view '+label,(await navp.getByRole('heading',{level:1}).textContent()).length>0);await fit(navp,'320 '+label);}
 await navc.close();
 // Fully loaded practice does not depend on internet or decorative image success.
 const off=await context({width:390,height:844}),op=await off.newPage();await op.route('**/art/gully-cricket.webp',r=>r.abort());await home(op);await off.setOffline(true);await op.getByRole('button',{name:'Play cricket',exact:true}).click();await op.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});check('offline after load and missing artwork still plays',await op.locator('.fd-answer').count()===4);await off.close();
 const blocked=await context({width:320,height:568});await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')}});const bp=await blocked.newPage();await home(bp);await bp.getByRole('button',{name:'Play cricket',exact:true}).click();await bp.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});check('blocked web storage does not block practice',await bp.locator('.fd-answer').count()===4);await blocked.close();
 const hindi=await context({width:320,height:568});await hindi.addInitScript(()=>{try{localStorage.setItem('fd-locale','hi')}catch{}});const hp=await hindi.newPage();await hp.goto('http://127.0.0.1:5199/fact-duel/');await hp.getByRole('button',{name:'क्रिकेट खेलें',exact:true}).waitFor();await fit(hp,'Hindi home fits 320');await hp.screenshot({path:path.join(out,'hindi-320.png'),fullPage:true});await hp.getByRole('button',{name:'क्रिकेट खेलें',exact:true}).click();await hp.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});await fit(hp,'Hindi question chrome fits 320');await hindi.close();
 const zoom=await context({width:320,height:568}),zp=await zoom.newPage();await home(zp);await zp.addStyleTag({content:'html{font-size:200% !important}'});await fit(zp,'200 percent text home reflows');await zp.getByRole('button',{name:'Play cricket',exact:true}).click();await zp.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});await fit(zp,'200 percent text question reflows');await zoom.close();
 const search=await context({width:390,height:844}),sp=await search.newPage();await sp.route('**/functions/v1/jhk-game',r=>r.abort());await home(sp);await sp.getByRole('button',{name:'Human duel',exact:true}).click();await sp.locator('#jhk-live-adult').check();await sp.getByRole('button',{name:'Play now',exact:true}).click();await sp.getByRole('button',{name:'Cancel search',exact:true}).waitFor();await sp.getByRole('button',{name:'Cancel search',exact:true}).click();await sp.waitForTimeout(5300);check('cancelled search cannot revive practice',await sp.locator('.cr-practice-label').count()===0);await sp.getByRole('button',{name:'Play now',exact:true}).click();await sp.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});check('failed human network has labelled practice fallback',await sp.locator('.cr-practice-label').isVisible());await search.close();
 check('disabled ads make no network request',adRequests===0);check('no runtime errors',errors.length===0);
} finally {await fs.writeFile(path.join(out,'browser-checks.json'),JSON.stringify({checks,errors,adRequests},null,2));await browser.close();await server.close();}
assert.ok(checks.every(c=>c.pass),'All browser acceptance checks must pass');console.log(JSON.stringify({suite:'gully-browser',passed:checks.length}));
