import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { saveDesignRecord, designPath } from '../src/design-records.js';
import { validateCoasterProject } from '../src/coaster-project.js';
import { createSaveHandler } from '../api/save-project.js';
import { recordPaidOrder, jobPath } from '../src/order-notifications.js';
import { makeOrderEmail, sendOrderMail } from '../src/order-email.js';
const fixture=()=>JSON.parse(readFileSync(new URL('../verification/coaster-review.SignGuy',import.meta.url),'utf8'));
const designId='coaster-order-12345678';
const kinds=['projectFile','logo','finalArtworkPng','finalArtworkSvg','logoPreview','renderScreenshot1','renderScreenshot2','renderScreenshot3'];
const files=()=>kinds.map(kind=>({kind,pathname:`orders/${designId}/${kind}-test`,url:`https://store.private.blob.vercel-storage.com/orders/${designId}/${kind}-test`,filename:kind==='finalArtworkSvg'?'coaster-finished-circle.svg':kind==='finalArtworkPng'?'coaster-finished-circle.png':`${kind}.bin`,contentType:kind==='finalArtworkSvg'?'image/svg+xml':'image/png',size:100}));
const submission=()=>({orderId:designId,customerEmail:fixture().customerEmail,projectName:'coaster.SignGuy',sendOrderEmail:true,subject:'Coaster checkout started',message:'Custom coaster details',messageHtml:'<p>Original coaster submission</p>',files:files()});
function store(){const data=new Map();return {data,async read(p){return data.has(p)?{value:data.get(p),etag:'1'}:null;},async create(p,v){if(data.has(p))throw Error('exists');data.set(p,structuredClone(v));}};}
const response=()=>({setHeader(){},status(code){this.statusCode=code;return this;},json(body){this.body=body;}});
test('coaster save persists the complete production file set, remains unpaid, and plain save queues no email',async()=>{
 const storage=store(),project=fixture(),events=[],handler=createSaveHandler({previewToken:()=> 'preview-token',save:(input,options)=>saveDesignRecord(input,{...options,store:storage,readProject:async()=>project}),enqueue:async(record,event)=>events.push({record,event})});
 const res=response();await handler({method:'POST',body:submission()},res);assert.equal(res.statusCode,200);assert.equal(res.body.designId,designId);assert.equal(res.body.emailSent,false);assert.equal(events[0].event.kind,'submitted');
 const record=events[0].record;assert.equal(record.product,'Drink Coasters');assert.equal(record.submissionStatus,'checkout_pending');assert.equal(record.files.length,8);assert.deepEqual(record.settings,project.config);
 const pending=makeOrderEmail(record,{kind:'submitted'},'a'.repeat(64));assert.match(pending.text,/Payment has not been confirmed/);assert.doesNotMatch(pending.subject,/Payment confirmed/);
 const plain=response();await handler({method:'POST',body:{...submission(),orderId:'coaster-save-12345678',files:files().map(f=>({...f,pathname:f.pathname.replace(designId,'coaster-save-12345678'),url:f.url.replace(designId,'coaster-save-12345678')})),sendOrderEmail:false}},plain);assert.equal(plain.statusCode,200);assert.equal(plain.body.emailQueued,false);assert.equal(events.length,1);
});
test('coaster production validation rejects altered sizes, relief, extra colours, and missing finished files',async()=>{
 const project=fixture();validateCoasterProject(project);
 for(const change of [p=>p.config.dimensions.depthMm=5,p=>p.config.coaster.palette[0].height=2,p=>p.config.totalCoasters=5,p=>p.config.coaster.packs=0,p=>p.source.dataUrl='',p=>{p.config.coaster.palette=Array.from({length:8},(_,i)=>({colour:`#${(i*200000).toString(16).padStart(6,'0')}`,height:0}));p.config.coaster.backing=p.config.coaster.palette[0].colour;p.config.coaster.wizardEdit.textBoxes[0].colour='#abcdef';}]){const bad=structuredClone(project);change(bad);assert.throws(()=>validateCoasterProject(bad));}
 await assert.rejects(saveDesignRecord({...submission(),files:files().filter(f=>f.kind!=='finalArtworkSvg')},{store:store(),readProject:async()=>project}),/Finished coaster/);
});
test('paid coaster briefs use actual paid packs, retain text and exact colours, and never call them signs',async()=>{
 const storage=store(),record=await saveDesignRecord(submission(),{store:storage,readProject:async()=>fixture()}),jobs=[];
 const order={id:12345,name:'#COASTER-TEST',financial_status:'paid',line_items:[{id:1,variant_id:63132097249420,quantity:2,title:'Custom Drink Coaster',properties:[{name:'_Studio design ID',value:designId}]}]};
 await assert.rejects(recordPaidOrder({...order,financial_status:'pending'},'11a02c-d2.myshopify.com',{store:storage,publish:async()=>assert.fail('unpaid')}),/not paid/);
 await recordPaidOrder(order,'11a02c-d2.myshopify.com',{store:storage,publish:async id=>jobs.push(id)});assert.equal(jobs.length,1);const event=storage.data.get(jobPath(jobs[0])).event,mail=makeOrderEmail(record,event,jobs[0]);
 assert.match(mail.subject,/Payment confirmed/);assert.match(mail.text,/2 packs · 8 coasters/);assert.match(mail.text,/101.66 mm diameter × 4 mm/);assert.match(mail.text,/Text 1: CHAMPIONS\n2026/);assert.match(mail.text,/Text 1 font: Bebas Neue Bold/);assert.match(mail.html,/background-color:#00BBCC/);assert.match(mail.html,/coaster top/);assert.match(mail.html,/four-pack/);assert.match(mail.html,/holder view/);assert.match(mail.text,/finished circle SVG and PNG/);assert.doesNotMatch(mail.text,/2 signs|Shell colours|raised|roster/);
 assert.equal(storage.data.get(designPath(designId)).submissionStatus,'checkout_pending');
});
test('paid coaster attachment delivery preserves the final SVG, PNG and original upload bytes',async()=>{
 const project=fixture(),record=await saveDesignRecord(submission(),{store:store(),readProject:async()=>project}),contents=new Map(files().map(f=>[f.pathname,Buffer.from(f.kind==='finalArtworkSvg'?project.outputArtwork.svgText:f.kind==='logo'?'ORIGINAL SOURCE':'FINAL OR PREVIEW')]));let delivered;
 await sendOrderMail(record,{kind:'paid',orderName:'#TEST',lineItems:[{quantity:1}]},'f'.repeat(64),{readBlob:async p=>({statusCode:200,stream:new Response(contents.get(p)).body,blob:{contentType:files().find(f=>f.pathname===p).contentType}}),makeTransport:()=>({async sendMail(message){delivered=message;for(const a of message.attachments){const chunks=[];for await(const chunk of a.content)chunks.push(chunk);a.bytes=Buffer.concat(chunks);}},close(){}})});
 assert.equal(delivered.attachments.length,8);assert.equal(delivered.attachments.find(a=>a.filename==='coaster-finished-circle.svg').bytes.toString(),project.outputArtwork.svgText);assert.equal(delivered.attachments.find(a=>a.filename==='logo.bin').bytes.toString(),'ORIGINAL SOURCE');
});
