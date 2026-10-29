/** Production-only smoke, including the real Pages base path and CPU-throttled one-tap play. */
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=path.resolve('dist-static'),out=path.resolve('docs/gully-redesign/verification');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;let rel=decodeURIComponent(pathname).replace(/^\/fact-duel\//,'');if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('Invalid path');const data=await fs.readFile(file);res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(5197,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[],failed=[];let ads=0;
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});page.on('request',r=>{if(/doubleclick|googlesyndication|googleads/.test(r.url()))ads++});
try {
 await page.goto('http://127.0.0.1:5197/fact-duel/');await page.getByRole('button',{name:'Play cricket',exact:true}).waitFor();
 assert.equal(await page.locator('.gc-art img').evaluate(e=>e.complete&&e.naturalWidth>0),true);await page.screenshot({path:path.join(out,'production-home.png'),fullPage:true});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const start=Date.now();await page.getByRole('button',{name:'Play cricket',exact:true}).click();await page.locator('.fd-answer:not(:disabled)').first().waitFor({timeout:15000});const elapsedMs=Date.now()-start;
 assert.match(await page.locator('.fd-hud-format').textContent(),/30s/);assert.equal(await page.locator('.fd-answer').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,'production-question.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.equal(ads,0);
 const result={production:true,viewport:{width:390,height:844},cpuThrottle:4,firstPlayClicks:1,elapsedMs,answerCount:4,readingTimer:30,ads,errors,failed};await fs.writeFile(path.join(out,'production-check.json'),JSON.stringify(result,null,2));console.log(result);
} finally {await browser.close();await new Promise(r=>server.close(r));}
