// Shared utilities for the extension
// This file is loaded before other scripts to provide common functions

// Storage key constants
const STORAGE_KEYS = {
  BLOCKED_SITES: 'blockedSites',
  ALLOWED_SITES: 'allowedSites',
  TEMP_UNBLOCKS: 'tempUnblocks',
  BYPASS_HISTORY: 'bypassHistory',
  BLOCK_HISTORY: 'blockHistory',
  LAST_REFLECTION: 'lastReflection'
};

// Hostname utilities
function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, "");
}

function isHostnameBlocked(hostname, blockedSites) {
  return blockedSites.some(
    (site) => hostname === site || hostname.endsWith("." + site)
  );
}

function isTempUnblocked(hostname, tempUnblocks) {
  const expiresAt = tempUnblocks[hostname];
  return expiresAt && expiresAt > Date.now();
}

// Storage utilities
async function addBypass(site, minutes) {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.TEMP_UNBLOCKS]: {},
    [STORAGE_KEYS.BYPASS_HISTORY]: []
  });

  const tempUnblocks = data[STORAGE_KEYS.TEMP_UNBLOCKS] || {};
  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];

  // Set expiration
  const expiresAt = Date.now() + (minutes * 60 * 1000);
  tempUnblocks[site] = expiresAt;

  // Log bypass
  bypassHistory.push({
    site,
    timestamp: Date.now(),
    duration: minutes
  });

  // Prune history to last 100
  if (bypassHistory.length > 100) {
    bypassHistory.shift();
  }

  // Save
  await browser.storage.local.set({
    [STORAGE_KEYS.TEMP_UNBLOCKS]: tempUnblocks,
    [STORAGE_KEYS.BYPASS_HISTORY]: bypassHistory
  });
}

async function shouldShowReflection() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BYPASS_HISTORY]: [],
    [STORAGE_KEYS.LAST_REFLECTION]: 0
  });

  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];
  const lastReflection = data[STORAGE_KEYS.LAST_REFLECTION] || 0;
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

  // Only show reflection once per week
  if (now - lastReflection < 7 * 24 * 60 * 60 * 1000) {
    return false;
  }

  // Count recent bypasses
  const recentBypasses = bypassHistory.filter(b => b.timestamp > weekAgo);

  // Show if 5+ bypasses in last week
  if (recentBypasses.length >= 5) {
    // Mark that we showed reflection
    await browser.storage.local.set({ [STORAGE_KEYS.LAST_REFLECTION]: now });

    const days = Math.floor((now - recentBypasses[0].timestamp) / (24 * 60 * 60 * 1000));
    return {
      count: recentBypasses.length,
      days: Math.max(days, 1)
    };
  }

  return false;
}

async function getRecentBypassCount() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BYPASS_HISTORY]: []
  });

  const bypassHistory = data[STORAGE_KEYS.BYPASS_HISTORY] || [];
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return bypassHistory.filter(b => b.timestamp > weekAgo).length;
}

async function getRecentBlockCount() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BLOCK_HISTORY]: []
  });

  const blockHistory = data[STORAGE_KEYS.BLOCK_HISTORY] || [];
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return blockHistory.filter(b => b.timestamp > weekAgo).length;
}

async function addBlock(site) {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.BLOCK_HISTORY]: []
  });

  const blockHistory = data[STORAGE_KEYS.BLOCK_HISTORY] || [];

  // Log block
  blockHistory.push({
    site,
    timestamp: Date.now()
  });

  // Prune history to last 100
  if (blockHistory.length > 100) {
    blockHistory.shift();
  }

  // Save
  await browser.storage.local.set({
    [STORAGE_KEYS.BLOCK_HISTORY]: blockHistory
  });
}

