/**
 * Drives the real screens through the whole thing: create an exercise, tune
 * it, run it — set, rest, set, complete — checking the lock state flips at
 * each step and that two exercises keep their settings apart.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import notifee, { EventType } from '@notifee/react-native';
import App from '../App';
import { MockBlocker } from '../src/blocking';
import { createMemoryStorage } from '../src/state/storage';

/**
 * Fires the "Time's up!" notification press through the same listener notifee
 * would call, so the test exercises the real wiring rather than a shortcut.
 */
const pressNotification = (id = 'rest-over') => {
  const calls = (notifee.onForegroundEvent as jest.Mock).mock.calls;
  const observer = calls[calls.length - 1]?.[0];
  if (!observer) {
    throw new Error('Nothing subscribed to notifee foreground events');
  }
  ReactTestRenderer.act(() => {
    observer({ type: EventType.PRESS, detail: { notification: { id } } });
  });
};

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

const type = (root: ReactTestInstance, placeholder: string, value: string) => {
  const [input] = root.findAll(n => n.props?.placeholder === placeholder);
  ReactTestRenderer.act(() => input.props.onChangeText(value));
};

/** Joins each host node's inline children, so "Set {n} of {m}" reads as one string. */
const texts = (root: ReactTestInstance): string[] =>
  root
    .findAll(n => typeof n.type === 'string' && n.props?.children != null)
    .map(n =>
      [n.props.children]
        .flat(Infinity)
        .filter(c => typeof c === 'string' || typeof c === 'number')
        .join(''),
    );

const hasText = (root: ReactTestInstance, needle: string) =>
  texts(root).some(t => t.includes(needle));

/** The set counter is split across several Texts but grouped under one label. */
const hasLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props?.accessibilityLabel === label).length > 0;

/** Types a name into the composer and saves it. */
const addExercise = (root: ReactTestInstance, name: string) => {
  type(root, 'Bench press', name);
  press(root, 'Save exercise');
};

describe('full workout loop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    trees.forEach(t => ReactTestRenderer.act(() => t.unmount()));
    trees.length = 0;
    jest.useRealTimers();
  });

  /** Unmounted in afterEach so no animation outlives the test. */
  const trees: ReactTestRenderer.ReactTestRenderer[] = [];

  /** Its own storage each time — the default one is shared across mounts. */
  const launch = async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App storage={createMemoryStorage()} />);
    });
    trees.push(tree);
    return tree.root;
  };

  it('locks during sets, unlocks during rest, and finishes', async () => {
    const root = await launch();

    // --- An empty list, with the composer already open ------------------
    expect(hasText(root, 'Nothing saved yet.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    addExercise(root, 'Squat');
    expect(hasText(root, 'Squat')).toBe(true);
    expect(hasText(root, '3 sets')).toBe(true);

    // --- Tune this exercise down to two sets ----------------------------
    press(root, 'Squat, edit');
    press(root, 'Decrease sets for Squat');
    expect(hasText(root, '2 sets')).toBe(true);

    press(root, 'Start Squat');

    // --- Set 1: apps blocked -------------------------------------------
    expect(hasLabel(root, 'Set 1 of 2')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'Done with set');

    // --- Rest: apps unlocked, countdown running ------------------------
    expect(hasText(root, 'Scroll away.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);
    expect(hasText(root, '01:00')).toBe(true);

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(hasText(root, '00:30')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    // --- Rest expires: re-locked, back on the next set -----------------
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(31_000);
    });
    expect(hasLabel(root, 'Set 2 of 2')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(true);

    // --- Last set: complete, unlocked for good -------------------------
    press(root, 'Done with set');
    expect(hasText(root, 'That’s the work.')).toBe(true);
    expect(hasText(root, '2 of 2')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    // Time reclaimed is revealed here and nowhere else — the rest screens
    // deliberately never showed it accruing.
    expect(hasText(root, 'You kept your phone down for')).toBe(true);

    // --- And back to the list, exercise intact -------------------------
    press(root, 'New workout');
    expect(hasText(root, 'Your lifts')).toBe(true);
    expect(hasText(root, 'Squat')).toBe(true);
    expect(hasText(root, '2 sets')).toBe(true);
  });

  it('keeps each exercise’s settings to itself', async () => {
    const root = await launch();

    addExercise(root, 'Squat');
    press(root, 'Add exercise');
    addExercise(root, 'Rows');

    // Squat gets 90s rest; Rows must not move.
    press(root, 'Squat, edit');
    press(root, 'Increase rest for Squat');
    press(root, 'Squat, done editing');

    expect(hasText(root, '65s rest')).toBe(true);
    expect(hasText(root, '60s rest')).toBe(true);

    // And starting one runs that one.
    press(root, 'Start Rows');
    expect(hasText(root, 'Rows')).toBe(true);
    expect(hasLabel(root, 'Set 1 of 3')).toBe(true);
  });

  it('ends the workout through the confirm dialog', async () => {
    // Regression: this used to go through Alert.alert, whose react-native-web
    // implementation is an empty function — the button did nothing at all in a
    // browser, and no test noticed because Alert is mocked away on native.
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Start Rows');
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'End workout');
    expect(hasText(root, 'End this workout?')).toBe(true);
    // Still running: asking is not doing.
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'Keep going');
    expect(hasText(root, 'End this workout?')).toBe(false);
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'End workout');
    press(root, 'End it now');
    expect(hasText(root, 'Called it early.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);
  });

  it('deletes an exercise through the confirm dialog', async () => {
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Add exercise');
    addExercise(root, 'Squat');

    press(root, 'Rows, edit');
    press(root, 'Delete Rows');
    expect(hasText(root, 'Delete Rows?')).toBe(true);

    press(root, 'Delete it');
    expect(hasText(root, 'Squat')).toBe(true);
    expect(hasText(root, 'Rows')).toBe(false);
  });

  it('lands on the active set when the notification is tapped', async () => {
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Start Rows');
    press(root, 'Done with set');
    expect(hasText(root, 'Scroll away.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    // Tapping it should put the user on the set they were about to do — not
    // just open the app on whatever screen it happened to be showing.
    pressNotification();

    expect(hasLabel(root, 'Set 2 of 3')).toBe(true);
    expect(hasText(root, 'Rows')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(true);
  });

  it('ignores a tap on somebody else’s notification', async () => {
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Start Rows');
    press(root, 'Done with set');

    pressNotification('some-other-app');
    expect(hasText(root, 'Scroll away.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);
  });

  it('re-locks immediately when rest is skipped', async () => {
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Start Rows');
    press(root, 'Done with set');
    expect(MockBlocker.isLocked()).toBe(false);

    press(root, 'Skip rest');
    expect(MockBlocker.isLocked()).toBe(true);
    expect(hasLabel(root, 'Set 2 of 3')).toBe(true);
  });
});
