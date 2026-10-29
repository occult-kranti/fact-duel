import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const source=fs.readFileSync(new URL('../lib/auth-client.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source.replace("import { STORAGE } from './storage-names.mjs';","const STORAGE={principal:'fd-principal'};"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
test('Pages legacy account helpers fail closed without probing an absent auth endpoint',async()=>{
 const previous=process.env.NEXT_PUBLIC_JHK_STATIC_BUILD,fetchBefore=globalThis.fetch;let requests=0;
 process.env.NEXT_PUBLIC_JHK_STATIC_BUILD='true';globalThis.fetch=async()=>{requests++;throw Error('Must not request missing API')};
 try{const api=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));assert.deepEqual(await api.whoami(),{available:false});assert.deepEqual(await api.quickProfile('Reader',''),{ok:false,available:false});assert.equal(await api.requestMagicLink('a@example.com'),false);assert.equal(await api.signOut(),false);await assert.rejects(api.signInWithGoogle('test'),/did not go through/);assert.equal(requests,0);}finally{globalThis.fetch=fetchBefore;if(previous===undefined)delete process.env.NEXT_PUBLIC_JHK_STATIC_BUILD;else process.env.NEXT_PUBLIC_JHK_STATIC_BUILD=previous;}
});

test('Pages legacy profile sync also avoids absent auth and profile endpoints',async()=>{
 const previous=process.env.NEXT_PUBLIC_JHK_STATIC_BUILD,fetchBefore=globalThis.fetch;let requests=0;
 process.env.NEXT_PUBLIC_JHK_STATIC_BUILD='true';globalThis.fetch=async()=>{requests++;throw Error('Missing Pages API')};
 try{
 const raw=fs.readFileSync(new URL('../lib/profile-sync.ts',import.meta.url),'utf8').replace("import { STORAGE } from './storage-names.mjs';","const STORAGE={principal:'fd-principal'};");
 const resolved=raw.replace("'./passport.mjs'",JSON.stringify(new URL('../lib/passport.mjs',import.meta.url).href));
 const js=ts.transpileModule(resolved,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 const api=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 assert.equal(await api.whoami(),null);assert.deepEqual(await api.pullProfile(),{ok:false,code:'unavailable'});assert.deepEqual(await api.pushProfile({revision:0}),{ok:false,code:'unavailable'});assert.equal(requests,0);
 }finally{globalThis.fetch=fetchBefore;if(previous===undefined)delete process.env.NEXT_PUBLIC_JHK_STATIC_BUILD;else process.env.NEXT_PUBLIC_JHK_STATIC_BUILD=previous;}
});
