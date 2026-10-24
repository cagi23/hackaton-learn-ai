import '@testing-library/jest-dom/vitest';

// Node 22 defines an incomplete experimental globalThis.localStorage without standard Web Storage methods.
// Polyfill standard Web Storage in jsdom test environment if methods like getItem/setItem are missing.
if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function') {
  const createStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
  };

  const storageInstance = createStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageInstance,
    writable: true,
    configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storageInstance,
      writable: true,
      configurable: true,
    });
  }
}

