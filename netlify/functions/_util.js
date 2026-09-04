function blobOptions() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  return (siteID && token) ? { siteID, token } : undefined;
}

function openStore(getStore, name) {
  const opts = blobOptions();
  return opts ? getStore(name, opts) : getStore(name);
}

module.exports = { blobOptions, openStore };
