// Coaster uploads use the Studio wizard, staging changes until Confirm.
let coasterUploadSession=null;
async function beginCoasterLogoWizard(file,options={}){
 const validation=validateUploadFile(file);if(!validation.ok)throw new Error(validation.message);
 if(file.size>15*1024*1024)throw new Error('Please choose a logo smaller than 15 MB.');
 if(coasterUploadSession)cancelCoasterLogoWizard();
 const session={snapshot:captureCurrentArtworkState(),uploadTarget:state.uploadTarget,processingDirty:state.processingDirty};
 coasterUploadSession=session;coasterState().busy=true;coasterState().error='';updateProjectControls();setStatus('Preparing artwork');
 try{
  const upload=validation.kind==='heic'?await convertHeicToPngFile(file):file;
  state.uploadTarget='coaster';
  const artwork=await(validation.kind==='svg'?readSvgArtwork(upload):readRasterArtwork(upload));
  const dataUrl=await fileToDataUrl(upload);if(coasterUploadSession!==session)return;
  session.original={fileName:upload.name,artworkType:artwork.type,mimeType:upload.type,dataUrl};session.artwork=artwork;
  session.edit={mode:null,placed:false,scale:100,x:0,y:0,removeBg:!artwork.hasTransparency,backing:coasterState().backing,...options.edit,textBoxes:(options.edit?.textBoxes||[]).map(normaliseCoasterEditorText)};
  session.selectedTextId=session.edit.textBoxes.at(-1)?.id||null;
  session.textPaletteDirty=session.edit.textBoxes.length>0;
  rebuildCoasterWizardSource();
  if(!session.sourceBounds)throw new Error('No visible artwork was found. Choose a design with visible colours.');
  if(coasterArtworkIsCircular(session.logo)){if(!session.edit.mode){session.edit.mode='crop';session.edit.placed=true;}session.detectedCircle=true;}
  Object.assign(state,{artwork,uploadedFile:upload,fileName:upload.name,isDefaultPreview:false,processed:null,removeBg:false,fixFloatingRegions:false,
   targetColorCount:8,colorOverrides:[],frontColoursCustomized:false,selectedColor:0,selectedColourTarget:{type:'front',index:0},processingDirty:true});
  initEditState(artwork);openWizard('edit');setStatus('Edit your circle design');
 }catch(error){if(coasterUploadSession===session)cancelCoasterLogoWizard();throw error;}
}
function rebuildCoasterWizardSource(){
 const session=coasterUploadSession;if(!session)return;
 const image=session.artwork.image,w=getArtworkImageWidth(image),h=getArtworkImageHeight(image),ratio=Math.min(1,1536/Math.max(w,h));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
 let frame=ctx.getImageData(0,0,canvas.width,canvas.height);
 if(session.edit.removeBg){removeConnectedBackgroundFromImageData(frame.data,canvas.width,canvas.height);ctx.putImageData(frame,0,0);}
 session.sourceBounds=getImageDataAlphaBounds(frame.data,canvas.width,canvas.height,128);
 session.logo=trimCanvasToVisibleAlpha(canvas,128).canvas;
 remapCoasterSavedLogo(session);
 session.logoColours=detectCoasterLogoUsedColours(session);
 const sample=document.createElement('canvas');sample.width=sample.height=128;sample.getContext('2d').drawImage(session.logo,0,0,128,128);
 const pixels=sample.getContext('2d').getImageData(0,0,128,128).data;session.alphaPoints=[];
 for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]>=128)session.alphaPoints.push([(x+.5)/128,(y+.5)/128]);
 session.composed=null;
}
function coasterArtworkIsCircular(canvas){
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
function coasterCircleLayout(){
 const session=coasterUploadSession,e=session.edit,logo=session.logo,n=1024;
 const fit=e.mode==='place' ? .9*n/Math.hypot(logo.width,logo.height) : n/Math.max(logo.width,logo.height);
 const scale=fit*e.scale/100,w=logo.width*scale,h=logo.height*scale;
 return {w,h,x:(n-w)/2+e.x*n,y:(n-h)/2+e.y*n};
}
function coasterCircleValidation(){
 const session=coasterUploadSession;if(!session?.sourceBounds||!session.alphaPoints.length)return {ok:false,message:'This image has no visible logo.'};
 if(!session.edit.mode||!session.edit.placed)return {ok:false,message:'Drag the logo onto the circle, or choose a circle option before continuing.'};
 const b=coasterCircleLayout();let visible=0,outside=0;
 for(const [u,v] of session.alphaPoints){const radius=Math.hypot(b.x+u*b.w-512,b.y+v*b.h-512);if(radius<508)visible++;else outside++;}
 if(!visible)return {ok:false,message:'Move the logo onto the circle before continuing.'};
 if(session.edit.mode==='place'&&outside)return {ok:false,message:'Keep the full logo inside the circle. Move it inward or reduce its size.'};
 const textValidation=validateCoasterEditorText();if(!textValidation.ok)return textValidation;
 return {ok:true,message:session.edit.mode==='place'?'Logo is on the circle. Drag to reposition it.':'Circular crop ready. Drag to adjust what appears inside the circle.'};
}
function drawCoasterCircle(canvas,editor=false){
 const session=coasterUploadSession,e=session.edit,n=canvas.width,ctx=canvas.getContext('2d');ctx.clearRect(0,0,n,n);
 ctx.save();ctx.scale(n/1024,n/1024);ctx.beginPath();ctx.arc(512,512,512,0,Math.PI*2);ctx.clip();ctx.fillStyle=e.backing;ctx.fillRect(0,0,1024,1024);
 if(e.placed){const b=coasterCircleLayout();ctx.drawImage(session.logo,b.x,b.y,b.w,b.h);}
 else if(editor){ctx.fillStyle=readableTextColour(e.backing);ctx.font='bold 36px Arial';ctx.textAlign='center';ctx.fillText('Drag your logo here',512,510);ctx.font='24px Arial';ctx.fillText('or choose Place logo on circle',512,554);}
 drawCoasterEditorText(ctx);ctx.restore();
 if(editor){
  ctx.save();ctx.scale(n/1024,n/1024);drawCoasterTextSelection(ctx,1024/Math.max(1,canvas.getBoundingClientRect().width));ctx.restore();
  ctx.beginPath();ctx.arc(n/2,n/2,n/2-2,0,Math.PI*2);ctx.strokeStyle=coasterCircleValidation().ok?'#fcd504':'#999';ctx.lineWidth=3;ctx.stroke();
  if(session.dragging&&session.snapping){
   const displayWidth=document.querySelector('#coasterCircleCanvas').getBoundingClientRect().width,unit=n/Math.max(1,displayWidth);
   ctx.save();ctx.beginPath();ctx.arc(n/2,n/2,n/2-2,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#44d6f0';ctx.lineWidth=unit;ctx.setLineDash([8*unit,5*unit]);
   ctx.beginPath();if(session.snapping.x){ctx.moveTo(n/2,0);ctx.lineTo(n/2,n);}if(session.snapping.y){ctx.moveTo(0,n/2);ctx.lineTo(n,n/2);}ctx.stroke();ctx.restore();
  }
 }
}
function renderCoasterEditStep(){
 const session=coasterUploadSession;if(!session)return;const e=session.edit;
 els.wizard.classList.add('coaster-circle-edit');els.wizardTitle.textContent='Design your coaster';els.wizardImage.hidden=true;els.cropBox.classList.remove('visible','circle');els.previewTools.classList.remove('hidden');
 let canvas=document.querySelector('#coasterCircleCanvas');
 if(!canvas){
  canvas=document.createElement('canvas');canvas.id='coasterCircleCanvas';canvas.width=canvas.height=1024;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Circle design. Drop your logo here, then drag or use arrow keys to position it.');els.wizardArtboard.append(canvas);bindCoasterCircleCanvas(canvas);
 }
 canvas.hidden=false;
 els.wizardSide.innerHTML=`<h3>Coaster design</h3><p>${session.detectedCircle?'Your uploaded design is circular. Adjust its crop below.':'Place your logo on a circle, or crop your image to a circle.'}</p>
  <div class="coaster-logo-drag" draggable="true" tabindex="0" role="button" aria-label="Place uploaded logo on the circle"><img src="${session.logo.toDataURL()}" alt="Uploaded logo" draggable="false"/><span>Drag logo onto circle</span></div>
  <div class="coaster-circle-options"><button type="button" data-coaster-circle-mode="place" class="crop-preset ${e.mode==='place'?'active':''}">Place logo on circle</button><button type="button" data-coaster-circle-mode="crop" class="crop-preset ${e.mode==='crop'?'active':''}">Crop to circle</button></div>
  <label class="switch-row"><span>Remove Background</span><input id="coasterWizardRemoveBg" type="checkbox" ${e.removeBg?'checked':''}/></label>
  <div class="coaster-circle-backing"><span>Background colour</span><button type="button" class="hype-colour-chip" id="coasterWizardBacking" aria-label="Circle background colour"><i style="background:${e.backing}"></i></button></div>
  <label class="coaster-circle-scale">Logo size <output id="coasterWizardScaleValue">${Math.round(e.scale)}%</output><input id="coasterWizardScale" type="range" min="10" max="180" step="1" value="${e.scale}"/></label>
  <button class="secondary-button" type="button" id="coasterWizardCentre">Centre logo</button><p id="coasterCircleStatus" role="status" aria-live="polite"></p><section id="coasterTextControls" aria-label="Add text to the circle"></section>`;
 els.wizardFooter.innerHTML='<button class="secondary-button" type="button" data-wizard-action="cancel">Cancel</button><button class="primary-button" type="button" data-wizard-action="to-vector">Next</button>';
 bindWizardButtons();
 const chooseMode=mode=>{e.mode=mode;e.placed=true;e.scale=100;e.x=e.y=0;session.composed=null;renderCoasterEditStep();};
 els.wizardSide.querySelectorAll('[data-coaster-circle-mode]').forEach(button=>button.addEventListener('click',()=>chooseMode(button.dataset.coasterCircleMode)));
 const thumbnail=els.wizardSide.querySelector('.coaster-logo-drag');
 thumbnail.addEventListener('dragstart',event=>{event.dataTransfer.setData('application/x-coaster-logo','uploaded');event.dataTransfer.effectAllowed='copy';});
 thumbnail.addEventListener('click',()=>{if(!e.placed)chooseMode('place');});
 thumbnail.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseMode('place');}});
 let start=null;
 thumbnail.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;start={id:event.pointerId};thumbnail.setPointerCapture(event.pointerId);});
 thumbnail.addEventListener('pointerup',event=>{if(!start)return;const r=canvas.getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)dropCoasterLogoAt(event.clientX,event.clientY,canvas);start=null;});
 thumbnail.addEventListener('pointercancel',()=>{start=null;});
 document.querySelector('#coasterWizardRemoveBg').addEventListener('change',event=>{e.removeBg=event.target.checked;rebuildCoasterWizardSource();renderCoasterEditStep();});
 document.querySelector('#coasterWizardScale').addEventListener('input',event=>{e.scale=Number(event.target.value);session.composed=null;paintCoasterCircleEditor();});
 document.querySelector('#coasterWizardCentre').addEventListener('click',()=>{e.x=e.y=0;session.composed=null;paintCoasterCircleEditor();});
 document.querySelector('#coasterWizardBacking').addEventListener('click',event=>{state.selectedColourTarget={type:'coasterCircleBacking'};updatePopoverInputs(e.backing);positionColourPopover(event.currentTarget);renderUsedColourGrid();setPopoverTab('preset');});
 renderCoasterTextControls();paintCoasterCircleEditor();requestAnimationFrame(()=>canvas.focus({preventScroll:true}));
}
function bindCoasterCircleCanvas(canvas){
 canvas.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-coaster-logo')){event.preventDefault();event.dataTransfer.dropEffect='copy';}});
 canvas.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer.getData('application/x-coaster-logo'))dropCoasterLogoAt(event.clientX,event.clientY,canvas);});
 let drag=null;
 canvas.addEventListener('pointerdown',event=>{
  if(!coasterUploadSession||drag)return;const e=coasterUploadSession.edit,r=canvas.getBoundingClientRect(),target=findCoasterTextTarget((event.clientX-r.left)/r.width*1024,(event.clientY-r.top)/r.height*1024,canvas);
  if(!target&&!e.placed)return;event.preventDefault();closeColourPopover();coasterUploadSession.selectedTextId=target?.box.id||null;renderCoasterTextControls();
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,positionX:e.x,positionY:e.y,width:r.width,height:r.height,textId:target?.box.id,corner:target?.corner,original:target?{...target.box}:null};
  const p=target?.box||e;coasterUploadSession.dragging=true;coasterUploadSession.snapping={x:p.x===0,y:p.y===0};canvas.dataset.dragging='true';canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});paintCoasterCircleEditor();
 });
 canvas.addEventListener('pointermove',event=>{if(!drag||!coasterUploadSession||event.pointerId!==drag.id)return;const dx=(event.clientX-drag.x)/drag.width,dy=(event.clientY-drag.y)/drag.height;if(drag.textId)moveCoasterTextDrag(drag,dx,dy,canvas);else{setCoasterCirclePosition(drag.positionX+dx,drag.positionY+dy,canvas);paintCoasterCircleEditor();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;delete canvas.dataset.dragging;if(coasterUploadSession){coasterUploadSession.dragging=false;paintCoasterCircleEditor();}});
 canvas.addEventListener('keydown',event=>{
  if(!coasterUploadSession)return;const box=coasterSelectedTextBox();if(box&&['Delete','Backspace'].includes(event.key)){event.preventDefault();removeCoasterEditorText(box.id);return;}
  if(!box&&!coasterUploadSession.edit.placed||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const e=box||coasterUploadSession.edit,step=event.shiftKey?.05:.01;if(event.key==='ArrowLeft')e.x-=step;if(event.key==='ArrowRight')e.x+=step;if(event.key==='ArrowUp')e.y-=step;if(event.key==='ArrowDown')e.y+=step;coasterUploadSession.composed=null;paintCoasterCircleEditor();
 });
}
function dropCoasterLogoAt(clientX,clientY,canvas){
 const session=coasterUploadSession;if(!session)return;const r=canvas.getBoundingClientRect(),e=session.edit;e.mode='place';e.placed=true;e.scale=100;setCoasterCirclePosition((clientX-r.left)/r.width-.5,(clientY-r.top)/r.height-.5,canvas);renderCoasterEditStep();
}
function setCoasterCirclePosition(x,y,canvas){
 const p=snapCoasterEditorPosition(x,y,canvas);coasterUploadSession.edit.x=p.x;coasterUploadSession.edit.y=p.y;coasterUploadSession.composed=null;
}
function snapCoasterEditorPosition(x,y,canvas){
 const session=coasterUploadSession;if(!session)return;const r=canvas.getBoundingClientRect(),threshold=8/Math.max(1,Math.min(r.width,r.height));
 session.snapping={x:Math.abs(x)<=threshold,y:Math.abs(y)<=threshold};
 return {x:session.snapping.x?0:clamp(x,-1,1),y:session.snapping.y?0:clamp(y,-1,1)};
}
function paintCoasterCircleEditor(){
 const session=coasterUploadSession,canvas=document.querySelector('#coasterCircleCanvas');if(!session||!canvas||state.wizardStep!=='edit')return;
 drawCoasterCircle(canvas,true);const validation=coasterCircleValidation(),next=els.wizardFooter.querySelector('[data-wizard-action="to-vector"]');if(next)next.disabled=!validation.ok;
 const message=document.querySelector('#coasterCircleStatus');if(message){
  const snap=session.dragging&&session.snapping,alignment=snap?.x&&snap?.y?'Centred on both axes.':snap?.x?'Centred horizontally.':snap?.y?'Centred vertically.':'';
  message.textContent=validation.message+(alignment?' '+alignment:'');message.classList.toggle('invalid',!validation.ok);
 }
 const slider=document.querySelector('#coasterWizardScale');if(slider)slider.value=session.edit.scale;
 const value=document.querySelector('#coasterWizardScaleValue');if(value)value.textContent=Math.round(session.edit.scale)+'%';
 document.querySelector('#coasterWizardBacking i')?.style.setProperty('background',session.edit.backing);
}
function zoomCoasterCircleEditor(value){
 const e=coasterUploadSession.edit;e.scale=clamp(e.scale+(value-state.edit.zoom)*100,10,180);state.edit.zoom=clamp(value,.7,1.8);coasterUploadSession.composed=null;paintCoasterCircleEditor();
}
function hideCoasterCircleEditor(){closeLockerFontPicker();els.wizard.classList.remove('coaster-circle-edit');els.wizardImage.hidden=false;const canvas=document.querySelector('#coasterCircleCanvas');if(canvas)canvas.hidden=true;}
async function prepareCoasterCircleArtwork(){
 const session=coasterUploadSession;if(!session)return false;const validation=coasterCircleValidation();
 if(!validation.ok){if(state.wizardStep!=='edit')openWizard('edit');paintCoasterCircleEditor();return false;}
 if(session.composed)return true;
 await Promise.all(coasterEditorTextBoxes().map(box=>document.fonts.load('400 200px '+coasterTextFontStack(box.font)).catch(()=>{}))); if(coasterUploadSession!==session)return false;
 if(!coasterCircleValidation().ok){paintCoasterCircleEditor();return false;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;drawCoasterCircle(canvas);
 const dataUrl=canvas.toDataURL('image/png'),image=await loadImage(dataUrl);if(coasterUploadSession!==session)return false;
 // Seed the shared vectorizer with source inks, keeping edge blends out of its
 // expensive per-pixel cluster creation while retaining colour-count editing.
 const textColours=coasterEditorTextBoxes().map(box=>hexToRgb(box.colour));
 const palette=[...new Map([...session.logoColours.map(hexToRgb),hexToRgb(session.edit.backing),...textColours].map(rgb=>[rgbToHex(rgb),rgb])).values()];
 session.sourceColourCount=palette.length;
 const paletteSignature=palette.map(rgbToHex).sort().join(',');
 if(session.textPaletteDirty||session.paletteSignature&&session.paletteSignature!==paletteSignature){state.frontColoursCustomized=true;state.targetColorCount=8;session.autoColourCount=true;}
 session.paletteSignature=paletteSignature;session.textPaletteDirty=false;
 state.artwork={type:'png',image,dataUrl,hasTransparency:true,name:session.original.fileName,palette,coasterSolidPalette:true};
 state.edit.crop={x:0,y:0,w:1,h:1};state.edit.cropAspect='circle';state.removeBg=false;state.fixFloatingRegions=false;state.processingDirty=true;
 session.composed=dataUrl;return true;
}
function coasterCirclePalette(source){
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
function getCoasterWizardUsedColours(){
 if(!coasterUploadSession)return [];
 return [...(state.processed?.colours.length?state.processed.colours.map((region,index)=>getDisplayColour(index,region.hex)):coasterUploadSession.logoColours||[]),...coasterEditorTextBoxes().map(box=>box.colour)];
}
function detectCoasterLogoUsedColours(session){
 const explicit=session.artwork.type==='svg'&&!session.logoRemapped;
 if(!explicit)return coasterCirclePalette(session.logo).map(rgbToHex);
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
function cancelCoasterLogoWizard(){
 const session=coasterUploadSession;if(!session)return;coasterUploadSession=null;hideCoasterCircleEditor();applyArtworkStateSnapshot(session.snapshot);state.uploadTarget=session.uploadTarget;state.processingDirty=session.processingDirty;coasterState().busy=false;syncCoasterControls();updateProjectControls();setStatus('Ready');
}
async function completeCoasterLogoWizard(){
 const session=coasterUploadSession;if(!session||!coasterCircleValidation().ok)return;
 if(state.processingDirty)await reprocess({skipWizardRender:true});
 if(!state.processed?.colours.length)throw new Error('No visible artwork was found.');
 const canvas=createMappedArtworkCanvas(state.processed),preparedDataUrl=canvas.toDataURL('image/png'),image=await loadImage(preparedDataUrl);if(coasterUploadSession!==session)return;
 const palette=state.processed.colours.map((region,k)=>{const colour=normalizeHex(getDisplayColour(k,region.hex)),rgb=hexToRgb(colour);return {colour,rgb,height:0};});
 const mapColour=hex=>{const rgb=hexToRgb(hex);let best=0,distance=Infinity;state.processed.colours.forEach((region,k)=>{const d=hexToRgb(region.hex).reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){best=k;distance=d;}});return getDisplayColour(best,state.processed.colours[best].hex);};
 const mapping=session.edit.logoColourMapping?.length?session.edit.logoColourMapping.map(m=>({from:m.from,to:mapColour(m.to)})):session.logoColours.map(hex=>({from:hex,to:mapColour(hex)}));
 const source={...session.original},wizardEdit={...session.edit,backing:mapColour(session.edit.backing),logoColourMapping:mapping,textBoxes:coasterEditorTextBoxes().map(box=>({...box,colour:mapColour(box.colour)}))};cancelCoasterLogoWizard();
 Object.assign(coasterState(),{source,preparedDataUrl,wizardEdit,circlePrepared:true,isExample:false,projectId:null,palette,colourCount:palette.length,removeBg:false,backing:wizardEdit.backing,scale:100,x:0,y:0,busy:false,error:''});
 ++coasterRevision;coasterImage=image;coasterState().backingIndex=coasterNearestPaletteIndex(wizardEdit.backing);await buildCoaster();closeWizard();setStatus('Coaster design ready');
}
