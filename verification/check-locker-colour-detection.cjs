const {chromium}=require('C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader']}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('signGuyOnboardingDismissed','true'));
 await page.goto('http://127.0.0.1:8780/?product=locker&preview=colours-12');await page.waitForFunction(()=>typeof lockerView!=='undefined'&&lockerView?.face&&!lockerState().busy);await page.locator('#appLoading').waitFor({state:'hidden'});
 const screenshot='data:image/png;base64,'+fs.readFileSync('C:/Users/johnm/AppData/Local/Temp/codex-clipboard-40bdba4c-b877-41e5-9fcd-6422d2aba7c3.png').toString('base64');
 // Recover only the displayed logo for a regression fixture. The original
 // upload was not attached, so this deliberately tests a smaller raster.
 const fixture=await page.evaluate(async dataUrl=>{
  const image=await loadImage(dataUrl),canvas=document.createElement('canvas');canvas.width=298;canvas.height=234;const ctx=canvas.getContext('2d');ctx.drawImage(image,288,158,298,234,0,0,298,234);
  const frame=ctx.getImageData(0,0,298,234);for(let i=0;i<frame.data.length;i+=4){const pixel=i/4;if(Math.hypot(frame.data[i]-255,frame.data[i+1]-87,frame.data[i+2]-127)<38||Math.hypot(pixel%298+288-436,Math.floor(pixel/298)+158-306)>200)frame.data[i+3]=0;}ctx.putImageData(frame,0,0);return canvas.toDataURL();
 },screenshot);
 const report={fixture:'Logo recovered from supplied screenshot; original upload unavailable'};
 await page.locator('#lockerLogoFile').setInputFiles({name:'pirates-regression.png',mimeType:'image/png',buffer:Buffer.from(fixture.split(',')[1],'base64')});await page.waitForFunction(()=>state.wizardStep==='edit'&&lockerUploadSession?.logo);
 report.logoColours=await page.evaluate(()=>lockerUploadSession.logoColours);console.log('Logo inks',report.logoColours);assert.equal(report.logoColours.length,4);
 await page.locator('[data-locker-circle-mode=place]').click();await page.evaluate(()=>{lockerUploadSession.edit.backing='#ff577f';lockerUploadSession.edit.scale=75;lockerUploadSession.edit.y=-.13;paintLockerCircleEditor();});
 await page.locator('#lockerAddText').click();await page.locator('#lockerBoxText').fill('U11 BOYS');await page.evaluate(()=>{Object.assign(lockerSelectedTextBox(),{colour:'#ffffff',y:.26,width:.48,height:.1});invalidateLockerEditorText(true);});
 await page.locator('#lockerAddText').click();await page.locator('#lockerBoxText').fill('GUELPH PIRATES BASEBALL 2026');await page.evaluate(()=>{Object.assign(lockerSelectedTextBox(),{colour:'#ffffff',y:.35,width:.4,height:.03});invalidateLockerEditorText(true);});
 await page.locator('[data-wizard-action=to-vector]').click();await page.waitForFunction(()=>state.wizardStep==='vector');
 report.initial=await page.evaluate(()=>({count:state.processed.colours.length,target:state.targetColorCount,natural:state.processed.naturalColourCount,colours:state.processed.colours.map(c=>c.hex)}));assert.equal(report.initial.count,5);assert.equal(report.initial.target,5);assert.equal(report.initial.natural,5);assert.ok(report.initial.colours.includes('#ff577f'));
 await page.waitForTimeout(400);await page.screenshot({path:path.join(__dirname,'locker-colour-detection-five.png')});
 await page.locator('[data-wizard-action=to-edit]').click();await page.waitForFunction(()=>state.wizardStep==='edit');
 await page.evaluate(()=>{lockerEditorTextBoxes()[1].colour='#00bbcc';invalidateLockerEditorText(true);});await page.locator('[data-wizard-action=to-vector]').click();await page.waitForFunction(()=>state.wizardStep==='vector');assert.equal(await page.evaluate(()=>state.processed.colours.length),6);assert.ok(await page.evaluate(()=>state.processed.colours.some(c=>c.hex==='#00bbcc')));report.newTextColourRetained=true;
 await page.locator('#mapColorCount').fill('5');await page.locator('#mapColorCount').dispatchEvent('change');await page.waitForFunction(()=>state.processed.colours.length===5&&state.targetColorCount===5&&!state.processingDirty);report.manualCountStillWorks=true;
 await page.locator('[data-wizard-action=to-edit]').click();await page.waitForFunction(()=>state.wizardStep==='edit');await page.evaluate(()=>{lockerUploadSession.edit.backing='#223355';lockerUploadSession.composed=null;paintLockerCircleEditor();});await page.locator('[data-wizard-action=to-vector]').click();await page.waitForFunction(()=>state.wizardStep==='vector');assert.equal(await page.evaluate(()=>state.targetColorCount),6);assert.ok(await page.evaluate(()=>state.processed.colours.some(c=>c.hex==='#223355')));report.changedBackgroundRecounts=true;
 await page.locator('#wizardClose').click();
 // Deliberate solid greys must survive, unlike greys found only on edges.
 const neutralFixture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=400;const ctx=c.getContext('2d');['#000000','#ffffff','#888888','#d0d0d0'].forEach((hex,i)=>{ctx.fillStyle=hex;ctx.fillRect(10+(i%2)*200,10+Math.floor(i/2)*200,180,180);});return c.toDataURL();});
 await page.locator('#lockerLogoFile').setInputFiles({name:'intentional-grey.png',mimeType:'image/png',buffer:Buffer.from(neutralFixture.split(',')[1],'base64')});await page.waitForFunction(()=>state.wizardStep==='edit'&&lockerUploadSession?.logo);assert.deepEqual(new Set(await page.evaluate(()=>lockerUploadSession.logoColours)),new Set(['#000000','#ffffff','#888888','#d0d0d0']));report.intentionalGreyRetained=true;await page.locator('#wizardClose').click();
 report.errors=errors;assert.equal(errors.length,0);fs.writeFileSync(path.join(__dirname,'locker-colour-detection-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
