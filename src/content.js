// Content script that runs on every page
// Monitors temp unblocks and shows overlay when they expire

const hostname = normalizeHostname(window.location.hostname);
let checkInterval = null;
let overlayShown = false;

// Check if site has active temp unblock and monitor for expiry
async function monitorTempUnblock() {
  const data = await browser.storage.local.get({
    [STORAGE_KEYS.TEMP_UNBLOCKS]: {},
    [STORAGE_KEYS.BLOCKED_SITES]: []
  });

  const tempUnblocks = data[STORAGE_KEYS.TEMP_UNBLOCKS] || {};
  const blockedSites = data[STORAGE_KEYS.BLOCKED_SITES] || [];

  // Check if this site is blocked
  const isBlocked = isHostnameBlocked(hostname, blockedSites);

  if (!isBlocked) {
    // Not a blocked site, no need to monitor
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    return;
  }

  // Check if temp unblock is active
  if (isTempUnblocked(hostname, tempUnblocks)) {
    // Temp unblock is active, start monitoring
    // Clear any existing interval first to avoid duplicates
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    checkInterval = setInterval(checkExpiry, 30000); // Check every 30 seconds
  } else {
    // No active temp unblock, clear interval
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    // Check if there was a temp unblock that expired
    const expiresAt = tempUnblocks[hostname];
    if (expiresAt && expiresAt <= Date.now() && !overlayShown) {
      showExpiryOverlay();
    }
  }
}

// Check if temp unblock has expired
async function checkExpiry() {
  const data = await browser.storage.local.get({ [STORAGE_KEYS.TEMP_UNBLOCKS]: {} });
  const tempUnblocks = data[STORAGE_KEYS.TEMP_UNBLOCKS] || {};

  if (!isTempUnblocked(hostname, tempUnblocks)) {
    // Expired, show overlay
    if (!overlayShown) {
      showExpiryOverlay();
    }
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Show overlay when temp unblock expires
function showExpiryOverlay() {
  overlayShown = true;

  const overlay = document.createElement('div');
  overlay.id = 'rageblock-expiry-overlay';
  overlay.innerHTML = `
    <div class="rageblock-overlay-backdrop"></div>
    <div class="rageblock-overlay-content">
      <h1>Time's up</h1>
      <p>Your temporary bypass expired.</p>
      <div class="rageblock-overlay-buttons">
        <button id="rageblock-go-back" class="rageblock-btn-primary">Go Back</button>
        <button id="rageblock-bypass-5min" class="rageblock-btn-secondary">5 more minutes</button>
        <button id="rageblock-bypass-today" class="rageblock-btn-surrender">I give in, unblock for today</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const goBackBtn = overlay.querySelector('#rageblock-go-back');
  const bypass5minBtn = overlay.querySelector('#rageblock-bypass-5min');
  const bypassTodayBtn = overlay.querySelector('#rageblock-bypass-today');

  goBackBtn.addEventListener('click', () => {
    window.history.back();
  });

  bypass5minBtn.addEventListener('click', async (e) => {
    const button = e.target;
    button.disabled = true;
    try {
      await bypassAgain(5);
      overlay.remove();
      overlayShown = false;
      await new Promise(resolve => setTimeout(resolve, 100));
      await monitorTempUnblock();
    } catch (err) {
      console.error('Error bypassing:', err);
      button.disabled = false;
    }
  });

  bypassTodayBtn.addEventListener('click', async (e) => {
    const button = e.target;
    button.disabled = true;
    try {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const minutesUntilMidnight = Math.ceil((midnight - now) / 60000);

      await bypassAgain(minutesUntilMidnight);
      overlay.remove();
      overlayShown = false;
      await new Promise(resolve => setTimeout(resolve, 100));
      await monitorTempUnblock();
    } catch (err) {
      console.error('Error bypassing:', err);
      button.disabled = false;
    }
  });
}

// Bypass again for specified minutes
async function bypassAgain(minutes) {
  if (typeof addBypass !== 'function') {
    throw new Error('addBypass is not available in content script');
  }
  await addBypass(hostname, minutes);
}

// Start monitoring when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', monitorTempUnblock);
} else {
  monitorTempUnblock();
}

// Listen for storage changes (in case temp unblock is added/removed)
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEYS.TEMP_UNBLOCKS]) {
    monitorTempUnblock();
  }
});

