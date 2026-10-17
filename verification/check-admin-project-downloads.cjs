const {chromium}=require('C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const fixture=file=>JSON.parse(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),downloads=[],errors=[],report=[];
 page.on('download',d=>downloads.push(d));page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{localStorage.setItem('signGuyOnboardingDismissed','true');localStorage.setItem('signGuyCustomerEmail','studio-test@example.invalid');});
 try{
  await page.goto('http://127.0.0.1:8782/?product=coaster');await page.waitForFunction(()=>state.studioInitialized&&coasterView?.holder);await page.locator('#appLoading').waitFor({state:'hidden'});
  await page.evaluate(source=>{queueEmailMarketingSubscription=()=>{};window.__simpleSource=source;},fixture('verification/coaster-review.SignGuy').source);
  const cases=[['coaster','verification/coaster-review.SignGuy'],['locker','verification/coaster-review.SignGuy'],['plaque','assets/plaque/default-3d-plaque.SignGuy'],['classic','assets/hype-chain/default-hype-chain.SignGuy'],['spinner','assets/hype-chain/default-hype-chain.SignGuy'],['bag',null]];
  for(const [product,file]of cases){
   if(process.argv[2]&&product!==process.argv[2])continue;
   console.log('Checking',product);
   const project=file?fixture(file):fixture('verification/coaster-review.SignGuy');project.customerEmail='studio-test@example.invalid';project.name='Save restriction verification '+product;
   await page.evaluate(async({product,project})=>{
    if(product==='led')selectProductType('led');
    if(product==='locker'){await restoreLockerProject({type:'SignGuy.LockerSignStudio',version:PROJECT_FILE_VERSION,id:'save-restriction-locker',name:project.name,customerEmail:state.customerEmail,source:project.source,config:{locker:{...LOCKER_SIGN_DEFAULTS,palette:[],isExample:false}}});}
    else if(product==='bag'){
     await restoreBagProject({type:'SignGuy.BagTagStudio',version:PROJECT_FILE_VERSION,id:'save-restriction-bag',name:'Save restriction verification bag',customerEmail:state.customerEmail,source:project.source,config:{bag:{...BAG_TAG_DEFAULTS,backing:'circle',palette:[],roster:[],text:'SAVE TEST'}}});
    }else{if(['led','plaque'].includes(product))project.source=window.__simpleSource;if(product==='spinner')project.config.hype.variant='spinner';await restoreSignGuyProject(project);}
    state.isAdmin=false;renderAdminMode();
   },{product,project});
   await page.waitForFunction(()=>!els.saveProject.disabled,null,{timeout:60000});
   assert.equal(await page.locator('#openProject').isVisible(),false,product+' import hidden');
   assert.equal(await page.locator('#projectFileInput').isVisible(),false);
   assert.equal(await page.locator('#saveProject').getAttribute('aria-label'),'Save design');
   let count=downloads.length;await page.evaluate(()=>saveProjectFile());await page.waitForFunction(()=>!els.saveProject.disabled&&/saved/i.test(els.projectNote.textContent));
   assert.equal(downloads.length,count,product+' public save must not download');
   const saved=await page.evaluate(async()=>{await refreshProjectLog({forcePreviews:true});return (await getProjectRecords({includePreviews:true}))[0];});assert.ok(saved,product+' persisted');
   await page.evaluate(async saved=>{await restoreSignGuyProject(saved);},saved);await page.waitForFunction(()=>!els.saveProject.disabled);
   assert.equal(await page.evaluate(()=>state.isAdmin),false);
   await page.evaluate(()=>{state.isAdmin=true;renderAdminMode();});assert.equal(await page.locator('#openProject').getAttribute('hidden'),null);
   const event=page.waitForEvent('download');await page.evaluate(()=>saveProjectFile());const download=await event;assert.match(download.suggestedFilename(),/\.SignGuy$/);await page.waitForFunction(()=>!els.saveProject.disabled);
   const contents=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(contents.type,saved.type);assert.equal(contents.type,{'coaster':'SignGuy.CoasterStudio','locker':'SignGuy.LockerSignStudio','led':'SignGuy.LightboxStudio','plaque':'SignGuy.WallPlaqueStudio','classic':'SignGuy.HypeChainStudio','spinner':'SignGuy.HypeChainStudio','bag':'SignGuy.BagTagStudio'}[product]);assert.ok(contents.source.dataUrl);
   await page.evaluate(()=>logoutAdmin());assert.equal(await page.locator('#openProject').isVisible(),false);
   count=downloads.length;const denied=await page.evaluate(()=>[
    downloadProjectPayload({name:'forbidden'}),
    downloadBlob(new Blob(['{}']),'test.SiGnGuY','application/json'),
    downloadBlob(new Blob(['{}'],{type:'application/x-signguy+json'}),'test.json','application/json'),
    downloadBlob(new Blob(['{}']),'test.json','application/x-signguy+json; charset=utf-8')
   ]);assert.deepEqual(denied,[false,false,false,false]);await page.waitForTimeout(100);assert.equal(downloads.length,count);
   report.push({product,publicSavePersistsAndRestores:true,publicDownloads:0,adminExport:contents.type,logoutBlocksExport:true});console.log('Passed',product);
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>openMobileControlSheet());assert.equal(await page.locator('#mobileSaveProject').getAttribute('aria-label'),'Save design');
  const before=downloads.length;await page.evaluate(()=>saveProjectFile());assert.equal(downloads.length,before);assert.equal(await page.locator('#openProject').isVisible(),false);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'admin-project-downloads-results.json'),JSON.stringify({build:'3.6.2',products:report,mobilePublicSaveNoDownload:true,errors},null,2));console.log(JSON.stringify(report,null,2));
 }catch(e){await page.screenshot({path:path.join(__dirname,'admin-project-downloads-failure.png')});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
