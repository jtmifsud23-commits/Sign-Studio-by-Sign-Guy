import test from 'node:test';
import assert from 'node:assert/strict';
import { issueAdminToken, verifyAdminToken } from '../src/admin-session.js';
import { saveDesignRecord } from '../src/design-records.js';
import { createSaveHandler, validateSubmission } from '../api/save-project.js';
import { makeOrderEmail, sendOrderMail } from '../src/order-email.js';
import { productionBrief } from '../src/order-email-layout.js';
import { validateUploadRequest } from '../api/blob-upload.js';

const id='locker-admin-design-12345678';
const project={type:'SignGuy.LockerSignStudio',id,name:'Team <Final>',customerEmail:'admin@example.com',source:{fileName:'original-logo.svg',artworkType:'svg',dataUrl:'data:image/svg+xml;base64,PHN2Zy8+'},outputArtwork:{pngDataUrl:'data:image/png;base64,AAA',svgText:'<svg>final logo and text outlines</svg>'},config:{locker:{style:'layered',text:'PLAYER NAME',font:'Bebas Neue Bold',stick:'#191b1e',glove:'#112233',textColour:'#ffffff',rings:'#fcd504',backing:'#191b1e',scale:100,x:0,y:0,palette:[{colour:'#ffffff',height:0},{colour:'#cc0011',height:6}],wizardEdit:{textBoxes:[{text:'COOL <GUYS>',font:'Bungee',colour:'#cc0011',width:.5,height:.1}]}},dimensions:{diameterMm:228.6,baseMm:4}},preview:{dimensions:{diameterMm:228.6,baseMm:4}}};
const files=['projectFile','logo','finalArtworkPng','finalArtworkSvg','logoPreview','renderScreenshot1','renderScreenshot2','renderScreenshot3'].map(kind=>({kind,pathname:`orders/${id}/${kind}-file`,url:`https://store.private.blob.vercel-storage.com/orders/${id}/${kind}-file`,filename:kind==='finalArtworkSvg'?'finished-circle.svg':kind==='finalArtworkPng'?'finished-circle.png':kind,contentType:kind==='finalArtworkSvg'?'image/svg+xml':'image/png',size:20}));
const submission={orderId:id,customerEmail:'admin@example.com',projectName:'final.SignGuy',sendOrderEmail:true,adminDesignPreview:true,files};
function memoryStore(){const data=new Map();return {data,async read(path){return data.has(path)?{value:data.get(path),etag:'1'}:null;},async create(path,value){if(data.has(path))throw Error('exists');data.set(path,structuredClone(value));}};}
const response=()=>({statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;}});

test('admin tokens reject tampering, expiry, future timestamps and a different signing key',()=>{
 const token=issueAdminToken({key:'test-key',now:1000});assert.ok(verifyAdminToken(token,{key:'test-key',now:2000}));assert.equal(verifyAdminToken(token+'x',{key:'test-key',now:2000}),false);assert.equal(verifyAdminToken(token,{key:'other',now:2000}),false);assert.equal(verifyAdminToken(token,{key:'test-key',now:1000+8*60*60*1000}),false);assert.equal(verifyAdminToken(token,{key:'test-key',now:0}),false);
});
test('admin locker previews require authentication and all locker records require both finished files',async()=>{
 const store=memoryStore(),options={store,readProject:async()=>project};
 await assert.rejects(saveDesignRecord(submission,options),/Admin login/);assert.equal(store.data.size,0);
 await assert.rejects(saveDesignRecord({...submission,files:files.filter(f=>f.kind!=='finalArtworkSvg')},{...options,adminAuthorized:true}),/Finished circle/);assert.equal(store.data.size,0);
 const record=await saveDesignRecord(submission,{...options,adminAuthorized:true});assert.equal(record.product,'Locker Room Sign');assert.equal(record.submissionStatus,'admin_preview');assert.deepEqual(record.settings,project.config);assert.equal(record.files.length,8);assert.equal(validateSubmission(submission).adminDesignPreview,true);
});

test('public locker uploads retain path, type and size limits without requiring an admin token',()=>{
 for(const kind of ['finalArtworkPng','finalArtworkSvg']){
  const upload=validateUploadRequest(`orders/${id}/${kind}-finished-file`,JSON.stringify({orderId:id,kind}));assert.equal(upload.kind,kind);assert.equal(upload.rule.maximumSizeInBytes,12*1024*1024);
 }
 assert.throws(()=>validateUploadRequest(`orders/${id}/finalArtworkSvg-finished-file`,JSON.stringify({orderId:'another-design-123',kind:'finalArtworkSvg'})),/metadata/);
 assert.throws(()=>validateUploadRequest(`orders/${id}/unknown-finished-file`,JSON.stringify({orderId:id,kind:'unknown'})),/pathname/);
});

