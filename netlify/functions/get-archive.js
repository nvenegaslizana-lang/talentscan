const { getStore } = require('@netlify/blobs');
const { openStore } = require('./_util');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  const recruiterId = event.queryStringParameters && event.queryStringParameters.recruiterId;
  const recruiterKey = event.queryStringParameters && event.queryStringParameters.recruiterKey;
  if (!recruiterId || !recruiterKey) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing recruiterId or recruiterKey' })
    };
  }
  try {
    const store = openStore(getStore, 'talentscan-archive');
    const data = await store.get(recruiterId, { type: 'json' });
    if (!data || data.recruiterKey !== recruiterKey) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archive: data.archive || [] })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
