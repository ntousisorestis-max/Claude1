import { FACTORY_DEFAULTS } from './workoutReducer';
import type { SavedState } from './types';

/**
 * Where the saved exercises and preferences are kept between launches.
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
 * // src/state/asyncStorage.ts
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const KEY = 'rest-timer.state.v2';
 *
 * export const asyncStorage: AppStorage = {
 *   async load() {
 *     const raw = await AsyncStorage.getItem(KEY);
 *     return raw ? (JSON.parse(raw) as SavedState) : null;
 *   },
 *   async save(saved) {
 *     await AsyncStorage.setItem(KEY, JSON.stringify(saved));
 *   },
 * };
 * ```
 *
 * **Web:** the same file with `.web.ts` on the end, using
 * `window.localStorage`. Webpack's platform resolution picks it automatically.
 *
 * Then pass it in: `<WorkoutProvider storage={asyncStorage}>`.
 *
 * Note the `v2` in the key. It went up when sets and rest moved out of one
 * shared pair of numbers and onto a list of exercises, which is exactly when to
 * bump it: `load()` is trusted to return something of the right shape, and a v1
 * payload read as v2 would put junk straight into state. HYDRATE clamps and
 * filters whatever it's handed, but it can't invent a list that was never
 * written.
 */
export type AppStorage = {
  /** Returns what was saved, or null when there's nothing stored. */
  load(): Promise<SavedState | null>;
  save(saved: SavedState): Promise<void>;
};

/**
 * The current implementation: holds state for the life of the process and
 * forgets it on restart.
 *
 * Deliberately not a no-op. It exercises the same load-then-save path the real
 * one will, so the wiring is proven rather than hypothetical, and swapping in
 * a persistent driver changes only how long the values survive.
 */
export function createMemoryStorage(
  seed: SavedState | null = null,
): AppStorage {
  let held: SavedState | null = seed;

  return {
    async load() {
      return held;
    },
    async save(saved) {
      held = saved;
    },
  };
}

/** The instance the app uses unless something else is passed in. */
export const memoryStorage = createMemoryStorage();

/**
 * Memory storage seeded as somebody who has been here before.
 *
 * For tests. Once the welcome screen existed, an unseeded store meant every
 * test was implicitly a first launch with the welcome overlaid on whatever it
 * was checking — which passed, because a test renderer queries the whole tree
 * regardless of what is drawn on top, and which was therefore testing a screen
 * no real user in that situation would be looking at. Tests that mean "a
 * returning user" should say so.
 */
export function createReturningStorage(
  saved: Partial<SavedState> = {},
): AppStorage {
  return createMemoryStorage({
    defaults: FACTORY_DEFAULTS,
    exercises: [],
    welcomed: true,
    ...saved,
  });
}
