import { Platform, Vibration } from 'react-native';

/**
 * Physical feedback, on the six moments worth feeling.
 *
 * Almost all of them are fired from one place — the phase-change effect in
 * WorkoutContext — so rest running out on its own feels identical to skipping
 * it, and no screen has to remember to buzz. `tap` is the exception: it belongs
 * to the press, not to a state change, and lives in `usePressScale`.
 *
 * ## Two backends
 *
 * `react-native-haptic-feedback` is the good one. It drives
 * `UIImpactFeedbackGenerator` on iOS and the modern `VibrationEffect` API on
 * Android, which is the difference between a crisp tick and a phone buzzing in
 * your hand like a wasp.
 *
 * It's a native module, so it is absent in the browser and absent until the
 * first native build links it. When it is, this falls back to core RN's
 * `Vibration` — **on Android only**, because on iOS `Vibration.vibrate` ignores
 * the duration entirely and fires a fixed ~400ms buzz. Using that for a button
 * tap would make the app feel worse than having no haptics at all, which is why
 * the fallback deliberately does nothing there.
 *
 * ## Intensity has a shape
 *
 * The vocabulary is small on purpose, and it climbs:
 *
 * - `tap` — a press landed. The lightest thing available.
 * - `restSkipped` — you cut rest short yourself. The lightest of the workout
 *   beats, because you are already looking at the screen you just pressed.
 * - `restExpired` — rest ran out on its own. Two beats, because you might not
 *   be looking at anything.
 * - `setBanked` — a set is done. Medium, single. The workhorse.
 * - `workoutStarted` — a rising double. Same "locked" news as `setStart`, but
 *   it's the start of everything.
 * - `personalBest` — a quick triple that accelerates. Reserved for a record.
 * - `workoutDone` — the heaviest, and the only one that ends on a heavy beat.
 *
 * Nothing else buzzes. A phone that vibrates at everything is a phone whose
 * vibration means nothing.
 */

type Impact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

/** The optional native module, resolved once. */
const nativeHaptics = (() => {
  try {
    const module = require('react-native-haptic-feedback');
    const api = module?.default ?? module;
    return typeof api?.trigger === 'function' ? api : null;
  } catch {
    // Not installed, not linked, or we're in a browser. All the same here.
    return null;
  }
})();

const IMPACT_NAMES: Record<Impact, string> = {
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  rigid: 'rigid',
  soft: 'soft',
};

const OPTIONS = {
  // Respect the OS switches. Someone who turned haptics off system-wide meant
  // it, and a fallback buzz would route straight around that.
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

function impact(style: Impact) {
  if (!nativeHaptics) {
    return;
  }
  try {
    nativeHaptics.trigger(IMPACT_NAMES[style], OPTIONS);
  } catch {
    // Never let feedback break a workout.
  }
}

/** The Android-only fallback, used only when the native module isn't there. */
function buzz(pattern: number | number[]) {
  if (nativeHaptics || Platform.OS !== 'android') {
    return;
  }
  try {
    Vibration.vibrate(pattern);
  } catch {
    // As above.
  }
}

/**
 * Plays a sequence of impacts.
 *
 * Scheduled taps rather than one call, because the good backend has no concept
 * of a pattern — it fires discrete impacts, which is exactly why it feels
 * better than a buzz of a given length. The gaps are short enough to read as
 * one gesture and long enough that the taptic engine doesn't swallow the
 * second.
 */
function sequence(steps: { at: number; style: Impact }[]) {
  for (const step of steps) {
    if (step.at === 0) {
      impact(step.style);
    } else {
      setTimeout(() => impact(step.style), step.at);
    }
  }
}

/**
 * A button was pressed. The lightest tick available — this fires on ordinary
 * taps, so anything heavier becomes irritating within a minute.
 */
export function tap() {
  impact('light');
  buzz(8);
}

/**
 * The workout just started and the shield went up. A rising two-beat: the same
 * "locked" news as `setStart`, but it's the start of everything.
 */
export function workoutStarted() {
  sequence([
    { at: 0, style: 'soft' },
    { at: 90, style: 'medium' },
  ]);
  buzz([0, 16, 70, 30]);
}

/**
 * Rest ran out on its own.
 *
 * Two beats, and the only reason this differs from `restSkipped` is where the
 * user's attention is. A rest period that expires by itself is the one moment in
 * a workout the app has to *interrupt* someone — they may be mid-scroll, mid-
 * conversation, or not holding the phone at all — so it opens with a soft beat
 * to catch attention and lands on the same `rigid` tick that has always meant
 * "shield up, go".
 *
 * `rigid` rather than something heavier: it's sharper without being harder,
 * which is the right texture for a lock snapping shut.
 */
export function restExpired() {
  sequence([
    { at: 0, style: 'soft' },
    { at: 90, style: 'rigid' },
  ]);
  buzz([0, 14, 76, 26]);
}

/**
 * Rest was cut short deliberately.
 *
 * One light tick, and nothing more. You pressed the button, you are looking at
 * the screen, and you already know what happened — anything heavier is the app
 * telling you something you just told it.
 */
export function restSkipped() {
  impact('light');
  buzz(10);
}

/** A set is banked and rest has begun. Short and affirmative. */
export function setBanked() {
  impact('medium');
  buzz(22);
}

/**
 * A record just fell. Three beats that accelerate, which is what makes it read
 * as a flourish rather than an alert.
 */
export function personalBest() {
  sequence([
    { at: 0, style: 'light' },
    { at: 70, style: 'medium' },
    { at: 130, style: 'heavy' },
  ]);
  buzz([0, 14, 55, 20, 45, 40]);
}

/** Workout finished. The heaviest thing here, and it lands last. */
export function workoutDone() {
  sequence([
    { at: 0, style: 'medium' },
    { at: 90, style: 'medium' },
    { at: 190, style: 'heavy' },
  ]);
  buzz([0, 26, 60, 26, 60, 46]);
}

/** Whether the good backend is available. Exported for the tests and the docs. */
export const hasNativeHaptics = nativeHaptics != null;
