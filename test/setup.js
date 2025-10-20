// Mock browser APIs
const createMockStorage = () => {
  let storage = {};

  return {
    local: {
      get: (keys) => {
        return Promise.resolve(
          typeof keys === 'object' && !Array.isArray(keys)
            ? { ...keys, ...storage }
            : Object.keys(keys || {}).reduce((acc, key) => {
                acc[key] = storage[key];
                return acc;
              }, {})
        );
      },
      set: (items) => {
        storage = { ...storage, ...items };
        return Promise.resolve();
      },
      clear: () => {
        storage = {};
        return Promise.resolve();
      },
      _getAll: () => storage, // Test helper
    },
    onChanged: {
      addListener: () => {},
    },
  };
};

const mockBrowser = {
  storage: createMockStorage(),
  runtime: {
    getURL: (path) => `moz-extension://mock-id/${path}`,
    onInstalled: {
      addListener: () => {},
    },
  },
  webRequest: {
    onBeforeRequest: {
      addListener: () => {},
    },
  },
};

global.browser = mockBrowser;

// Mock DEFAULT_SITES for tests
global.DEFAULT_SITES = [
  "cnn.com",
  "foxnews.com",
  "example.com",
];

