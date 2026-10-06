// Run in a trusted environment with this project's Blob/Queue credentials.
// No credentials are accepted as command-line arguments or logged.
import { studioStore } from '../src/studio-storage.js';
import { jobPath, publishEmail, publishPayment } from '../src/order-notifications.js';

const [kind, id] = process.argv.slice(2);
if (!['email', 'payment'].includes(kind) || !/^[a-f0-9]{64}$/.test(id || '')) {
  console.error('Usage: node scripts/retry-studio-notification.mjs email|payment <64-character job/receipt ID>');
  process.exitCode = 1;
} else {
  const path = kind === 'email' ? jobPath(id) : `studio/paid-events/${id}.json`;
  if (!(await studioStore.read(path))) throw new Error('Notification record does not exist');
  const completePath = kind === 'email' ? path.replace('.json', '-state.json') : path.replace('.json', '-processed.json');
  const state = await studioStore.read(completePath);
  if (state?.value.status === 'sent' || state?.value.status === 'processed') console.log('Already completed; nothing queued.');
  else {
    await (kind === 'email' ? publishEmail : publishPayment)(id);
    console.log('Retry accepted. Queue idempotency may reuse an existing retained message.');
  }
}
