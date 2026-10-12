// Locker uploads use the Studio wizard, staging changes until Confirm.
let lockerUploadSession=null;
async function beginLockerLogoWizard(file,options={}){
 const validation=validateUploadFile(file);if(!validation.ok)throw new Error(validation.message);
 if(file.size>15*1024*1024)throw new Error('Please choose a logo smaller than 15 MB.');
 if(lockerUploadSession)cancelLockerLogoWizard();
 const session={snapshot:captureCurrentArtworkState(),uploadTarget:state.uploadTarget,processingDirty:state.processingDirty};
 lockerUploadSession=session;lockerState().busy=true;lockerState().error='';updateProjectControls();setStatus('Preparing artwork');
 try{
  const upload=validation.kind==='heic'?await convertHeicToPngFile(file):file;
  state.uploadTarget='locker';
  const artwork=await(validation.kind==='svg'?readSvgArtwork(upload):readRasterArtwork(upload));
  const dataUrl=await fileToDataUrl(upload);if(lockerUploadSession!==session)return;
  session.original={fileName:upload.name,artworkType:artwork.type,mimeType:upload.type,dataUrl};session.artwork=artwork;
  session.edit={mode:null,placed:false,scale:100,x:0,y:0,removeBg:!artwork.hasTransparency,backing:lockerState().backing,...options.edit,textBoxes:(options.edit?.textBoxes||[]).map(normaliseLockerEditorText)};
  session.selectedTextId=session.edit.textBoxes.at(-1)?.id||null;
  session.textPaletteDirty=session.edit.textBoxes.length>0;
  rebuildLockerWizardSource();
  if(!session.sourceBounds)throw new Error('No visible artwork was found. Choose a design with visible colours.');
  if(lockerArtworkIsCircular(session.logo)){if(!session.edit.mode){session.edit.mode='crop';session.edit.placed=true;}session.detectedCircle=true;}
  Object.assign(state,{artwork,uploadedFile:upload,fileName:upload.name,isDefaultPreview:false,processed:null,removeBg:false,fixFloatingRegions:false,
   targetColorCount:8,colorOverrides:[],frontColoursCustomized:false,selectedColor:0,selectedColourTarget:{type:'front',index:0},processingDirty:true});
  initEditState(artwork);openWizard('edit');setStatus('Edit your circle design');
 }catch(error){if(lockerUploadSession===session)cancelLockerLogoWizard();throw error;}
}
function rebuildLockerWizardSource(){
 const session=lockerUploadSession;if(!session)return;
 const image=session.artwork.image,w=getArtworkImageWidth(image),h=getArtworkImageHeight(image),ratio=Math.min(1,1536/Math.max(w,h));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
 let frame=ctx.getImageData(0,0,canvas.width,canvas.height);
 if(session.edit.removeBg){removeConnectedBackgroundFromImageData(frame.data,canvas.width,canvas.height);ctx.putImageData(frame,0,0);}
 session.sourceBounds=getImageDataAlphaBounds(frame.data,canvas.width,canvas.height,128);
 session.logo=trimCanvasToVisibleAlpha(canvas,128).canvas;
 remapLockerSavedLogo(session);
 session.logoColours=detectLockerLogoUsedColours(session);
 const sample=document.createElement('canvas');sample.width=sample.height=128;sample.getContext('2d').drawImage(session.logo,0,0,128,128);
 const pixels=sample.getContext('2d').getImageData(0,0,128,128).data;session.alphaPoints=[];
 for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]>=128)session.alphaPoints.push([(x+.5)/128,(y+.5)/128]);
 session.composed=null;
}
function lockerArtworkIsCircular(canvas){
 if(Math.abs(canvas.width/canvas.height-1)>.08)return false;
 const sample=document.createElement('canvas');sample.width=sample.height=192;
 const ctx=sample.getContext('2d');ctx.drawImage(canvas,0,0,192,192);const pixels=ctx.getImageData(0,0,192,192).data;
 let outside=0,total=0;
 for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(pixels[(y*192+x)*4+3]>=128){total++;if(Math.hypot(x+.5-96,y+.5-96)>98)outside++;}
 if(!total||outside/total>.02)return false;
 let rim=0;
 for(let k=0;k<32;k++){const angle=k*Math.PI/16;for(let r=86;r<96;r++){
  const x=Math.floor(96+Math.cos(angle)*r),y=Math.floor(96+Math.sin(angle)*r);
  if(pixels[(y*192+x)*4+3]>=128){rim++;break;}
 }}
 return rim>=29;
}
function lockerCircleLayout(){
 const session=lockerUploadSession,e=session.edit,logo=session.logo,n=1024;
 const fit=e.mode==='place' ? .9*n/Math.hypot(logo.width,logo.height) : n/Math.max(logo.width,logo.height);
 const scale=fit*e.scale/100,w=logo.width*scale,h=logo.height*scale;
 return {w,h,x:(n-w)/2+e.x*n,y:(n-h)/2+e.y*n};
}
function lockerCircleValidation(){
 const session=lockerUploadSession;if(!session?.sourceBounds||!session.alphaPoints.length)return {ok:false,message:'This image has no visible logo.'};
 if(!session.edit.mode||!session.edit.placed)return {ok:false,message:'Drag the logo onto the circle, or choose a circle option before continuing.'};
 const b=lockerCircleLayout();let visible=0,outside=0;
 for(const [u,v] of session.alphaPoints){const radius=Math.hypot(b.x+u*b.w-512,b.y+v*b.h-512);if(radius<508)visible++;else outside++;}
 if(!visible)return {ok:false,message:'Move the logo onto the circle before continuing.'};
 if(session.edit.mode==='place'&&outside)return {ok:false,message:'Keep the full logo inside the circle. Move it inward or reduce its size.'};
 const textValidation=validateLockerEditorText();if(!textValidation.ok)return textValidation;
 return {ok:true,message:session.edit.mode==='place'?'Logo is on the circle. Drag to reposition it.':'Circular crop ready. Drag to adjust what appears inside the circle.'};
}
function drawLockerCircle(canvas,editor=false){
 const session=lockerUploadSession,e=session.edit,n=canvas.width,ctx=canvas.getContext('2d');ctx.clearRect(0,0,n,n);
 ctx.save();ctx.scale(n/1024,n/1024);ctx.beginPath();ctx.arc(512,512,512,0,Math.PI*2);ctx.clip();ctx.fillStyle=e.backing;ctx.fillRect(0,0,1024,1024);
 if(e.placed){const b=lockerCircleLayout();ctx.drawImage(session.logo,b.x,b.y,b.w,b.h);}
 else if(editor){ctx.fillStyle=readableTextColour(e.backing);ctx.font='bold 36px Arial';ctx.textAlign='center';ctx.fillText('Drag your logo here',512,510);ctx.font='24px Arial';ctx.fillText('or choose Place logo on circle',512,554);}
 drawLockerEditorText(ctx);ctx.restore();
 if(editor){
  ctx.save();ctx.scale(n/1024,n/1024);drawLockerTextSelection(ctx,1024/Math.max(1,canvas.getBoundingClientRect().width));ctx.restore();
  ctx.beginPath();ctx.arc(n/2,n/2,n/2-2,0,Math.PI*2);ctx.strokeStyle=lockerCircleValidation().ok?'#fcd504':'#999';ctx.lineWidth=3;ctx.stroke();
  if(session.dragging&&session.snapping){
   const displayWidth=document.querySelector('#lockerCircleCanvas').getBoundingClientRect().width,unit=n/Math.max(1,displayWidth);
   ctx.save();ctx.beginPath();ctx.arc(n/2,n/2,n/2-2,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#44d6f0';ctx.lineWidth=unit;ctx.setLineDash([8*unit,5*unit]);
   ctx.beginPath();if(session.snapping.x){ctx.moveTo(n/2,0);ctx.lineTo(n/2,n);}if(session.snapping.y){ctx.moveTo(0,n/2);ctx.lineTo(n,n/2);}ctx.stroke();ctx.restore();
  }
 }
}
function renderLockerEditStep(){
 const session=lockerUploadSession;if(!session)return;const e=session.edit;
 els.wizard.classList.add('locker-circle-edit');els.wizardTitle.textContent='Edit Your Image';els.wizardImage.hidden=true;els.cropBox.classList.remove('visible','circle');els.previewTools.classList.remove('hidden');
 let canvas=document.querySelector('#lockerCircleCanvas');
 if(!canvas){
  canvas=document.createElement('canvas');canvas.id='lockerCircleCanvas';canvas.width=canvas.height=1024;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Circle design. Drop your logo here, then drag or use arrow keys to position it.');els.wizardArtboard.append(canvas);bindLockerCircleCanvas(canvas);
 }
 canvas.hidden=false;
 els.wizardSide.innerHTML=`<h3>Circle design</h3><p>${session.detectedCircle?'Your uploaded design is circular. Adjust its crop below.':'Place your logo on a circle, or crop your image to a circle.'}</p>
  <div class="locker-logo-drag" draggable="true" tabindex="0" role="button" aria-label="Place uploaded logo on the circle"><img src="${session.logo.toDataURL()}" alt="Uploaded logo" draggable="false"/><span>Drag logo onto circle</span></div>
  <div class="locker-circle-options"><button type="button" data-locker-circle-mode="place" class="crop-preset ${e.mode==='place'?'active':''}">Place logo on circle</button><button type="button" data-locker-circle-mode="crop" class="crop-preset ${e.mode==='crop'?'active':''}">Crop to circle</button></div>
  <label class="switch-row"><span>Remove Background</span><input id="lockerWizardRemoveBg" type="checkbox" ${e.removeBg?'checked':''}/></label>
  <div class="locker-circle-backing"><span>Circle colour</span><button type="button" class="hype-colour-chip" id="lockerWizardBacking" aria-label="Circle background colour"><i style="background:${e.backing}"></i></button></div>
  <label class="locker-circle-scale">Logo size <output id="lockerWizardScaleValue">${Math.round(e.scale)}%</output><input id="lockerWizardScale" type="range" min="10" max="180" step="1" value="${e.scale}"/></label>
  <button class="secondary-button" type="button" id="lockerWizardCentre">Centre logo</button><p id="lockerCircleStatus" role="status" aria-live="polite"></p><section id="lockerTextControls" aria-label="Add text to the circle"></section>`;
 els.wizardFooter.innerHTML='<button class="secondary-button" type="button" data-wizard-action="cancel">Cancel</button><button class="primary-button" type="button" data-wizard-action="to-vector">Next</button>';
 bindWizardButtons();
 const chooseMode=mode=>{e.mode=mode;e.placed=true;e.scale=100;e.x=e.y=0;session.composed=null;renderLockerEditStep();};
 els.wizardSide.querySelectorAll('[data-locker-circle-mode]').forEach(button=>button.addEventListener('click',()=>chooseMode(button.dataset.lockerCircleMode)));
 const thumbnail=els.wizardSide.querySelector('.locker-logo-drag');
 thumbnail.addEventListener('dragstart',event=>{event.dataTransfer.setData('application/x-locker-logo','uploaded');event.dataTransfer.effectAllowed='copy';});
 thumbnail.addEventListener('click',()=>{if(!e.placed)chooseMode('place');});
 thumbnail.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseMode('place');}});
 let start=null;
 thumbnail.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;start={id:event.pointerId};thumbnail.setPointerCapture(event.pointerId);});
 thumbnail.addEventListener('pointerup',event=>{if(!start)return;const r=canvas.getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)dropLockerLogoAt(event.clientX,event.clientY,canvas);start=null;});
 thumbnail.addEventListener('pointercancel',()=>{start=null;});
 document.querySelector('#lockerWizardRemoveBg').addEventListener('change',event=>{e.removeBg=event.target.checked;rebuildLockerWizardSource();renderLockerEditStep();});
 document.querySelector('#lockerWizardScale').addEventListener('input',event=>{e.scale=Number(event.target.value);session.composed=null;paintLockerCircleEditor();});
 document.querySelector('#lockerWizardCentre').addEventListener('click',()=>{e.x=e.y=0;session.composed=null;paintLockerCircleEditor();});
 document.querySelector('#lockerWizardBacking').addEventListener('click',event=>{state.selectedColourTarget={type:'lockerCircleBacking'};updatePopoverInputs(e.backing);positionColourPopover(event.currentTarget);renderUsedColourGrid();setPopoverTab('preset');});
 renderLockerTextControls();paintLockerCircleEditor();requestAnimationFrame(()=>canvas.focus({preventScroll:true}));
}
function bindLockerCircleCanvas(canvas){
 canvas.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-locker-logo')){event.preventDefault();event.dataTransfer.dropEffect='copy';}});
 canvas.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer.getData('application/x-locker-logo'))dropLockerLogoAt(event.clientX,event.clientY,canvas);});
 let drag=null;
 canvas.addEventListener('pointerdown',event=>{
  if(!lockerUploadSession||drag)return;const e=lockerUploadSession.edit,r=canvas.getBoundingClientRect(),target=findLockerTextTarget((event.clientX-r.left)/r.width*1024,(event.clientY-r.top)/r.height*1024,canvas);
  if(!target&&!e.placed)return;event.preventDefault();closeColourPopover();lockerUploadSession.selectedTextId=target?.box.id||null;renderLockerTextControls();
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,positionX:e.x,positionY:e.y,width:r.width,height:r.height,textId:target?.box.id,corner:target?.corner,original:target?{...target.box}:null};
  const p=target?.box||e;lockerUploadSession.dragging=true;lockerUploadSession.snapping={x:p.x===0,y:p.y===0};canvas.dataset.dragging='true';canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});paintLockerCircleEditor();
 });
 canvas.addEventListener('pointermove',event=>{if(!drag||!lockerUploadSession||event.pointerId!==drag.id)return;const dx=(event.clientX-drag.x)/drag.width,dy=(event.clientY-drag.y)/drag.height;if(drag.textId)moveLockerTextDrag(drag,dx,dy,canvas);else{setLockerCirclePosition(drag.positionX+dx,drag.positionY+dy,canvas);paintLockerCircleEditor();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;delete canvas.dataset.dragging;if(lockerUploadSession){lockerUploadSession.dragging=false;paintLockerCircleEditor();}});
 canvas.addEventListener('keydown',event=>{
  if(!lockerUploadSession)return;const box=lockerSelectedTextBox();if(box&&['Delete','Backspace'].includes(event.key)){event.preventDefault();removeLockerEditorText(box.id);return;}
  if(!box&&!lockerUploadSession.edit.placed||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const e=box||lockerUploadSession.edit,step=event.shiftKey?.05:.01;if(event.key==='ArrowLeft')e.x-=step;if(event.key==='ArrowRight')e.x+=step;if(event.key==='ArrowUp')e.y-=step;if(event.key==='ArrowDown')e.y+=step;lockerUploadSession.composed=null;paintLockerCircleEditor();
 });
}
function dropLockerLogoAt(clientX,clientY,canvas){
 const session=lockerUploadSession;if(!session)return;const r=canvas.getBoundingClientRect(),e=session.edit;e.mode='place';e.placed=true;e.scale=100;setLockerCirclePosition((clientX-r.left)/r.width-.5,(clientY-r.top)/r.height-.5,canvas);renderLockerEditStep();
}
function setLockerCirclePosition(x,y,canvas){
 const p=snapLockerEditorPosition(x,y,canvas);lockerUploadSession.edit.x=p.x;lockerUploadSession.edit.y=p.y;lockerUploadSession.composed=null;
}
function snapLockerEditorPosition(x,y,canvas){
 const session=lockerUploadSession;if(!session)return;const r=canvas.getBoundingClientRect(),threshold=8/Math.max(1,Math.min(r.width,r.height));
 session.snapping={x:Math.abs(x)<=threshold,y:Math.abs(y)<=threshold};
 return {x:session.snapping.x?0:clamp(x,-1,1),y:session.snapping.y?0:clamp(y,-1,1)};
}
function paintLockerCircleEditor(){
 const session=lockerUploadSession,canvas=document.querySelector('#lockerCircleCanvas');if(!session||!canvas||state.wizardStep!=='edit')return;
 drawLockerCircle(canvas,true);const validation=lockerCircleValidation(),next=els.wizardFooter.querySelector('[data-wizard-action="to-vector"]');if(next)next.disabled=!validation.ok;
 const message=document.querySelector('#lockerCircleStatus');if(message){
  const snap=session.dragging&&session.snapping,alignment=snap?.x&&snap?.y?'Centred on both axes.':snap?.x?'Centred horizontally.':snap?.y?'Centred vertically.':'';
  message.textContent=validation.message+(alignment?' '+alignment:'');message.classList.toggle('invalid',!validation.ok);
 }
 const slider=document.querySelector('#lockerWizardScale');if(slider)slider.value=session.edit.scale;
 const value=document.querySelector('#lockerWizardScaleValue');if(value)value.textContent=Math.round(session.edit.scale)+'%';
 document.querySelector('#lockerWizardBacking i')?.style.setProperty('background',session.edit.backing);
}
function zoomLockerCircleEditor(value){
 const e=lockerUploadSession.edit;e.scale=clamp(e.scale+(value-state.edit.zoom)*100,10,180);state.edit.zoom=clamp(value,.7,1.8);lockerUploadSession.composed=null;paintLockerCircleEditor();
}
function hideLockerCircleEditor(){closeLockerFontPicker();els.wizard.classList.remove('locker-circle-edit');els.wizardImage.hidden=false;const canvas=document.querySelector('#lockerCircleCanvas');if(canvas)canvas.hidden=true;}
async function prepareLockerCircleArtwork(){
 const session=lockerUploadSession;if(!session)return false;const validation=lockerCircleValidation();
 if(!validation.ok){if(state.wizardStep!=='edit')openWizard('edit');paintLockerCircleEditor();return false;}
 if(session.composed)return true;
 await Promise.all(lockerEditorTextBoxes().map(box=>document.fonts.load('400 200px '+lockerTextFontStack(box.font)).catch(()=>{}))); if(lockerUploadSession!==session)return false;
 if(!lockerCircleValidation().ok){paintLockerCircleEditor();return false;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;drawLockerCircle(canvas);
 const dataUrl=canvas.toDataURL('image/png'),image=await loadImage(dataUrl);if(lockerUploadSession!==session)return false;
 // Seed the shared vectorizer with source inks, keeping edge blends out of its
 // expensive per-pixel cluster creation while retaining colour-count editing.
 const textColours=lockerEditorTextBoxes().map(box=>hexToRgb(box.colour));
 const palette=[...new Map([...session.logoColours.map(hexToRgb),hexToRgb(session.edit.backing),...textColours].map(rgb=>[rgbToHex(rgb),rgb])).values()];
 const paletteSignature=palette.map(rgbToHex).sort().join(',');
 if(session.textPaletteDirty||session.paletteSignature&&session.paletteSignature!==paletteSignature){state.frontColoursCustomized=true;state.targetColorCount=8;session.autoColourCount=true;}
 session.paletteSignature=paletteSignature;session.textPaletteDirty=false;
 state.artwork={type:'png',image,dataUrl,hasTransparency:true,name:session.original.fileName,palette,lockerSolidPalette:true};
 state.edit.crop={x:0,y:0,w:1,h:1};state.edit.cropAspect='circle';state.removeBg=false;state.fixFloatingRegions=false;state.processingDirty=true;
 session.composed=dataUrl;return true;
}
function lockerCirclePalette(source){
 // Inspect the original-resolution pixels. Downsampling first creates grey
 // edge shades that can look like additional inks in detailed lettering.
 const width=source.width,height=source.height,ctx=source.getContext('2d',{willReadFrequently:true});
 const data=ctx.getImageData(0,0,width,height).data,hist=new Map(),fallback=new Map();
 const add=(map,rgb)=>{
  const key=rgb.map(v=>Math.round(v/12)).join(','),bucket=map.get(key)||{rgb,count:0,samples:new Map(),modeCount:0};
  const sample=(rgb[0]<<16)|(rgb[1]<<8)|rgb[2],count=(bucket.samples.get(sample)||0)+1;
  bucket.samples.set(sample,count);if(count>bucket.modeCount){bucket.rgb=rgb;bucket.modeCount=count;}bucket.count++;map.set(key,bucket);
 };
 let opaque=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(data[i+3]<220)continue;opaque++;const rgb=[data[i],data[i+1],data[i+2]];add(fallback,rgb);
  if(x<2||y<2||x>=width-2||y>=height-2)continue;
  let solid=true;
  for(let dy=-2;dy<=2&&solid;dy++)for(let dx=-2;dx<=2;dx++){
   const j=((y+dy)*width+x+dx)*4;
   if(data[j+3]<220||rgb.reduce((sum,v,k)=>sum+(v-data[j+k])**2,0)>18**2){solid=false;break;}
  }
  if(solid)add(hist,rgb);
 }
 const palette=[];
 for(const {rgb,count} of [...(hist.size?hist:fallback).values()].sort((a,b)=>b.count-a.count)){
  if(count<Math.max(3,opaque*.0002)||palette.some(p=>p.reduce((d,v,k)=>d+(v-rgb[k])**2,0)<45**2))continue;
  palette.push(rgb);if(palette.length===8)break;
 }
 return palette.length?palette:[...fallback.values()].sort((a,b)=>b.count-a.count).slice(0,1).map(bucket=>bucket.rgb);
}
function getLockerWizardUsedColours(){
 if(!lockerUploadSession)return [];
 return [...(state.processed?.colours.length?state.processed.colours.map((region,index)=>getDisplayColour(index,region.hex)):lockerUploadSession.logoColours||[]),...lockerEditorTextBoxes().map(box=>box.colour)];
}
function detectLockerLogoUsedColours(session){
 const explicit=session.artwork.type==='svg'&&!session.logoRemapped;
 if(!explicit)return lockerCirclePalette(session.logo).map(rgbToHex);
 const n=256,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d');ctx.drawImage(session.logo,0,0,n,n);
 const data=ctx.getImageData(0,0,n,n).data,palette=session.artwork.palette;
 const clusters=palette.map(rgb=>({rgb,count:0}));
 for(let i=0;i<n*n;i++){
  if(data[i*4+3]<220)continue;let best=-1,distance=Infinity;
  palette.forEach((rgb,k)=>{const d=rgb.reduce((sum,v,j)=>sum+(v-data[i*4+j])**2,0);if(d<distance){best=k;distance=d;}});
  if(best<0||distance>18**2)continue;
  clusters[best].count++;
 }
 const present=clusters.filter(c=>c.count>=3);
 return present.map(c=>rgbToHex(c.rgb));
}
function cancelLockerLogoWizard(){
 const session=lockerUploadSession;if(!session)return;lockerUploadSession=null;hideLockerCircleEditor();applyArtworkStateSnapshot(session.snapshot);state.uploadTarget=session.uploadTarget;state.processingDirty=session.processingDirty;lockerState().busy=false;syncLockerControls();updateProjectControls();setStatus('Ready');
}
async function completeLockerLogoWizard(){
 const session=lockerUploadSession;if(!session||!lockerCircleValidation().ok)return;
 if(state.processingDirty)await reprocess({skipWizardRender:true});
 if(!state.processed?.colours.length)throw new Error('No visible artwork was found.');
 const canvas=trimCanvasToVisibleAlpha(createMappedArtworkCanvas(state.processed),128).canvas,preparedDataUrl=canvas.toDataURL('image/png'),image=await loadImage(preparedDataUrl);if(lockerUploadSession!==session)return;
 const palette=state.processed.colours.map((region,k)=>{const colour=normalizeHex(getDisplayColour(k,region.hex)),rgb=hexToRgb(colour);return {colour,rgb,height:lockerDefaultLayerHeight(colour,isNearWhiteHex(session.edit.backing))};});
 const mapColour=hex=>{const rgb=hexToRgb(hex);let best=0,distance=Infinity;state.processed.colours.forEach((region,k)=>{const d=hexToRgb(region.hex).reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){best=k;distance=d;}});return getDisplayColour(best,state.processed.colours[best].hex);};
 const mapping=session.edit.logoColourMapping?.length?session.edit.logoColourMapping.map(m=>({from:m.from,to:mapColour(m.to)})):session.logoColours.map(hex=>({from:hex,to:mapColour(hex)}));
 const source={...session.original},wizardEdit={...session.edit,backing:mapColour(session.edit.backing),logoColourMapping:mapping,textBoxes:lockerEditorTextBoxes().map(box=>({...box,colour:mapColour(box.colour)}))};cancelLockerLogoWizard();
 Object.assign(lockerState(),{source,preparedDataUrl,wizardEdit,circlePrepared:true,isExample:false,projectId:null,palette,colourCount:palette.length,removeBg:false,backing:wizardEdit.backing,scale:100,x:0,y:0,busy:false,error:''});
 ++lockerRevision;lockerImage=image;await buildLockerSign();closeWizard();setStatus('Locker sign design ready');
}
