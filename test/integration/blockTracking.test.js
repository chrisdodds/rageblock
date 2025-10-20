import { describe, it, expect, beforeEach } from "vitest";
import { addBlock, getRecentBlockCount, STORAGE_KEYS } from "./helpers.js";

describe("block tracking", () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  describe("addBlock and getRecentBlockCount", () => {
    it("stores block in history", async () => {
      await addBlock("cnn.com");

      const data = await browser.storage.local.get({ blockHistory: [] });
      expect(data.blockHistory).toHaveLength(1);
      expect(data.blockHistory[0].site).toBe("cnn.com");
      expect(data.blockHistory[0].timestamp).toBeGreaterThan(0);
    });

    it("returns correct count", async () => {
      await addBlock("cnn.com");
      await addBlock("foxnews.com");
      await addBlock("reddit.com");

      const count = await getRecentBlockCount();
      expect(count).toBe(3);
    });

    it("filters old blocks", async () => {
      const now = Date.now();
      const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

      await browser.storage.local.set({
        blockHistory: [
          { site: "site1.com", timestamp: now - 1000 },
          { site: "site2.com", timestamp: now - (2 * 24 * 60 * 60 * 1000) },
          { site: "site3.com", timestamp: twoWeeksAgo },
        ],
      });

      const count = await getRecentBlockCount();
      expect(count).toBe(2);
    });

    it("returns 0 for empty history", async () => {
      const count = await getRecentBlockCount();
      expect(count).toBe(0);
    });

    it("accumulates multiple blocks", async () => {
      await addBlock("site1.com");
      await addBlock("site2.com");
      await addBlock("site3.com");

      const data = await browser.storage.local.get({ blockHistory: [] });
      expect(data.blockHistory).toHaveLength(3);

      const count = await getRecentBlockCount();
      expect(count).toBe(3);
    });

    it("prunes history at 100 items", async () => {
      for (let i = 0; i < 100; i++) {
        await addBlock(`site${i}.com`);
      }

      let data = await browser.storage.local.get({ blockHistory: [] });
      expect(data.blockHistory).toHaveLength(100);

      await addBlock("site101.com");

      data = await browser.storage.local.get({ blockHistory: [] });
      expect(data.blockHistory).toHaveLength(100);
      expect(data.blockHistory[0].site).not.toBe("site0.com");
      expect(data.blockHistory[99].site).toBe("site101.com");
    });
  });

  describe("incremental counting", () => {
    it("starts at 0, increments with each block", async () => {
      let count = await getRecentBlockCount();
      expect(count).toBe(0);

      await addBlock("cnn.com");
      count = await getRecentBlockCount();
      expect(count).toBe(1);

      await addBlock("foxnews.com");
      count = await getRecentBlockCount();
      expect(count).toBe(2);

      await addBlock("cnn.com");
      count = await getRecentBlockCount();
      expect(count).toBe(3);
    });
  });
});

