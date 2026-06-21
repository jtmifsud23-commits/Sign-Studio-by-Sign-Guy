import { uploadPresigned } from '@vercel/blob/client';

globalThis.SignStudioPrivateBlob = Object.freeze({
  upload: uploadPresigned,
});
