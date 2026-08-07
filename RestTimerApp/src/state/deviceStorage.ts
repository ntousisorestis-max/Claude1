import { createMemoryStorage, type AppStorage } from './storage';
import type { SavedState } from './types';

/**
 * Real persistence, on a phone.
 *
 * ## The key
 *
 * `liftlock.state.v3`, and both halves of that were chosen now because now is
 * the only moment they are free. Nothing has ever been written to disk — the
 * app has run on `createMemoryStorage` since it was built — so there is no
 * stored payload anywhere in the world to orphan by renaming the prefix or
 * bumping the version. The moment this ships, both are permanent.
 *
 * `v3` rather than the `v2` the docs used to name: the saved shape gained
 * `welcomed`, and a version that doesn't move when the shape does is a version
 * that lies. `HYDRATE` clamps and filters whatever it is handed, but it cannot
 * invent a field that was never written.
 *
 * ## Why the module is loaded through `require`
 *
 * `@react-native-async-storage/async-storage` is a native module. It is absent
 * in Jest, and absent on any build where it hasn't been linked yet — and
 * importing it statically in either case throws at module scope, which takes
 * the whole app down before a single screen renders. Falling back to memory
 * means the worst case is the app behaving exactly as it did before
 * persistence existed.
 *
 * The `.web.ts` twin uses `localStorage` and needs none of this.
 */

export const STORAGE_KEY = 'liftlock.state.v3';

type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const asyncStorage: AsyncStorageLike | null = (() => {
  try {
    const module = require('@react-native-async-storage/async-storage');
    const api = module?.default ?? module;
    return typeof api?.getItem === 'function'
      ? (api as AsyncStorageLike)
      : null;
  } catch {
    return null;
  }
})();

export function createDeviceStorage(): AppStorage {
  if (!asyncStorage) {
    console.warn(
      '[liftlock] AsyncStorage is unavailable; nothing will be saved this run',
    );
    return createMemoryStorage();
  }

  return {
    async load() {
      const raw = await asyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as SavedState;
      } catch {
        // Corrupt or half-written JSON. Starting fresh is survivable; throwing
        // here would mean an app that never gets past its first render again.
        console.warn('[liftlock] saved state was unreadable, starting fresh');
        return null;
      }
    },
    async save(saved) {
      await asyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
  };
}

let instance: AppStorage | null = null;

/**
 * The instance the app uses. One per process, built on first *use*.
 *
 * Lazy rather than a module-level const: this module is imported by App.tsx,
 * which every test also imports, and building it eagerly would reach for a
 * native module that isn't there and log a warning on every test run — for a
 * store none of those tests use, because they all pass their own.
 */
export function getDeviceStorage(): AppStorage {
  if (!instance) {
    instance = createDeviceStorage();
  }
  return instance;
}
