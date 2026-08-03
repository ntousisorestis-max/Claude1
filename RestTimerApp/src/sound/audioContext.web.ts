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

export type { MinimalAudioContext };
