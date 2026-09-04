const { getStore } = require('@netlify/blobs');
const { openStore } = require('./_util');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  const jobId = event.queryStringParameters && event.queryStringParameters.jobId;
  const readKey = event.queryStringParameters && event.queryStringParameters.readKey;
  if (!jobId || !readKey) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing jobId or readKey' })
    };
  }
  try {
    const metaStore = openStore(getStore, 'talentscan-meta');
    const meta = await metaStore.get(jobId, { type: 'json' });
    if (!meta || meta.readKey !== readKey) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
    const store = openStore(getStore, 'talentscan-results');
    const { blobs } = await store.list({ prefix: jobId + '/' });
    const results = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: results.filter(Boolean) })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', detail: String(e && e.stack || e) })
    };
  }
};
