import { createHash } from 'node:crypto';
import { get } from '@vercel/blob';
import { createOnce, studioStore } from './studio-storage.js';

const PRODUCTS = {
  'SignGuy.LightboxStudio': 'LED Sign',
  'SignGuy.WallPlaqueStudio': '3D Plaque',
  'SignGuy.HypeChainStudio': 'Hype Chain',
  'SignGuy.BagTagStudio': 'Bag Tag',
};
export const validDesignId = id => typeof id === 'string' && /^[a-z0-9_-]{8,96}$/i.test(id);
export function designPath(id) {
  if (!validDesignId(id)) throw new Error('Invalid Studio design ID');
  return `studio/designs/${id}.json`;
}
export async function readUploadedProject(file) {
  const result = await get(file.pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) throw new Error('Uploaded project unavailable');
  return new Response(result.stream).json();
}
export async function saveDesignRecord(submission, {
  store = studioStore, readProject = readUploadedProject, previewUrl = null, now = () => new Date().toISOString(),
} = {}) {
  const project = await readProject(submission.files.find(file => file.kind === 'projectFile'));
  const product = PRODUCTS[project?.type];
  if (!product || !project.config || typeof project.config !== 'object' || Array.isArray(project.config)) {
    throw new Error('Unsupported or incomplete SignGuy project');
  }
  if (String(project.customerEmail || '').trim().toLowerCase() !== submission.customerEmail) {
    throw new Error('Project customer does not match the submission');
  }
  const snapshotHash = createHash('sha256').update(JSON.stringify({ submission, project })).digest('hex');
  const record = {
    schemaVersion: 1, designId: submission.orderId, snapshotHash, createdAt: now(),
    submissionStatus: submission.sendOrderEmail ? 'checkout_pending' : 'saved',
    projectId: String(project.id || ''), name: String(project.name || ''),
    customerEmail: submission.customerEmail, product, projectType: project.type,
    settings: project.config,
    artwork: { filename: project.source?.fileName || '', type: project.source?.artworkType || '' },
    preview: { url: previewUrl, dimensions: project.preview?.dimensions || null, colours: project.preview?.colours || [] },
    files: submission.files,
    submissionEmail: { subject: submission.subject, text: submission.message, html: submission.messageHtml },
  };
  return createOnce(store, designPath(record.designId), record, existing => existing.snapshotHash === snapshotHash);
}
