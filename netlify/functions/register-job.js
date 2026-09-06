const { getStore } = require('@netlify/blobs');
const { openStore } = require('./_util');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { jobId, readKey, job, candidates } = body;
    if (!jobId || !readKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing jobId or readKey' })
      };
    }
    const metaStore = openStore(getStore, 'talentscan-meta');
    const existing = await metaStore.get(jobId, { type: 'json' });
    if (existing && existing.readKey !== readKey) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
    const merged = {
      readKey,
      job: job !== undefined ? job : (existing ? existing.job : {}),
      candidates: candidates !== undefined ? candidates : (existing ? existing.candidates : []),
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    await metaStore.setJSON(jobId, merged);
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
