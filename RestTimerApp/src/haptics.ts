import { Platform, Vibration } from 'react-native';

/**
 * Physical feedback on the moments that matter: banking a set, the lock
 * snapping shut, finishing the workout.
 *
 * **Android only, deliberately.** `Vibration` is core React Native, so this
 * costs no dependency — but on iOS it ignores the duration and fires a fixed
 * ~400ms buzz, which is far too heavy for a button tap and would make the app
 * feel worse, not better. iOS wants `UIImpactFeedbackGenerator`, which needs a
 * native module.
 *
 * To finish the job on iOS: add `react-native-haptic-feedback`, then swap the
 * three bodies below for `impactAsync('light' | 'medium')` and drop the
 * platform guard. Nothing else in the app has to change — every call site goes
 * through these three functions.
 */

const androidOnly = (pattern: number | number[]) => {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    Vibration.vibrate(pattern);
  } catch {
    // Never let feedback break a workout.
  }
};

/** A set is banked. Short and affirmative. */
export function setBanked() {
  androidOnly(22);
}

/** Rest is over and the shield is back up. Two taps: "that's closed". */
export function lockedShut() {
  androidOnly([0, 18, 70, 26]);
}

/** Workout finished. */
export function workoutDone() {
  androidOnly([0, 26, 60, 26, 60, 46]);
}
