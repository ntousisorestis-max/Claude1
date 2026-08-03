/**
 * The sound module, against a fake AudioContext.
 *
 * What's worth testing here isn't the notes — those are taste — but the gate:
 * Silent mode has to be genuinely silent, and a missing audio backend has to be
 * silence rather than a crash. A sound effect is the most disposable thing in
 * this app and must never be the thing that breaks a workout.
 */
// `mock`-prefixed so Jest allows the factory below to close over it — the
// hoisted factory otherwise runs before any ordinary variable exists.
const mockCreateAudioContext = jest.fn();

jest.mock('../src/sound/audioContext', () => ({
  createAudioContext: () => mockCreateAudioContext(),
}));

import {
  playSetComplete,
  playWorkoutComplete,
  resetSoundForTests,
  setSoundEnabled,
} from '../src/sound';

/** Records every oscillator the module asks for. */
function fakeContext() {
  const started: { frequency: number; at: number }[] = [];
  let now = 0;

  const context = {
    get currentTime() {
      return now;
    },
    state: 'running',
    destination: {},
    resume: jest.fn(),
    createOscillator: () => {
      const oscillator = {
        type: '',
        frequency: {
          setValueAtTime: (value: number) => {
            oscillator._frequency = value;
          },
        },
        _frequency: 0,
        connect: () => {},
        start: (at: number) => started.push({ frequency: oscillator._frequency, at }),
        stop: () => {},
      };
      return oscillator;
    },
    createGain: () => ({
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    }),
  };

  return { context, started, advance: (by: number) => (now += by) };
}

describe('sound', () => {
  beforeEach(() => {
    resetSoundForTests();
    mockCreateAudioContext.mockReset();
  });

  it('plays a bell when a set is banked', () => {
    const fake = fakeContext();
    mockCreateAudioContext.mockReturnValue(fake.context);

    playSetComplete();

    // A fundamental and its fifth above, struck together.
    expect(fake.started.map(n => n.frequency)).toEqual([880, 1320]);
  });

  it('plays a longer, arpeggiated figure when the workout ends', () => {
    const fake = fakeContext();
    mockCreateAudioContext.mockReturnValue(fake.context);

    playWorkoutComplete();

    expect(fake.started).toHaveLength(5);
    // The three that carry the melody rise.
    const melody = fake.started.slice(0, 3).map(n => n.frequency);
    expect(melody[0]).toBeLessThan(melody[1]);
    expect(melody[1]).toBeLessThan(melody[2]);
    // And they're staggered rather than struck as a chord.
    expect(fake.started[1].at).toBeGreaterThan(fake.started[0].at);
  });

  it('makes no sound at all in Silent mode', () => {
    const fake = fakeContext();
    mockCreateAudioContext.mockReturnValue(fake.context);

    setSoundEnabled(false);
    playSetComplete();
    playWorkoutComplete();

    expect(fake.started).toHaveLength(0);
    // And it doesn't even reach for an audio context — Silent mode shouldn't
    // grab the audio session away from whatever the user is listening to.
    expect(mockCreateAudioContext).not.toHaveBeenCalled();
  });

  it('starts making sound again when the setting comes back on', () => {
    const fake = fakeContext();
    mockCreateAudioContext.mockReturnValue(fake.context);

    setSoundEnabled(false);
    playSetComplete();
    setSoundEnabled(true);
    playSetComplete();

    expect(fake.started).toHaveLength(2);
  });

  it('stays quiet, and stays alive, with no audio backend', () => {
    // This is the browser before a user gesture, and every native build until
    // react-native-audio-api is linked.
    mockCreateAudioContext.mockReturnValue(null);

    expect(() => {
      playSetComplete();
      playWorkoutComplete();
    }).not.toThrow();
  });

  it('only builds one audio context, however much it plays', () => {
    const fake = fakeContext();
    mockCreateAudioContext.mockReturnValue(fake.context);

    playSetComplete();
    playSetComplete();
    playWorkoutComplete();

    expect(mockCreateAudioContext).toHaveBeenCalledTimes(1);
  });

  it('gives up quietly rather than retrying a backend that failed', () => {
    mockCreateAudioContext.mockReturnValue(null);

    playSetComplete();
    playSetComplete();

    expect(mockCreateAudioContext).toHaveBeenCalledTimes(1);
  });
});
