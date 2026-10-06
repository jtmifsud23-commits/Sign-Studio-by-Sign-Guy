import { get, put } from '@vercel/blob';

// Mutable notification state must bypass the CDN and use conditional writes.
export const studioStore = {
  async read(pathname) {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Private record unavailable');
    return { value: await new Response(result.stream).json(), etag: result.blob.etag };
  },
  async create(pathname, value) {
    return put(pathname, JSON.stringify(value), {
      access: 'private', addRandomSuffix: false, allowOverwrite: false,
      contentType: 'application/json', cacheControlMaxAge: 60,
    });
  },
  async replace(pathname, value, etag) {
    return put(pathname, JSON.stringify(value), {
      access: 'private', addRandomSuffix: false, ifMatch: etag,
      contentType: 'application/json', cacheControlMaxAge: 60,
    });
  },
};

export async function createOnce(store, pathname, value, matches) {
  try {
    await store.create(pathname, value);
    return value;
  } catch (error) {
    // A simultaneous create can win. Never overwrite its contents.
    const existing = await store.read(pathname);
    if (!existing) throw error;
    if (!matches(existing.value)) throw new Error('Immutable record conflicts with this submission');
    return existing.value;
  }
}
