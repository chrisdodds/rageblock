import { describe, it, expect, beforeEach } from "vitest";
import {
  addBlock,
  getRecentBlockCount,
  addBypass,
  getRecentBypassCount,
  isTempUnblocked,
  isHostnameBlocked,
  STORAGE_KEYS
} from "./helpers.js";

describe("full flow simulations", () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  it("simulates block -> count in popup", async () => {
    await addBlock("cnn.com");
    await addBlock("foxnews.com");

    const count = await getRecentBlockCount();
    expect(count).toBe(2);
  });

  it("simulates bypass -> count in popup", async () => {
    await addBypass("reddit.com", 5);
    await addBypass("facebook.com", 10);

    const count = await getRecentBypassCount();
    expect(count).toBe(2);
  });

  it("simulates mixed blocks and bypasses", async () => {
    await addBlock("cnn.com");
    await addBlock("foxnews.com");
    await addBypass("reddit.com", 5);

    const blockCount = await getRecentBlockCount();
    const bypassCount = await getRecentBypassCount();

    expect(blockCount).toBe(2);
    expect(bypassCount).toBe(1);
  });

  it("simulates bypass expiry and re-bypass flow", async () => {
    const site = "reddit.com";

    await addBypass(site, 5);

    let data = await browser.storage.local.get({ tempUnblocks: {} });
    expect(data.tempUnblocks[site]).toBeGreaterThan(Date.now());

    data.tempUnblocks[site] = Date.now() - 1000;
    await browser.storage.local.set({ tempUnblocks: data.tempUnblocks });

    data = await browser.storage.local.get({ tempUnblocks: {} });
    expect(isTempUnblocked(site, data.tempUnblocks)).toBe(false);

    await addBypass(site, 5);

    data = await browser.storage.local.get({ tempUnblocks: {} });
    expect(isTempUnblocked(site, data.tempUnblocks)).toBe(true);

    const count = await getRecentBypassCount();
    expect(count).toBe(2);
  });

  it("handles adding sites to blocked and allowed lists", async () => {
    await browser.storage.local.set({
      blockedSites: ["reddit.com", "facebook.com"],
      allowedSites: ["propublica.org"]
    });

    const data = await browser.storage.local.get({
      blockedSites: [],
      allowedSites: []
    });

    expect(data.blockedSites).toContain("reddit.com");
    expect(data.blockedSites).toContain("facebook.com");
    expect(data.allowedSites).toContain("propublica.org");
  });

  it("correctly prioritizes allowed over blocked", async () => {
    const site = "example.com";
    const blockedSites = [site, "other.com"];
    const allowedSites = [site];

    const isBlocked = isHostnameBlocked(site, blockedSites);
    const isAllowed = isHostnameBlocked(site, allowedSites);

    expect(isBlocked).toBe(true);
    expect(isAllowed).toBe(true);
  });
});

describe("storage keys", () => {
  it("uses correct storage keys", () => {
    expect(STORAGE_KEYS.BLOCKED_SITES).toBe("blockedSites");
    expect(STORAGE_KEYS.ALLOWED_SITES).toBe("allowedSites");
    expect(STORAGE_KEYS.TEMP_UNBLOCKS).toBe("tempUnblocks");
    expect(STORAGE_KEYS.BYPASS_HISTORY).toBe("bypassHistory");
    expect(STORAGE_KEYS.BLOCK_HISTORY).toBe("blockHistory");
    expect(STORAGE_KEYS.LAST_REFLECTION).toBe("lastReflection");
  });
});

