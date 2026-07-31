import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS "reduce motion" setting is on.
 *
 * Backed by a single module-level subscription rather than one per component.
 * Every button, toggle, pill and tab now asks for this, and a hook that opened
 * its own OS listener and async query each time would mean dozens of both for
 * one boolean that changes approximately never.
 */

let enabled = false;
let started = false;
const listeners = new Set<() => void>();

function publish(next: boolean) {
  if (next === enabled) {
    return; // No churn when the answer hasn't changed.
  }
  enabled = next;
  listeners.forEach(notify => notify());
}

function start() {
  if (started) {
    return;
  }
  started = true;

  AccessibilityInfo.isReduceMotionEnabled()
    .then(publish)
    .catch(() => {
      // Not worth breaking a workout over; motion stays on.
    });

  AccessibilityInfo.addEventListener('reduceMotionChanged', publish);
}

function subscribe(notify: () => void) {
  start();
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useReduceMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => enabled,
  );
}
