const DEFAULT_SOURCE = 'Sign Studio';
const SIGN_STUDIO_TAGS = ['Sign Studio', 'Hype Chain Visualizer', 'mysignguy.ca'];
const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2025-10';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'A valid email is required.' });
    return;
  }

  const shopDomain = normalizeShopDomain(process.env.SHOPIFY_STORE_DOMAIN);
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!shopDomain || !adminToken) {
    res.status(500).json({ error: 'Shopify subscription credentials are not configured.' });
    return;
  }

  try {
    const existingCustomer = await findCustomerByEmail(shopDomain, adminToken, email);
    const customer = existingCustomer
      ? await updateExistingCustomer(shopDomain, adminToken, existingCustomer, email)
      : await createSubscribedCustomer(shopDomain, adminToken, email);

    res.status(200).json({
      ok: true,
      email,
      source: normalizeSource(req.body?.source),
      customerId: customer?.id || existingCustomer?.id || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not subscribe this email in Shopify.' });
  }
}

async function findCustomerByEmail(shopDomain, adminToken, email) {
  const query = `
    query FindSignStudioCustomer($query: String!) {
      customers(first: 1, query: $query) {
        nodes {
          id
          email
          tags
          emailMarketingConsent {
            marketingState
          }
        }
      }
    }
  `;
  const data = await shopifyGraphql(shopDomain, adminToken, query, {
    query: `email:${quoteShopifySearchValue(email)}`,
  });
  return data?.customers?.nodes?.[0] || null;
}

async function updateExistingCustomer(shopDomain, adminToken, customer, email) {
  const updatedCustomer = await updateCustomerTags(shopDomain, adminToken, customer);
  const marketingState = customer.emailMarketingConsent?.marketingState;
  if (marketingState === 'SUBSCRIBED') return updatedCustomer || customer;
  return updateEmailMarketingConsent(shopDomain, adminToken, customer.id, email);
}

async function updateCustomerTags(shopDomain, adminToken, customer) {
  const tags = [...new Set([...(customer.tags || []), ...SIGN_STUDIO_TAGS])];
  const mutation = `
    mutation TagSignStudioCustomer($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          email
          tags
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await shopifyGraphql(shopDomain, adminToken, mutation, {
    input: { id: customer.id, tags },
  });
  const payload = data?.customerUpdate;
  throwOnUserErrors(payload?.userErrors);
  return payload?.customer || customer;
}

async function updateEmailMarketingConsent(shopDomain, adminToken, customerId, email) {
  const mutation = `
    mutation SubscribeSignStudioCustomer($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) {
        customer {
          id
          email
          emailMarketingConsent {
            marketingState
            marketingOptInLevel
            consentUpdatedAt
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await shopifyGraphql(shopDomain, adminToken, mutation, {
    input: {
      customerId,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
        consentUpdatedAt: new Date().toISOString(),
      },
    },
  });
  const payload = data?.customerEmailMarketingConsentUpdate;
  throwOnUserErrors(payload?.userErrors);
  return payload?.customer || { id: customerId, email };
}

async function createSubscribedCustomer(shopDomain, adminToken, email) {
  const mutation = `
    mutation CreateSignStudioSubscriber($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          tags
          emailMarketingConsent {
            marketingState
            marketingOptInLevel
            consentUpdatedAt
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await shopifyGraphql(shopDomain, adminToken, mutation, {
    input: {
      email,
      tags: SIGN_STUDIO_TAGS,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
        consentUpdatedAt: new Date().toISOString(),
      },
    },
  });
  const payload = data?.customerCreate;
  const duplicateError = (payload?.userErrors || []).some((error) => /already|taken|exists/i.test(error.message || ''));
  if (duplicateError) {
    const customer = await findCustomerByEmail(shopDomain, adminToken, email);
    if (customer) return updateExistingCustomer(shopDomain, adminToken, customer, email);
  }
  throwOnUserErrors(payload?.userErrors);
  return payload?.customer;
}

async function shopifyGraphql(shopDomain, adminToken, query, variables) {
  const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.errors?.length) {
    const detail = json.errors?.map((error) => error.message).join('; ') || response.statusText;
    throw new Error(`Shopify Admin API error: ${detail}`);
  }
  return json.data;
}

function throwOnUserErrors(userErrors = []) {
  if (!userErrors.length) return;
  throw new Error(userErrors.map((error) => error.message).join('; '));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSource(value) {
  return String(value || DEFAULT_SOURCE).trim() || DEFAULT_SOURCE;
}

function normalizeShopDomain(value) {
  return String(value || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function quoteShopifySearchValue(value) {
  return `"${String(value).replace(/["\\]/g, '\\$&')}"`;
}
