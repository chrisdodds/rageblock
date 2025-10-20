// Cache blocklist and allowlist in memory for synchronous access
let blockedSites = DEFAULT_SITES;
let allowedSites = [];

// Initialize default settings
browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    blockedSites: DEFAULT_SITES,
    allowedSites: [],
  });
});

// Load settings on startup
browser.storage.local.get({ blockedSites: DEFAULT_SITES, allowedSites: [] }).then((data) => {
  if (data) {
    blockedSites = data.blockedSites || blockedSites;
    allowedSites = data.allowedSites || [];
  }
});

// Listen for storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes.blockedSites) blockedSites = changes.blockedSites.newValue;
    if (changes.allowedSites) allowedSites = changes.allowedSites.newValue;
  }
});

// Cache temp unblocks in memory
let tempUnblocks = {};

// Load temp unblocks on startup
browser.storage.local.get({ tempUnblocks: {} }).then((data) => {
  tempUnblocks = data.tempUnblocks || {};
  cleanExpiredUnblocks();
});

// Listen for temp unblock changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tempUnblocks) {
    tempUnblocks = changes.tempUnblocks.newValue || {};
  }
});

// Clean expired temp unblocks
function cleanExpiredUnblocks() {
  const now = Date.now();
  let changed = false;

  for (const site in tempUnblocks) {
    if (tempUnblocks[site] < now) {
      delete tempUnblocks[site];
      changed = true;
    }
  }

  if (changed) {
    browser.storage.local.set({ tempUnblocks });
  }
}

// Clean expired unblocks every minute
setInterval(cleanExpiredUnblocks, 60000);

// Listen for web requests and block before loading
browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (details.type !== "main_frame") return;

    const url = new URL(details.url);
    const hostname = normalizeHostname(url.hostname);

    if (isHostnameBlocked(hostname, allowedSites)) {
      return;
    }

    const data = await browser.storage.local.get({ [STORAGE_KEYS.TEMP_UNBLOCKS]: {} });
    const latestTempUnblocks = data[STORAGE_KEYS.TEMP_UNBLOCKS] || {};

    if (isTempUnblocked(hostname, latestTempUnblocks)) {
      tempUnblocks = latestTempUnblocks;
      return;
    }

    const isBlocked = isHostnameBlocked(hostname, blockedSites);

    if (isBlocked) {
      await addBlock(hostname);
      const blockedUrl = browser.runtime.getURL("src/blocked.html") + "?site=" + encodeURIComponent(hostname);
      return {
        redirectUrl: blockedUrl,
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
