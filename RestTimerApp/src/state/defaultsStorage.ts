import type { WorkoutDefaults } from './types';

/**
 * Where the Settings defaults are kept between launches.
 *
 * The app talks to this interface and never to a storage library directly, so
 * adding real persistence is one new file plus one line in App.tsx — no screen,
 * reducer or test has to change.
 *
 * ## Adding real saving later
 *
 * **Native (AsyncStorage):**
 *
 * ```ts
 * // src/state/asyncStorageDefaults.ts
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const KEY = 'rest-timer.defaults.v1';
 *
 * export const asyncStorageDefaults: DefaultsStorage = {
 *   async load() {
 *     const raw = await AsyncStorage.getItem(KEY);
 *     return raw ? (JSON.parse(raw) as WorkoutDefaults) : null;
 *   },
 *   async save(defaults) {
 *     await AsyncStorage.setItem(KEY, JSON.stringify(defaults));
 *   },
 * };
 * ```
 *
 * **Web:** the same file with `.web.ts` on the end, using
 * `window.localStorage`. Webpack's platform resolution picks it automatically.
 *
 * Then pass it in: `<WorkoutProvider storage={asyncStorageDefaults}>`.
 *
 * Note the `v1` in the key. Bump it whenever the shape of `WorkoutDefaults`
 * changes, so an old payload can't be read back as a new one — `load()` is
 * trusted to return something valid, and a mismatched shape would put junk
 * straight into state.
 */
export type DefaultsStorage = {
  /** Returns saved defaults, or null when there's nothing stored. */
  load(): Promise<WorkoutDefaults | null>;
  save(defaults: WorkoutDefaults): Promise<void>;
};

/**
 * The current implementation: holds defaults for the life of the process and
 * forgets them on restart.
 *
 * Deliberately not a no-op. It exercises the same load-then-save path the real
 * one will, so the wiring is proven rather than hypothetical, and swapping in
 * a persistent driver changes only how long the values survive.
 */
export function createMemoryDefaultsStorage(
  seed: WorkoutDefaults | null = null,
): DefaultsStorage {
  let held: WorkoutDefaults | null = seed;

  return {
    async load() {
      return held;
    },
    async save(defaults) {
      held = defaults;
    },
  };
}

/** The instance the app uses unless something else is passed in. */
export const memoryDefaultsStorage = createMemoryDefaultsStorage();