test('public locker saves and emails succeed without admin authentication and stay unpaid',async()=>{
 const publicSubmission={...submission};delete publicSubmission.adminDesignPreview;
 const store=memoryStore(),events=[],handler=createSaveHandler({previewToken:()=> 'signed-preview',save:(input,options)=>saveDesignRecord(input,{...options,store,readProject:async()=>project}),enqueue:async(record,event)=>events.push({record,event})});
 const accepted=response();await handler({method:'POST',body:publicSubmission,headers:{}},accepted);assert.equal(accepted.statusCode,200);assert.equal(accepted.body.emailQueued,true);assert.equal(events[0].event.kind,'locker_design');assert.equal(events[0].record.submissionStatus,'design_submitted');assert.equal(events[0].record.files.length,8);
 const mail=makeOrderEmail(events[0].record,events[0].event,'e'.repeat(64));assert.match(mail.subject,/Locker sign design submitted/);assert.match(mail.html,/DESIGN SUBMITTED — UNPAID/);assert.match(mail.text,/Payment has not been confirmed/);assert.match(mail.html,/background-color:#CC0011/);assert.match(mail.text,/COOL <GUYS>/);assert.match(mail.text,/finished circle SVG and PNG/);assert.doesNotMatch(mail.html,/ADMIN DESIGN PREVIEW|PAYMENT CONFIRMED|Shopify order ID:/);
 const saved=await saveDesignRecord({...publicSubmission,sendOrderEmail:false,orderId:id+'-saved'},{store,readProject:async()=>project});assert.equal(saved.submissionStatus,'saved');
 const missingStore=memoryStore();await assert.rejects(saveDesignRecord({...publicSubmission,files:files.filter(f=>f.kind!=='finalArtworkSvg')},{store:missingStore,readProject:async()=>project}),/Finished circle/);assert.equal(missingStore.data.size,0);
});
test('the save API checks its signed admin header and queues a distinct unpaid admin design email',async()=>{
 const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='unit-test-signing-secret';
 try{const store=memoryStore(),events=[],handler=createSaveHandler({previewToken:()=> 'signed-preview',save:(input,options)=>saveDesignRecord(input,{...options,store,readProject:async()=>project}),enqueue:async(record,event)=>events.push(event)});
 const denied=response();await handler({method:'POST',body:submission,headers:{}},denied);assert.equal(denied.statusCode,403);assert.equal(store.data.size,0);assert.equal(events.length,0);
 const accepted=response();await handler({method:'POST',body:submission,headers:{authorization:'Bearer '+issueAdminToken()}},accepted);assert.equal(accepted.statusCode,200);assert.equal(accepted.body.emailQueued,true);assert.equal(events[0].kind,'admin_design');assert.equal(events[0].lineItems[0].quantity,1);
 }finally{if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous;}
});
test('locker email uses the shared layout, actual swatches, added text and both final artwork attachments',()=>{
 const record={product:'Locker Room Sign',name:project.name,customerEmail:project.customerEmail,designId:id,settings:project.config,preview:project.preview,files},event={kind:'admin_design',lineItems:[{quantity:1,title:'Locker Room Sign'}]},brief=productionBrief(record,event),mail=makeOrderEmail(record,event,'a'.repeat(64));
 assert.equal(brief.colours.find(g=>g.title==='Hanger colours').items.find(i=>i.label==='Hanging rings').hex,'#FCD504');assert.match(mail.text,/Circle text 1: COOL <GUYS>/);assert.match(mail.text,/Circle text 1 font: Bungee/);assert.match(mail.html,/COOL &lt;GUYS&gt;/);assert.match(mail.html,/background-color:#CC0011/);assert.match(mail.html,/ADMIN DESIGN PREVIEW/);assert.doesNotMatch(mail.html,/PAYMENT CONFIRMED|<script>|Shopify order ID:/);assert.doesNotMatch(mail.text,/undefined|Payment confirmed/);assert.match(mail.text,/finished circle SVG and PNG/);assert.match(mail.html,/cid:uploaded-logo/);assert.match(mail.html,/<!--[\s\S]*\[if mso\]/);
 const paid=makeOrderEmail(record,{kind:'paid',shop:'11a02c-d2.myshopify.com',orderId:'12345',orderName:'#1234',lineItems:[{quantity:2}]},'b'.repeat(64));assert.match(paid.html,/PAYMENT CONFIRMED/);assert.match(paid.text,/2 signs/);assert.match(paid.text,/Stick text · both sides: PLAYER NAME/);
});
test('SMTP transport receives the standalone final SVG and PNG bytes, project, original and previews',async()=>{
 const contents=new Map(files.map(file=>[file.pathname,Buffer.from(file.kind==='finalArtworkSvg'?project.outputArtwork.svgText:file.kind==='finalArtworkPng'?'FINAL PNG BYTES':file.kind==='logo'?'ORIGINAL LOGO':'PROJECT OR PREVIEW')]));let delivered,closed=false;
 await sendOrderMail({product:'Locker Room Sign',name:project.name,customerEmail:project.customerEmail,designId:id,settings:project.config,preview:project.preview,files},{kind:'admin_design',lineItems:[{quantity:1}]},'c'.repeat(64),{readBlob:async pathname=>({statusCode:200,stream:new Response(contents.get(pathname)).body,blob:{contentType:files.find(f=>f.pathname===pathname).contentType}}),makeTransport:()=>({async sendMail(message){delivered=message;for(const attachment of message.attachments){const chunks=[];for await(const chunk of attachment.content)chunks.push(chunk);attachment.bytes=Buffer.concat(chunks);}},close(){closed=true;}})});
 assert.ok(closed);assert.equal(delivered.to,'Hey@MySignGuy.ca');assert.equal(delivered.attachments.length,8);assert.equal(delivered.attachments.find(a=>a.filename==='finished-circle.svg').bytes.toString(),project.outputArtwork.svgText);assert.equal(delivered.attachments.find(a=>a.filename==='finished-circle.png').contentDisposition,'attachment');assert.equal(delivered.attachments.find(a=>a.filename==='finished-circle.png').bytes.toString(),'FINAL PNG BYTES');
});
