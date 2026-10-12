// Export the exact colour regions used by the final visualizer, after all
// palette and placement edits. The circle artwork excludes hanger hardware.
function buildLockerFinalArtwork(){
 const s=lockerState(),pixels=lockerView.artworkPixels,C=LOCKER_SIGN_CENTRE,diameter=228.6;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(1024,1024,1024,0,Math.PI*2);ctx.clip();ctx.drawImage(pixels.artwork,0,0);
 const number=value=>Number(value.toFixed(4)),pathText=path=>path.getPoints().map((p,i)=>(i?'L':'M')+number(p.x-C.x+diameter/2)+' '+number(diameter/2-p.y+C.y)).join(' ')+' Z';
 const paths=pixels.regions.map((shapes,k)=>shapes.length?`<path fill="${normalizeHex(s.palette[k].colour)}" fill-rule="evenodd" d="${shapes.map(shape=>[shape,...shape.holes].map(pathText).join(' ')).join(' ')}"/>`:'').join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="228.6mm" height="228.6mm" viewBox="0 0 228.6 228.6"><defs><clipPath id="circle"><circle cx="114.3" cy="114.3" r="114.3"/></clipPath></defs><g clip-path="url(#circle)"><circle cx="114.3" cy="114.3" r="114.3" fill="${normalizeHex(s.backing)}"/>${paths}</g></svg>`;
 return {pngDataUrl:canvas.toDataURL('image/png'),svgText:svg,widthMm:diameter,heightMm:diameter};
}
function lockerOutputFiles(project){
 if(!project.outputArtwork?.svgText||!project.outputArtwork?.pngDataUrl)throw new Error('The finished circle artwork is missing.');
 return [{kind:'finalArtworkPng',file:dataUrlToFile(project.outputArtwork.pngDataUrl,'locker-sign-finished-circle.png')},{kind:'finalArtworkSvg',file:new File([project.outputArtwork.svgText],'locker-sign-finished-circle.svg',{type:'image/svg+xml'})}];
}
async function emailLockerDesign(){
 if(!lockerReady()||state.orderInProgress)return;state.orderInProgress=true;updateProjectControls();setStatus('Preparing design email');
 try{
  const project=await buildLockerProject();lockerState().projectId=project.id;
  if(isLocalTesting()){downloadProjectPayload(project);lockerOutputFiles(project).forEach(asset=>downloadBlob(asset.file,asset.file.name,asset.file.type));els.submitNote.textContent='Finished circle PNG, SVG and .SignGuy downloaded for local review.';}
  else{await uploadProjectFolder(project,{screenshots:await captureLockerShots(),sendOrderEmail:true,adminDesignPreview:state.isAdmin});els.submitNote.textContent='Locker sign design email queued with the finished circle PNG, SVG, original upload and editable project.';}
  await saveProjectRecord(project);await refreshProjectLog();setStatus(isLocalTesting()?'Downloaded':'Email queued');
 }catch(error){els.submitNote.textContent=formatSaveFailureMessage(error,'Could not email this design.');setStatus('Email failed');}
 finally{state.orderInProgress=false;updateProjectControls();}
}
