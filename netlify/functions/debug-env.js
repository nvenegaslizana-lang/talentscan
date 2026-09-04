exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hasSiteId: !!process.env.BLOBS_SITE_ID,
      hasToken: !!process.env.BLOBS_TOKEN,
      siteIdLen: (process.env.BLOBS_SITE_ID || '').length,
      tokenLen: (process.env.BLOBS_TOKEN || '').length,
      blobKeys: Object.keys(process.env).filter((k) => k.toUpperCase().includes('BLOB')),
      netlifyKeys: Object.keys(process.env).filter((k) => k.toUpperCase().includes('NETLIFY') || k.toUpperCase().includes('SITE'))
    })
  };
};
