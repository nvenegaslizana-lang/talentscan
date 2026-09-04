const { getStore } = require('@netlify/blobs');
const { openStore } = require('./_util');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { jobId, readKey } = body;
    if (!jobId || !readKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing jobId or readKey' })
      };
    }
    const metaStore = openStore(getStore, 'talentscan-meta');
    await metaStore.setJSON(jobId, { readKey, createdAt: Date.now() });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
