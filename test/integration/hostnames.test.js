import { describe, it, expect, beforeEach } from "vitest";
import { normalizeHostname, isHostnameBlocked, isTempUnblocked } from "./helpers.js";

describe("hostname utilities", () => {
  describe("normalizeHostname", () => {
    it("removes www", () => {
      expect(normalizeHostname("www.reddit.com")).toBe("reddit.com");
      expect(normalizeHostname("reddit.com")).toBe("reddit.com");
      expect(normalizeHostname("www.news.bbc.co.uk")).toBe("news.bbc.co.uk");
    });
  });

  describe("isHostnameBlocked", () => {
    it("matches exact and subdomain", () => {
      const blockedSites = ["reddit.com", "facebook.com"];

      expect(isHostnameBlocked("reddit.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("old.reddit.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("m.facebook.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("twitter.com", blockedSites)).toBe(false);
    });

    it("handles site with multiple subdomains", () => {
      const blockedSites = ["reddit.com"];

      expect(isHostnameBlocked("reddit.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("old.reddit.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("www.reddit.com", blockedSites)).toBe(true);
      expect(isHostnameBlocked("preview.old.reddit.com", blockedSites)).toBe(true);
    });

    it("does not match partial domain names", () => {
      const blockedSites = ["reddit.com"];

      expect(isHostnameBlocked("notreddit.com", blockedSites)).toBe(false);
      expect(isHostnameBlocked("reddit.com.fake.com", blockedSites)).toBe(false);
    });
  });

  describe("isTempUnblocked", () => {
    it("checks expiry correctly", () => {
      const now = Date.now();
      const tempUnblocks = {
        "reddit.com": now + 60000,
        "facebook.com": now - 60000,
      };

      expect(isTempUnblocked("reddit.com", tempUnblocks)).toBe(true);
      expect(isTempUnblocked("facebook.com", tempUnblocks)).toBe(false);
      expect(!!isTempUnblocked("twitter.com", tempUnblocks)).toBe(false);
    });
  });

  describe("edge cases", () => {
    beforeEach(async () => {
      await browser.storage.local.clear();
    });

    it("handles empty lists gracefully", async () => {
      await browser.storage.local.set({
        blockedSites: [],
        allowedSites: [],
        tempUnblocks: {}
      });

      const data = await browser.storage.local.get({
        blockedSites: [],
        allowedSites: [],
        tempUnblocks: {}
      });

      expect(isHostnameBlocked("anything.com", data.blockedSites)).toBe(false);
      expect(!!isTempUnblocked("anything.com", data.tempUnblocks)).toBe(false);
    });
  });
});

