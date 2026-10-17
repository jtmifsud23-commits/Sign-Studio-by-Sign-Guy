// Round coaster designer. The single flat face is repeated on four identical bodies.
const COASTER_DIAMETER_MM = 101.66;
const COASTER_DEPTH_MM = 4;
const COASTER_PACK_SIZE = 4;
const COASTER_SIGN_DEFAULTS = Object.freeze({backing:'#191b1e',font:'Bebas Neue Bold',packs:1});
let coasterSign, coasterView, coasterImage, coasterRevision=0;
function coasterState(){return coasterSign ||= {...COASTER_SIGN_DEFAULTS,palette:[],source:null,wizardEdit:null,name:'',projectId:null,busy:false,error:'',view:'top',angle:0,tilt:0,zoom:1,backingIndex:-1};}
function coasterDimensions(){return {diameterMm:COASTER_DIAMETER_MM,widthMm:COASTER_DIAMETER_MM,heightMm:COASTER_DIAMETER_MM,depthMm:COASTER_DEPTH_MM,baseMm:COASTER_DEPTH_MM,raisedMm:0};}
function coasterColours(){const s=coasterState();return uniqueHexColours([s.backing,...s.palette.map(p=>p.colour)]);}
function coasterReady(){const s=coasterState();return Boolean(s.source&&s.preparedDataUrl&&s.palette.length&&!coasterUploadSession&&!s.busy&&!s.error&&coasterColours().length<=8&&Number.isInteger(s.packs)&&s.packs>=1&&s.packs<=99);}
function coasterNearestPaletteIndex(hex){const rgb=hexToRgb(hex);let best=-1,distance=Infinity;coasterState().palette.forEach((p,k)=>{const d=p.rgb.reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){best=k;distance=d;}});return best;}
function setupCoaster(){
 const panel=document.querySelector('#coasterControls');if(panel.dataset.ready)return;panel.dataset.ready='true';
 setupFileButtonKeyboard(document.querySelector('#coasterChooseFile'),document.querySelector('#coasterLogoFile'));
 document.querySelector('#coasterLogoFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{await beginCoasterLogoWizard(file);}catch(error){coasterState().error=error.message;syncCoasterControls();updateProjectControls();setStatus('Upload failed');}finally{event.target.value='';}});
 document.querySelector('#coasterEditDesign').addEventListener('click',editExistingCoasterDesign);
 document.querySelector('#coasterBackground').addEventListener('click',event=>openCoasterColourPopover(coasterState().backingIndex,event.currentTarget));
 document.querySelectorAll('[data-coaster-view]').forEach(button=>button.addEventListener('click',()=>{const s=coasterState();s.view=button.dataset.coasterView;s.angle=s.view==='top'?0:.12;s.tilt=s.view==='top'?0:.32;s.zoom=1;renderCoasterView();}));
 document.querySelectorAll('[data-coaster-zoom]').forEach(button=>button.addEventListener('click',()=>{coasterState().zoom=clamp(coasterState().zoom*Number(button.dataset.coasterZoom),.6,2.5);renderCoasterView();}));
 document.querySelector('#coasterZoomReset').addEventListener('click',()=>{coasterState().zoom=1;renderCoasterView();});
}
async function activateCoaster(){setupCoaster();if(!coasterView)initCoasterView();await buildCoaster();}
function initCoasterView(){
 const host=document.querySelector('#coasterCanvas'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,1,2000),group=new THREE.Group();scene.add(group);
 scene.add(new THREE.HemisphereLight(0xffffff,0x6e7580,1.05));const light=new THREE.DirectionalLight(0xffffff,.8);light.position.set(-120,170,300);scene.add(light);
 host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Coaster 3D preview. Drag or use arrow keys to rotate.');
 coasterView={renderer,scene,camera,group};new ResizeObserver(renderCoasterView).observe(host);
 const pointers=new Map();let pinch=0;
 host.addEventListener('pointerdown',e=>{e.stopPropagation();pointers.set(e.pointerId,[e.clientX,e.clientY]);host.setPointerCapture(e.pointerId);});
 host.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;e.stopPropagation();const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);const s=coasterState();if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)s.zoom=clamp(s.zoom*distance/pinch,.6,2.5);pinch=distance;}else{s.angle+=(e.clientX-old[0])*.008;s.tilt=clamp(s.tilt+(e.clientY-old[1])*.006,-1.45,1.45);}renderCoasterView();});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;});
 host.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();coasterState().zoom=clamp(coasterState().zoom*Math.exp(-e.deltaY*.001),.6,2.5);renderCoasterView();},{passive:false});
 host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const s=coasterState();if(e.key==='ArrowLeft'||e.key==='ArrowRight')s.angle+=e.key==='ArrowLeft'?-.12:.12;else s.tilt=clamp(s.tilt+(e.key==='ArrowUp'?-.12:.12),-1.45,1.45);renderCoasterView();});
}
function coasterArtworkCanvas(){
 const s=coasterState(),canvas=document.createElement('canvas'),n=1024;canvas.width=canvas.height=n;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle=s.backing;ctx.fillRect(0,0,n,n);
 if(coasterImage&&s.palette.length){
  const source=document.createElement('canvas');source.width=source.height=n;const sourceCtx=source.getContext('2d',{willReadFrequently:true});sourceCtx.imageSmoothingEnabled=false;sourceCtx.drawImage(coasterImage,0,0,n,n);const frame=sourceCtx.getImageData(0,0,n,n),base=ctx.getImageData(0,0,n,n),inks=s.palette.map(p=>hexToRgb(p.colour));
  // Assign every face pixel to a selected solid ink. Blended display pixels never become extra colours.
  for(let i=0;i<n*n;i++){const o=i*4;if(frame.data[o+3]<128)continue;let best=0,distance=Infinity;s.palette.forEach((p,k)=>{const d=p.rgb.reduce((sum,v,j)=>sum+(v-frame.data[o+j])**2,0);if(d<distance){best=k;distance=d;}});for(let j=0;j<3;j++)base.data[o+j]=inks[best][j];base.data[o+3]=255;}ctx.putImageData(base,0,0);
 }else{ctx.fillStyle='#fcd504';ctx.font='800 140px Arial';ctx.textAlign='center';ctx.fillText('YOUR',512,480);ctx.fillText('LOGO',512,640);}
 ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(512,512,512,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';return canvas;
}
async function buildCoaster(){
 if(!coasterView)return;const s=coasterState(),canvas=coasterArtworkCanvas();coasterView.artwork=canvas;
 const previous=[...coasterView.group.children];previous.forEach(child=>{coasterView.group.remove(child);child.traverse(mesh=>{if(mesh.geometry)mesh.geometry.dispose();if(mesh.material)mesh.material.dispose();});});coasterView.texture?.dispose();
 const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=coasterView.renderer.capabilities.getMaxAnisotropy();coasterView.texture=texture;
 for(let i=0;i<4;i++){
  const disk=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(COASTER_DIAMETER_MM/2,COASTER_DIAMETER_MM/2,COASTER_DEPTH_MM,192),new THREE.MeshStandardMaterial({color:new THREE.Color(s.backing).convertSRGBToLinear(),roughness:.82,metalness:0}));body.rotation.x=Math.PI/2;disk.add(body);
  // Coplanar face, with polygon offset only for rendering. Geometry stays at z=2 mm.
  const face=new THREE.Mesh(new THREE.CircleGeometry(COASTER_DIAMETER_MM/2,192),new THREE.MeshBasicMaterial({map:texture,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));face.position.z=COASTER_DEPTH_MM/2;disk.add(face);disk.userData={diameterMm:COASTER_DIAMETER_MM,depthMm:COASTER_DEPTH_MM,designIndex:0};coasterView.group.add(disk);
 }
 syncCoasterControls();renderCoasterView();renderPreviewTitle();updateStats();updateProjectControls();
}
function layoutCoasterPack(pack){
 const radius=COASTER_DIAMETER_MM/2,depth=COASTER_DEPTH_MM,lean=.18;
 const stackX=radius*.5,stackZ=-radius*.2,standingX=-radius*.58;
 const standingY=radius*Math.cos(lean)+depth/2*Math.sin(lean);
 // Rest the standing coaster on the floor and its reverse against the top
 // stack edge. All transforms are rigid: diameter and thickness stay exact.
 const contactLocalY=(3*depth-standingY+depth/2*Math.sin(lean))/Math.cos(lean);
 const contactX=standingX+Math.sqrt(radius**2-contactLocalY**2);
 const stackFrontZ=stackZ+Math.sqrt(radius**2-(contactX-stackX)**2);
 const standingZ=stackFrontZ+Math.sin(lean)*contactLocalY+depth/2*Math.cos(lean);
 coasterView.group.children.forEach((disk,i)=>{
  disk.visible=pack||i===0;disk.rotation.set(0,0,0);disk.position.set(0,0,0);
  if(!pack)return;
  if(i===0){disk.rotation.x=-lean;disk.position.set(standingX,standingY,standingZ);}
  else{disk.rotation.x=-Math.PI/2;disk.position.set(stackX,(i-.5)*depth,stackZ);}
 });
}
function renderCoasterView(){
 if(!coasterView||state.productType!=='coaster')return;const s=coasterState(),host=document.querySelector('#coasterCanvas'),w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 if(isMobileControlLayout()){const bar=els.mobileCommandBar.getBoundingClientRect(),stage=els.stage.getBoundingClientRect();if(bar.height>0&&!document.body.classList.contains('mobile-controls-open'))document.querySelector('#coasterPreview').style.setProperty('--coaster-mobile-footer',Math.max(16,stage.bottom-bar.top+16)+'px');}
 const pack=s.view==='pack';layoutCoasterPack(pack);
 const bounds=new THREE.Box3();coasterView.group.children.filter(d=>d.visible).forEach(d=>bounds.union(new THREE.Box3().setFromObject(d)));const eye=new THREE.Vector3(Math.sin(s.angle)*Math.cos(s.tilt),Math.sin(s.tilt),Math.cos(s.angle)*Math.cos(s.tilt)),target=bounds.getCenter(new THREE.Vector3());
 const {renderer,camera,scene}=coasterView;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.copy(target).addScaledVector(eye,fitLockerCameraDistance(bounds,target,eye,camera.aspect)/s.zoom);camera.lookAt(target);camera.updateProjectionMatrix();renderer.render(scene,camera);
 document.querySelectorAll('[data-coaster-view]').forEach(button=>{const active=button.dataset.coasterView===s.view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});document.querySelector('#coasterZoomReset').textContent=Math.round(s.zoom*100)+'%';
}
function syncCoasterControls(){
 const s=coasterState();document.querySelector('#coasterEditDesign').hidden=!s.source;document.querySelector('#coasterBackground i').style.background=s.backing;document.querySelector('#coasterColourCount').textContent=`${coasterColours().length} of 8 colours used`;document.querySelector('#coasterMessage').textContent=s.error;
 const host=document.querySelector('#coasterPalette');host.replaceChildren();s.palette.forEach((p,k)=>{if(k===s.backingIndex)return;const label=`Artwork colour ${k+1}`,button=document.createElement('button');button.type='button';button.className='hype-colour-chip';button.dataset.coasterPalette=k;button.title=label;button.setAttribute('aria-label',label);const ink=document.createElement('i');ink.style.background=p.colour;button.append(ink);button.addEventListener('click',()=>openCoasterColourPopover(k,button));host.append(button);});
}
function openCoasterColourPopover(index,button){state.selectedColourTarget={type:'coaster',index};updatePopoverInputs(index<0?coasterState().backing:coasterState().palette[index].colour);positionColourPopover(button);renderUsedColourGrid();setPopoverTab('preset');}
function applyCoasterColour(index,hex){const s=coasterState(),previous=index<0?s.backing:s.palette[index]?.colour;if(!previous)return;const proposed=uniqueHexColours([index<0||index===s.backingIndex?hex:s.backing,...s.palette.map((p,k)=>k===index?hex:p.colour)]);if(proposed.length>8){s.error='Maximum 8 colours. Reuse a current colour or merge artwork colours first.';syncCoasterControls();updateProjectControls();return;}s.error='';if(index<0||index===s.backingIndex)s.backing=hex;if(index>=0)s.palette[index].colour=hex;buildCoaster();}
function coasterSavedEdit(){const s=coasterState(),e=s.wizardEdit;if(!e)return null;const map=hex=>s.palette[coasterNearestPaletteIndex(hex)]?.colour||hex;return {...e,backing:s.backing,logoColourMapping:(e.logoColourMapping||[]).map(m=>({...m,to:map(m.to)})),textBoxes:(e.textBoxes||[]).map(box=>({...box,colour:map(box.colour)}))};}
async function buildCoasterProject(){
 if(!coasterReady())throw new Error('Upload and confirm a coaster design before saving.');const s=coasterState(),{source,busy,error,...config}=s;
 return {type:'SignGuy.CoasterStudio',version:PROJECT_FILE_VERSION,id:s.projectId||makeProjectId(),name:s.name||'My Custom Coaster Set',customerEmail:state.customerEmail,savedAt:new Date().toISOString(),source:{...source},config:{productType:'coaster',coaster:{...config,wizardEdit:coasterSavedEdit(),palette:s.palette.map(p=>({...p,rgb:[...p.rgb],height:0}))},dimensions:coasterDimensions(),packSize:4,totalCoasters:s.packs*4,construction:'single-sided-flush'},outputArtwork:buildCoasterFinalArtwork(),preview:{screenshotDataUrl:coasterView.artwork.toDataURL('image/png'),dimensions:coasterDimensions(),colours:coasterColours(),details:{packs:s.packs,coasters:s.packs*4}}};
}
function buildCoasterFinalArtwork(){
 const canvas=coasterView.artwork,n=canvas.width,ctx=canvas.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,n,n).data,colours=coasterColours(),commands=colours.map(()=>[]),lookup=new Map(colours.map((c,k)=>[hexToRgb(c).join(','),k]));
 // Exact selected-colour pixel runs preserve thin details without re-tracing or changing the design.
 for(let y=0;y<n;y++){let run=-1,start=0;for(let x=0;x<=n;x++){const o=(y*n+x)*4,k=x<n&&pixels[o+3]>=128?lookup.get([pixels[o],pixels[o+1],pixels[o+2]].join(','))??-1:-1;if(k!==run){if(run>=0)commands[run].push(`M${start} ${y}h${x-start}v1h-${x-start}Z`);start=x;run=k;}}}
 const paths=commands.map((runs,k)=>runs.length?`<path fill="${colours[k]}" d="${runs.join('')}"/>`:'').join(''),diameter=COASTER_DIAMETER_MM;
 const svgText=`<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}mm" height="${diameter}mm" viewBox="0 0 ${n} ${n}"><defs><clipPath id="coaster"><circle cx="512" cy="512" r="512"/></clipPath></defs><g clip-path="url(#coaster)"><circle cx="512" cy="512" r="512" fill="${coasterState().backing}"/>${paths}</g></svg>`;
 return {pngDataUrl:canvas.toDataURL('image/png'),svgText,widthMm:diameter,heightMm:diameter,depthMm:4,raisedMm:0};
}
async function saveCoasterProject(){setStatus('Saving');try{const project=await buildCoasterProject();await saveProjectRecord(project);coasterState().projectId=project.id;downloadProjectPayload(project);await refreshProjectLog();els.projectNote.textContent=`${project.name} saved locally and downloaded as a .SignGuy file.`;setStatus('Saved');}catch(error){els.projectNote.textContent=error.message;setStatus('Save failed');}finally{updateProjectControls();}}
async function exportCoasterArtwork(){try{const project=await buildCoasterProject();downloadBlob(dataUrlToFile(project.outputArtwork.pngDataUrl,'coaster-finished-circle.png'),'coaster-finished-circle.png','image/png');downloadBlob(project.outputArtwork.svgText,'coaster-finished-circle.svg','image/svg+xml');els.submitNote.textContent='Finished coaster PNG and SVG downloaded. Four identical coasters per pack.';}catch(error){els.submitNote.textContent=error.message;}}
async function restoreCoasterProject(project){
 const c=project.config?.coaster,d=project.config?.dimensions;if(!c||!project.source?.dataUrl||!c.preparedDataUrl||!Array.isArray(c.palette)||!c.palette.length||c.palette.length>8||d?.diameterMm!==101.66||d?.depthMm!==4||project.config.packSize!==4)throw new Error('Invalid coaster project. Expected a 101.66 mm × 4 mm coaster, in packs of four.');
 const image=await loadImage(c.preparedDataUrl),candidate={...COASTER_SIGN_DEFAULTS,...c,source:{...project.source},name:project.name,projectId:project.id,busy:false,error:'',backing:normalizeHex(c.backing),packs:Number(c.packs),palette:c.palette.map(p=>{if(!Array.isArray(p.rgb)||p.rgb.length!==3||p.rgb.some(v=>!Number.isFinite(v)))throw new Error('Invalid coaster colours.');return {rgb:p.rgb.map(v=>clamp(v,0,255)),colour:normalizeHex(p.colour),height:0};})};
 if(!Number.isInteger(candidate.packs)||candidate.packs<1||candidate.packs>99||uniqueHexColours([candidate.backing,...candidate.palette.map(p=>p.colour)]).length>8)throw new Error('Invalid coaster pack quantity or colour count.');
 if(!['top','pack'].includes(candidate.view)){candidate.view='top';candidate.angle=0;candidate.tilt=0;candidate.zoom=1;}
 coasterSign=candidate;coasterImage=image;++coasterRevision;state.productSelectionMenuResolved=true;hideProductSelectionMenu();selectProductType('coaster');await activateCoaster();await refreshProjectLog();
}
async function captureCoasterShots(){const s=coasterState(),old={view:s.view,angle:s.angle,tilt:s.tilt,zoom:s.zoom},shots=[];try{for(const view of ['top','pack']){Object.assign(s,{view,angle:view==='top'?0:.12,tilt:view==='top'?0:.32,zoom:1});renderCoasterView();const blob=await new Promise(resolve=>coasterView.renderer.domElement.toBlob(resolve,'image/png')),fileName=`coaster-${view}.png`;shots.push({label:view,fileName,blob,file:new File([blob],fileName,{type:'image/png'})});}}finally{Object.assign(s,old);renderCoasterView();}return shots;}
