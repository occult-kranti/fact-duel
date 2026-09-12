// Loaded only after an explicit 3D request. No renderer is mounted in a room.
/** @param {HTMLCanvasElement} canvas @param {{onLost?:()=>void,reduced?:boolean,signal?:AbortSignal}} options */
export async function createArcadeScene(canvas,{onLost=()=>{},reduced=false,signal}={}){
 const THREE=await import('three');
 if(signal?.aborted)return null;
 if(typeof ResizeObserver==='undefined'||typeof IntersectionObserver==='undefined')throw new Error('Static artwork required');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60);
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 camera.position.set(4,3.4,8.3);camera.lookAt(0,.1,0);
 const group=new THREE.Group();scene.add(group);
 const materials=new Set(),geometries=new Set();
 let cleanup=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.forceContextLoss();};
 try{
 function mesh(geometry,color,position,scale=1){const material=new THREE.MeshStandardMaterial({color,roughness:.26,metalness:.68});materials.add(material);geometries.add(geometry);const item=new THREE.Mesh(geometry,material);item.position.set(...position);item.scale.setScalar(scale);item.castShadow=true;item.receiveShadow=true;group.add(item);return item;}
 const pedestal=mesh(new THREE.CylinderGeometry(2.7,2.8,.23,64),0x10211c,[0,-.84,0]);
 const token=mesh(new THREE.CylinderGeometry(1.04,1.04,.15,64),0x455952,[-.82,.33,.18]);token.rotation.set(Math.PI/2,0,.18);
 const rim=mesh(new THREE.TorusGeometry(1.04,.035,10,80),0xdcfc67,[-.82,.33,.28]);rim.rotation.set(0,0,.18);
 const bolt=new THREE.Shape();bolt.moveTo(.08,.67);bolt.lineTo(-.38,-.04);bolt.lineTo(-.02,-.04);bolt.lineTo(-.15,-.68);bolt.lineTo(.43,.16);bolt.lineTo(.05,.16);bolt.closePath();
 const mark=mesh(new THREE.ExtrudeGeometry(bolt,{depth:.05,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.02,bevelThickness:.015}),0xdcfc67,[-.82,.33,.29]);mark.rotation.z=.18;
 const orb=mesh(new THREE.IcosahedronGeometry(.61,2),0x52362b,[1.05,.17,.14]);
 const seamSource=new THREE.IcosahedronGeometry(.617,1),wireGeo=new THREE.EdgesGeometry(seamSource);seamSource.dispose();geometries.add(wireGeo);const wireMat=new THREE.LineBasicMaterial({color:0xd3b79a});materials.add(wireMat);orb.add(new THREE.LineSegments(wireGeo,wireMat));
 const ring=mesh(new THREE.TorusGeometry(.99,.025,10,80),0xdcfc67,[1.05,.17,.14]);ring.rotation.set(1.05,.4,.4);
 const ring2=mesh(new THREE.TorusGeometry(.84,.018,10,80),0xffa285,[1.05,.17,.14]);ring2.rotation.set(.4,-.3,-.6);
 mesh(new THREE.SphereGeometry(.10,14,12),0xdcfc67,[1.92,.55,.12]);
 scene.add(new THREE.HemisphereLight(0xd7f8de,0x071712,2.8));
 const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.04;scene.add(key);
 const fill=new THREE.DirectionalLight(0xff8866,3.2);fill.position.set(4,3,-3);scene.add(fill);
 let frame=0,dead=false,spin=false,visible=true,last=0,drag=null;
 const render=()=>{if(dead||document.hidden||!visible)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const w=Math.min(900,Math.round(rect.width)),h=Math.min(600,Math.round(rect.height));if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}renderer.render(scene,camera);};
 const animate=time=>{frame=0;if(dead||!spin||document.hidden||!visible||reduced)return;if(time-last>=1000/30){group.rotation.y+=.004;render();last=time;}frame=requestAnimationFrame(animate);};
 const restart=()=>{cancelAnimationFrame(frame);frame=0;render();if(spin&&!reduced&&!document.hidden&&visible)frame=requestAnimationFrame(animate);};
 const resize=new ResizeObserver(restart);resize.observe(canvas);
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;restart();},{threshold:.05});observer.observe(canvas);
 const lost=e=>{e.preventDefault();cancelAnimationFrame(frame);onLost();};
 const down=e=>{if(e.button===0)drag={x:e.clientX,y:e.clientY,rotation:group.rotation.y};};
 const move=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)+12){drag=null;return;}group.rotation.y=drag.rotation+dx*.008;render();};
 const up=()=>{drag=null;};
 canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',down);window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);document.addEventListener('visibilitychange',restart);
 cleanup=()=>{dead=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);document.removeEventListener('visibilitychange',restart);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();key.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();};
 render();
 return {rotate(direction){group.rotation.y+=direction*.35;render();},spin(value){spin=value;restart();},dispose(){cleanup();}};
 }catch(error){cleanup();throw error;}
}
