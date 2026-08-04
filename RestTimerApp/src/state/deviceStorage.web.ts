import { createMemoryStorage, type AppStorage } from './storage';
import type { SavedState } from './types';

/**
 * Real persistence, in a browser.
 *
 * Same key and the same contract as the native twin, so nothing above this
 * layer learns which one it got. See deviceStorage.ts for why the key is what
 * it is.
 *
 * `localStorage` is synchronous and this interface is async — deliberately, so
 * the native side can be genuinely async. Wrapping a synchronous read in a
 * resolved promise costs nothing and keeps one shape for both.
 */

export const STORAGE_KEY = 'liftlock.state.v3';

type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/**
 * Reached through `globalThis` because this project's tsconfig has no DOM lib —
 * it is a React Native app that also builds for the web, and pulling DOM in
 * globally would let `document` slip into files that run on a phone.
 *
 * It can genuinely be missing: Safari in private mode has historically thrown
 * on `localStorage` access, and any embedding that disables storage does too.
 */
const webStorage: WebStorageLike | null = (() => {
  try {
    const store = (globalThis as any)?.localStorage ?? null;
    // Touch it rather than trusting it exists — the throw is on *access*, not
    // on the property being there.
    store?.getItem(STORAGE_KEY);
    return store;
  } catch {
    return null;
  }
})();

export function createDeviceStorage(): AppStorage {
  if (!webStorage) {
    console.warn(
      '[liftlock] localStorage is unavailable; nothing will be saved this run',
    );
    return createMemoryStorage();
  }

  return {
    async load() {
      const raw = webStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as SavedState;
      } catch {
        console.warn('[liftlock] saved state was unreadable, starting fresh');
        return null;
      }
    },
    async save(saved) {
      webStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
  };
}

let instance: AppStorage | null = null;

/** The instance the app uses. One per process, built on first *use*. */
export function getDeviceStorage(): AppStorage {
  if (!instance) {
    instance = createDeviceStorage();
  }
  return instance;
}
