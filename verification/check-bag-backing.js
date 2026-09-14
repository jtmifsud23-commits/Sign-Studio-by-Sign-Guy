(async()=>{
 const assert=(value,message)=>{if(!value)throw Error(message)};
 const original=await buildBagProject();
 assert(bagBackingMode()==='custom','Fusion should choose custom');
 assert(bagDimensions().widthMm<=80.001,'Width exceeds 80 mm');
 assert(bagState().backingGeometry.shapes.length===1,'Disconnected backing');
 assert(bagState().backingGeometry.shapes[0].holes.length===1,'Attachment hole missing');
 assert(bagDimensions().heightMm<106,'Fusion should have variable height');
 for(const backing of ['circle','custom']){
   bagState().backing=backing;buildBagTag();assert(bagBackingMode()===backing,'Override failed');assert(!bagState().error,'Build failed');
 }
 await restoreBagProject(original);
 assert(bagState().backing==='auto'&&bagBackingMode()==='custom','Auto restore failed');
 assert(JSON.stringify(bagDimensions())===JSON.stringify(original.config.dimensions),'Dimensions drifted');
 assert(original.config.bag.backingGeometry.shapes[0].holes.length===1,'Saved geometry missing');
 for(const type of ['circle','square']){
  const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');x.fillStyle='#f00';
  if(type==='circle'){x.beginPath();x.arc(100,100,90,0,Math.PI*2);x.fill();}else x.fillRect(10,10,180,180);
  assert(bagSilhouetteInfo(await loadImage(c.toDataURL())).circular===(type==='circle'),'Shape detection failed');
 }
 return {status:'passed',backing:bagBackingMode(),dimensions:bagDimensions(),savedGeometry:true};
})()
