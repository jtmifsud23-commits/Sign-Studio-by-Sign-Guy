const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const source=fs.readFileSync('api/save-project.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export default async function','async function');
const context=vm.createContext({console,Readable,URL,Buffer,get:async()=>({statusCode:200,stream:new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2,3]));c.close();}}),blob:{contentType:'image/jpeg'}})});
vm.runInContext(source,context);
(async()=>{
 const files=[1,2,3,4,100].map(n=>({kind:'renderScreenshot'+n,filename:'tag-'+n+'.jpg',url:'https://test.private.blob.vercel-storage.com/orders/test-order-123/renderScreenshot'+n+'-tag.jpg',pathname:'orders/test-order-123/renderScreenshot'+n+'-tag.jpg',contentType:'image/jpeg'}));
 for(const f of files)context.validateBlobFile(f,'test-order-123');
 const attachments=await context.collectAttachments(files);
 assert.deepEqual(Array.from(attachments,a=>a.cid),['bag-tag-1','bag-tag-2','bag-tag-3','bag-tag-4','bag-tag-100']);
 assert(attachments.every(a=>a.contentDisposition==='attachment'));
 assert.throws(()=>context.validateBlobFile({...files[0],kind:'renderScreenshot101'},'test-order-123'));
 const upload=fs.readFileSync('api/blob-upload.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export default async function','async function');const uploadContext=vm.createContext({console});vm.runInContext(upload,uploadContext);
 for(const n of [1,4,100])assert(uploadContext.validateUploadRequest('orders/test-order-123/renderScreenshot'+n+'-tag.jpg',JSON.stringify({orderId:'test-order-123',kind:'renderScreenshot'+n})).rule);
 assert.throws(()=>uploadContext.validateUploadRequest('orders/test-order-123/renderScreenshot101-tag.jpg','{}'));
 console.log('Passed: all roster attachments, matching image CIDs, upload slots 1–100 and invalid-slot rejection');
})().catch(e=>{console.error(e);process.exit(1)});
