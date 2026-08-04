/**
 * An AudioContext on a phone, and the audio session it plays through.
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
 * The `.web.ts` twin next to this file returns the browser's own AudioContext
 * and configures nothing — a browser has no audio session, and the machine's
 * volume and mute are the OS's business, not the page's.
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

/**
 * How this app is allowed to make noise on iOS.
 *
 * ## `ambient`, so the ring/silent switch means what it says
 *
 * iOS decides whether the hardware mute switch silences an app purely from its
 * `AVAudioSession` category, and the difference is stark: `playback` plays
 * straight through a silenced phone — correct for a music app, which is why
 * audio libraries tend to default to it, and wrong for everything else.
 * `ambient` and `soloAmbient` obey the switch.
 *
 * A rest timer is not a music app. Somebody who has flicked their phone to
 * silent, in a gym, has been unambiguous, and a bell that fires anyway is the
 * app deciding it knows better. The Sound toggle in Settings already exists for
 * people who want it off in software; this is for the switch on the side of the
 * phone.
 *
 * ## `mixWithOthers`, so it doesn't stop the music
 *
 * `ambient` mixes by default; naming the option makes that a decision rather
 * than an inherited side effect, and keeps it true if the category is ever
 * revisited. It matters here more than in most apps: someone lifting is very
 * likely to have headphones in, and a chime that ducked or paused their track
 * twice a minute would be worse than no chime at all.
 *
 * ## Not verified
 *
 * None of this can run in a browser or in the tests — it is an iOS session API
 * reached through a native module, and no native build has compiled in this
 * project yet. The call is guarded, so a version of the library without
 * `AudioManager` is silently skipped rather than fatal, and the shape of the
 * call is asserted in __tests__/sound.test.ts. Whether the switch is actually
 * obeyed is a question only a real iPhone can answer.
 */
const SESSION = {
  iosCategory: 'ambient' as const,
  iosMode: 'default' as const,
  iosOptions: ['mixWithOthers' as const],
};

/** Configured once, on the same first use that builds the context. */
let sessionConfigured = false;

function configureSession(module: any) {
  if (sessionConfigured) {
    return;
  }
  sessionConfigured = true;
  try {
    module?.AudioManager?.setAudioSessionOptions?.(SESSION);
  } catch {
    // An unconfigured session still plays; it just plays through silent mode.
    // Worth a worse behaviour, never worth a crash.
  }
}

export function createAudioContext(): MinimalAudioContext | null {
  try {
    const module = require('react-native-audio-api');

    // Before the context exists, deliberately: the session category decides how
    // the very first sound is routed, and setting it afterwards would leave one
    // bell already committed to the wrong one.
    configureSession(module);

    const { AudioContext } = module;
    return AudioContext ? (new AudioContext() as MinimalAudioContext) : null;
  } catch {
    return null;
  }
}

/** Testing seam: forget that the session was configured. */
export function resetAudioSessionForTests() {
  sessionConfigured = false;
}
