import { D1RoomStore, dispatch, hash } from './duel-service.mjs';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
export async function handleDuelRequest(request,env){
 try{
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return new Response(JSON.stringify({error:'Cross-origin requests are not allowed.'}),{status:403,headers});
  if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(JSON.stringify({error:'JSON request required.'}),{status:415,headers});
  const reader=request.body?.getReader();let raw='',size=0;const decoder=new TextDecoder();if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();break;}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}if(size>4096)return new Response(JSON.stringify({error:'Request too large.'}),{status:413,headers});
  let body;try{body=JSON.parse(raw);}catch{return new Response(JSON.stringify({error:'Invalid JSON.'}),{status:400,headers});}
  const receivedAt=Date.now();
  if(body?.action==='clock'&&env.DB){const stamp=await new D1RoomStore(env.DB).clock();return new Response(JSON.stringify({serverNow:stamp.db_now,clockSource:'primary-database'}),{headers});}
  if(['clock','catalogue','practice','expedition'].includes(body?.action)){const result=await dispatch(null,body,{now:receivedAt});return new Response(JSON.stringify(result),{headers});}
  if(!env.DB)return new Response(JSON.stringify({error:'The room service is unavailable. Please try again shortly.',code:'service_unavailable'}),{status:503,headers});
  const actor=await hash(request.headers.get('oai-authenticated-user-id')||request.headers.get('cf-connecting-ip')||'private-site');
  const result=await dispatch(new D1RoomStore(env.DB),body,{now:receivedAt,actor,useDatabaseClock:true});return new Response(JSON.stringify(result),{headers});
 }catch(error){const status=error?.status||503;return new Response(JSON.stringify({error:status===503?'The room service is busy or unavailable. Your accepted answer remains locked; retry safely.':error.message,code:error?.code||'service_unavailable'}),{status,headers});}
}
