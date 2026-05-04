export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const configuredPassword = process.env.ADMIN_PASSWORD || '77\\r(~68dKTE';
    if (!configuredPassword) {
      res.status(503).json({ error: 'Admin login is not configured.' });
      return;
    }

    const body = await readJsonBody(req);
    if (String(body.password || '') !== configuredPassword) {
      res.status(401).json({ error: 'Incorrect admin password.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not process admin login.' });
  }
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 4096) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
