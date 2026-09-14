// Bag Tag owns its editor, geometry and project state. Dimensions are millimetres.
const BAG_TAG_PRODUCT_URL = 'https://mysignguy.ca/products/custom-team-bag-tag';
const BAG_TAG_VARIANTS = Object.freeze({ indoor: '56986734755980', outdoor: '56986734788748' });
const BAG_TAG_DEFAULTS = Object.freeze({ text: 'YOUR NAME', font: 'Bebas Neue Bold', textColour: '#ffffff', baseColour: '#000000', scale: 1, x: 0, y: 0, removeBg: false, quantity: 1, colourCount: 4, usage: 'indoor', backing: 'auto', alignmentX: 0, orderMode: 'single', roster: [], activeRoster: 0 });
let bagTag, bagView, bagImage, bagTimer, bagRevision = 0;
const bagSilhouetteCache=new WeakMap();
function bagSilhouetteInfo(image) {
  if(bagSilhouetteCache.has(image))return bagSilhouetteCache.get(image);
  const n=256,c=document.createElement('canvas');c.width=c.height=n;
  const ctx=c.getContext('2d');const scale=Math.min(n/image.width,n/image.height);
  ctx.drawImage(image,(n-image.width*scale)/2,(n-image.height*scale)/2,image.width*scale,image.height*scale);
  const data=ctx.getImageData(0,0,n,n).data,mask=new Uint8Array(n*n);
  let left=n,right=-1,top=n,bottom=-1;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(data[(y*n+x)*4+3]>=128){mask[y*n+x]=1;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const shapes=bagMaskShapes(mask,n,n,n,n,n/2,n/2);
  ctx.clearRect(0,0,n,n);ctx.fillStyle='#fff';
  // Only the external silhouette counts: internal lettering is irrelevant.
  for(const shape of shapes){ctx.beginPath();shape.getPoints().forEach((p,i)=>i?ctx.lineTo(p.x,n-p.y):ctx.moveTo(p.x,n-p.y));ctx.closePath();ctx.fill();}
  const filled=ctx.getImageData(0,0,n,n).data;
  const w=right-left+1,h=bottom-top+1,cx=(left+right)/2,cy=(top+bottom)/2,r=(w+h)/4;
  let intersection=0,union=0;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const a=filled[(y*n+x)*4+3]>=128,b=Math.hypot(x-cx,y-cy)<=r;
    if(a&&b)intersection++;if(a||b)union++;
  }
  const result={circular:Math.min(w,h)/Math.max(w,h)>.92&&intersection/Math.max(1,union)>.91,score:intersection/Math.max(1,union)};
  bagSilhouetteCache.set(image,result);return result;
}
function bagBackingMode(){const b=bagState();return b.backing==='circle'||b.backing==='custom'?b.backing:bagImage&&b.source?(bagSilhouetteInfo(bagImage).circular?'circle':'custom'):'circle';}
function bagDimensions(){return bagState().dimensions||{widthMm:80,heightMm:106.238,baseMm:4,raisedMm:2,depthMm:6};}
function bagDimensionLabel(){const d=bagDimensions();return `${Number(d.widthMm.toFixed(1))} × ${Number(d.heightMm.toFixed(1))} × 6 mm`;}
function buildCustomBagBacking(regions){
  const n=regions.resolution,mask=new Uint8Array(n*n);
  regions.masks.forEach(m=>{for(let i=0;i<m.length;i++)if(m[i])mask[i]=1;});
  const outlines=bagMaskShapes(mask,n,n,74,74,0,2.2,true);
  if(!outlines.length)throw Error('No visible logo outline');
  const points=outlines.flatMap(s=>s.getPoints());
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const canvas=document.createElement('canvas'),ppm=8;canvas.width=800;canvas.height=1200;
  const ctx=canvas.getContext('2d');ctx.translate(400,600);ctx.scale(ppm,-ppm);
  ctx.fillStyle=ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.lineJoin=ctx.lineCap='round';
  for(const shape of outlines){ctx.beginPath();shape.getPoints().forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();}
  // Support detached logo islands and join the name plate to the logo body.
  const centerY=(minY+maxY)/2,alignmentX=clamp(Number(bagState().alignmentX)||0,-20,20);
  for(const shape of outlines){const ps=shape.getPoints(),cx=ps.reduce((s,p)=>s+p.x,0)/ps.length,cy=ps.reduce((s,p)=>s+p.y,0)/ps.length;ctx.beginPath();ctx.moveTo(0,centerY);ctx.lineTo(cx,cy);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(alignmentX,centerY);ctx.lineTo(alignmentX,minY);ctx.stroke();
  ctx.beginPath();ctx.roundRect(alignmentX-29,minY-20,58,27,3);ctx.fill();
  ctx.beginPath();ctx.roundRect(alignmentX-9,centerY,18,maxY+12-centerY,5);ctx.fill();
  // Fill support gaps before cutting the one intentional attachment hole.
  const support=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=3;i<support.data.length;i+=4)support.data[i]=support.data[i]>=128?255:0;
  ctx.putImageData(support,0,0);
  fillEnclosedTransparentRegions(ctx,{r:255,g:255,b:255,a:255});
  ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(alignmentX,maxY+6,3,0,Math.PI*2);ctx.fill();
  ctx.setTransform(1,0,0,1,0,0);
  const data=ctx.getImageData(0,0,800,1200).data,baseMask=new Uint8Array(800*1200);
  for(let i=0;i<baseMask.length;i++)baseMask[i]=data[i*4+3]>=128?1:0;
  const shapes=bagMaskShapes(baseMask,800,1200,100,150,0,0);
  if(shapes.length!==1||shapes[0].holes.length!==1)throw Error('Backing must be one connected piece with one attachment hole');
  return {shapes,textY:minY-10,textX:alignmentX};
}
function bagLogoColourIsRaised(colour) {
  return !['#000000', '#ffffff'].includes(normalizeHex(colour).toLowerCase());
}
function bagState() {
  bagTag ||= { ...BAG_TAG_DEFAULTS, roster: [], palette: [], source: null, projectId: null, name: '', rotation: { x: -0.12, y: 0.25 }, zoom: 1 };
  bagTag.palette.forEach(p => { p.raised = bagLogoColourIsRaised(p.colour); });
  return bagTag;
}
function bagReady() { const b = bagState(); return Boolean(b.source && bagNamesValid(b) && !b.busy && !b.error); }
function setupBagTag() {
  const panel = document.querySelector('#bagTagControls');
  if (panel.dataset.ready) return;
  panel.dataset.ready = 'true';
  panel.querySelectorAll('.bag-adjust-grid input[type=range]').forEach(input=>{
    const row=document.createElement('span');row.className='bag-adjust-slider';input.parentNode.insertBefore(row,input);row.append(input);
    const reset=document.createElement('button');reset.type='button';reset.className='plaque-layer-reset';reset.textContent='Reset';reset.setAttribute('aria-label',`Reset ${input.parentNode.parentNode.firstChild.textContent.trim()}`);
    reset.addEventListener('click',event=>{event.preventDefault();input.value=BAG_TAG_DEFAULTS[input.dataset.bag];input.dispatchEvent(new Event('input',{bubbles:true}));});row.append(reset);
  });
  setupBagTeam();
  setupFileButtonKeyboard(document.querySelector('#bagChooseFile'), document.querySelector('#bagLogoFile'));
  panel.querySelectorAll('[data-bag-usage]').forEach(button => button.addEventListener('click', () => { bagState().usage = button.dataset.bagUsage; syncBagControls(); scheduleBagTag(); }));
  panel.querySelectorAll('[data-bag]').forEach(input => input.addEventListener('input', () => {
    const b = bagState(), key = input.dataset.bag;
    b[key] = input.type === 'checkbox' ? input.checked : input.type === 'range' || input.type === 'number' ? Number(input.value) : input.value;
    b.quantity = Math.max(1, Math.min(999, Math.floor(b.quantity) || 1));
    if (key === 'removeBg' || key === 'colourCount') b.palette = [];
    b.error = '';
    if (key === 'font') document.fonts.load(`48px "${b.font}"`).then(scheduleBagTag);
    if (input.type === 'range') updateRangeFill(input);
    scheduleBagTag();
  }));
  document.querySelector('#bagLogoFile').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { await beginBagLogoWizard(file); } finally { event.target.value = ''; }
  });
  document.querySelector('#bagAlignment').addEventListener('click',openBagAlignment);
  document.querySelector('#bagCentre').addEventListener('click', () => { Object.assign(bagState(), { scale: 1, x: 0, y: 0 }); syncBagControls(); scheduleBagTag(); });
  document.querySelectorAll('[data-bag-view]').forEach(button => button.addEventListener('click', () => {
    const b = bagState(); b.rotation = button.dataset.bagView === 'back' ? { x: 0, y: Math.PI } : button.dataset.bagView === 'front' ? { x: 0, y: 0 } : { x: -0.12, y: 0.25 }; b.zoom = 1; renderBagView();
  }));
  document.querySelector('#bagZoomReset').addEventListener('click', () => { bagState().zoom = 1; renderBagView(); });
  document.querySelectorAll('[data-bag-zoom]').forEach(button => button.addEventListener('click', () => { bagState().zoom = clamp(bagState().zoom * Number(button.dataset.bagZoom), 0.6, 2.5); renderBagView(); }));
  syncBagControls();
}
function syncBagControls() {
  renderBagTeam();
  document.querySelectorAll('[data-bag-usage]').forEach(button => { const active = button.dataset.bagUsage === bagState().usage; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });

  const b = bagState(); document.querySelectorAll('[data-bag]').forEach(input => { if (input.type === 'checkbox') input.checked = b[input.dataset.bag]; else input.value = b[input.dataset.bag]; if(input.type==='range')updateRangeFill(input); });
}
function activateBagTag() {
  setupBagTag();
  document.querySelector('#bagTagControls').hidden = false;
  document.querySelector('#bagTagPreview').hidden = false;
  if (!bagView) initBagView();
  document.fonts.load(`48px "${bagState().font}"`).then(scheduleBagTag);
  scheduleBagTag();
}
function initBagView() {
  const host = document.querySelector('#bagTagCanvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label', 'Bag Tag 360 degree preview. Use arrow keys to rotate.'); renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x616775, 1.1));
  const light = new THREE.DirectionalLight(0xffffff, 0.85); light.position.set(-70, 120, 180); scene.add(light);
  const rim = new THREE.DirectionalLight(0xa8c9ff, 0.6); rim.position.set(80, 40, -120); scene.add(rim);
  bagView = { renderer, scene, camera, group: null };
  new ResizeObserver(renderBagView).observe(host);
  const pointers = new Map(); let distance = 0;
  host.addEventListener('pointerdown', e => { e.stopPropagation(); pointers.set(e.pointerId, [e.clientX, e.clientY]); host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return; e.stopPropagation();
    const old = pointers.get(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) { const [a,c] = [...pointers.values()], next = Math.hypot(a[0]-c[0],a[1]-c[1]); if (distance) bagState().zoom = clamp(bagState().zoom * next / distance, 0.6, 2.5); distance = next; }
    else { bagState().rotation.y += (e.clientX-old[0])*0.012; bagState().rotation.x += (e.clientY-old[1])*0.012; }
    renderBagView();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => host.addEventListener(name,e => { pointers.delete(e.pointerId); distance=0; }));
  host.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); bagState().zoom = clamp(bagState().zoom*Math.exp(-e.deltaY*0.001),0.6,2.5); renderBagView(); }, { passive: false });
  host.addEventListener('keydown', e => { if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return; e.preventDefault(); e.stopPropagation(); bagState().rotation[e.key.includes('Left')||e.key.includes('Right')?'y':'x'] += ['ArrowLeft','ArrowUp'].includes(e.key)?-0.15:0.15; renderBagView(); });
}
function renderBagView() {
  if (!bagView || state.productType !== 'bag') return;
  document.querySelector('#bagZoomReset').textContent = `${Math.round(bagState().zoom * 100)}%`;
  const angle = ((bagState().rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  document.querySelectorAll('[data-bag-view]').forEach(button => {
    if (button.dataset.bagView === 'reset') return;
    const active = Math.abs(bagState().rotation.x) < 0.01 && (button.dataset.bagView === 'front' ? Math.min(angle, Math.PI * 2 - angle) < 0.01 : Math.abs(angle - Math.PI) < 0.01);
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  });
  const host = document.querySelector('#bagTagCanvas'), w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
  const { renderer, camera, group, scene } = bagView;
  renderer.setSize(w,h,false); camera.aspect=w/h;
  camera.position.set(0,0,Math.max(bagDimensions().heightMm,bagDimensions().widthMm/(w/h))/(2*Math.tan(17*Math.PI/180)*0.8)/bagState().zoom); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
  if (group) { group.rotation.x=bagState().rotation.x; group.rotation.y=bagState().rotation.y; }
  renderer.render(scene,camera);
}
function scheduleBagTag() { clearTimeout(bagTimer); bagTimer=setTimeout(buildBagTag,100); }
function bagMesh(shapes, colour, depth, z) {
  const flat = depth < 0.01;
  const geometry = flat ? new THREE.ShapeGeometry(shapes) : new THREE.ExtrudeGeometry(shapes,{ depth, bevelEnabled:false, curveSegments:48 });
  // r128 expects material colours in linear space when the renderer outputs sRGB.
  const linearColour = new THREE.Color(colour).convertSRGBToLinear();
  const side = new THREE.MeshStandardMaterial({color:linearColour,roughness:0.72,metalness:0});
  // Keep printed artwork faithful to its chosen colour; lighting defines the side walls.
  const face = new THREE.MeshBasicMaterial({color:linearColour,toneMapped:false,polygonOffset:flat,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  let material;
  if (depth === 4) { material = side; face.dispose(); }
  else if (flat) { material = face; side.dispose(); }
  else material = [face,side];
  const mesh = new THREE.Mesh(geometry,material); mesh.position.z=z+(flat?0.005:0); return mesh;
}
// Simplify within less than one tracing pixel, keeping corners and tiny closed features.
function smoothBagContour(points, tolerance) {
  const simplify = list => {
    if (list.length < 3) return list;
    const a=list[0],b=list[list.length-1],dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
    let far=0,index=0;
    for(let i=1;i<list.length-1;i++){const p=list[i],t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;const d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;if(d>far){far=d;index=i;}}
    if(far<=tolerance*tolerance)return [a,b];
    return [...simplify(list.slice(0,index+1)).slice(0,-1),...simplify(list.slice(index))];
  };
  let split=1,dist=0;
  for(let i=1;i<points.length;i++){const d=(points[i][0]-points[0][0])**2+(points[i][1]-points[0][1])**2;if(d>dist){dist=d;split=i;}}
  const result=[...simplify(points.slice(0,split+1)).slice(0,-1),...simplify([...points.slice(split),points[0]]).slice(0,-1)];
  return result.length>=3?result:points;
}
function bagPath(points, hole=false) { const p = hole ? new THREE.Path() : new THREE.Shape(); points.forEach(([x,y],i) => i?p.lineTo(x,y):p.moveTo(x,y)); p.closePath(); return p; }
// Trace raster colour boundaries into real extruded shapes, including letter counters.
function polishBagLogoContour(points, pixelSize) {
  let result=smoothBagContour(points,pixelSize*0.7);
  for(let pass=0;pass<2;pass++){
    const next=[],maxCut=pixelSize*0.25/(pass+1);
    result.forEach((p,i)=>{
      const a=result[(i+result.length-1)%result.length],b=result[(i+1)%result.length];
      const ux=p[0]-a[0],uy=p[1]-a[1],vx=b[0]-p[0],vy=b[1]-p[1];
      const u=Math.hypot(ux,uy),v=Math.hypot(vx,vy);
      // Keep intentional corners. Pixel cleanup must never scale with edge length:
      // a quarter of a long diagonal used to turn the stick's bend into an arc.
      if(!u||!v||(u>pixelSize*2&&v>pixelSize*2&&(ux*vx+uy*vy)/(u*v)<Math.cos(Math.PI/6))){next.push(p);return;}
      const cut=Math.min(maxCut,u*0.25,v*0.25);
      next.push([p[0]-ux/u*cut,p[1]-uy/u*cut]);
      next.push([p[0]+vx/v*cut,p[1]+vy/v*cut]);
    });
    result=next;
  }
  return result;
}
function bagMaskShapes(mask,w,h,width,height,cx,cy,polish=false) {
  const edges=new Map(), add=(a,b)=>{ const key=a[0]+','+a[1]; if(!edges.has(key))edges.set(key,[]); edges.get(key).push(b); };
  const has=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&mask[y*w+x];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(has(x,y)) {
    if(!has(x,y-1))add([x,y],[x+1,y]); if(!has(x+1,y))add([x+1,y],[x+1,y+1]);
    if(!has(x,y+1))add([x+1,y+1],[x,y+1]); if(!has(x-1,y))add([x,y+1],[x,y]);
  }
  const loops=[];
  while(edges.size) {
    const start=edges.keys().next().value; let key=start; const points=[];
    do { const [x,y]=key.split(',').map(Number); points.push([cx+(x/w-0.5)*width,cy+(0.5-y/h)*height]); const list=edges.get(key); if(!list)break; const next=list.pop(); if(!list.length)edges.delete(key); key=next.join(','); } while(key!==start);
    if(points.length>3) { const simplified=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return Math.abs((p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0]))>1e-9;}); if(simplified.length>2)loops.push(polish ? polishBagLogoContour(simplified,Math.min(width/w,height/h)) : smoothBagContour(simplified,Math.min(width/w,height/h)*0.7)); }
  }
  const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
  const outers=loops.filter(p=>area(p)<0).map(p=>({points:p,shape:bagPath(p)}));
  const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
  for(const hole of loops.filter(p=>area(p)>0)) { const parent=outers.filter(o=>inside(hole[0],o.points)).sort((a,b)=>Math.abs(area(a.points))-Math.abs(area(b.points)))[0]; if(parent)parent.shape.holes.push(bagPath(hole,true)); }
  return outers.map(o=>o.shape);
}
function bagLogoPixels(trace=true) {
  const b=bagState(), n=1024, canvas=document.createElement('canvas');canvas.width=canvas.height=n;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  // The wizard has already assigned inks; resampling must not invent blended inks.
  ctx.imageSmoothingEnabled=!b.preparedDataUrl;
  const source=document.createElement('canvas'),factor=Math.min(1,1536/Math.max(bagImage.width,bagImage.height));
  source.width=Math.max(1,Math.round(bagImage.width*factor));source.height=Math.max(1,Math.round(bagImage.height*factor));
  const src=source.getContext('2d',{willReadFrequently:true});src.drawImage(bagImage,0,0,source.width,source.height);
  const original=src.getImageData(0,0,source.width,source.height);let left=source.width,top=source.height,right=0,bottom=0;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){const i=(y*source.width+x)*4;if(b.removeBg&&Math.min(original.data[i],original.data[i+1],original.data[i+2])>238)original.data[i+3]=0;if(original.data[i+3]>128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
  src.putImageData(original,0,0);const sw=Math.max(1,right-left+1),sh=Math.max(1,bottom-top+1),ratio=bagBackingMode()==='custom'?Math.min((n-2*Math.abs(b.x)*n/74)/sw,(n-2*Math.abs(b.y)*n/74)/sh)*Math.min(1,b.scale):Math.min(n/sw,n/sh)*b.scale;
  if(right>=left)ctx.drawImage(source,left,top,sw,sh,(n-sw*ratio)/2+b.x*n/74,(n-sh*ratio)/2-b.y*n/74,sw*ratio,sh*ratio);
  const {data}=ctx.getImageData(0,0,n,n);
  if(b.removeBg) {
    // Remove light neutral background only; black is usually intentional artwork.
    for(let i=0;i<data.length;i+=4)if(Math.min(data[i],data[i+1],data[i+2])>238)data[i+3]=0;
  }
  const histogram=new Map();
  for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
    const i=(y*n+x)*4;
    if(bagBackingMode()==='circle'&&Math.hypot(x-n/2,y-n/2)>n/2-1)data[i+3]=0;
    if(data[i+3]<128)continue;
    const rgb=[data[i],data[i+1],data[i+2]], key=rgb.map(v=>Math.round(v/8)).join(',');
    if(!histogram.has(key))histogram.set(key,{count:0,exact:new Map()});
    const bucket=histogram.get(key),exact=rgb.join(',');bucket.count++;bucket.exact.set(exact,(bucket.exact.get(exact)||0)+1);
  }
  if(!b.palette.length) {
    const total=[...histogram.values()].reduce((sum,bucket)=>sum+bucket.count,0);
    for(const bucket of [...histogram.values()].sort((a,c)=>c.count-a.count)) {
      // Preserve small, distinct details such as eyes instead of a 2% area cutoff.
      if(bucket.count<Math.max(3,total*0.00005))continue;
      const rgb=[...bucket.exact].sort((a,c)=>c[1]-a[1])[0][0].split(',').map(Number);
      if(b.palette.some(p=>p.rgb.reduce((sum,v,i)=>sum+(v-rgb[i])**2,0)<65**2))continue;
      // Edge blends between two existing inks are not additional logo colours.
      let blend=false;
      for(let a=0;a<b.palette.length;a++)for(let c=a+1;c<b.palette.length;c++){
        const start=b.palette[a].rgb,delta=b.palette[c].rgb.map((v,k)=>v-start[k]),den=delta.reduce((sum,v)=>sum+v*v,0);
        const t=den?Math.max(0,Math.min(1,delta.reduce((sum,v,k)=>sum+v*(rgb[k]-start[k]),0)/den)):0;
        if(rgb.reduce((sum,v,k)=>sum+(v-start[k]-t*delta[k])**2,0)<24**2)blend=true;
      }
      if(blend)continue;
      const colour='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
      b.palette.push({rgb,colour,raised:bagLogoColourIsRaised(colour)});
      if(b.palette.length===Number(b.colourCount))break;
    }
  }
  const masks=b.palette.map(()=>new Uint8Array(n*n));
  for(let i=0;i<n*n;i++)if(data[i*4+3]>=128&&masks.length){let best=0,d=Infinity;b.palette.forEach((p,j)=>{const pixel=[data[i*4],data[i*4+1],data[i*4+2]], norm=p.rgb.reduce((sum,c)=>sum+c*c,0);
    // Dark antialias pixels retain their source hue instead of becoming another ink colour.
    const shade=norm?Math.min(1,p.rgb.reduce((sum,c,k)=>sum+c*pixel[k],0)/norm):0;
    const v=b.preparedDataUrl
      ? p.rgb.reduce((sum,c,k)=>sum+(c-pixel[k])**2,0)
      : p.rgb.reduce((sum,c,k)=>sum+(c*shade-pixel[k])**2+0.02*(c-pixel[k])**2,0);
    if(v<d){best=j;d=v;}});masks[best][i]=1;}
  // Remove isolated compression/quantization speckles before they become tall walls.
  const labels=new Int16Array(n*n).fill(-1);
  masks.forEach((mask,k)=>{for(let i=0;i<mask.length;i++)if(mask[i])labels[i]=k;});
  for(let pass=0;pass<2;pass++){
    const next=labels.slice();
    for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){
      const i=y*n+x;if(labels[i]<0)continue;
      const counts=new Map();
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
        const k=labels[i+dy*n+dx];if(k>=0)counts.set(k,(counts.get(k)||0)+1);
      }
      if((counts.get(labels[i])||0)<=5){
        for(const [k,count] of counts)if(count>=10){next[i]=k;break;}
      }
    }
    labels.set(next);
  }
  masks.forEach(mask=>mask.fill(0));
  for(let i=0;i<labels.length;i++)if(labels[i]>=0)masks[labels[i]][i]=1;
  const shapes = trace ? masks.map(mask=>bagMaskShapes(mask,n,n,74,74,0,2.2)) : [];
  shapes.masks = masks;
  shapes.resolution = n;
  return shapes;
}
// Draw the same smoothed colour contours used for the geometry, rather than
// enlarging the raster labels onto the tops and walls.
function bagVectorColourCanvas(regions, raisedOnly=false) {
  const b=bagState(), canvas=document.createElement('canvas');
  canvas.width=canvas.height=2048;
  const ctx=canvas.getContext('2d'), scale=canvas.width/74;
  ctx.translate(canvas.width/2,canvas.height/2+2.2*scale);ctx.scale(scale,-scale);
  ctx.lineJoin='round';ctx.lineCap='round';
  regions.masks.forEach((mask,index)=>{
    const colour=b.palette[index].colour;
    if(raisedOnly&&!bagLogoColourIsRaised(colour))return;
    const shapes=bagMaskShapes(mask,regions.resolution,regions.resolution,74,74,0,2.2,true);
    ctx.fillStyle=ctx.strokeStyle=colour;
    // A slight bleed covers the smoothed solid boundary; it is clipped by the mesh.
    ctx.lineWidth=0.025;
    for(const shape of shapes){
      ctx.beginPath();
      for(const path of [shape,...shape.holes]){
        path.getPoints().forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));
        ctx.closePath();
      }
      ctx.fill('evenodd');ctx.stroke();
    }
  });
  return canvas;
}
// Give each side quad one ink from the interior region. The face texture has
// overlapping bleed at colour boundaries and must not colour the vertical walls.
function applyBagSideInks(mesh, regions) {
  const n=regions.resolution, b=bagState(), g=mesh.geometry,p=g.attributes.position,normal=g.attributes.normal;
  const labels=new Int16Array(n*n).fill(-1);
  regions.masks.forEach((mask,k)=>{if(bagLogoColourIsRaised(b.palette[k].colour))for(let i=0;i<mask.length;i++)if(mask[i])labels[i]=k;});
  const colours=new Float32Array(p.count*3).fill(1);
  const inks=b.palette.map(c=>new THREE.Color(c.colour).convertSRGBToLinear().multiplyScalar(0.69));
  const contours=[];
  for(const group of g.groups)if(group.materialIndex===1){
    let contour=[];contours.push(contour);
    for(let i=group.start;i<group.start+group.count;i+=6){
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(let k=0;k<6;k++){minX=Math.min(minX,p.getX(i+k));maxX=Math.max(maxX,p.getX(i+k));minY=Math.min(minY,p.getY(i+k));maxY=Math.max(maxY,p.getY(i+k));}
      const x=Math.round(((minX+maxX)/2/74+0.5)*n-normal.getX(i)*1.5);
      const y=Math.round((0.5-((minY+maxY)/2-2.2)/74)*n+normal.getY(i)*1.5);
      const votes=new Float32Array(inks.length);
      for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
        const px=x+dx,py=y+dy;if(px<0||py<0||px>=n||py>=n)continue;
        const k=labels[py*n+px];if(k>=0)votes[k]+=1/(1+dx*dx+dy*dy);
      }
      let best=-1;votes.forEach((v,k)=>{if(v>0&&(best<0||v>votes[best]))best=k;});
      const endpoints=[];
      for(let k=0;k<6;k++){
        const point=[p.getX(i+k),p.getY(i+k)];
        if(!endpoints.some(q=>Math.hypot(q[0]-point[0],q[1]-point[1])<1e-6))endpoints.push(point);
      }
      if(endpoints.length<2)continue;
      const previous=contour.at(-1);
      if(previous&&!previous.ends.some(a=>endpoints.some(c=>Math.hypot(a[0]-c[0],a[1]-c[1])<1e-5))){contour=[];contours.push(contour);}
      contour.push({i,ink:best,ends:endpoints,length:Math.hypot(maxX-minX,maxY-minY)});
    }
  }
  mesh.userData.sideInkContours=contours.map(c=>c.length);
  let correctedQuads=0;
  for(const contour of contours){
    // Remove brief sampling excursions only when the same ink continues on
    // both sides. Long regions and actual colour transitions are retained.
    for(let pass=0;pass<2;pass++){
      const runs=[];
      for(const quad of contour){
        let run=runs.at(-1);
        if(!run||run.ink!==quad.ink){run={ink:quad.ink,length:0,quads:[]};runs.push(run);}
        run.length+=quad.length;run.quads.push(quad);
      }
      if(runs.length>1&&runs[0].ink===runs.at(-1).ink){
        const last=runs.pop();runs[0].length+=last.length;runs[0].quads.push(...last.quads);
      }
      if(runs.length>=3)runs.forEach((run,j)=>{
        const before=runs[(j+runs.length-1)%runs.length],after=runs[(j+1)%runs.length];
        if(run.length<0.8&&before.ink===after.ink&&before.length+after.length>run.length*3){
          run.quads.forEach(q=>{q.ink=before.ink;correctedQuads++;});
        }
      });
    }
    for(const quad of contour){
      const ink=inks[quad.ink]||new THREE.Color(b.baseColour).convertSRGBToLinear();
      for(let k=0;k<6;k++)colours.set([ink.r,ink.g,ink.b],(quad.i+k)*3);
    }
  }
  mesh.userData.correctedSideQuads=correctedQuads;
  g.setAttribute('color',new THREE.BufferAttribute(colours,3));
}
// Adjacent raised inks share one solid: internal colour boundaries are not walls.
function bagLogoMeshes(regions=bagLogoPixels(false)) {
  const b=bagState(), n=regions.resolution;
  const raised=new Uint8Array(n*n), flat=new Uint8Array(n*n);
  regions.masks.forEach((mask,index)=>{
    const target=bagLogoColourIsRaised(b.palette[index].colour)?raised:flat;
    for(let i=0;i<mask.length;i++)if(mask[i])target[i]=1;
  });
  const meshes=[];
  for(const [mask,depth] of [[raised,2],[flat,0.005]]){
    const shapes=bagMaskShapes(mask,n,n,74,74,0,2.2,true);
    if(!shapes.length)continue;
    const mesh=bagMesh(shapes,'#ffffff',depth,1);
    const texture=new THREE.CanvasTexture(bagVectorColourCanvas(regions,depth===2));
    texture.encoding=THREE.sRGBEncoding;
    texture.anisotropy=bagView.renderer.capabilities.getMaxAnisotropy();
    const position=mesh.geometry.attributes.position, uv=mesh.geometry.attributes.uv;
    for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/74+0.5,(position.getY(i)-2.2)/74+0.5);
    uv.needsUpdate=true;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    materials[0].map=texture;materials[0].needsUpdate=true;
    if(materials[1]){
      materials[1].dispose();
      applyBagSideInks(mesh,regions);
      materials[1]=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
    }
    meshes.push(mesh);
  }
  return meshes;
}
function renderBagPalette() {
  const host=document.querySelector('#bagPalette');host.replaceChildren();
  if(!bagState().palette.length){host.textContent='Upload artwork';return;}
  bagState().palette.forEach((p,i)=>{
    const row=document.createElement('div');row.className='bag-palette-row';
    const colour=document.createElement('input');colour.type='color';colour.value=p.colour;colour.setAttribute('aria-label',`Logo colour ${i+1}`);
    colour.addEventListener('input',()=>{p.colour=colour.value;scheduleBagTag();});
    row.append(colour);host.append(row);
  });
}
function buildBagTag() {
  if(!bagView||state.productType!=='bag')return;
  const b=bagState(), group=new THREE.Group();
  try {
    const mode=bagBackingMode(),regions=bagImage&&b.source?bagLogoPixels(false):null;
    let textY=-42.4,textX=0,baseShapes;
    if(mode==='custom'&&regions){const backing=buildCustomBagBacking(regions);baseShapes=backing.shapes;textY=backing.textY;textX=backing.textX;}
    else {const base=bagPath(BAG_TAG_OUTLINE[0]);BAG_TAG_OUTLINE.slice(1).forEach(loop=>base.holes.push(bagPath(loop,true)));baseShapes=[base];}
    group.add(bagMesh(baseShapes,b.baseColour,4,-3));
    b.resolvedBacking=mode;
    const sizeControl=document.querySelector('[data-bag=scale]');sizeControl.max=mode==='custom'?'1':'2';if(mode==='custom'&&b.scale>1){b.scale=1;sizeControl.value=1;}
    updateRangeFill(sizeControl);
    if(regions) { bagLogoMeshes(regions).forEach(mesh=>group.add(mesh)); }
    else { const ring=new THREE.Shape();ring.absarc(0,2.2,32,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,2.2,30,0,Math.PI*2,true);ring.holes.push(hole);group.add(bagMesh(ring,'#ffde00',2,1));const star=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?10:23;star.push([Math.cos(a)*r,2.2+Math.sin(a)*r]);}group.add(bagMesh(bagPath(star),'#ffde00',2,1)); }
    const nameResult=bagNameMesh(bagPreviewName(),textX,textY);
    if(nameResult.mesh){nameResult.mesh.userData.bagName=true;group.add(nameResult.mesh);}
    const bounds=new THREE.Box3().setFromObject(group),size3=bounds.getSize(new THREE.Vector3());
    const fitWidth=Math.min(1,80/size3.x);
    const center=bounds.getCenter(new THREE.Vector3());
    group.children.forEach(mesh=>{mesh.position.x-=center.x;mesh.position.y-=center.y;mesh.position.x*=fitWidth;mesh.position.y*=fitWidth;mesh.scale.x=mesh.scale.y=fitWidth;});
    bagView.nameLayout={textX,textY,centerX:center.x,centerY:center.y,fitWidth};
    b.dimensions={widthMm:size3.x*fitWidth,heightMm:size3.y*fitWidth,baseMm:4,raisedMm:2,depthMm:6};
    b.backingGeometry={version:1,marginMm:mode==='custom'?3:null,shapes:baseShapes.map(shape=>({outline:shape.getPoints().map(p=>[(p.x-center.x)*fitWidth,(p.y-center.y)*fitWidth]),holes:shape.holes.map(h=>h.getPoints().map(p=>[(p.x-center.x)*fitWidth,(p.y-center.y)*fitWidth]))}))};
    document.querySelector('#bagAlignment').disabled=mode!=='custom'||!regions;
    document.querySelector('#bagBackingResult').textContent=`${mode==='circle'?'Circular':'Custom outline'}`;
    if(bagView.group){bagView.scene.remove(bagView.group);bagView.group.traverse(o=>{o.geometry?.dispose();[].concat(o.material||[]).forEach(material=>{material.map?.dispose();material.dispose();});});}
    b.error='';bagView.group=group;bagView.scene.add(group);renderBagView();renderBagPalette();
    document.querySelector('#bagLogoName').textContent=b.source?.fileName||'Upload your team logo to replace the placeholder.';
    document.querySelector('#bagMessage').textContent=b.error||(bagPreviewName().trim()?nameResult.small?'This name is small. A shorter name will be easier to read.':'':'Enter a name before saving or ordering.');
    updateBagTeamStatus();renderPreviewTitle();updateStats();updateProjectControls();
  }catch(error){b.error='Could not build this logo. Try simpler artwork.';document.querySelector('#bagMessage').textContent=b.error;console.error(error);updateProjectControls();}
}
async function buildBagProject() {
  buildBagTag();const b=bagState();if(!bagReady())throw new Error('Upload a logo and enter a valid name and quantity for every tag.');
  return {type:'SignGuy.BagTagStudio',version:PROJECT_FILE_VERSION,id:b.projectId||makeProjectId(),name:b.name||(b.orderMode==='team'?'Team Bag Tags':`${b.text} Bag Tag`),customerEmail:state.customerEmail,savedAt:new Date().toISOString(),source:{...b.source},config:{productType:'bag',bag:{...b,roster:b.roster.map(row=>({...row})),source:undefined,busy:undefined,error:undefined},dimensions:{...bagDimensions()},template:b.resolvedBacking==='custom'?'custom-outline-v1':'bclark-v1'},preview:{screenshotDataUrl:bagView.renderer.domElement.toDataURL('image/png'),dimensions:{...bagDimensions()}}};
}
async function restoreBagProject(project) {
  const config=project.config?.bag;if(!config||!project.source?.dataUrl)throw new Error('Invalid Bag Tag project.');
  if(!['Bebas Neue Bold','Bungee','Montserrat Black','Soccer League'].includes(config.font))throw new Error('Unsupported Bag Tag font.');
  const image=await loadImage(config.preparedDataUrl || project.source.dataUrl);
  ++bagRevision;bagImage=image;bagTag={...bagState(),...config,source:{...project.source},projectId:project.id,name:project.name,busy:false,error:''};
  bagTag.text=String(bagTag.text||'').slice(0,32);bagTag.scale=clamp(Number(bagTag.scale)||1,0.4,2);bagTag.x=clamp(Number(bagTag.x)||0,-25,25);bagTag.y=clamp(Number(bagTag.y)||0,-25,25);bagTag.quantity=clamp(Math.floor(Number(bagTag.quantity)||1),1,999);
  bagTag.backing=['auto','circle','custom'].includes(config.backing)?config.backing:'circle';
  bagTag.alignmentX=clamp(Number(config.alignmentX)||0,-20,20);
  bagTag.orderMode=config.orderMode==='team'?'team':'single';
  bagTag.roster=Array.isArray(config.roster)?config.roster.slice(0,100).map(row=>({name:String(row.name??'').slice(0,32),quantity:Number(row.quantity)})):[];
  bagTag.activeRoster=clamp(Math.floor(Number(config.activeRoster)||0),0,Math.max(0,bagTag.roster.length-1));
  bagTag.usage=bagTag.usage==='outdoor'?'outdoor':'indoor';
  state.productSelectionMenuResolved=true;hideProductSelectionMenu();selectProductType('bag');syncBagControls();buildBagTag();
}
async function saveBagProject() {
  try {setStatus('Saving');const project=await buildBagProject();bagState().projectId=project.id;await saveProjectRecord(project);await refreshProjectLog();
    if(isLocalTesting()){downloadProjectPayload(project);els.projectNote.textContent='Bag Tag saved to this device and downloaded.';}
    else {try{await uploadProjectFolder(project,{screenshots:await captureBagShots()});els.projectNote.textContent='Bag Tag saved to your project folder.';}catch(error){els.projectNote.textContent=`Saved to this device. ${formatSaveFailureMessage(error,'Server save failed.')}`;}}
    setStatus('Saved');
  }catch(error){els.projectNote.textContent=error.message;setStatus('Save failed');}finally{updateProjectControls();}
}
async function captureBagShots() {
  const b=bagState(),rotation={...b.rotation},shots=[];
  try{for(const [label,y] of [['Front',0],['Angled',0.65],['Back',Math.PI]]){b.rotation={x:0,y};renderBagView();const blob=await new Promise(resolve=>bagView.renderer.domElement.toBlob(resolve,'image/png'));shots.push({label,fileName:`bag-tag-${label.toLowerCase()}.png`,blob,file:new File([blob],`bag-tag-${label.toLowerCase()}.png`,{type:'image/png'})});}}finally{b.rotation=rotation;renderBagView();}return shots;
}
async function orderBagTag() {
  if(!bagReady()||!state.customerEmail)return;
  state.orderInProgress=true;updateProjectControls();
  try{const project=await buildBagProject();bagState().projectId=project.id;
    if(!getShopifyVariantId())throw new Error('Bag Tag checkout is not configured yet. Your design can still be saved.');
    const message=`Bag Tag\nNames: ${bagOrderRows().map(row=>`${row.name} (quantity ${row.quantity})`).join('; ')}\nFont: ${bagState().font}\nQuantity: ${bagTotalQuantity()}\nUsage: ${bagState().usage}\n${bagDimensionLabel()}; 4 mm base + 2 mm relief; front only.\nBase: ${bagState().baseColour}\nText: ${bagState().textColour}\nLogo colours: ${JSON.stringify(bagState().palette)}`;
    if(isLocalTesting()){await saveProjectRecord(project);downloadProjectPayload(project);els.submitNote.textContent='Bag Tag order file downloaded for review. Local testing does not send email or open checkout.';}
    else{const result=await uploadProjectFolder(project,{screenshots:await captureBagOrderShots(project.config.bag),sendOrderEmail:true,subject:makeOrderEmailSubject('Bag Tag'),message,messageHtml:makeBagOrderEmailHtml(project)});await saveProjectRecord(project);redirectToShopifyCheckout(project,result);}
  }catch(error){els.submitNote.textContent=error.message;setStatus('Order not placed');}finally{state.orderInProgress=false;updateProjectControls();}
}

