import { QueueClient } from '@vercel/queue';
import { processPaidReceipt } from '../../src/order-notifications.js';

const queue = new QueueClient({ region: 'iad1' });
export default queue.handleNodeCallback(
  async ({ receiptId }) => { await processPaidReceipt(receiptId); },
  {
    visibilityTimeoutSeconds: 300,
    retry: (_error, metadata) => ({ afterSeconds: Math.min(3600, 30 * 2 ** Math.min(metadata.deliveryCount, 7)) }),
  },
);
