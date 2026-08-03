/**
 * An AudioContext on a phone.
 *
 * `react-native-audio-api` implements the Web Audio API natively, which is the
 * whole reason it was chosen: the synthesis in ../sound.ts is written once and
 * runs unchanged in a browser and on a device. The alternative — shipping
 * generated WAV files and a sample player — meant two implementations, two
 * sets of assets, and a binary that has to be regenerated to change a note.
 *
 * Loaded through `require` rather than a static import so a missing or unlinked
 * native module degrades to silence instead of a red screen. Sound is the most
 * disposable thing in this app; it must never be the thing that breaks it.
 *
 * The `.web.ts` twin next to this file returns the browser's own AudioContext.
 */

/** The slice of the Web Audio API this app actually uses. */
export type MinimalAudioContext = {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void> | void;
  createOscillator(): any;
  createGain(): any;
};

export function createAudioContext(): MinimalAudioContext | null {
  try {
    const { AudioContext } = require('react-native-audio-api');
    return AudioContext ? (new AudioContext() as MinimalAudioContext) : null;
  } catch {
    return null;
  }
}
