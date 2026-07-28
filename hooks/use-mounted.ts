import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * True only once the component has mounted on the client. Used to defer
 * rendering anything that would otherwise mismatch between the server
 * render and the client's first paint (e.g. reading the resolved theme).
 * Implemented with useSyncExternalStore instead of a state+effect pair so
 * there's no synchronous setState-in-effect to reason about.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
