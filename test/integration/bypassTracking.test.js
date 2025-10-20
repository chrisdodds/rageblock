import { describe, it, expect, beforeEach } from "vitest";
import { addBypass, getRecentBypassCount, shouldShowReflection, STORAGE_KEYS } from "./helpers.js";

describe("bypass tracking", () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  describe("addBypass and getRecentBypassCount", () => {
    it("stores bypass in history and tempUnblocks", async () => {
      await addBypass("reddit.com", 5);

      const data = await browser.storage.local.get({
        bypassHistory: [],
        tempUnblocks: {},
      });

      expect(data.bypassHistory).toHaveLength(1);
      expect(data.bypassHistory[0].site).toBe("reddit.com");
      expect(data.bypassHistory[0].duration).toBe(5);
      expect(data.tempUnblocks["reddit.com"]).toBeGreaterThan(Date.now());
    });

    it("returns correct count", async () => {
      await addBypass("reddit.com", 5);
      await addBypass("facebook.com", 10);

      const count = await getRecentBypassCount();
      expect(count).toBe(2);
    });

    it("filters old bypasses", async () => {
      const now = Date.now();
      const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

      await browser.storage.local.set({
        bypassHistory: [
          { site: "site1.com", timestamp: now - 1000, duration: 5 },
          { site: "site2.com", timestamp: twoWeeksAgo, duration: 5 },
        ],
      });

      const count = await getRecentBypassCount();
      expect(count).toBe(1);
    });

    it("prunes history at 100 items", async () => {
      for (let i = 0; i < 100; i++) {
        await addBypass(`site${i}.com`, 5);
      }

      let data = await browser.storage.local.get({ bypassHistory: [] });
      expect(data.bypassHistory).toHaveLength(100);

      await addBypass("site101.com", 5);

      data = await browser.storage.local.get({ bypassHistory: [] });
      expect(data.bypassHistory).toHaveLength(100);
      expect(data.bypassHistory[99].site).toBe("site101.com");
    });
  });

  describe("reflection logic", () => {
    it("returns false when no bypasses", async () => {
      const result = await shouldShowReflection();
      expect(result).toBe(false);
    });

    it("returns false when bypasses < 5", async () => {
      await addBypass("site1.com", 5);
      await addBypass("site2.com", 5);
      await addBypass("site3.com", 5);

      const result = await shouldShowReflection();
      expect(result).toBe(false);
    });

    it("returns stats when bypasses >= 5", async () => {
      for (let i = 0; i < 5; i++) {
        await addBypass(`site${i}.com`, 5);
      }

      const result = await shouldShowReflection();
      expect(result).not.toBe(false);
      expect(result.count).toBeGreaterThanOrEqual(5);
      expect(result.days).toBeGreaterThanOrEqual(1);
    });

    it("respects lastReflection cooldown", async () => {
      for (let i = 0; i < 5; i++) {
        await addBypass(`site${i}.com`, 5);
      }

      const result1 = await shouldShowReflection();
      expect(result1).not.toBe(false);

      const result2 = await shouldShowReflection();
      expect(result2).toBe(false);
    });
  });
});

