import { useSyncExternalStore } from "react";

interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

/**
 * localStorage-backed zustand stores start empty on the server and during
 * the first client render, then rehydrate a moment later. Callers that
 * redirect based on "is there saved state" (e.g. the workspace guard) need
 * to wait for that rehydration, or they'll bounce the user on every
 * refresh. This tracks that transition for any persisted store.
 */
export function useHydrated(store: PersistedStore): boolean {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false
  );
}
