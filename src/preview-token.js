import { createHmac, timingSafeEqual } from 'node:crypto';

const previewPath = /^orders\/[a-z0-9_-]{8,96}\/renderScreenshot1-[^/]{1,180}$/i;
function signingKey(){
  const key=process.env.BLOB_READ_WRITE_TOKEN;
  if(!key)throw new Error('Preview signing is not configured');
  return key;
}
function signature(payload){return createHmac('sha256',signingKey()).update('sign-studio-preview-v1:'+payload).digest();}
export function createPreviewToken(pathname){
  if(!previewPath.test(pathname))throw new Error('Only the front preview can be shared');
  const payload=Buffer.from(pathname).toString('base64url');
  return `${payload}.${signature(payload).toString('base64url')}`;
}
export function readPreviewToken(token){
  if(typeof token!=='string'||token.length>800)return null;
  const parts=token.split('.');if(parts.length!==2)return null;
  const [payload,mac]=parts,expected=signature(payload),received=Buffer.from(mac,'base64url');
  if(expected.length!==received.length||!timingSafeEqual(expected,received))return null;
  const pathname=Buffer.from(payload,'base64url').toString();return previewPath.test(pathname)?pathname:null;
}
