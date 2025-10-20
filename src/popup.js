document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await browser.storage.local.get({
      blockedSites: DEFAULT_SITES,
      allowedSites: [],
    });

    if (!data.blockedSites || data.blockedSites.length === 0) {
      await browser.storage.local.set({
        blockedSites: DEFAULT_SITES,
        allowedSites: []
      });
      data.blockedSites = DEFAULT_SITES;
      data.allowedSites = [];
    }

    renderBlockedList(data.blockedSites || []);
    renderAllowedList(data.allowedSites || []);
    await renderStats();

    document.getElementById("addSite").addEventListener("click", addSite);
    document
      .getElementById("siteInput")
      .addEventListener("keypress", (e) => e.key === "Enter" && addSite());

    document.getElementById("addAllowed").addEventListener("click", addAllowedSite);
    document
      .getElementById("allowedInput")
      .addEventListener("keypress", (e) => e.key === "Enter" && addAllowedSite());
  } catch (error) {
    console.error("Error loading popup:", error);
  }
});

async function addSite() {
  const input = document.getElementById("siteInput");
  const site = input.value.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");

  if (!site) return;

  const data = await browser.storage.local.get({
    blockedSites: DEFAULT_SITES,
    allowedSites: []
  });

  if (!data.blockedSites.includes(site)) {
    data.blockedSites.push(site);
    await browser.storage.local.set({ blockedSites: data.blockedSites });
    renderBlockedList(data.blockedSites);
  }

  input.value = "";
}

async function addAllowedSite() {
  const input = document.getElementById("allowedInput");
  const site = input.value.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");

  if (!site) return;

  const data = await browser.storage.local.get({
    allowedSites: [],
    blockedSites: DEFAULT_SITES
  });

  // Add to allowed list if not already there
  if (!data.allowedSites.includes(site)) {
    data.allowedSites.push(site);
  }

  // Remove from blocked list if present (allowed takes precedence)
  const wasBlocked = data.blockedSites.includes(site);
  if (wasBlocked) {
    data.blockedSites = data.blockedSites.filter((s) => s !== site);
  }

  await browser.storage.local.set({
    allowedSites: data.allowedSites,
    blockedSites: data.blockedSites
  });

  renderAllowedList(data.allowedSites);
  if (wasBlocked) {
    renderBlockedList(data.blockedSites);
  }

  input.value = "";
}

async function removeBlocked(site) {
  const data = await browser.storage.local.get({ blockedSites: DEFAULT_SITES });
  data.blockedSites = data.blockedSites.filter((s) => s !== site);
  await browser.storage.local.set({ blockedSites: data.blockedSites });
  renderBlockedList(data.blockedSites);
}

async function removeAllowed(site) {
  const data = await browser.storage.local.get({ allowedSites: [] });
  data.allowedSites = data.allowedSites.filter((s) => s !== site);
  await browser.storage.local.set({ allowedSites: data.allowedSites });
  renderAllowedList(data.allowedSites);
}

function renderBlockedList(sites) {
  const list = document.getElementById("blockedList");
  if (!list) return;

  if (!sites || sites.length === 0) {
    list.innerHTML = '<div style="padding: 8px; color: #666; font-size: 13px;">No blocked sites</div>';
    return;
  }

  const html = sites
    .map(
      (site) => `
    <div class="list-item">
      <span>${site}</span>
      <button class="btn-remove" data-site="${site}">Remove</button>
    </div>
  `
    )
    .join("");

  list.innerHTML = html;

  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => removeBlocked(btn.dataset.site));
  });
}

function renderAllowedList(sites) {
  const list = document.getElementById("allowedList");

  if (!list) {
    console.error("allowedList element not found!");
    return;
  }

  if (!sites || sites.length === 0) {
    list.innerHTML = '<div style="padding: 8px; color: #666; font-size: 13px;">No allowed sites</div>';
    return;
  }

  list.innerHTML = sites
    .map(
      (site) => `
    <div class="list-item">
      <span>${site}</span>
      <button class="btn-remove" data-site="${site}">Remove</button>
    </div>
  `
    )
    .join("");

  // Add event listeners
  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => removeAllowed(btn.dataset.site));
  });
}

async function renderStats() {
  const recentBypassCount = await getRecentBypassCount();
  const recentBlockCount = await getRecentBlockCount();

  document.getElementById("statBypasses").textContent = recentBypassCount;
  document.getElementById("statBlocks").textContent = recentBlockCount;
}
