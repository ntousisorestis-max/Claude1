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
 * just don't get the backup alert.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleRestOverNotification(
  _endsAt: number,
  _nextSet: number,
  _totalSets: number,
): Promise<void> {
  // No-op: see above.
}

export async function cancelRestOverNotification(): Promise<void> {
  // No-op: nothing was ever scheduled.
}
