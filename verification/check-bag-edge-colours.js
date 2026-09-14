// Run in the loaded studio with agent-browser eval --stdin.
(() => {
  const w=21,h=7,palette=[{rgb:[0,100,160]},{rgb:[255,255,255]},{rgb:[190,170,140]}];
  const mask=new Uint8Array(w*h).fill(1),labels=new Int16Array(w*h),data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    // The blend is numerically closer to gold, but only touches blue and white.
    const rgb=x<8?palette[0].rgb:x===8?[130,178,208]:x<17?palette[1].rgb:palette[2].rgb;
    data.set([...rgb,255],(y*w+x)*4);labels[y*w+x]=x===8?2:x<8?0:x<17?1:2;
  }
  assignBagEdgeColours(labels,mask,data,palette,w,h);
  for(let y=0;y<h;y++){
    if(labels[y*w+8]===2)throw Error('Unrelated gold introduced at blue/white edge');
    if(labels[y*w+19]!==2)throw Error('Genuine gold region lost');
  }
  if(bagLogoColourIsRaised('#ffffff')||bagLogoColourIsRaised('#000000')||!bagLogoColourIsRaised('#035795'))throw Error('Relief rule changed');
  const neutralPalette=[{rgb:[0,0,0]},{rgb:[255,255,255]}];
  const neutralData=new Uint8ClampedArray(9*5*4),neutralLabels=new Int16Array(9*5),neutralMask=new Uint8Array(9*5).fill(1);
  for(let y=0;y<5;y++)for(let x=0;x<9;x++){
    const ink=x>=3&&x<=5;
    neutralData.set([...(ink?[35,29,31]:[240,240,240]),255],(y*9+x)*4);neutralLabels[y*9+x]=ink?0:1;
  }
  assignBagEdgeColours(neutralLabels,neutralMask,neutralData,neutralPalette,9,5);
  for(let y=0;y<5;y++)for(let x=0;x<9;x++)if(neutralLabels[y*9+x]!==((x>=3&&x<=5)?0:1))throw Error('Normalized neutral ink lost');
  return {charcoal:'preserved',edgeMapping:'passed',genuineGold:'preserved',reliefRules:'passed'};
})()
