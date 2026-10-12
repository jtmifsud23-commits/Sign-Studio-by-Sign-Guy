const {chromium}=require('C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader']}),page=await browser.newPage({viewport:{width:1920,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('signGuyOnboardingDismissed','true'));await page.goto('http://127.0.0.1:8780/?product=locker&preview=framing-3');await page.waitForFunction(()=>typeof lockerView!=='undefined'&&lockerView?.face&&!lockerState().busy);await page.locator('#appLoading').waitFor({state:'hidden'});
 const measure=()=>page.evaluate(()=>{
  const v=lockerView,camera=v.camera;v.scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const extent=object=>{const box=new THREE.Box3().setFromObject(object),p=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])p.push(new THREE.Vector3(x,y,z).project(camera));return {left:Math.min(...p.map(p=>p.x)),right:Math.max(...p.map(p=>p.x)),top:Math.max(...p.map(p=>p.y)),bottom:Math.min(...p.map(p=>p.y)),near:Math.min(...p.map(p=>p.z)),far:Math.max(...p.map(p=>p.z))};};
  const canvas=document.querySelector('#lockerSignCanvas').getBoundingClientRect(),stage=els.stage.getBoundingClientRect(),controls=document.querySelector('.locker-camera-tools').getBoundingClientRect(),bar=els.mobileCommandBar.getBoundingClientRect();
  return {sign:extent(v.sign),text:extent(v.frontText),full:extent(v.group),target:v.framing.target,baseline:v.framing.baselineTarget,distance:v.framing.distance,canvasHeight:canvas.height,canvasBottom:canvas.bottom,controlsBottom:controls.bottom,stageBottom:stage.bottom,mobileBarTop:bar.height?bar.top:null};
 });
 const fits=e=>e.left>=-1.001&&e.right<=1.001&&e.top<=1.001&&e.bottom>=-1.001&&e.near>=-1&&e.far<=1;
 const report={sizes:[]};
 for(const [width,height] of [[1920,900],[1440,900],[1024,768],[768,1024],[390,844],[320,844]]){
  await page.setViewportSize({width,height});await page.locator('[data-locker-view=assembly]').click();await page.waitForTimeout(150);
  const standard=await measure();if(!fits(standard.full))throw Error('Full assembly clips at '+width+': '+JSON.stringify(standard));
  const oldHeight=height-(width<768?(width<400?145:135):145)-(width<768?(width<400?220:210):65)-80;
  await page.evaluate(()=>{lockerState().zoom=1.35;renderLockerView();});const zoomed=await measure();
  if(!fits(zoomed.sign)||!fits(zoomed.text))throw Error('Customization clips at 135% '+width+': '+JSON.stringify(zoomed));
  if(zoomed.target.y>=zoomed.baseline.y)throw Error('Zoom focus did not move toward the sign');
  await page.screenshot({path:path.join(__dirname,'locker-framing-135-'+width+'.png')});
  await page.evaluate(()=>{lockerState().zoom=2;renderLockerView();});const close=await measure();
  if(!fits(close.text))throw Error('Custom stick text clips at 200% '+width+': '+JSON.stringify(close.text));
  await page.evaluate(()=>{lockerState().zoom=.6;renderLockerView();});const distant=await measure();if(!fits(distant.full))throw Error('Assembly clips at 60% '+width);
  report.sizes.push({width,height,oldHeight,standard,zoomed,close,zoomOutFits:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-locker-view=front]').click();const front=await measure();if(!fits(front.sign))throw Error('Circle front clips');await page.locator('[data-locker-view=back]').click();const back=await measure();if(!fits(back.sign))throw Error('Circle back clips');report.circleViewsFit=true;
 await page.locator('[data-locker-view=assembly]').click();await page.locator('[data-locker-zoom="1.18"]').click();report.zoomButton=await page.evaluate(()=>lockerState().zoom===1.18);await page.locator('#lockerZoomReset').click();report.reset=await page.evaluate(()=>lockerState().zoom===1);
 report.errors=errors;fs.writeFileSync(path.join(__dirname,'locker-framing-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({sizes:report.sizes.map(s=>({width:s.width,canvasHeight:s.standard.canvasHeight,extraHeight:s.standard.canvasHeight-s.oldHeight,bottomGap:s.standard.stageBottom-s.standard.controlsBottom,focusY:s.zoomed.target.y})),circleViewsFit:report.circleViewsFit,zoomButton:report.zoomButton,reset:report.reset,errors},null,2));await browser.close();if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
