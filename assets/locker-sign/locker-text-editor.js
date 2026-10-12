// Editable text stays separate from the upload until the circle is confirmed.
function lockerEditorTextBoxes(){return lockerUploadSession?.edit.textBoxes||[];}
function normaliseLockerEditorText(box){return {id:String(box.id||makeProjectId()),text:String(box.text||'').slice(0,500),font:HYPE_SPINNER_FONT_OPTIONS.includes(box.font)?box.font:LOCKER_SIGN_DEFAULTS.font,colour:normalizeHex(box.colour),x:clamp(Number(box.x)||0,-1,1),y:clamp(Number(box.y)||0,-1,1),width:clamp(Number(box.width)||.55,1/228.6,1),height:clamp(Number(box.height)||.12,1/228.6,1)};}
function lockerSelectedTextBox(){return lockerEditorTextBoxes().find(box=>box.id===lockerUploadSession?.selectedTextId);}
function lockerTextFontStack(font){return font==='Market Pro'?'"Market Pro", "Marker Felt", "Comic Sans MS", cursive':'"'+font+'", Impact, "Arial Black", Arial, sans-serif';}
function lockerTextRect(box){return {left:(.5+box.x-box.width/2)*1024,top:(.5+box.y-box.height/2)*1024,width:box.width*1024,height:box.height*1024};}
function fitLockerEditorText(box){
 const ctx=fitLockerEditorText.context||(fitLockerEditorText.context=document.createElement('canvas').getContext('2d'));
 const rect=lockerTextRect(box),padding=Math.min(rect.width,rect.height)*.035,lines=String(box.text).replace(/\r/g,'').split('\n');
 const measure=size=>{ctx.font='400 '+size+'px '+lockerTextFontStack(box.font);const metrics=lines.map(line=>ctx.measureText(line));
  const ascent=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent)),descent=Math.max(...metrics.map(m=>m.actualBoundingBoxDescent)),lineHeight=Math.max(size*1.12,ascent+descent);
  return {metrics,ascent,descent,lineHeight,width:Math.max(...metrics.map(m=>m.actualBoundingBoxLeft+m.actualBoundingBoxRight)),height:ascent+descent+(lines.length-1)*lineHeight};};
 let low=.1,high=2048;for(let i=0;i<20;i++){const mid=(low+high)/2,m=measure(mid);if(m.width<=rect.width-padding*2&&m.height<=rect.height-padding*2)low=mid;else high=mid;}
 const m=measure(low),cx=rect.left+rect.width/2,baseline=rect.top+(rect.height-m.height)/2+m.ascent;
 return {size:low,rect,width:m.width,height:m.height,lines:lines.map((text,i)=>{const metric=m.metrics[i],width=metric.actualBoundingBoxLeft+metric.actualBoundingBoxRight,y=baseline+i*m.lineHeight;return {text,x:cx+(metric.actualBoundingBoxLeft-metric.actualBoundingBoxRight)/2,y,left:cx-width/2,right:cx+width/2,top:y-metric.actualBoundingBoxAscent,bottom:y+metric.actualBoundingBoxDescent};})};
}
function drawLockerEditorText(ctx){
 for(const box of lockerEditorTextBoxes()){
  const fit=fitLockerEditorText(box);ctx.save();ctx.font='400 '+fit.size+'px '+lockerTextFontStack(box.font);ctx.fillStyle=box.colour;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  for(const line of fit.lines)ctx.fillText(line.text,line.x,line.y);ctx.restore();
 }
}
function drawLockerTextSelection(ctx,unit){
 const box=lockerSelectedTextBox();if(!box)return;const r=lockerTextRect(box);
 ctx.save();ctx.strokeStyle='#44d6f0';ctx.lineWidth=unit;ctx.setLineDash([5*unit,3*unit]);ctx.strokeRect(r.left,r.top,r.width,r.height);ctx.setLineDash([]);
 for(const [x,y] of [[r.left,r.top],[r.left+r.width,r.top],[r.left,r.top+r.height],[r.left+r.width,r.top+r.height]]){ctx.fillStyle='#fff';ctx.fillRect(x-5*unit,y-5*unit,10*unit,10*unit);ctx.strokeRect(x-5*unit,y-5*unit,10*unit,10*unit);}ctx.restore();
}
function validateLockerEditorText(){
 for(const [index,box] of lockerEditorTextBoxes().entries()){
  if(!box.text.trim())return {ok:false,message:'Enter text for Text '+(index+1)+', or remove that box.'};
  for(const line of fitLockerEditorText(box).lines){if(!line.text.trim())continue;
   if([[line.left,line.top],[line.right,line.top],[line.left,line.bottom],[line.right,line.bottom]].some(([x,y])=>Math.hypot(x-512,y-512)>508))return {ok:false,message:'Move or resize Text '+(index+1)+' to keep it inside the circle.'};
  }
 }
 return {ok:true};
}
function invalidateLockerEditorText(paletteChanged=false){
 const session=lockerUploadSession;if(!session)return;session.composed=null;if(paletteChanged)session.textPaletteDirty=true;state.processingDirty=true;paintLockerCircleEditor();
}
function addLockerEditorText(){
 const session=lockerUploadSession;if(!session)return;const index=lockerEditorTextBoxes().length;
 const box={id:makeProjectId(),text:'YOUR TEXT',font:LOCKER_SIGN_DEFAULTS.font,colour:'#ffffff',x:0,y:index%2===0?.22:-.22,width:.55,height:.12};
 session.edit.textBoxes.push(box);session.selectedTextId=box.id;invalidateLockerEditorText(true);renderLockerTextControls();document.querySelector('#lockerBoxText').focus();document.querySelector('#lockerBoxText').select();
}
function renderLockerTextControls(){
 closeLockerFontPicker();
 const host=document.querySelector('#lockerTextControls');if(!host||!lockerUploadSession)return;
 host.innerHTML='<div class="locker-text-heading"><h3>Text</h3><button type="button" id="lockerAddText" class="secondary-button">Add Text</button></div><div id="lockerTextBoxList" class="locker-text-box-list" role="group" aria-label="Text boxes"></div><div id="lockerSelectedTextControls"></div>';
 document.querySelector('#lockerAddText').addEventListener('click',addLockerEditorText);
 const list=document.querySelector('#lockerTextBoxList');
 lockerEditorTextBoxes().forEach((box,index)=>{const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent='Text '+(index+1);button.setAttribute('aria-label','Select Text '+(index+1));button.setAttribute('aria-pressed',String(box.id===lockerUploadSession.selectedTextId));button.addEventListener('click',()=>{closeColourPopover();lockerUploadSession.selectedTextId=box.id;renderLockerTextControls();paintLockerCircleEditor();});list.append(button);});
 const box=lockerSelectedTextBox();if(!box)return;
 const fields=document.querySelector('#lockerSelectedTextControls');fields.innerHTML=`<label class="locker-text-field">Your text<textarea id="lockerBoxText" rows="2" maxlength="500"></textarea></label><div class="locker-text-properties"><label class="locker-text-field">Font<select id="lockerBoxFont"></select></label><button type="button" id="lockerBoxColour" class="hype-colour-chip" aria-label="Text colour"><i></i></button></div><div class="locker-text-dimensions"><label class="locker-text-field">Width (mm)<input id="lockerBoxWidth" type="number" min="1" max="228.6" step="0.5"/></label><label class="locker-text-field">Height (mm)<input id="lockerBoxHeight" type="number" min="1" max="228.6" step="0.5"/></label></div><p class="wizard-helper-text">Text fits the box automatically. Drag to move; drag a corner to resize. Press Enter for a new line.</p><div class="locker-text-actions"><button type="button" class="secondary-button" id="lockerCentreText">Centre text</button><button type="button" class="secondary-button" id="lockerRemoveText">Remove text</button></div>`;
 const text=document.querySelector('#lockerBoxText');text.value=box.text;text.addEventListener('input',()=>{box.text=text.value;invalidateLockerEditorText();});
 const font=document.querySelector('#lockerBoxFont');for(const name of HYPE_SPINNER_FONT_OPTIONS){const option=document.createElement('option');option.value=option.textContent=name;option.style.fontFamily=getHypeSpinnerFontStack(name);font.append(option);}font.value=box.font;font.style.fontFamily=lockerTextFontStack(box.font);attachLockerFontPicker(font);
 font.addEventListener('change',async()=>{box.font=font.value;font.style.fontFamily=lockerTextFontStack(box.font);invalidateLockerEditorText();await document.fonts.load('400 200px '+lockerTextFontStack(box.font)).catch(()=>{});paintLockerCircleEditor();});
 for(const [id,key] of [['lockerBoxWidth','width'],['lockerBoxHeight','height']]){const input=document.getElementById(id);input.value=(box[key]*228.6).toFixed(1);input.addEventListener('input',()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<1)return;box[key]=clamp(value,1,228.6)/228.6;invalidateLockerEditorText();});}
 const colour=document.querySelector('#lockerBoxColour');colour.querySelector('i').style.background=box.colour;colour.addEventListener('click',()=>{state.selectedColourTarget={type:'lockerEditorText',id:box.id};updatePopoverInputs(box.colour);positionColourPopover(colour);renderUsedColourGrid();setPopoverTab('preset');});
 document.querySelector('#lockerCentreText').addEventListener('click',()=>{box.x=box.y=0;invalidateLockerEditorText();});
 document.querySelector('#lockerRemoveText').addEventListener('click',()=>removeLockerEditorText(box.id));
}
function removeLockerEditorText(id){
 const session=lockerUploadSession;session.edit.textBoxes=session.edit.textBoxes.filter(box=>box.id!==id);session.selectedTextId=session.edit.textBoxes.at(-1)?.id||null;invalidateLockerEditorText(true);renderLockerTextControls();
}
function syncLockerTextDimensions(){const box=lockerSelectedTextBox();if(!box)return;for(const [id,key] of [['lockerBoxWidth','width'],['lockerBoxHeight','height']]){const input=document.getElementById(id);if(input&&document.activeElement!==input)input.value=(box[key]*228.6).toFixed(1);}}
function findLockerTextTarget(x,y,canvas){
 const current=lockerSelectedTextBox(),unit=1024/canvas.getBoundingClientRect().width;
 if(current){const r=lockerTextRect(current);for(const [corner,cx,cy] of [['nw',r.left,r.top],['ne',r.left+r.width,r.top],['sw',r.left,r.top+r.height],['se',r.left+r.width,r.top+r.height]])if(Math.abs(x-cx)<=10*unit&&Math.abs(y-cy)<=10*unit)return {box:current,corner};}
 for(const box of [...lockerEditorTextBoxes()].reverse()){const r=lockerTextRect(box);if(x>=r.left&&x<=r.left+r.width&&y>=r.top&&y<=r.top+r.height)return {box};}
 return null;
}
function moveLockerTextDrag(drag,dx,dy,canvas){
 const box=lockerEditorTextBoxes().find(b=>b.id===drag.textId);if(!box)return;
 if(!drag.corner){const p=snapLockerEditorPosition(drag.original.x+dx,drag.original.y+dy,canvas);box.x=p.x;box.y=p.y;}
 else{
  const original=drag.original,min=1/228.6;let left=original.x-original.width/2,right=original.x+original.width/2,top=original.y-original.height/2,bottom=original.y+original.height/2;
  if(drag.corner.includes('w'))left=clamp(left+dx,right-1,right-min);else right=clamp(right+dx,left+min,left+1);
  if(drag.corner.includes('n'))top=clamp(top+dy,bottom-1,bottom-min);else bottom=clamp(bottom+dy,top+min,top+1);
  box.x=(left+right)/2;box.y=(top+bottom)/2;box.width=right-left;box.height=bottom-top;lockerUploadSession.snapping={x:false,y:false};
 }
 invalidateLockerEditorText();syncLockerTextDimensions();
}
async function editExistingLockerDesign(){
 const s=lockerState();if(!s.source)return;
 try{await beginLockerLogoWizard(dataUrlToFile(s.source.dataUrl,s.source.fileName),{edit:s.wizardEdit});}
 catch(error){s.error=error.message;syncLockerControls();updateProjectControls();}
}
function remapLockerSavedLogo(session){
 const mapping=session.edit.logoColourMapping;if(!Array.isArray(mapping)||!mapping.length)return;
 const ctx=session.logo.getContext('2d'),frame=ctx.getImageData(0,0,session.logo.width,session.logo.height),palette=mapping.map(m=>({from:hexToRgb(normalizeHex(m.from)),to:hexToRgb(normalizeHex(m.to))}));
 for(let i=0;i<frame.data.length;i+=4){if(frame.data[i+3]<128)continue;let best=0,distance=Infinity;
  palette.forEach((p,k)=>{const d=p.from.reduce((sum,v,j)=>sum+(v-frame.data[i+j])**2,0);if(d<distance){distance=d;best=k;}});
  if(distance<=90**2)palette[best].to.forEach((v,j)=>{frame.data[i+j]=v;});
 }
 ctx.putImageData(frame,0,0);session.logoRemapped=true;
}
