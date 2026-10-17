const {chromium}=require('C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader']}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('signGuyOnboardingDismissed','true'));
 try{
 await page.goto('http://127.0.0.1:8782/?product=coaster');await page.waitForFunction(()=>state.studioInitialized&&coasterView?.group.children.length===4);await page.locator('#appLoading').waitFor({state:'hidden'});
 await page.evaluate(p=>restoreCoasterProject(p),JSON.parse(fs.readFileSync(path.join(__dirname,'coaster-review.SignGuy'),'utf8')));await page.locator('[data-coaster-view=pack]').click();
 const pose=await page.evaluate(()=>coasterView.group.children.map(d=>{d.updateMatrixWorld(true);const local=new THREE.Box3();d.children.forEach(mesh=>{mesh.geometry.computeBoundingBox();local.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix));});const world=new THREE.Box3().setFromObject(d),normal=new THREE.Vector3(0,0,1).applyQuaternion(d.quaternion);return {localSize:local.getSize(new THREE.Vector3()).toArray(),scale:d.scale.toArray(),position:d.position.toArray(),normal:normal.toArray(),bottom:world.min.y,top:world.max.y,visible:d.visible};}));
 for(const disk of pose){assert.ok(Math.abs(disk.localSize[0]-101.66)<.0001);assert.ok(Math.abs(disk.localSize[1]-101.66)<.0001);assert.ok(Math.abs(disk.localSize[2]-4)<.0001);assert.deepEqual(disk.scale,[1,1,1]);assert.ok(disk.visible);}
 assert.ok(pose[0].normal[2]>.98);assert.ok(Math.abs(pose[0].bottom)<.001);for(let i=1;i<4;i++){assert.ok(pose[i].normal[1]>.99999);assert.ok(Math.abs(pose[i].bottom-(i-1)*4)<.001);assert.ok(Math.abs(pose[i].top-i*4)<.001);}
 const responsive=[];
 for(const [width,height] of [[1440,1000],[1024,768],[768,900],[390,844],[320,700]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(400);await page.screenshot({path:path.join(__dirname,`coaster-stack-pack-${width}.png`)});
  const framing=await page.evaluate(()=>{const {group,camera}=coasterView;const projected=[];for(const disk of group.children)disk.traverse(mesh=>{const p=mesh.geometry?.attributes.position;if(!p)return;for(let i=0;i<p.count;i++){const point=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).project(camera);projected.push([point.x,point.y]);}});return {minX:Math.min(...projected.map(p=>p[0])),maxX:Math.max(...projected.map(p=>p[0])),minY:Math.min(...projected.map(p=>p[1])),maxY:Math.max(...projected.map(p=>p[1])),overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(framing.minX>=-1&&framing.maxX<=1&&framing.minY>=-1&&framing.maxY<=1);assert.equal(framing.overflow,false);responsive.push({width,height,...framing});
 }
 await page.setViewportSize({width:1440,height:1000});for(const view of ['top']){await page.locator(`[data-coaster-view=${view}]`).click();const pose=await page.evaluate(()=>coasterView.group.children.map(d=>({visible:d.visible,rotation:d.rotation.toArray().slice(0,3),position:d.position.toArray()})));assert.equal(pose.filter(d=>d.visible).length,1);assert.deepEqual(pose[0].rotation,[0,0,0]);assert.deepEqual(pose[0].position,[0,0,0]);}
 const shots=await page.evaluate(async()=>{const result=await captureCoasterShots();return result.map(s=>({label:s.label,size:s.blob.size}));});assert.equal(shots.length,2);assert.ok(shots.every(s=>s.size>1000));assert.deepEqual(errors,[]);
 const report={arrangement:'three stacked flat, one leaning against the stack',pose,responsive,shots,errors};fs.writeFileSync(path.join(__dirname,'coaster-stack-pack-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
