import { QueueClient } from '@vercel/queue';
import { deliverEmail } from '../../src/order-notifications.js';
import { sendOrderMail } from '../../src/order-email.js';

const queue = new QueueClient({ region: 'iad1' });
export default queue.handleNodeCallback(
  async ({ jobId }) => { await deliverEmail(jobId, { sendMail: sendOrderMail }); },
  {
    visibilityTimeoutSeconds: 300,
    retry: (_error, metadata) => ({ afterSeconds: Math.min(3600, 30 * 2 ** Math.min(metadata.deliveryCount, 7)) }),
  },
);
