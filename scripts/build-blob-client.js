import { build } from 'esbuild';

await build({
  entryPoints: ['src/blob-upload-client.js'],
  outfile: 'blob-upload-client.js',
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
});
