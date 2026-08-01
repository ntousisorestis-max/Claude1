/**
 * Web stand-in for notifications.ts.
 *
 * Picked up automatically by webpack's `.web.ts` resolution, so nothing in the
 * app imports this directly — `WorkoutContext` still imports './notifications'.
 *
 * The browser has no equivalent of an OS-scheduled alarm that survives the tab
 * being backgrounded, which is the entire point of the native version. Rather
 * than fake it with a `setTimeout` that silently dies, these are honest no-ops:
 * the in-app countdown and the re-lock work exactly as they do on device, you
 * just don't get the backup alert — and with no alert there is nothing to tap,
 * so the press plumbing is a no-op too.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleRestOverNotification(
  _endsAt: number,
  _nextSet: number,
  _totalSets: number,
  _withSound?: boolean,
): Promise<void> {
  // No-op: see above.
}

export async function cancelRestOverNotification(): Promise<void> {
  // No-op: nothing was ever scheduled.
}

/** Returns an unsubscribe, so callers need no platform check. */
export function onRestNotificationPress(_handler: () => void): () => void {
  return () => {};
}

export function registerBackgroundNotificationHandler(): void {
  // No-op: a browser tab has no headless background context to run one in.
}
