import { get } from '@vercel/blob';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { readPreviewToken } from '../src/preview-token.js';

export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  try{
    const pathname=readPreviewToken(req.query?.token);
    if(!pathname)return res.status(404).end();
    const result=await get(pathname,{access:'private'});
    if(!result||result.statusCode!==200||!result.stream)return res.status(404).end();
    const type=result.blob?.contentType;
    if(!['image/png','image/jpeg','image/webp'].includes(type))return res.status(404).end();
    res.setHeader('Content-Type',type);
    res.setHeader('Content-Disposition','inline; filename="design-preview.png"');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','private, max-age=3600');
    res.setHeader('Referrer-Policy','no-referrer');
    if(req.method==='HEAD'){await result.stream.cancel();return res.status(200).end();}
    await pipeline(Readable.fromWeb(result.stream),res);
  }catch(error){if(!res.headersSent)res.status(500).end();else res.end();}
}