// The shared wizard edits a temporary artwork state; only Confirm changes the tag.
let bagUploadSession = null;
async function beginBagLogoWizard(file) {
  const validation = validateUploadFile(file);
  if (!validation.ok) { showUploadError(validation.message); return; }
  if (file.size > 15 * 1024 * 1024) { showUploadError('Please choose a logo smaller than 15 MB.'); return; }
  if (bagUploadSession) cancelBagLogoWizard();
  const session = { snapshot: captureCurrentArtworkState(), uploadTarget: state.uploadTarget, processingDirty: state.processingDirty };
  bagUploadSession = session;
  bagState().busy = true; bagState().error = '';
  if (els.submitNote) els.submitNote.textContent = '';
  updateProjectControls(); setStatus('Processing');
  try {
    const upload = validation.kind === 'heic' ? await convertHeicToPngFile(file) : file;
    state.uploadTarget = 'bag';
    const artwork = await (validation.kind === 'svg' ? readSvgArtwork(upload) : readRasterArtwork(upload));
    if (bagUploadSession !== session) return;
    Object.assign(state, { artwork, uploadedFile: upload, fileName: upload.name, isDefaultPreview: false,
      processed: null, removeBg: !artwork.hasTransparency, fixFloatingRegions: false,
      floatingSupportColour: DEFAULT_FLOATING_SUPPORT_COLOUR, targetColorCount: 8,
      colorOverrides: [], frontColoursCustomized: false, selectedColor: 0,
      selectedColourTarget: { type: 'front', index: 0 }, processingDirty: true });
    initEditState(artwork);
    await reprocess();
    if (bagUploadSession !== session) return;
    openWizard('edit');
  } catch (error) {
    cancelBagLogoWizard(); showUploadError(getUploadErrorMessage(error));
  }
}
function cancelBagLogoWizard() {
  if (!bagUploadSession) return;
  const session = bagUploadSession; bagUploadSession = null;
  applyArtworkStateSnapshot(session.snapshot);
  state.uploadTarget = session.uploadTarget;
  state.processingDirty = session.processingDirty;
  bagState().busy = false;
  updateProjectControls();
}
async function completeBagLogoWizard() {
  const session = bagUploadSession;
  if (!session) return;
  if (state.processingDirty) await reprocess({ skipWizardRender: true });
  const original = { fileName: state.uploadedFile.name, artworkType: state.artwork.type, dataUrl: await fileToDataUrl(state.uploadedFile) };
  const preparedDataUrl = trimCanvasToVisibleAlpha(createMappedArtworkCanvas(state.processed),20).canvas.toDataURL('image/png');
  const image = await loadImage(preparedDataUrl);
  if (bagUploadSession !== session) return;
  const palette = state.processed.colours.map((region,index) => {
    const colour = normalizeHex(getDisplayColour(index,region.hex));
    return { colour, rgb: [1,3,5].map(offset=>parseInt(colour.slice(offset,offset+2),16)), raised: bagLogoColourIsRaised(colour) };
  });
  const edit = { crop: {...state.edit.crop}, cropAspect: state.edit.cropAspect, removeBg: state.removeBg,
    fixFloatingRegions: state.fixFloatingRegions, targetColorCount: state.targetColorCount };
  cancelBagLogoWizard();
  Object.assign(bagState(), { source: original, preparedDataUrl, wizardEdit: edit, palette, colourCount: palette.length,
    removeBg: false, scale: 1, x: 0, y: 0, alignmentX: 0, error: '', busy: false });
  bagImage = image;
  syncBagControls(); buildBagTag(); closeWizard(); setStatus('Bag Tag logo ready');
}

