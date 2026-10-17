import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const memory = new Map<string, string>();

const noopStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => void memory.set(name, value),
  removeItem: (name) => void memory.delete(name),
};

/** localStorage in the browser, an in-memory map on the server or when storage is blocked. */
export const safeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') return noopStorage;
  try {
    const probe = '__workspace_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return noopStorage;
  }
});
