// Editable text stays separate from the upload until the circle is confirmed.
function coasterEditorTextBoxes(){return coasterUploadSession?.edit.textBoxes||[];}
function normaliseCoasterEditorText(box){return {id:String(box.id||makeProjectId()),text:String(box.text||'').slice(0,500),font:HYPE_SPINNER_FONT_OPTIONS.includes(box.font)?box.font:COASTER_SIGN_DEFAULTS.font,colour:normalizeHex(box.colour),x:clamp(Number(box.x)||0,-1,1),y:clamp(Number(box.y)||0,-1,1),width:clamp(Number(box.width)||.55,1/101.66,1),height:clamp(Number(box.height)||.12,1/101.66,1)};}
function coasterSelectedTextBox(){return coasterEditorTextBoxes().find(box=>box.id===coasterUploadSession?.selectedTextId);}
function coasterTextFontStack(font){return font==='Market Pro'?'"Market Pro", "Marker Felt", "Comic Sans MS", cursive':'"'+font+'", Impact, "Arial Black", Arial, sans-serif';}
function coasterTextRect(box){return {left:(.5+box.x-box.width/2)*1024,top:(.5+box.y-box.height/2)*1024,width:box.width*1024,height:box.height*1024};}
function fitCoasterEditorText(box){
 const ctx=fitCoasterEditorText.context||(fitCoasterEditorText.context=document.createElement('canvas').getContext('2d'));
 const rect=coasterTextRect(box),padding=Math.min(rect.width,rect.height)*.035,lines=String(box.text).replace(/\r/g,'').split('\n');
 const measure=size=>{ctx.font='400 '+size+'px '+coasterTextFontStack(box.font);const metrics=lines.map(line=>ctx.measureText(line));
  const ascent=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent)),descent=Math.max(...metrics.map(m=>m.actualBoundingBoxDescent)),lineHeight=Math.max(size*1.12,ascent+descent);
  return {metrics,ascent,descent,lineHeight,width:Math.max(...metrics.map(m=>m.actualBoundingBoxLeft+m.actualBoundingBoxRight)),height:ascent+descent+(lines.length-1)*lineHeight};};
 let low=.1,high=2048;for(let i=0;i<20;i++){const mid=(low+high)/2,m=measure(mid);if(m.width<=rect.width-padding*2&&m.height<=rect.height-padding*2)low=mid;else high=mid;}
 const m=measure(low),cx=rect.left+rect.width/2,baseline=rect.top+(rect.height-m.height)/2+m.ascent;
 return {size:low,rect,width:m.width,height:m.height,lines:lines.map((text,i)=>{const metric=m.metrics[i],width=metric.actualBoundingBoxLeft+metric.actualBoundingBoxRight,y=baseline+i*m.lineHeight;return {text,x:cx+(metric.actualBoundingBoxLeft-metric.actualBoundingBoxRight)/2,y,left:cx-width/2,right:cx+width/2,top:y-metric.actualBoundingBoxAscent,bottom:y+metric.actualBoundingBoxDescent};})};
}
function drawCoasterEditorText(ctx){
 for(const box of coasterEditorTextBoxes()){
  const fit=fitCoasterEditorText(box);ctx.save();ctx.font='400 '+fit.size+'px '+coasterTextFontStack(box.font);ctx.fillStyle=box.colour;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  for(const line of fit.lines)ctx.fillText(line.text,line.x,line.y);ctx.restore();
 }
}
function drawCoasterTextSelection(ctx,unit){
 const box=coasterSelectedTextBox();if(!box)return;const r=coasterTextRect(box);
 ctx.save();ctx.strokeStyle='#44d6f0';ctx.lineWidth=unit;ctx.setLineDash([5*unit,3*unit]);ctx.strokeRect(r.left,r.top,r.width,r.height);ctx.setLineDash([]);
 for(const [x,y] of [[r.left,r.top],[r.left+r.width,r.top],[r.left,r.top+r.height],[r.left+r.width,r.top+r.height]]){ctx.fillStyle='#fff';ctx.fillRect(x-5*unit,y-5*unit,10*unit,10*unit);ctx.strokeRect(x-5*unit,y-5*unit,10*unit,10*unit);}ctx.restore();
}
function validateCoasterEditorText(){
 for(const [index,box] of coasterEditorTextBoxes().entries()){
  if(!box.text.trim())return {ok:false,message:'Enter text for Text '+(index+1)+', or remove that box.'};
  for(const line of fitCoasterEditorText(box).lines){if(!line.text.trim())continue;
   if([[line.left,line.top],[line.right,line.top],[line.left,line.bottom],[line.right,line.bottom]].some(([x,y])=>Math.hypot(x-512,y-512)>508))return {ok:false,message:'Move or resize Text '+(index+1)+' to keep it inside the circle.'};
  }
 }
 return {ok:true};
}
function invalidateCoasterEditorText(paletteChanged=false){
 const session=coasterUploadSession;if(!session)return;session.composed=null;if(paletteChanged)session.textPaletteDirty=true;state.processingDirty=true;paintCoasterCircleEditor();
}
function addCoasterEditorText(){
 const session=coasterUploadSession;if(!session)return;const index=coasterEditorTextBoxes().length;
 const box={id:makeProjectId(),text:'YOUR TEXT',font:COASTER_SIGN_DEFAULTS.font,colour:'#ffffff',x:0,y:index%2===0?.22:-.22,width:.55,height:.12};
 session.edit.textBoxes.push(box);session.selectedTextId=box.id;invalidateCoasterEditorText(true);renderCoasterTextControls();document.querySelector('#coasterBoxText').focus();document.querySelector('#coasterBoxText').select();
}
function renderCoasterTextControls(){
 closeLockerFontPicker();
 const host=document.querySelector('#coasterTextControls');if(!host||!coasterUploadSession)return;
 host.innerHTML='<div class="coaster-text-heading"><h3>Text</h3><button type="button" id="coasterAddText" class="secondary-button">Add Text</button></div><div id="coasterTextBoxList" class="coaster-text-box-list" role="group" aria-label="Text boxes"></div><div id="coasterSelectedTextControls"></div>';
 document.querySelector('#coasterAddText').addEventListener('click',addCoasterEditorText);
 const list=document.querySelector('#coasterTextBoxList');
 coasterEditorTextBoxes().forEach((box,index)=>{const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent='Text '+(index+1);button.setAttribute('aria-label','Select Text '+(index+1));button.setAttribute('aria-pressed',String(box.id===coasterUploadSession.selectedTextId));button.addEventListener('click',()=>{closeColourPopover();coasterUploadSession.selectedTextId=box.id;renderCoasterTextControls();paintCoasterCircleEditor();});list.append(button);});
 const box=coasterSelectedTextBox();if(!box)return;
 const fields=document.querySelector('#coasterSelectedTextControls');fields.innerHTML=`<label class="coaster-text-field">Your text<textarea id="coasterBoxText" rows="2" maxlength="500"></textarea></label><div class="coaster-text-properties"><label class="coaster-text-field">Font<select id="coasterBoxFont"></select></label><button type="button" id="coasterBoxColour" class="hype-colour-chip" aria-label="Text colour"><i></i></button></div><div class="coaster-text-dimensions"><label class="coaster-text-field">Width (mm)<input id="coasterBoxWidth" type="number" min="1" max="101.66" step="0.5"/></label><label class="coaster-text-field">Height (mm)<input id="coasterBoxHeight" type="number" min="1" max="101.66" step="0.5"/></label></div><p class="wizard-helper-text">Text fits the box automatically. Drag to move; drag a corner to resize. Press Enter for a new line.</p><div class="coaster-text-actions"><button type="button" class="secondary-button" id="coasterCentreText">Centre text</button><button type="button" class="secondary-button" id="coasterRemoveText">Remove text</button></div>`;
 const text=document.querySelector('#coasterBoxText');text.value=box.text;text.addEventListener('input',()=>{box.text=text.value;invalidateCoasterEditorText();});
 const font=document.querySelector('#coasterBoxFont');for(const name of HYPE_SPINNER_FONT_OPTIONS){const option=document.createElement('option');option.value=option.textContent=name;option.style.fontFamily=getHypeSpinnerFontStack(name);font.append(option);}font.value=box.font;font.style.fontFamily=coasterTextFontStack(box.font);attachLockerFontPicker(font);
 font.addEventListener('change',async()=>{box.font=font.value;font.style.fontFamily=coasterTextFontStack(box.font);invalidateCoasterEditorText();await document.fonts.load('400 200px '+coasterTextFontStack(box.font)).catch(()=>{});paintCoasterCircleEditor();});
 for(const [id,key] of [['coasterBoxWidth','width'],['coasterBoxHeight','height']]){const input=document.getElementById(id);input.value=(box[key]*101.66).toFixed(1);input.addEventListener('input',()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<1)return;box[key]=clamp(value,1,101.66)/101.66;invalidateCoasterEditorText();});}
 const colour=document.querySelector('#coasterBoxColour');colour.querySelector('i').style.background=box.colour;colour.addEventListener('click',()=>{state.selectedColourTarget={type:'coasterEditorText',id:box.id};updatePopoverInputs(box.colour);positionColourPopover(colour);renderUsedColourGrid();setPopoverTab('preset');});
 document.querySelector('#coasterCentreText').addEventListener('click',()=>{box.x=box.y=0;invalidateCoasterEditorText();});
 document.querySelector('#coasterRemoveText').addEventListener('click',()=>removeCoasterEditorText(box.id));
}
function removeCoasterEditorText(id){
 const session=coasterUploadSession;session.edit.textBoxes=session.edit.textBoxes.filter(box=>box.id!==id);session.selectedTextId=session.edit.textBoxes.at(-1)?.id||null;invalidateCoasterEditorText(true);renderCoasterTextControls();
}
function syncCoasterTextDimensions(){const box=coasterSelectedTextBox();if(!box)return;for(const [id,key] of [['coasterBoxWidth','width'],['coasterBoxHeight','height']]){const input=document.getElementById(id);if(input&&document.activeElement!==input)input.value=(box[key]*101.66).toFixed(1);}}
function findCoasterTextTarget(x,y,canvas){
 const current=coasterSelectedTextBox(),unit=1024/canvas.getBoundingClientRect().width;
 if(current){const r=coasterTextRect(current);for(const [corner,cx,cy] of [['nw',r.left,r.top],['ne',r.left+r.width,r.top],['sw',r.left,r.top+r.height],['se',r.left+r.width,r.top+r.height]])if(Math.abs(x-cx)<=10*unit&&Math.abs(y-cy)<=10*unit)return {box:current,corner};}
 for(const box of [...coasterEditorTextBoxes()].reverse()){const r=coasterTextRect(box);if(x>=r.left&&x<=r.left+r.width&&y>=r.top&&y<=r.top+r.height)return {box};}
 return null;
}
function moveCoasterTextDrag(drag,dx,dy,canvas){
 const box=coasterEditorTextBoxes().find(b=>b.id===drag.textId);if(!box)return;
 if(!drag.corner){const p=snapCoasterEditorPosition(drag.original.x+dx,drag.original.y+dy,canvas);box.x=p.x;box.y=p.y;}
 else{
  const original=drag.original,min=1/101.66;let left=original.x-original.width/2,right=original.x+original.width/2,top=original.y-original.height/2,bottom=original.y+original.height/2;
  if(drag.corner.includes('w'))left=clamp(left+dx,right-1,right-min);else right=clamp(right+dx,left+min,left+1);
  if(drag.corner.includes('n'))top=clamp(top+dy,bottom-1,bottom-min);else bottom=clamp(bottom+dy,top+min,top+1);
  box.x=(left+right)/2;box.y=(top+bottom)/2;box.width=right-left;box.height=bottom-top;coasterUploadSession.snapping={x:false,y:false};
 }
 invalidateCoasterEditorText();syncCoasterTextDimensions();
}
async function editExistingCoasterDesign(){
 const s=coasterState();if(!s.source)return;
 try{await beginCoasterLogoWizard(dataUrlToFile(s.source.dataUrl,s.source.fileName),{edit:coasterSavedEdit()});}
 catch(error){s.error=error.message;syncCoasterControls();updateProjectControls();}
}
function remapCoasterSavedLogo(session){
 const mapping=session.edit.logoColourMapping;if(!Array.isArray(mapping)||!mapping.length)return;
 const ctx=session.logo.getContext('2d'),frame=ctx.getImageData(0,0,session.logo.width,session.logo.height),palette=mapping.map(m=>({from:hexToRgb(normalizeHex(m.from)),to:hexToRgb(normalizeHex(m.to))}));
 for(let i=0;i<frame.data.length;i+=4){if(frame.data[i+3]<128)continue;let best=0,distance=Infinity;
  palette.forEach((p,k)=>{const d=p.from.reduce((sum,v,j)=>sum+(v-frame.data[i+j])**2,0);if(d<distance){distance=d;best=k;}});
  if(distance<=90**2)palette[best].to.forEach((v,j)=>{frame.data[i+j]=v;});
 }
 ctx.putImageData(frame,0,0);session.logoRemapped=true;
}
