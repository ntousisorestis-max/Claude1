import type { MinimalAudioContext } from './audioContext';

/**
 * An AudioContext in a browser.
 *
 * Same shape as the native twin, so ../sound.ts never learns which one it got.
 * `webkitAudioContext` is still what Safari exposes on older iOS.
 */
export function createAudioContext(): MinimalAudioContext | null {
  // Reached through `globalThis` rather than `window` because this project's
  // tsconfig has no DOM lib — it is a React Native app that happens to also
  // build for the web, and pulling in DOM globally would let `document` slip
  // into files that run on a phone.
  const root = globalThis as any;
  const Ctor = root?.AudioContext ?? root?.webkitAudioContext ?? null;
  if (!Ctor) {
    return null;
  }
  try {
    return new Ctor() as MinimalAudioContext;
  } catch {
    return null;
  }
}

/**
 * Nothing to configure in a browser.
 *
 * Present only so the two files export the same shape — there is no audio
 * session on the web, and the machine's volume and mute belong to the OS.
 */
export function resetAudioSessionForTests() {}

export type { MinimalAudioContext };
