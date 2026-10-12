// Locker Room Sign product runtime. All dimensions are millimetres.
// Hardware derives from the supplied 3MF and the approved assembly mockup.
const LOCKER_SIGN_DEFAULTS = Object.freeze({style:'layered',text:'TEAM NAME',font:'Bebas Neue Bold',stick:'#191b1e',glove:'#191b1e',textColour:'#f6f5f1',rings:'#fcd504',backing:'#191b1e',scale:100,x:0,y:0,removeBg:false,colourCount:5});
const LOCKER_SIGN_CENTRE = Object.freeze({x:54.673,y:-166.29,z:1.7});
const LOCKER_SIGN_RELIEF_MM = 6;
let lockerSign, lockerView, lockerImage, lockerModelsPromise, lockerBuildTimer, lockerRevision=0;
function lockerDefaultLayerHeight(colour,whiteFlat=false){
 const rgb=hexToRgb(normalizeHex(colour));
 return Math.max(...rgb)<65||whiteFlat&&isNearWhiteHex(colour)?0:LOCKER_SIGN_RELIEF_MM;
}
function lockerState(){return lockerSign ||= {...LOCKER_SIGN_DEFAULTS,palette:[],source:null,name:'',projectId:null,isExample:true,busy:false,error:'',view:'assembly',angle:.18,tilt:0,zoom:1};}
function lockerReady(){const s=lockerState();return Boolean(s.source && !lockerUploadSession && !s.busy && !s.error && s.text.trim());}
function lockerDimensions(){return {diameterMm:228.6,widthMm:228.6,heightMm:228.6,baseMm:4,hangerSpacingMm:128.014,signHoleSpacingMm:128.014,approximateReferenceSpacingMm:120};}
function lockerFontStack(){return lockerState().font==='Market Pro'?'"Market Pro", "Marker Felt", "Comic Sans MS", cursive':'"'+lockerState().font+'", Impact, "Arial Black", Arial, sans-serif';}
function lockerMaterial(colour){return new THREE.MeshStandardMaterial({color:new THREE.Color(colour).convertSRGBToLinear(),roughness:.82,metalness:.02});}
async function lockerLoadModels(){
 if(!lockerModelsPromise)lockerModelsPromise=fetch('./assets/locker-sign/hanger-models.json').then(response=>{if(!response.ok)throw new Error('Could not load the hockey mount.');return response.json();});
 return lockerModelsPromise;
}
function lockerHardwareMesh(name,mat,models){
 const d=models[name],v=d.v.slice();
 for(let k=0;k<v.length;k+=3){const x=v[k],y=v[k+1],z=v[k+2];
  if(name==='shaft'){v[k+1]=y-10.424;v[k+2]=-z;}
  else if(name==='blade'){v[k]=-y;v[k+1]=-x;v[k+2]=-z;}
  else if(name==='glove'){v[k]=z;v[k+1]=(x+y)*Math.SQRT1_2;v[k+2]=(-x+y)*Math.SQRT1_2;}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(d.i);g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);m.name=name;return m;
}
function lockerLoop(x){
 const s=new THREE.Shape();s.moveTo(-11,-21);s.lineTo(-11,0);s.absarc(0,0,11,Math.PI,0,true);s.lineTo(11,-21);s.closePath();
 const h=new THREE.Path();h.absarc(0,0,5.3,0,Math.PI*2,true);s.holes.push(h);
 // The bevel stays within the circle's 4 mm thickness on both faces.
 const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:3,bevelEnabled:true,bevelThickness:.5,bevelSize:.5,bevelSegments:2,curveSegments:28}),lockerMaterial(lockerState().backing));
 m.name='sign-loop';m.position.set(x,-64.29,.2);m.userData.holeCentre={x,y:-64.29,z:1.7};return m;
}
function setupLockerSign(){
 const panel=document.querySelector('#lockerSignControls');if(panel.dataset.ready)return;panel.dataset.ready='true';
 const font=panel.querySelector('[data-locker=font]');HYPE_SPINNER_FONT_OPTIONS.forEach(name=>{const o=document.createElement('option');o.value=o.textContent=name;o.style.fontFamily=getHypeSpinnerFontStack(name);font.append(o);});attachLockerFontPicker(font);
 panel.querySelectorAll('[data-locker-colour]').forEach(button=>button.addEventListener('click',()=>openLockerColourPopover(button.dataset.lockerColour,button)));
 panel.querySelectorAll('[data-locker]').forEach(input=>input.addEventListener('input',async()=>{
  const s=lockerState(),key=input.dataset.locker;
  s[key]=input.type==='checkbox'?input.checked:['range','number'].includes(input.type)||key==='colourCount'?Number(input.value):input.value;
  if(['colourCount','removeBg'].includes(key))s.palette=[];
  s.error='';if(key==='font')await document.fonts.load('400 200px '+lockerFontStack()).catch(()=>{});
  if(['text','font','textColour'].includes(key)){paintLockerText();renderLockerView();syncLockerControls();updateProjectControls();}
  else if(['stick','glove','rings'].includes(key)){updateLockerHardwareColours();renderLockerView();syncLockerControls();}
  else scheduleLockerBuild();
 }));
 panel.querySelectorAll('[data-locker-style]').forEach(button=>button.addEventListener('click',()=>{lockerState().style=button.dataset.lockerStyle;scheduleLockerBuild();}));
 setupFileButtonKeyboard(document.querySelector('#lockerChooseFile'),document.querySelector('#lockerLogoFile'));
 document.querySelector('#lockerEditDesign').addEventListener('click',editExistingLockerDesign);
 document.querySelector('#lockerLogoFile').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{await loadLockerArtwork(file);}catch(error){lockerState().error=error.message;syncLockerControls();updateProjectControls();setStatus('Upload failed');}
  finally{event.target.value='';}
 });
 document.querySelector('#lockerResetArtwork').addEventListener('click',()=>{Object.assign(lockerState(),{scale:100,x:0,y:0});scheduleLockerBuild();});
 document.querySelectorAll('[data-locker-view]').forEach(button=>button.addEventListener('click',()=>{
  const s=lockerState();s.view=button.dataset.lockerView;s.angle=s.view==='back'?Math.PI:s.view==='front'?0:s.view==='detail'?1.02:.18;s.tilt=0;s.zoom=1;renderLockerView();
 }));
 document.querySelectorAll('[data-locker-zoom]').forEach(button=>button.addEventListener('click',()=>{lockerState().zoom=clamp(lockerState().zoom*Number(button.dataset.lockerZoom),.6,2.5);renderLockerView();}));
 document.querySelector('#lockerZoomReset').addEventListener('click',()=>{lockerState().zoom=1;renderLockerView();});
 syncLockerControls();
}
async function activateLockerSign(){
 setupLockerSign();document.querySelector('#lockerSignControls').hidden=false;document.querySelector('#lockerSignPreview').hidden=false;
 try{
  if(!lockerView)await initLockerView();
  if(!lockerImage){lockerImage=await loadImage('./assets/locker-sign/sign-guy-example.png');}
  await document.fonts.load('400 200px '+lockerFontStack()).catch(()=>{});paintLockerText();await buildLockerSign();
 }catch(error){lockerState().error=error.message;syncLockerControls();updateProjectControls();console.error(error);}
}
async function initLockerView(){
 const models=await lockerLoadModels();if(lockerView)return;
 const host=document.querySelector('#lockerSignCanvas'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
 host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Locker sign 360 degree preview. Drag or use arrow keys to rotate.');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,2,1800),group=new THREE.Group();scene.add(group);
 scene.add(new THREE.HemisphereLight(0xf4f4ff,0x55535b,.85));const key=new THREE.DirectionalLight(0xffffff,1.15);key.position.set(-180,250,500);scene.add(key);
 const rim=new THREE.DirectionalLight(0xb7c8ff,.65);rim.position.set(350,80,-180);scene.add(rim);
 const hanger=new THREE.Group();hanger.position.y=-12;group.add(hanger);
 const s=lockerState(),stickMat=lockerMaterial(s.stick),gloveMat=lockerMaterial(s.glove),ringMat=lockerMaterial(s.rings);
 const shaft=lockerHardwareMesh('shaft',stickMat,models);hanger.add(shaft);
 const blade=lockerHardwareMesh('blade',stickMat,models);blade.position.set(207.595,54.178,1.7);hanger.add(blade);
 const tape=lockerHardwareMesh('tape',lockerMaterial('#f6f5f1'),models);tape.rotation.z=Math.PI/2;tape.position.set(138.215,0,1.7);hanger.add(tape);
 const glove=lockerHardwareMesh('glove',gloveMat,models);glove.position.set(-114,-.205,1.635);hanger.add(glove);
 const rings=[];for(const x of [-9.334,118.680]){const ring=lockerHardwareMesh('ring',ringMat,models);ring.rotation.y=Math.PI/2;ring.position.set(x,-37.29,1.7);ring.userData.connections={upper:{x,y:-22.29,z:1.7},lower:{x,y:-52.29,z:1.7}};hanger.add(ring);rings.push(ring);}
 const wall=new THREE.Mesh(new THREE.BoxGeometry(3,360,45),lockerMaterial('#434952'));wall.position.set(-162.45,-85,1.7);hanger.add(wall);
 const c=document.createElement('canvas');c.width=2048;c.height=256;const textTexture=new THREE.CanvasTexture(c);textTexture.encoding=THREE.sRGBEncoding;
 const textMat=new THREE.MeshBasicMaterial({map:textTexture,transparent:true,depthWrite:false});
 const frontText=new THREE.Mesh(new THREE.PlaneGeometry(185,28.5),textMat);frontText.position.set(13.215,0,8.58);hanger.add(frontText);
 const backText=new THREE.Mesh(new THREE.PlaneGeometry(185,28.5),textMat);backText.position.set(13.215,0,-5.18);backText.rotation.y=Math.PI;hanger.add(backText);
 const sign=new THREE.Group();group.add(sign);
 lockerView={renderer,scene,camera,group,hanger,sign,stickMat,gloveMat,ringMat,textTexture,frontText,backText,rings};
 new ResizeObserver(renderLockerView).observe(host);
 const pointers=new Map();let pinchDistance=0;
 host.addEventListener('pointerdown',e=>{e.stopPropagation();pointers.set(e.pointerId,[e.clientX,e.clientY]);host.setPointerCapture(e.pointerId);});
 host.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;e.stopPropagation();const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);const s=lockerState();
  if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance)s.zoom=clamp(s.zoom*distance/pinchDistance,.6,2.5);pinchDistance=distance;}
  else{s.angle+=(e.clientX-old[0])*.008;s.tilt=clamp(s.tilt+(e.clientY-old[1])*.006,-.6,.6);}renderLockerView();
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(name,e=>{pointers.delete(e.pointerId);pinchDistance=0;});
 host.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();lockerState().zoom=clamp(lockerState().zoom*Math.exp(-e.deltaY*.001),.6,2.5);renderLockerView();},{passive:false});
 host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key.includes('Left')||e.key.includes('Right'))lockerState().angle+=e.key==='ArrowLeft'?-.15:.15;else lockerState().tilt=clamp(lockerState().tilt+(e.key==='ArrowUp'?-.1:.1),-.6,.6);renderLockerView();});
}
function paintLockerText(){
 if(!lockerView)return;const s=lockerState(),c=lockerView.textTexture.image,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 ctx.font='400 400px '+lockerFontStack();ctx.textAlign='left';ctx.textBaseline='alphabetic';const label=s.text.trim().toUpperCase();if(!label){lockerView.textTexture.needsUpdate=true;return;}
 const m=ctx.measureText(label),ascent=m.actualBoundingBoxAscent,descent=m.actualBoundingBoxDescent,left=m.actualBoundingBoxLeft,right=m.actualBoundingBoxRight;
 const scaleY=248/Math.max(1,ascent+descent),scaleX=Math.min(scaleY,2000/Math.max(1,left+right));
 ctx.save();ctx.translate(c.width/2,c.height/2);ctx.scale(scaleX,scaleY);ctx.fillStyle=s.textColour;ctx.fillText(label,(left-right)/2,(ascent-descent)/2);ctx.restore();
 lockerView.textTexture.userData={fit:{label,font:s.font,inkHeight:248,inkWidth:(left+right)*scaleX}};lockerView.textTexture.needsUpdate=true;
}
function updateLockerHardwareColours(){if(!lockerView)return;const s=lockerState();for(const [mat,key] of [[lockerView.stickMat,'stick'],[lockerView.gloveMat,'glove'],[lockerView.ringMat,'rings']])mat.color.set(s[key]).convertSRGBToLinear();}
function fitLockerCameraDistance(bounds,target,eye,aspect){
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),eye).normalize(),up=new THREE.Vector3().crossVectors(eye,right).normalize();
 const tangent=Math.tan(17*Math.PI/180),padding=.9;let distance=40;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const point=new THREE.Vector3(x,y,z).sub(target),depth=point.dot(eye);
  distance=Math.max(distance,depth+Math.abs(point.dot(up))/(tangent*padding),depth+Math.abs(point.dot(right))/(tangent*aspect*padding));
 }
 return distance;
}
function renderLockerView(){
 if(!lockerView||!lockerView.sign.children.length||state.productType!=='locker')return;const s=lockerState(),host=document.querySelector('#lockerSignCanvas');
 // Keep the controls just above the existing mobile action bar.
 if(isMobileControlLayout()){
  const stage=els.stage.getBoundingClientRect(),bar=els.mobileCommandBar.getBoundingClientRect();
  if(bar.height>0&&!document.body.classList.contains('mobile-controls-open'))document.querySelector('#lockerSignPreview').style.setProperty('--locker-mobile-footer',Math.max(16,stage.bottom-bar.top+16)+'px');
 }
 const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 const {renderer,camera,scene,hanger}=lockerView;renderer.setSize(w,h,false);camera.aspect=w/h;
 const circle=s.view==='front'||s.view==='back',detail=s.view==='detail';
 scene.updateMatrixWorld(true);
 const elevation=s.tilt+(circle?0:.035),eye=new THREE.Vector3(Math.sin(s.angle)*Math.cos(elevation),Math.sin(elevation),Math.cos(s.angle)*Math.cos(elevation));
 const signBounds=new THREE.Box3().setFromObject(lockerView.sign),textBounds=new THREE.Box3().setFromObject(lockerView.frontText).union(new THREE.Box3().setFromObject(lockerView.backText));
 const fullBounds=new THREE.Box3().setFromObject(lockerView.group),focusBounds=signBounds.clone().union(textBounds);
 const baselineTarget=circle?signBounds.getCenter(new THREE.Vector3()):detail?new THREE.Vector3(54.673,-47,1.7):fullBounds.getCenter(new THREE.Vector3());
 const baselineDistance=detail?Math.max(315,fitLockerCameraDistance(new THREE.Box3(new THREE.Vector3(-85,-89,-8),new THREE.Vector3(151,18,12)),baselineTarget,eye,camera.aspect)):fitLockerCameraDistance(circle?signBounds:fullBounds,baselineTarget,eye,camera.aspect);
 const distance=baselineDistance/s.zoom,target=baselineTarget.clone();
 if(!circle&&!detail){
  const focus=clamp((s.zoom-1)/.35,0,1);target.lerp(focusBounds.getCenter(new THREE.Vector3()),focus);
  // At close zoom, keep the custom text near the upper edge while enlarging the sign.
  if(s.zoom>1)target.y=Math.max(target.y,textBounds.max.y-distance*Math.tan(17*Math.PI/180)*.86);
 }
 camera.position.copy(target).addScaledVector(eye,distance);camera.lookAt(target);camera.far=Math.max(1800,distance+fullBounds.getSize(new THREE.Vector3()).length());camera.updateProjectionMatrix();hanger.visible=!circle;
 lockerView.framing={target:target.clone(),baselineTarget:baselineTarget.clone(),distance,baselineDistance,focusBounds:focusBounds.clone()};
 document.querySelectorAll('[data-locker-view]').forEach(b=>{const active=b.dataset.lockerView===s.view&&s.view!=='assembly';b.classList.toggle('active',active);if(b.dataset.lockerView!=='assembly')b.setAttribute('aria-pressed',String(active));});
 document.querySelector('#lockerZoomReset').textContent=Math.round(s.zoom*100)+'%';renderer.render(scene,camera);
}
function lockerArtworkPixels(){
 const s=lockerState(),n=1024,c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d',{willReadFrequently:true});
 const ratio=Math.min(n/lockerImage.width,n/lockerImage.height)*s.scale/100;
 ctx.drawImage(lockerImage,(n-lockerImage.width*ratio)/2+s.x*n/228.6,(n-lockerImage.height*ratio)/2-s.y*n/228.6,lockerImage.width*ratio,lockerImage.height*ratio);
 const imageData=ctx.getImageData(0,0,n,n),data=imageData.data,hist=new Map();
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4;if(Math.hypot(x+.5-n/2,y+.5-n/2)>n/2-.7||s.removeBg&&Math.min(data[i],data[i+1],data[i+2])>238)data[i+3]=0;
  if(data[i+3]<128)continue;const rgb=[data[i],data[i+1],data[i+2]],key=rgb.map(v=>Math.round(v/12)).join(',');
  const p=hist.get(key)||{rgb,count:0};p.count++;hist.set(key,p);
 }
 if(!s.palette.length){
  for(const bucket of [...hist.values()].sort((a,b)=>b.count-a.count)){
   if(bucket.count<6)continue;const rgb=bucket.rgb;
   if(s.palette.some(p=>p.rgb.reduce((d,v,k)=>d+(v-rgb[k])**2,0)<55**2))continue;
   let blend=false;for(let a=0;a<s.palette.length;a++)for(let b=a+1;b<s.palette.length;b++){
    const start=s.palette[a].rgb,delta=s.palette[b].rgb.map((v,k)=>v-start[k]),den=delta.reduce((d,v)=>d+v*v,0),t=den?clamp(delta.reduce((d,v,k)=>d+v*(rgb[k]-start[k]),0)/den,0,1):0;
    if(rgb.reduce((d,v,k)=>d+(v-start[k]-t*delta[k])**2,0)<22**2)blend=true;
   }
   // The example's grey accents are deliberate ink, even between black and white.
   if(blend&&!s.isExample)continue;const colour=rgbToHex(rgb);s.palette.push({rgb,colour,height:lockerDefaultLayerHeight(colour,isNearWhiteHex(s.backing))});if(s.palette.length>=s.colourCount)break;
  }
 }
 const labels=new Int16Array(n*n);labels.fill(-1);
 for(let i=0;i<n*n;i++){
  if(data[i*4+3]<128){data[i*4+3]=0;continue;}let best=0,distance=Infinity;
  s.palette.forEach((p,k)=>{const d=p.rgb.reduce((sum,v,j)=>sum+(v-data[i*4+j])**2,0);if(d<distance){best=k;distance=d;}});
  if(s.palette[best])labels[i]=best;
 }
 // Replace isolated edge blends only when a neighbouring ink clearly dominates.
 // Coherent colour regions stay intact; transparent areas remain unchanged.
 for(let pass=0;pass<2;pass++){
  const next=labels.slice(),counts=new Uint8Array(s.palette.length);
  for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){
   const i=y*n+x,current=labels[i];if(current<0)continue;counts.fill(0);
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const ink=labels[i+dy*n+dx];if(ink>=0)counts[ink]++;}
   if(counts[current]>5)continue;let best=current;
   for(let k=0;k<counts.length;k++)if(counts[k]>counts[best])best=k;
   if(counts[best]>=10)next[i]=best;
  }
  labels.set(next);
 }
 const masks=s.palette.map(()=>new Uint8Array(n*n)),counts=new Uint32Array(s.palette.length);
 for(let i=0;i<labels.length;i++)if(labels[i]>=0){const k=labels[i];masks[k][i]=1;counts[k]++;}
 // Only visible artwork inks choose the flat layer. A black backing behind
 // a black-free logo must not stop white from becoming that flat colour.
 const logoInks=s.wizardEdit?.logoColourMapping;
 const hasBlack=logoInks?.length?logoInks.some(ink=>{
  const rgb=hexToRgb(ink.to);let best=0,distance=Infinity;
  s.palette.forEach((p,k)=>{const d=p.rgb.reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){best=k;distance=d;}});
  return counts[best]>0&&Math.max(...hexToRgb(s.palette[best].colour))<65;
 }):s.palette.some((p,k)=>counts[k]>0&&Math.max(...hexToRgb(p.colour))<65);
 const whiteFlat=!hasBlack;
 s.palette.forEach(p=>{p.height=lockerDefaultLayerHeight(p.colour,whiteFlat);});
 // If artwork has neither black nor white, keep its dominant ink flat.
 if(!s.palette.some((p,k)=>counts[k]>0&&p.height===0)){
  let flat=0;for(let k=1;k<counts.length;k++)if(counts[k]>counts[flat])flat=k;
  if(s.palette[flat])s.palette[flat].height=0;
 }
 const C=LOCKER_SIGN_CENTRE,regions=masks.map(mask=>bagMaskShapes(mask,n,n,228.6,228.6,C.x,C.y,true));
 const artwork=document.createElement('canvas');artwork.width=artwork.height=2048;
 const a=artwork.getContext('2d'),scale=artwork.width/228.6;a.fillStyle=s.backing;a.fillRect(0,0,artwork.width,artwork.height);
 a.translate(artwork.width/2-C.x*scale,artwork.height/2+C.y*scale);a.scale(scale,-scale);a.lineJoin='round';a.lineCap='round';a.lineWidth=.02;
 regions.forEach((shapes,k)=>{
  a.fillStyle=a.strokeStyle=s.palette[k].colour;
  for(const shape of shapes){
   a.beginPath();for(const path of [shape,...shape.holes]){path.getPoints().forEach((p,i)=>i?a.lineTo(p.x,p.y):a.moveTo(p.x,p.y));a.closePath();}
   a.fill('evenodd');a.stroke();
  }
 });
 return {n,masks,regions,artwork};
}
function disposeLockerSign(){
 if(!lockerView)return;const geometries=new Set(),materials=new Set(),textures=new Set();lockerView.sign.traverse(m=>{if(m.geometry)geometries.add(m.geometry);[].concat(m.material||[]).forEach(mat=>{materials.add(mat);if(mat.map)textures.add(mat.map);});});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());lockerView.sign.clear();
}
function scheduleLockerBuild(){clearTimeout(lockerBuildTimer);syncLockerControls();lockerBuildTimer=setTimeout(()=>buildLockerSign().catch(error=>{lockerState().error=error.message;syncLockerControls();updateProjectControls();console.error(error);}),100);}
async function buildLockerSign(){
 if(!lockerView||!lockerImage||state.productType!=='locker')return;const s=lockerState();s.busy=true;updateProjectControls();
 try{
  const pixels=lockerArtworkPixels();lockerView.artworkPixels=pixels;if(s.source&&!s.palette.length)throw new Error('No visible artwork was found. Choose a design with visible colours.');const texture=new THREE.CanvasTexture(pixels.artwork);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=lockerView.renderer.capabilities.getMaxAnisotropy();
  disposeLockerSign();const sign=lockerView.sign,C=LOCKER_SIGN_CENTRE;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(114.3,114.3,4,128),lockerMaterial(s.backing));disc.rotation.x=Math.PI/2;disc.position.set(C.x,C.y,C.z);disc.name='circle-backing';sign.add(disc);
  const loops=[lockerLoop(-9.334),lockerLoop(118.680)];loops.forEach(m=>sign.add(m));lockerView.loops=loops;
  // A rendering offset prevents coplanar tab edges showing through either face.
  const faceMat=new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),face=new THREE.Mesh(new THREE.CircleGeometry(114.15,128),faceMat);face.position.set(C.x,C.y,4.15);face.name='circle-front';sign.add(face);lockerView.face=face;
  const rear=new THREE.Mesh(new THREE.CircleGeometry(114.15,128),faceMat);rear.position.set(C.x,C.y,-.8);rear.rotation.y=Math.PI;rear.visible=s.style==='flat';rear.name='circle-back';sign.add(rear);lockerView.rear=rear;
  if(s.style==='layered')pixels.regions.forEach((shapes,k)=>{
   const p=s.palette[k];if(!p.height||!shapes.length)return;
   const geometry=new THREE.ExtrudeGeometry(shapes,{depth:p.height,bevelEnabled:false,curveSegments:36});
   const top=new THREE.MeshBasicMaterial({color:new THREE.Color(p.colour).convertSRGBToLinear(),toneMapped:false}),side=lockerMaterial(p.colour),m=new THREE.Mesh(geometry,[top,side]);m.position.z=4.17;m.name='raised-artwork';m.userData.layer=k;sign.add(m);
  });
  s.error='';updateLockerHardwareColours();paintLockerText();renderLockerPalette();syncLockerControls();renderLockerView();renderPreviewTitle();updateStats();
 }finally{s.busy=false;syncLockerControls();updateProjectControls();}
}
function renderLockerPalette(){
 const host=document.querySelector('#lockerPalette'),s=lockerState();
 if(host.children.length!==s.palette.length){
  host.replaceChildren();
  s.palette.forEach((p,k)=>{
   const button=document.createElement('button');button.type='button';button.className='hype-colour-chip';button.dataset.lockerArtColour=k;button.title='Artwork colour '+(k+1);button.append(document.createElement('i'));button.addEventListener('click',()=>openLockerColourPopover('artwork',button,k));host.append(button);
  });
 }
 [...host.children].forEach((button,k)=>{button.querySelector('i').style.background=s.palette[k].colour;button.setAttribute('aria-label','Artwork colour '+(k+1)+' '+s.palette[k].colour);});
}
function openLockerColourPopover(part,anchor,index){
 state.selectedColourTarget={type:'locker',part,index};
 const hex=part==='artwork'?lockerState().palette[index].colour:lockerState()[part];
 updatePopoverInputs(hex);positionColourPopover(anchor);renderUsedColourGrid();setPopoverTab('preset');
}
function applyLockerColour(part,hex,index){
 if(part==='artwork'){if(!lockerState().palette[index])return;lockerState().palette[index].colour=hex;scheduleLockerBuild();}
 else{lockerState()[part]=hex;if(part==='backing')scheduleLockerBuild();else{if(part==='textColour')paintLockerText();else updateLockerHardwareColours();renderLockerView();}}
 syncLockerControls();renderLockerPalette();
}
function syncLockerControls(){
 const editButton=document.querySelector('#lockerEditDesign');editButton.hidden=!lockerState().source;editButton.disabled=lockerState().busy;
 const s=lockerState();document.querySelectorAll('[data-locker]').forEach(input=>{if(document.activeElement!==input){if(input.type==='checkbox')input.checked=s[input.dataset.locker];else input.value=s[input.dataset.locker];}if(input.type==='range')updateRangeFill(input);});
 document.querySelectorAll('[data-locker-style]').forEach(b=>{const active=b.dataset.lockerStyle===s.style;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const font=document.querySelector('[data-locker=font]');if(font){font.style.fontFamily=lockerFontStack();syncLockerFontPicker(font);}
 document.querySelectorAll('[data-locker-colour]').forEach(button=>{const colour=s[button.dataset.lockerColour];button.querySelector('i').style.background=colour;button.setAttribute('aria-label',button.title+' colour '+colour);});
 document.querySelector('#lockerScaleOutput').textContent=s.scale+'%';
 document.querySelector('#lockerConstruction').textContent=s.style==='flat'?'Same uploaded design printed flat on both faces.':'Raised artwork on the front. Plain backing on the reverse.';
 document.querySelector('#lockerPreviewCaption').textContent=s.style==='flat'?'Double-sided · Flat · Identical artwork both faces':'Single-sided · Layered · Plain reverse';
 document.querySelector('#lockerMessage').textContent=s.error||(!s.text.trim()?'Enter the text for the stick.':s.isExample?'Example artwork · Upload your design to customize the circle.':'');
}
async function loadLockerArtwork(file){
 return beginLockerLogoWizard(file);
}
async function buildLockerProject(){
 clearTimeout(lockerBuildTimer);await buildLockerSign();if(!lockerReady())throw new Error('Upload your design and enter the stick text before saving.');
 const s=lockerState(),{source,busy,error,...config}=s;
 const mapColour=colour=>{const rgb=hexToRgb(colour);let best=0,distance=Infinity;s.palette.forEach((p,k)=>{const d=p.rgb.reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){best=k;distance=d;}});return s.palette[best]?.colour||colour;};
 const wizardEdit=s.wizardEdit?{...s.wizardEdit,backing:mapColour(s.wizardEdit.backing),logoColourMapping:(s.wizardEdit.logoColourMapping||[]).map(m=>({...m,to:mapColour(m.to)})),textBoxes:(s.wizardEdit.textBoxes||[]).map(box=>{const sourceColour=box.sourceColour||rgbToHex(s.palette.find(p=>normalizeHex(p.colour)===normalizeHex(box.colour))?.rgb||hexToRgb(box.colour));return {...box,sourceColour,colour:mapColour(sourceColour)};})}:null;
 return {type:'SignGuy.LockerSignStudio',version:PROJECT_FILE_VERSION,id:s.projectId||makeProjectId(),name:s.name||`${s.text} Locker Room Sign`,customerEmail:state.customerEmail,savedAt:new Date().toISOString(),source:{...source},outputArtwork:buildLockerFinalArtwork(),config:{productType:'locker',locker:{...config,wizardEdit,palette:s.palette.map(p=>({...p,rgb:[...p.rgb]}))},dimensions:lockerDimensions(),hardware:'hockey-glove-magnetic-v1'},preview:{screenshotDataUrl:lockerView.renderer.domElement.toDataURL('image/png'),colours:s.palette.map((p,k)=>({index:k,display:p.colour,height:p.height})),details:{style:s.style,stickText:s.text},dimensions:lockerDimensions()}};
}
async function saveLockerProject(){
 setStatus('Saving');try{const project=await buildLockerProject();if(!isLocalTesting())await uploadProjectFolder(project,{screenshots:await captureLockerShots()});await saveProjectRecord(project);lockerState().projectId=project.id;downloadProjectPayload(project);await refreshProjectLog();els.projectNote.textContent=`${project.name} saved ${isLocalTesting()?'locally':'to your project folder'} and downloaded as a .SignGuy file.`;setStatus('Saved');}catch(error){els.projectNote.textContent=error.message;setStatus('Save failed');}finally{updateProjectControls();}
}
async function restoreLockerProject(project){
 const c=project.config?.locker;if(!c||!project.source?.dataUrl||!['layered','flat'].includes(c.style)||!HYPE_SPINNER_FONT_OPTIONS.includes(c.font))throw new Error('Invalid Locker Room Sign project.');
 const image=await loadImage(c.preparedDataUrl||project.source.dataUrl);++lockerRevision;lockerImage=image;
 lockerSign={...lockerState(),...c,source:{...project.source},name:project.name,projectId:project.id,busy:false,error:'',isExample:false};
 const s=lockerState();s.text=String(s.text||'').slice(0,40);s.scale=clamp(Number(s.scale)||100,40,160);s.x=clamp(Number(s.x)||0,-60,60);s.y=clamp(Number(s.y)||0,-60,60);s.zoom=clamp(Number(s.zoom)||1,.6,2.5);s.angle=Number(s.angle)||0;s.tilt=clamp(Number(s.tilt)||0,-.6,.6);s.colourCount=clamp(Number(s.colourCount)||5,1,8);
 s.palette=Array.isArray(s.palette)?s.palette.slice(0,8).map(p=>({rgb:p.rgb.slice(0,3).map(v=>clamp(Number(v)||0,0,255)),colour:normalizeHex(p.colour),height:lockerDefaultLayerHeight(p.colour,isNearWhiteHex(s.backing))})):[];
 for(const key of ['stick','glove','textColour','rings','backing'])s[key]=normalizeHex(s[key]);
 state.productSelectionMenuResolved=true;hideProductSelectionMenu();selectProductType('locker');await activateLockerSign();await refreshProjectLog();
}
async function captureLockerShots(){
 const s=lockerState(),old={view:s.view,angle:s.angle,tilt:s.tilt,zoom:s.zoom},shots=[];
 try{for(const [label,view,angle] of [['Assembly','assembly',.18],['Front','front',0],['Back','back',Math.PI]]){Object.assign(s,{view,angle,tilt:0,zoom:1});renderLockerView();const blob=await new Promise(resolve=>lockerView.renderer.domElement.toBlob(resolve,'image/png'));const fileName=`locker-sign-${label.toLowerCase()}.png`;shots.push({label,fileName,blob,file:new File([blob],fileName,{type:'image/png'})});}}finally{Object.assign(s,old);renderLockerView();}return shots;
}