// The guide controls the backing attachments, not the artwork placement.
function openBagAlignment(){
  if(!bagImage||bagBackingMode()!=='custom')return;
  const dialog=document.createElement('dialog');dialog.className='bag-alignment-dialog';dialog.setAttribute('aria-label','Set alignment centre');
  dialog.innerHTML=`<h2>Set alignment centre</h2><p>Drag the line through the part of the logo you want centred over the name. The hanging hole follows this line too.</p><canvas width="600" height="600" aria-label="Logo alignment guide"></canvas><label>Alignment centre<input type="range" min="-20" max="20" step="0.1" aria-label="Alignment centre" /></label><div class="bag-alignment-actions"><button type="button" data-action="reset">Reset to automatic</button><button type="button" data-action="cancel">Cancel</button><button type="button" data-action="apply">Apply</button></div>`;
  document.body.append(dialog);
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=dialog.querySelector('input');
  const artwork=bagVectorColourCanvas(bagLogoPixels(false));
  let value=Number(bagState().alignmentX)||0;
  function draw(){
    ctx.fillStyle='#303636';ctx.fillRect(0,0,600,600);ctx.drawImage(artwork,0,0,600,600);
    const x=300+value*600/74;
    ctx.strokeStyle='#ffdf00';ctx.lineWidth=3;ctx.setLineDash([9,6]);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ffdf00';ctx.beginPath();ctx.arc(x,24,9,0,Math.PI*2);ctx.fill();slider.value=value;
  }
  function move(event){const r=canvas.getBoundingClientRect();value=Math.round(clamp(((event.clientX-r.left)/r.width-.5)*74,-20,20)*10)/10;draw();}
  canvas.onpointerdown=event=>{canvas.setPointerCapture(event.pointerId);move(event);};
  canvas.onpointermove=event=>{if(canvas.hasPointerCapture(event.pointerId))move(event);};
  slider.oninput=()=>{value=Number(slider.value);draw();};
  dialog.querySelector('[data-action=reset]').onclick=()=>{value=0;draw();};
  dialog.querySelector('[data-action=cancel]').onclick=()=>dialog.close();
  dialog.querySelector('[data-action=apply]').onclick=()=>{bagState().alignmentX=value;scheduleBagTag();dialog.close();};
  dialog.addEventListener('close',()=>dialog.remove());draw();dialog.showModal();
}

