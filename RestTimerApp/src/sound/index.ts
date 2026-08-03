import { createAudioContext, type MinimalAudioContext } from './audioContext';

/**
 * Two sounds, synthesised.
 *
 * ## Why not audio files
 *
 * A bell that is a handful of sine waves and an exponential decay is a dozen
 * lines here and nothing in the bundle, and changing a note is changing a
 * number. The same two sounds as assets would be a pair of files per platform,
 * a loader, and a regeneration step every time the tuning is wrong — and it
 * would sound identical, because this *is* how a soft bell is made.
 *
 * ## Why these notes
 *
 * Both sounds are built on a perfect fifth (a 3:2 frequency ratio), which is
 * the most consonant interval there is after the octave — it reads as resolved
 * rather than as a notification demanding something. Everything decays
 * exponentially and nothing sustains: a tone that lingers is a tone that gets
 * in the way of the next rep.
 *
 * Peak gain is deliberately low. This has to sit under a gym's worth of noise
 * without ever being the loudest thing in a quiet room, and the app's whole
 * argument is that your phone should be less present, not more.
 *
 * ## The Sound / Silent mode setting
 *
 * One gate, `setSoundEnabled`, kept in step by WorkoutContext with the same
 * `defaults.soundEnabled` that drives the notification channel. Silent mode
 * means silent — the visual and the haptic still land, exactly as with the
 * rest-over alert.
 */

/** Loud enough to notice in a gym, quiet enough not to embarrass anyone. */
const PEAK = 0.16;

let context: MinimalAudioContext | null = null;
let unavailable = false;
let enabled = true;

/** Mirrors `defaults.soundEnabled`. Silent mode routes through here. */
export function setSoundEnabled(next: boolean) {
  enabled = next;
}

/**
 * The context, made on first use.
 *
 * Not at import time: a browser refuses to start one before a user gesture, and
 * constructing it eagerly on iOS grabs the audio session from whatever the user
 * had playing. By the time either sound fires, several buttons have been
 * pressed.
 */
function audio(): MinimalAudioContext | null {
  if (unavailable) {
    return null;
  }
  if (!context) {
    context = createAudioContext();
    if (!context) {
      unavailable = true;
      return null;
    }
  }
  if (context.state === 'suspended') {
    // Fire and forget. If it fails the notes are simply never heard, which is
    // the correct failure for a sound effect.
    Promise.resolve(context.resume()).catch(() => {});
  }
  return context;
}

/** One note: a sine with a fast attack and an exponential tail. */
function note(
  ctx: MinimalAudioContext,
  {
    frequency,
    at,
    duration,
    gain,
  }: { frequency: number; at: number; duration: number; gain: number },
) {
  const start = ctx.currentTime + at;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);

  // Ramped, not switched. A gain that jumps from 0 produces a click at the
  // start of every note, and a click is the single most cheap-sounding thing
  // an interface can do.
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function play(notes: Parameters<typeof note>[1][]) {
  if (!enabled) {
    return;
  }
  const ctx = audio();
  if (!ctx) {
    return;
  }
  try {
    for (const spec of notes) {
      note(ctx, spec);
    }
  } catch {
    // A sound effect is never worth an exception reaching a workout.
  }
}

/**
 * A set is banked.
 *
 * One soft bell — A5 with its fifth above it, quieter, so the pair reads as a
 * single struck tone with some shine on it rather than as two notes. Short,
 * because this fires several times a workout.
 */
export function playSetComplete() {
  play([
    { frequency: 880, at: 0, duration: 0.42, gain: PEAK },
    { frequency: 1320, at: 0.005, duration: 0.3, gain: PEAK * 0.42 },
  ]);
}

/**
 * The whole workout is done.
 *
 * The same bell, arpeggiated up a fifth and then an octave — D5, A5, D6 — with
 * a low D3 underneath it that outlasts the rest and gives the flourish a floor
 * to sit on. Under a second, and it resolves rather than fading out mid-phrase.
 */
export function playWorkoutComplete() {
  play([
    { frequency: 587.33, at: 0, duration: 0.34, gain: PEAK * 0.9 },
    { frequency: 880, at: 0.11, duration: 0.36, gain: PEAK * 0.95 },
    { frequency: 1174.66, at: 0.22, duration: 0.62, gain: PEAK },
    { frequency: 1760, at: 0.235, duration: 0.5, gain: PEAK * 0.3 },
    { frequency: 146.83, at: 0.02, duration: 0.85, gain: PEAK * 0.5 },
  ]);
}

/** Testing seam: forget the context so the next play builds a fresh one. */
export function resetSoundForTests() {
  context = null;
  unavailable = false;
  enabled = true;
}
