'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Box,ArrowLeft,ArrowRight,Pause,Play,X} from 'lucide-react';
export default function ArcadeStage(){
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[spin,setSpin]=useState(false),[reduced,setReduced]=useState(false);
 const canvas=useRef<HTMLCanvasElement|null>(null),api=useRef<any>(null);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>{setReduced(media.matches);if(media.matches){setSpin(false);api.current?.spin(false);}};change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 useEffect(()=>{if(!enabled||!canvas.current)return;let stopped=false;const lifecycle=new AbortController();setReady(false);setFailed(false);
  import('@/lib/arcade-scene.mjs').then(m=>{if(stopped||!canvas.current)return;return m.createArcadeScene(canvas.current,{signal:lifecycle.signal,reduced,onLost:()=>{if(!stopped){setFailed(true);setEnabled(false);}}});}).then(scene=>{if(!scene)return;if(stopped){scene.dispose();return;}api.current=scene;setReady(true);}).catch(()=>{if(!stopped){setFailed(true);setEnabled(false);}});
  return()=>{stopped=true;lifecycle.abort();api.current?.dispose();api.current=null;setSpin(false);};
 },[enabled,reduced]);
 return <div className={`arcade-stage ${ready&&enabled?'stage-live':''}`}><img src="/art/rivalry-stage.webp" alt="Metallic lightning token and sports sphere with luminous orbital rings" width="1672" height="941"/>{enabled&&<canvas ref={canvas} aria-hidden="true"/>}<span className="stage-sticker">FACT<br/>//DUEL</span><div className="stage-controls">{enabled?<><Button size="icon" variant="ghost" aria-label="Rotate scene left" disabled={!ready} onClick={()=>api.current?.rotate(-1)}><ArrowLeft/></Button><Button size="icon" variant="ghost" aria-label="Rotate scene right" disabled={!ready} onClick={()=>api.current?.rotate(1)}><ArrowRight/></Button><Button size="icon" variant="ghost" aria-label={spin?'Pause scene rotation':'Rotate scene continuously'} aria-pressed={spin} disabled={!ready||reduced} onClick={()=>{api.current?.spin(!spin);setSpin(!spin);}}>{spin?<Pause/>:<Play/>}</Button><Button size="icon" variant="ghost" aria-label="Return to static artwork" onClick={()=>setEnabled(false)}><X/></Button></>:<Button variant="ghost" onClick={()=>setEnabled(true)}><Box/>{failed?'Retry 3D view':'Activate 3D'}<ArrowRight/></Button>}</div>{enabled&&!ready&&<span className="stage-loading" role="status">Preparing the 3D view…</span>}{failed&&!enabled&&<span className="stage-loading" role="status">Static artwork shown. Play works normally.</span>}</div>;
}
