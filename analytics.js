(() => {
  const loader = document.currentScript;
  const containerId = String(loader?.dataset?.gtmId || '').trim().toUpperCase();
  const validContainerId = /^GTM-[A-Z0-9]+$/.test(containerId);
  const blockedParameterKeys = new Set([
    'address',
    'customer',
    'customer_email',
    'design_name',
    'email',
    'file_name',
    'phone',
    'user_id',
  ]);
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

  window.dataLayer = window.dataLayer || [];

  function sanitizeValue(value, depth = 0) {
    if (depth > 5 || value == null) return undefined;
    if (typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || emailPattern.test(trimmed)) return undefined;
      return trimmed.slice(0, 100);
    }
    if (Array.isArray(value)) {
      return value
        .slice(0, 20)
        .map((item) => sanitizeValue(item, depth + 1))
        .filter((item) => item !== undefined);
    }
    if (typeof value !== 'object') return undefined;

    return Object.entries(value).reduce((result, [key, item]) => {
      if (blockedParameterKeys.has(String(key).toLowerCase())) return result;
      const sanitized = sanitizeValue(item, depth + 1);
      if (sanitized !== undefined) result[key] = sanitized;
      return result;
    }, {});
  }

  function track(eventName, parameters = {}) {
    const normalizedEventName = String(eventName || '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(normalizedEventName)) return false;
    const sanitizedParameters = sanitizeValue(parameters) || {};
    if (sanitizedParameters.ecommerce) window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: normalizedEventName,
      event_source: 'sign_studio',
      ...sanitizedParameters,
    });
    return true;
  }

  window.SignStudioAnalytics = Object.freeze({
    configured: validContainerId,
    containerId: validContainerId ? containerId : '',
    track,
  });

  if (!validContainerId) {
    console.info('Sign Studio analytics is ready but inactive. Add the GTM container ID in index.html.');
    return;
  }

  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
})();
