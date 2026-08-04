/**
 * The iOS audio session, tested through the real `audioContext.ts` with a fake
 * native module.
 *
 * Its own file rather than a block inside sound.test.ts, because that file
 * mocks `audioContext` wholesale — and a hoisted module mock cannot be undone
 * for four tests in the middle of it.
 *
 * This is the only check there can be. Whether iOS actually honours the
 * ring/silent switch for an `ambient` session is a question for a device, and
 * no native build has compiled in this project. What *is* testable: that the
 * app asks for the right category, asks once, asks before the first sound is
 * routed, and doesn't die when the library is too old to be asked.
 */

/** Loads a fresh copy of the module against a fake react-native-audio-api. */
function withLibrary(library: object, run: (mod: any) => void) {
  jest.isolateModules(() => {
    jest.doMock('react-native-audio-api', () => library);
    run(jest.requireActual('../src/sound/audioContext'));
  });
}

describe('the iOS audio session', () => {
  afterEach(() => {
    jest.dontMock('react-native-audio-api');
  });

  /** A library that records how it was configured, and when. */
  const spyLibrary = () => {
    const setAudioSessionOptions = jest.fn();
    /** How many times the session had been configured when a context was built. */
    const configuredBeforeContext: number[] = [];
    return {
      setAudioSessionOptions,
      configuredBeforeContext,
      library: {
        AudioManager: { setAudioSessionOptions },
        AudioContext: function () {
          configuredBeforeContext.push(setAudioSessionOptions.mock.calls.length);
          return {};
        },
      },
    };
  };

  it('asks for a category that obeys the ring/silent switch', () => {
    const spy = spyLibrary();
    withLibrary(spy.library, mod => mod.createAudioContext());

    // `playback` would play straight through a silenced phone. That is right
    // for a music app and wrong for this one.
    expect(spy.setAudioSessionOptions).toHaveBeenCalledTimes(1);
    expect(spy.setAudioSessionOptions.mock.calls[0][0].iosCategory).toBe('ambient');
  });

  it('asks not to interrupt whatever the user is listening to', () => {
    const spy = spyLibrary();
    withLibrary(spy.library, mod => mod.createAudioContext());

    // Someone lifting almost certainly has headphones in; a chime that ducked
    // their track twice a minute would be worse than no chime.
    expect(spy.setAudioSessionOptions.mock.calls[0][0].iosOptions).toContain(
      'mixWithOthers',
    );
  });

  it('configures the session before the first context exists', () => {
    // The category decides how the very first sound is routed. Setting it
    // afterwards would leave one bell already committed to the wrong one.
    const spy = spyLibrary();
    withLibrary(spy.library, mod => mod.createAudioContext());

    expect(spy.configuredBeforeContext).toEqual([1]);
  });

  it('configures it once, however many contexts are asked for', () => {
    const spy = spyLibrary();
    withLibrary(spy.library, mod => {
      mod.createAudioContext();
      mod.createAudioContext();
      mod.createAudioContext();
    });

    expect(spy.setAudioSessionOptions).toHaveBeenCalledTimes(1);
  });

  it('still plays when the library is too old to have an AudioManager', () => {
    // An unconfigured session plays; it just plays through silent mode. That is
    // a worse behaviour and never a reason to crash or fall silent.
    let context: unknown = null;
    withLibrary({ AudioContext: function () { return {}; } }, mod => {
      expect(() => {
        context = mod.createAudioContext();
      }).not.toThrow();
    });

    expect(context).not.toBeNull();
  });

  it('stays silent rather than throwing when configuring the session fails', () => {
    let context: unknown = 'unset';
    withLibrary(
      {
        AudioManager: {
          setAudioSessionOptions: () => {
            throw new Error('no such session');
          },
        },
        AudioContext: function () {
          return {};
        },
      },
      mod => {
        expect(() => {
          context = mod.createAudioContext();
        }).not.toThrow();
      },
    );

    // The throw is swallowed and the context is still handed back.
    expect(context).not.toBeNull();
  });
});
