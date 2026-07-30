/**
 * Drives the real screens through a whole workout: setup -> set -> rest ->
 * set -> complete, checking the lock state flips at each step.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { MockBlocker } from '../src/blocking';

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

/** Terse visuals (e.g. "01/03") carry the full sentence as an a11y label. */
const hasLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props?.accessibilityLabel === label).length > 0;

describe('full workout loop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('locks during sets, unlocks during rest, and finishes', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    const root = tree.root;

    // --- Setup ---------------------------------------------------------
    expect(hasText(root, 'New workout')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    type(root, 'Bench press', 'Squat');
    press(root, 'Decrease Sets'); // 3 -> 2 sets, to keep the test short
    press(root, 'Start Workout');

    // --- Set 1: apps blocked -------------------------------------------
    expect(hasText(root, 'Squat')).toBe(true);
    expect(hasLabel(root, 'Set 1 of 2')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'Done with Set');

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
    press(root, 'Done with Set');
    expect(hasText(root, 'Workout complete.')).toBe(true);
    expect(hasText(root, '2 of 2')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    press(root, 'New Workout');
    expect(hasText(root, 'New workout')).toBe(true);
  });

  it('re-locks immediately when rest is skipped', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    const root = tree.root;

    type(root, 'Bench press', 'Rows');
    press(root, 'Start Workout');
    press(root, 'Done with Set');
    expect(MockBlocker.isLocked()).toBe(false);

    press(root, 'Skip Rest');
    expect(MockBlocker.isLocked()).toBe(true);
    expect(hasLabel(root, 'Set 2 of 3')).toBe(true);
  });
});
