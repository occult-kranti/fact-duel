import { chromium } from 'playwright-core';
const BASE='http://localhost:5173';
const EXE=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE});
const p=await b.newPage({viewport:{width:390,height:844}});
p.on('console',m=>console.log('CONSOLE['+m.type()+']',m.text().slice(0,300)));
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,600)));
p.on('requestfailed',r=>console.log('REQFAIL',r.url(),r.failure()?.errorText));
p.on('response',async r=>{ if(r.url().includes('/api/duel')) console.log('API',r.status(),(await r.text().catch(()=>'')).slice(0,120)); });
await p.goto(BASE,{waitUntil:'networkidle'});
await p.waitForSelector('[data-nav="journeys"]',{timeout:20000});
for(let i=0;i<8;i++){ await p.locator('[data-nav="journeys"]').first().click({force:true}).catch(()=>{}); await p.waitForTimeout(400); if(await p.locator('button:has-text("World Cup folklore")').count()) break;}
await p.locator('button',{hasText:/World Cup folklore|Istanbul/i}).first().click({force:true});
await p.waitForSelector('button:has-text("Begin chapter 1")',{timeout:15000});
for(let i=0;i<6;i++){
  await p.locator('button',{hasText:/Begin chapter 1/i}).first().click({force:true}).catch(()=>{});
  await p.waitForTimeout(1200);
  const n=await p.locator('.fd-exp-answer').count();
  console.log('attempt',i,'answers',n,'err',(await p.locator('.error-box').first().textContent().catch(()=>''))||'');
  if(n) break;
}
console.log('journeys:', await p.evaluate(()=>{ try{ return Object.keys(JSON.parse(localStorage.getItem('fd.profile')||'{}').journeys||{}).join(',');}catch(e){return 'ls-err '+e.message;} }));
console.log('lskeys:', await p.evaluate(()=>Object.keys(localStorage).join(',')));
await b.close();