function bagNameMesh(text,textX,textY,b=bagState()){
  let mesh=null;
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=180;const ctx=canvas.getContext('2d');let size=160;ctx.font=`${size}px "${b.font}"`;while(ctx.measureText(text).width>690&&size>12){ctx.font=`${--size}px "${b.font}"`;}
    ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,360,90);
    const pixels=ctx.getImageData(0,0,720,180).data,mask=new Uint8Array(720*180);for(let i=0;i<mask.length;i++)mask[i]=pixels[i*4+3]>128?1:0;
    let left=720,right=0,top=180,bottom=0;
    for(let y=0;y<180;y++)for(let x=0;x<720;x++)if(mask[y*720+x]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right>=left){const tw=right-left+1,th=bottom-top+1,trimmed=new Uint8Array(tw*th);for(let y=0;y<th;y++)for(let x=0;x<tw;x++)trimmed[y*tw+x]=mask[(y+top)*720+x+left];const fit=Math.min(49/tw,14/th);const textShapes=bagMaskShapes(trimmed,tw,th,tw*fit,th*fit,textX,textY);if(textShapes.length)mesh=bagMesh(textShapes,b.textColour,2,1);}

  return {mesh,small:size<65};
}
function bagOrderRows(b=bagState()){
  return b.orderMode==='team'?(b.roster||[]):[{name:b.text,quantity:b.quantity}];
}
function bagTotalQuantity(b=bagState()){
  return bagOrderRows(b).reduce((total,row)=>total+(Number.isInteger(Number(row.quantity))&&Number(row.quantity)>0?Number(row.quantity):0),0);
}
function bagNamesValid(b=bagState()){
  const rows=bagOrderRows(b);
  return rows.length>0&&rows.length<=100&&rows.every(row=>typeof row.name==='string'&&row.name.trim()&&row.name.length<=32&&Number.isInteger(Number(row.quantity))&&Number(row.quantity)>=1&&Number(row.quantity)<=999);
}
function bagPreviewName(){const b=bagState();return b.orderMode==='team'?(b.roster?.[b.activeRoster]?.name||''):b.text;}
function bagOrderButtonLabel(){return bagState().orderMode==='team'?`Place order · ${bagTotalQuantity()} ${bagTotalQuantity()===1?'tag':'tags'}`:'Place Order';}
function setupBagTeam(){
  document.querySelectorAll('[data-bag-mode]').forEach(button=>button.addEventListener('click',()=>{
    const b=bagState();b.orderMode=button.dataset.bagMode;
    if(b.orderMode==='team'&&!b.roster.length){b.roster=[{name:b.text==='YOUR NAME'?'':b.text,quantity:b.quantity}];b.activeRoster=0;}
    renderBagTeam();scheduleBagTag();updateProjectControls();
  }));
  document.querySelector('#bagAddName').onclick=()=>{
    const b=bagState();if(b.roster.length>=100)return;b.roster.push({name:'',quantity:1});b.activeRoster=b.roster.length-1;
    renderBagTeam();document.querySelector('#bagRosterRows .bag-roster-row:last-child input').focus();scheduleBagTag();
  };
  document.querySelector('#bagPasteRoster').onclick=openBagRosterPaste;
  document.querySelector('#bagReviewTeam').onclick=reviewBagTeam;
}
function selectBagRoster(index){bagState().activeRoster=index;updateBagTeamStatus();scheduleBagTag();}
function renderBagTeam(){
  const host=document.querySelector('#bagTeamEditor');if(!host)return;
  const b=bagState(),team=b.orderMode==='team';host.hidden=!team;
  document.querySelectorAll('[data-bag-mode]').forEach(button=>{const active=button.dataset.bagMode===b.orderMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const grid=document.querySelector('.bag-name-grid');grid.classList.toggle('bag-team-font',team);
  grid.querySelector('[data-bag=text]').closest('label').hidden=team;grid.querySelector('[data-bag=quantity]').closest('label').hidden=team;
  const rows=document.querySelector('#bagRosterRows');rows.replaceChildren();
  (b.roster||[]).forEach((row,index)=>{
    const line=document.createElement('div');line.className='bag-roster-row';
    const preview=document.createElement('button');preview.type='button';preview.className='secondary-button';preview.textContent=String(index+1);preview.setAttribute('aria-label',`Preview tag ${index+1}`);preview.onclick=()=>selectBagRoster(index);
    const name=document.createElement('input');name.type='text';name.maxLength=32;name.value=row.name;name.placeholder='Name on tag';name.setAttribute('aria-label',`Name on tag ${index+1}`);
    name.onfocus=()=>selectBagRoster(index);name.oninput=()=>{row.name=name.value;updateBagTeamStatus();scheduleBagTag();};
    const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max='999';quantity.step='1';quantity.value=row.quantity;quantity.setAttribute('aria-label',`Quantity for tag ${index+1}`);
    quantity.oninput=()=>{row.quantity=quantity.value===''?null:Number(quantity.value);updateBagTeamStatus();};
    const remove=document.createElement('button');remove.type='button';remove.className='secondary-button';remove.textContent='×';remove.setAttribute('aria-label',`Remove tag ${index+1}`);remove.onclick=()=>{
      b.roster.splice(index,1);if(index<b.activeRoster)b.activeRoster--;b.activeRoster=Math.min(b.activeRoster,Math.max(0,b.roster.length-1));renderBagTeam();scheduleBagTag();
    };
    line.append(preview,name,quantity,remove);rows.append(line);
  });
  updateBagTeamStatus();
}
function updateBagTeamStatus(){
  const b=bagState(),team=b.orderMode==='team';
  const preview=document.querySelector('#bagRosterPreview');if(!preview)return;preview.hidden=!team;
  preview.textContent=b.roster?.length?`Previewing ${b.activeRoster+1} of ${b.roster.length}: ${bagPreviewName()||'Enter a name'}`:'Add a name to preview a tag';
  document.querySelectorAll('.bag-roster-row').forEach((line,index)=>{line.classList.toggle('active',index===b.activeRoster);line.firstChild.setAttribute('aria-pressed',String(index===b.activeRoster));});
  const valid=bagNamesValid(b);
  document.querySelector('#bagRosterStatus').textContent=valid?`${b.roster.length} names · ${bagTotalQuantity()} tags`:'Enter a name and a whole quantity from 1 to 999 for every row.';
  document.querySelector('#bagAddName').disabled=b.roster.length>=100;
  document.querySelector('#bagReviewTeam').disabled=!b.source||!valid||b.busy||!!b.error;
  if(typeof updateProjectControls==='function')updateProjectControls();
}
function bagTeamDialog(title){
  const dialog=document.createElement('dialog');dialog.className='bag-alignment-dialog bag-team-dialog';dialog.setAttribute('aria-label',title);
  const heading=document.createElement('h2');heading.textContent=title;dialog.append(heading);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());return dialog;
}
function openBagRosterPaste(){
  const dialog=bagTeamDialog('Paste a roster');
  const help=document.createElement('p');help.textContent='One name per line. Each starts with quantity 1; you can change quantities in the roster.';
  const input=document.createElement('textarea');input.rows=10;input.setAttribute('aria-label','Roster names, one per line');
  const note=document.createElement('p');note.setAttribute('role','alert');
  const actions=document.createElement('div');actions.className='bag-alignment-actions';
  const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();
  const add=document.createElement('button');add.textContent='Add names';add.onclick=()=>{
    const names=input.value.split(/\r?\n/).map(name=>name.trim()).filter(Boolean),b=bagState();
    const existing=b.roster.filter(row=>row.name.trim());
    if(!names.length){note.textContent='Paste at least one name.';return;}
    if(names.some(name=>name.length>32)){note.textContent='A name exceeds 32 characters. Shorten it before adding; no names have been changed.';return;}
    if(existing.length+names.length>100){note.textContent='A team order can contain up to 100 names.';return;}
    b.activeRoster=existing.length;b.roster=[...existing,...names.map(name=>({name,quantity:1}))];renderBagTeam();scheduleBagTag();dialog.close();
  };actions.append(cancel,add);dialog.append(help,input,note,actions);dialog.showModal();input.focus();
}
async function reviewBagTeam(){
  if(!bagReady()||bagState().orderMode!=='team')return;
  clearTimeout(bagTimer);buildBagTag();if(bagState().error)return;
  const dialog=bagTeamDialog('Review all tags');
  const status=document.createElement('p');status.setAttribute('role','status');
  const close=document.createElement('button');close.textContent='Back to editor';close.onclick=()=>dialog.close();
  const grid=document.createElement('div');grid.className='bag-team-review-grid';dialog.append(status,close,grid);dialog.showModal();
  // Use a separate scene/camera and the already built shared geometry. The live
  // editor, selection and saved camera stay unchanged while thumbnails render.
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x616775,1.1));
  const group=bagView.group.clone();group.rotation.set(0,0,0);group.children.filter(child=>child.userData.bagName).forEach(child=>group.remove(child));scene.add(group);
  const camera=new THREE.PerspectiveCamera(34,1,0.1,1000),d=bagDimensions();camera.position.set(0,0,Math.max(d.heightMm,d.widthMm)/(2*Math.tan(17*Math.PI/180)*.85));camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(320,320);renderer.outputEncoding=THREE.sRGBEncoding;
  try{
    const rows=bagState().roster.map(row=>({...row})),layout=bagView.nameLayout;
    for(let index=0;index<rows.length&&dialog.open;index++){
      const row=rows[index],result=bagNameMesh(row.name,layout.textX,layout.textY),mesh=result.mesh;
      if(mesh){mesh.position.x=-layout.centerX*layout.fitWidth;mesh.position.y=-layout.centerY*layout.fitWidth;mesh.scale.x=mesh.scale.y=layout.fitWidth;group.add(mesh);}
      renderer.render(scene,camera);
      const card=document.createElement('button');card.className='bag-team-review-card';card.type='button';card.setAttribute('aria-label',`Edit ${row.name}`);
      const image=document.createElement('img');image.src=renderer.domElement.toDataURL('image/png');image.alt=`Front view of ${row.name}`;
      const label=document.createElement('span');label.textContent=`${row.name} · Qty ${row.quantity}`;card.append(image,label);
      if(result.small){const warning=document.createElement('span');warning.className='bag-name-warning';warning.textContent='Small text — consider a shorter name';card.append(warning);}
      card.onclick=()=>{selectBagRoster(index);dialog.close();document.querySelectorAll('.bag-roster-row input[type=text]')[index]?.focus();};grid.append(card);
      if(mesh){group.remove(mesh);mesh.geometry.dispose();[].concat(mesh.material).forEach(m=>m.dispose());}
      status.textContent=`${index+1} of ${rows.length} names · ${bagTotalQuantity()} tags`;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }catch(error){status.textContent='Could not generate all previews. Return to the editor and try again.';console.error(error);}
  finally{renderer.dispose();renderer.forceContextLoss();}
}
function makeBagOrderEmailHtml(project){
  const b=project.config.bag,rows=bagOrderRows(b),d=project.config.dimensions;
  const roster=rows.map((row,index)=>`<tr><td style="padding:9px 12px;border-bottom:1px solid #ece6d8;">${index+1}</td><td style="padding:9px 12px;border-bottom:1px solid #ece6d8;">${escapeHtml(row.name)}</td><td style="padding:9px 12px;border-bottom:1px solid #ece6d8;text-align:right;">${row.quantity}</td></tr>`).join('');
  const images=rows.map((row,index)=>`<div style="margin:16px 0;padding:16px;border:1px solid #ded6c6;border-radius:10px;page-break-inside:avoid;"><h3 style="margin:0 0 12px;font-size:16px;">Tag ${index+1}: ${escapeHtml(row.name)} — Quantity ${row.quantity}</h3><img src="cid:bag-tag-${index+1}" alt="${escapeHtml(row.name)} front view" width="360" style="display:block;width:100%;max-width:360px;height:auto;" /></div>`).join('');
  return makeOrderEmailHtml({title:'Custom Bag Tag request',context:'Shopify checkout order started',logoTitle:'Uploaded logo',details:[
    ['Customer email',project.customerEmail||'Not provided'],['Design',project.name],['Uploaded file',project.source.fileName],
    ['Order type',b.orderMode==='team'?'Team order':'Single tag'],['Total tags',String(bagTotalQuantity(b))],['Roster entries',String(rows.length)],
    ['Usage',b.usage==='outdoor'?'Outdoor':'Indoor'],['Font',b.font],['Backing',b.resolvedBacking==='custom'?'Custom outline':'Circular'],
    ['Dimensions',`${Number(d.widthMm.toFixed(1))} × ${Number(d.heightMm.toFixed(1))} × 6 mm`],['Construction','4 mm backing; coloured logo areas and name +2 mm; black/white logo areas flat'],
  ],colourSections:[{title:'Tag colours',colours:[{label:'Backing',hex:b.baseColour},{label:'Name',hex:b.textColour}]},{title:'Logo colours',colours:b.palette.map((p,i)=>({label:`Colour ${i+1} — ${bagLogoColourIsRaised(p.colour)?'raised 2 mm':'flat'}`,hex:p.colour}))}],extraSections:`<h2 style="margin:24px 0 10px;font-size:16px;">Roster</h2><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="background:#f2eee4;"><th style="text-align:left;padding:9px 12px;">Tag</th><th style="text-align:left;padding:9px 12px;">Name on tag</th><th style="text-align:right;padding:9px 12px;">Quantity</th></tr></thead><tbody>${roster}</tbody></table><h2 style="margin:24px 0 10px;font-size:16px;">Individual tag designs</h2><p style="color:#69645b;font-size:13px;">Each front view below is also attached as a separate image. The numbered filenames match the roster.</p>${images}`});
}
async function captureBagOrderShots(b){
  const rows=bagOrderRows(b).map(row=>({...row})),shots=[],layout={...bagView.nameLayout};
  const scene=new THREE.Scene();scene.background=new THREE.Color('#222625');scene.add(new THREE.HemisphereLight(0xffffff,0x616775,1.1));
  const group=bagView.group.clone();group.rotation.set(0,0,0);group.children.filter(child=>child.userData.bagName).forEach(child=>group.remove(child));scene.add(group);
  const camera=new THREE.PerspectiveCamera(34,1,0.1,1000),d=bagDimensions();camera.position.set(0,0,Math.max(d.heightMm,d.widthMm)/(2*Math.tan(17*Math.PI/180)*.85));camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(640,640);renderer.outputEncoding=THREE.sRGBEncoding;
  try{
    for(let index=0;index<rows.length;index++){
      const row=rows[index],result=bagNameMesh(row.name,layout.textX,layout.textY,b),mesh=result.mesh;
      try{
        if(mesh){mesh.position.x=-layout.centerX*layout.fitWidth;mesh.position.y=-layout.centerY*layout.fitWidth;mesh.scale.x=mesh.scale.y=layout.fitWidth;group.add(mesh);}
        renderer.render(scene,camera);
        const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/jpeg',.88));
        if(!blob)throw Error(`Could not capture tag ${index+1}`);
        const slug=row.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'')||'name';
        const fileName=`tag-${String(index+1).padStart(3,'0')}-${slug}-qty-${row.quantity}.jpg`;
        shots.push({label:`Tag ${index+1}: ${row.name} (quantity ${row.quantity})`,fileName,blob,file:new File([blob],fileName,{type:'image/jpeg'})});
        setStatus(`Preparing tag ${index+1} of ${rows.length}`);
        await new Promise(resolve=>setTimeout(resolve,0));
      }finally{if(mesh){group.remove(mesh);mesh.geometry.dispose();[].concat(mesh.material).forEach(m=>m.dispose());}}
    }
  }finally{renderer.dispose();renderer.forceContextLoss();}
  return shots;
}
