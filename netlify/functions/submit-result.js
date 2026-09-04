const { getStore } = require('@netlify/blobs');
const { openStore } = require('./_util');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.jobId || !body.name) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing jobId or name' })
      };
    }
    const store = openStore(getStore, 'talentscan-results');
    const key = body.jobId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    await store.setJSON(key, body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', detail: String(e && e.stack || e) })
    };
  }
};
