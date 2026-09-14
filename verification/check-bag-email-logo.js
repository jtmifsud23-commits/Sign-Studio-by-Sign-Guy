// Run in the loaded studio. Confirm shared artwork cannot replace a Bag Tag logo.
(async()=>{
 const oldArtwork=state.artwork,oldFile=state.uploadedFile;
 const make=(colour)=>{const c=document.createElement('canvas');c.width=c.height=8;c.getContext('2d').fillStyle=colour;c.getContext('2d').fillRect(0,0,8,8);return c.toDataURL('image/png');};
 const source=make('#ff0000'),shared=make('#0000ff');
 try{
  state.artwork={dataUrl:shared};state.uploadedFile=dataUrlToFile(shared,'wrong-website-logo.png');
  const project={type:'SignGuy.BagTagStudio',source:{dataUrl:source,fileName:'customer-logo.png'}};
  const preview=await makeEmailLogoPreviewFile(project),logo=await makeProjectUploadLogoFile(project);
  if(preview.name!=='bag-tag-logo-preview.png'||logo.name!=='customer-logo.png')throw Error('Wrong filename');
  const im=await loadImage(await fileToDataUrl(preview)),c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);const pixel=c.getContext('2d').getImageData(4,4,1,1).data;
  if(pixel[0]!==255||pixel[2]!==0)throw Error('Shared artwork leaked into preview');
  if(await fileToDataUrl(logo)!==source)throw Error('Shared upload leaked into project');
  return {preview:'customer logo',savedLogo:'customer logo',sharedArtwork:'ignored'};
 }finally{state.artwork=oldArtwork;state.uploadedFile=oldFile;}
})()
