import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual shared LED/Plaque save path without rebuilding 3D geometry.
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const save = source.slice(source.indexOf('async function saveProjectFile()'), source.indexOf('async function placeOrderRequest()'));
const download = source.slice(source.indexOf('function downloadProjectPayload('), source.indexOf('async function uploadProjectFolder('));

test('LED and Plaque saves preserve customer designs and reserve file export for admins, locally and deployed', async () => {
  for (const productType of ['led', 'plaque']) {
    for (const local of [true, false]) {
      for (const isAdmin of [false, true]) {
        const project = { id: 'saved-design', name: 'Save verification', source: { dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' } };
        const stored = [], uploaded = [], downloads = [];
        const context = vm.createContext({
          Blob, console,
          state: { productType, isAdmin, processed: {}, artwork: {}, customerEmail: 'studio-test@example.invalid' },
          els: { saveProject: {}, projectNote: {} },
          isLocalTesting: () => local,
          buildSignGuyProject: async () => project,
          saveProjectRecord: async value => stored.push(value),
          uploadProjectFolder: async value => uploaded.push(value),
          refreshProjectLog: async () => {},
          downloadBlob: (blob, filename) => downloads.push({ blob, filename }),
          projectFileBaseName: value => value.name,
          setStatus: () => {}, updateProjectControls: () => {},
          queueEmailMarketingSubscription: () => {}, trackSignStudioEvent: () => {},
        });
        vm.runInContext(save + '\n' + download, context);
        await vm.runInContext('saveProjectFile()', context);
        assert.equal(stored.length, 1);
        assert.equal(stored[0], project);
        assert.equal(uploaded.length, local ? 0 : 1);
        assert.equal(downloads.length, isAdmin ? 1 : 0, `${productType}: local=${local}, admin=${isAdmin}`);
        if (isAdmin) {
          assert.match(downloads[0].filename, /\.SignGuy$/);
          assert.deepEqual(JSON.parse(await downloads[0].blob.text()), project);
        }
        assert.match(context.els.projectNote.textContent, /saved|downloaded/i);
      }
    }
  }
});
