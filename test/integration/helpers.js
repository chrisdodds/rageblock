// Shared test helpers that match actual shared.js implementations
// These are copied from shared.js for integration testing

export const STORAGE_KEYS = {
  BLOCKED_SITES: 'blockedSites',
  ALLOWED_SITES: 'allowedSites',
  TEMP_UNBLOCKS: 'tempUnblocks',
  BYPASS_HISTORY: 'bypassHistory',
  BLOCK_HISTORY: 'blockHistory',
  LAST_REFLECTION: 'lastReflection'
};

export async function addBlock(site) {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BLOCK_HISTORY]: []
  });

  const blockHistory = data[STORAGE_KEYS.BLOCK_HISTORY] || [];

  blockHistory.push({
    site,
    timestamp: Date.now()
  });

  if (blockHistory.length > 100) {
    blockHistory.shift();
  }

  await browser.storage.local.set({
    [STORAGE_KEYS.BLOCK_HISTORY]: blockHistory
  });
}

export async function getRecentBlockCount() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BLOCK_HISTORY]: []
  });

  const blockHistory = data[STORAGE_KEYS.BLOCK_HISTORY] || [];
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return blockHistory.filter(b => b.timestamp > weekAgo).length;
}

export async function addBypass(site, minutes) {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.TEMP_UNBLOCKS]: {},
    [STORAGE_KEYS.BYPASS_HISTORY]: []
  });

  const tempUnblocks = data[STORAGE_KEYS.TEMP_UNBLOCKS] || {};
  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];

  const expiresAt = Date.now() + (minutes * 60 * 1000);
  tempUnblocks[site] = expiresAt;

  bypassHistory.push({
    site,
    timestamp: Date.now(),
    duration: minutes
  });

  if (bypassHistory.length > 100) {
    bypassHistory.shift();
  }

  await browser.storage.local.set({
    [STORAGE_KEYS.TEMP_UNBLOCKS]: tempUnblocks,
    [STORAGE_KEYS.BYPASS_HISTORY]: bypassHistory
  });
}

export async function getRecentBypassCount() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BYPASS_HISTORY]: []
  });

  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return bypassHistory.filter(b => b.timestamp > weekAgo).length;
}

export function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, "");
}

export function isHostnameBlocked(hostname, list) {
  return list.some(
    (site) => hostname === site || hostname.endsWith("." + site)
  );
}

export function isTempUnblocked(hostname, tempUnblocks) {
  return tempUnblocks[hostname] && tempUnblocks[hostname] > Date.now();
}

export async function shouldShowReflection() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BYPASS_HISTORY]: [],
    [STORAGE_KEYS.LAST_REFLECTION]: 0
  });

  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];
  const lastReflection = data[STORAGE_KEYS.LAST_REFLECTION] || 0;
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

  if (now - lastReflection < 7 * 24 * 60 * 60 * 1000) {
    return false;
  }

  const recentBypasses = bypassHistory.filter(b => b.timestamp > weekAgo);

  if (recentBypasses.length >= 5) {
    await browser.storage.local.set({ [STORAGE_KEYS.LAST_REFLECTION]: now });
    const days = Math.floor((now - recentBypasses[0].timestamp) / (24 * 60 * 60 * 1000));
    return {
      count: recentBypasses.length,
      days: Math.max(days, 1)
    };
  }

  return false;
}

