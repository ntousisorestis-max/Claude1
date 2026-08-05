/**
 * Which haptic fires at which moment, driven through the real screens.
 *
 * This is the only verification haptics can have in this project. No native
 * build has compiled, and a browser has nothing to fire — so how any of it
 * *feels* is unknown and stays unknown until someone holds a phone. What can be
 * pinned down is the wiring: that the right function is called at the right
 * transition, exactly once, and that the two ways rest can end are told apart.
 *
 * The module is mocked wholesale, which also stubs the `tap` that every
 * pressable fires through `usePressScale`. That's deliberate: a test that
 * counted button taps alongside workout beats would break every time a screen
 * grew a button.
 */
jest.mock('../src/haptics', () => ({
  tap: jest.fn(),
  workoutStarted: jest.fn(),
  restExpired: jest.fn(),
  restSkipped: jest.fn(),
  setBanked: jest.fn(),
  personalBest: jest.fn(),
  workoutDone: jest.fn(),
  hasNativeHaptics: false,
}));

import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import notifee, { EventType } from '@notifee/react-native';
import App from '../App';
// The do-nothing cloud, passed explicitly. Before Firebase was configured this
// was what `<App />` picked by itself; now that a project exists, the default is
// the real SDK — which these tests have no business starting, and which Jest
// can't even parse (it ships as ESM, and node_modules isn't transformed).
// Naming it here keeps this suite about the app and off the network.
import { localOnlyBackend } from '../src/cloud/backend';
import * as haptics from '../src/haptics';
import { createReturningStorage } from '../src/state/storage';

const beats = haptics as unknown as Record<string, jest.Mock>;

const press = (root: ReactTestInstance, accessibilityLabel: string) => {
  const [node] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onPress === 'function',
  );
  if (!node) {
    throw new Error(`No pressable labelled "${accessibilityLabel}"`);
  }
  ReactTestRenderer.act(() => node.props.onPress());
};

/** Fires a "Time's up!" press through the listener notifee itself would call. */
const pressNotification = () => {
  const calls = (notifee.onForegroundEvent as jest.Mock).mock.calls;
  const observer = calls[calls.length - 1]?.[0];
  if (!observer) {
    throw new Error('Nothing subscribed to notifee foreground events');
  }
  ReactTestRenderer.act(() => {
    observer({ type: EventType.PRESS, detail: { notification: { id: 'rest-over' } } });
  });
};

const typeInto = (root: ReactTestInstance, placeholder: string, value: string) => {
  const [input] = root.findAll(n => n.props?.placeholder === placeholder);
  ReactTestRenderer.act(() => input.props.onChangeText(value));
};

describe('haptics', () => {
  const trees: ReactTestRenderer.ReactTestRenderer[] = [];

  beforeEach(() => {
    jest.useFakeTimers();
    Object.values(beats).forEach(fn => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear();
      }
    });
  });

  afterEach(() => {
    trees.forEach(t => ReactTestRenderer.act(() => t.unmount()));
    trees.length = 0;
    jest.useRealTimers();
  });

  const launch = async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <App storage={createReturningStorage()} backend={localOnlyBackend} />,
      );
    });
    trees.push(tree);
    return tree.root;
  };

  const startWorkout = (root: ReactTestInstance, name = 'Squat') => {
    typeInto(root, 'Bench press', name);
    press(root, 'Save exercise');
    press(root, `Start ${name}`);
  };

  it('marks the start of a workout, not just the start of a set', async () => {
    // The first set is the start of everything and gets its own rising double.
    const root = await launch();
    startWorkout(root);

    expect(beats.workoutStarted).toHaveBeenCalledTimes(1);
    expect(beats.restExpired).not.toHaveBeenCalled();
    expect(beats.restSkipped).not.toHaveBeenCalled();
  });

  it('banks a set with a single beat', async () => {
    const root = await launch();
    startWorkout(root);
    beats.workoutStarted.mockClear();

    press(root, 'Done with set');

    expect(beats.setBanked).toHaveBeenCalledTimes(1);
    expect(beats.workoutDone).not.toHaveBeenCalled();
  });

  it('uses the two-beat pattern when rest runs out on its own', async () => {
    // The one moment the app has to reach someone who may not be looking.
    const root = await launch();
    startWorkout(root);
    press(root, 'Done with set');

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(61_000);
    });

    expect(beats.restExpired).toHaveBeenCalledTimes(1);
    expect(beats.restSkipped).not.toHaveBeenCalled();
  });

  it('uses the light single beat when rest is cut short', async () => {
    // You pressed the button; you already know what happened.
    const root = await launch();
    startWorkout(root);
    press(root, 'Done with set');

    press(root, 'Skip rest');

    expect(beats.restSkipped).toHaveBeenCalledTimes(1);
    expect(beats.restExpired).not.toHaveBeenCalled();
  });

  it('treats a notification tap as a deliberate return', async () => {
    // Tapping "Time's up!" is a press, by someone holding the phone and looking
    // at it — the same situation as Skip rest, and it gets the same light beat.
    // Documented by a test because it is the one path where which of the two
    // fires is not obvious from the screen you were on.
    const root = await launch();
    startWorkout(root);
    press(root, 'Done with set');

    pressNotification();

    expect(beats.restSkipped).toHaveBeenCalledTimes(1);
    expect(beats.restExpired).not.toHaveBeenCalled();
  });

  it('lands the heaviest pattern on the finished workout', async () => {
    const root = await launch();
    typeInto(root, 'Bench press', 'Rows');
    press(root, 'Save exercise');
    press(root, 'Start Rows');
    press(root, 'End workout');
    press(root, 'End it now');

    expect(beats.workoutDone).toHaveBeenCalledTimes(1);
  });

  it('fires each beat once per transition, not once per render', async () => {
    const root = await launch();
    startWorkout(root);
    press(root, 'Done with set');

    // Sit on the rest screen while the countdown re-renders every second.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(beats.setBanked).toHaveBeenCalledTimes(1);
    expect(beats.restExpired).not.toHaveBeenCalled();
  });
});
