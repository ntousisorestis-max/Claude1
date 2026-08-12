/**
 * Drives the real screens through the whole thing: create an exercise, tune
 * it, run it — set, rest, set, complete — checking the lock state flips at
 * each step and that two exercises keep their settings apart.
 */
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
import { MockBlocker } from '../src/blocking';
import { createReturningStorage } from '../src/state/storage';

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

/**
 * Presses the first tappable whose label starts with `prefix`.
 *
 * The exercise-card rows announce their current value ("Sets for Squat, 3.
 * Edit"), which is right for a screen reader and wrong to hard-code in a test
 * that is about to change that value.
 */
const pressStartingWith = (root: ReactTestInstance, prefix: string) => {
  const [node] = root.findAll(
    n =>
      typeof n.props?.accessibilityLabel === 'string' &&
      n.props.accessibilityLabel.startsWith(prefix) &&
      typeof n.props?.onPress === 'function',
  );
  if (!node) {
    throw new Error(`No pressable whose label starts with "${prefix}"`);
  }
  ReactTestRenderer.act(() => node.props.onPress());
};

/** The full label of the first tappable whose label starts with `prefix`. */
const labelStartingWith = (root: ReactTestInstance, prefix: string): string => {
  const [node] = root.findAll(
    n =>
      typeof n.props?.accessibilityLabel === 'string' &&
      n.props.accessibilityLabel.startsWith(prefix),
  );
  return node?.props.accessibilityLabel ?? '';
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

/** The checked/unchecked state a switch or checkbox is announcing. */
const isChecked = (root: ReactTestInstance, label: string): boolean => {
  const [node] = root.findAll(n => n.props?.accessibilityLabel === label);
  return node?.props?.accessibilityState?.checked === true;
};

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
      tree = ReactTestRenderer.create(
        <App storage={createReturningStorage()} backend={localOnlyBackend} />,
      );
    });
    trees.push(tree);
    return tree.root;
  };

  it('locks during sets, unlocks during rest, and finishes', async () => {
    const root = await launch();

    // --- An empty list, with the composer already open ------------------
    expect(hasText(root, 'Nothing here yet.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);

    addExercise(root, 'Squat');
    expect(hasText(root, 'Squat')).toBe(true);
    expect(labelStartingWith(root, 'Sets for Squat')).toContain(', 3.');

    // --- Tune this exercise down to two sets ----------------------------
    pressStartingWith(root, 'Sets for Squat');
    press(root, 'Decrease sets for Squat');
    expect(labelStartingWith(root, 'Sets for Squat')).toContain(', 2.');

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
    expect(hasText(root, 'Let’s lift')).toBe(true);
    expect(hasText(root, 'Squat')).toBe(true);
    expect(labelStartingWith(root, 'Sets for Squat')).toContain(', 2.');
  });

  it('keeps each exercise’s settings to itself', async () => {
    const root = await launch();

    addExercise(root, 'Squat');
    press(root, 'Add exercise');
    addExercise(root, 'Rows');

    // Squat gets 65s rest; Rows must not move.
    pressStartingWith(root, 'Rest time for Squat');
    press(root, 'Increase rest for Squat');
    pressStartingWith(root, 'Rest time for Squat');

    expect(labelStartingWith(root, 'Rest time for Squat')).toContain('65s');
    expect(labelStartingWith(root, 'Rest time for Rows')).toContain('60s');

    // And starting one runs that one.
    press(root, 'Start Rows');
    expect(hasText(root, 'Rows')).toBe(true);
    expect(hasLabel(root, 'Set 1 of 3')).toBe(true);
  });

  it('opens each settings row independently of the others', async () => {
    // Regression: all three rows shared one card-wide `expanded` flag, so
    // tapping any arrow opened all three sections at once.
    const root = await launch();

    addExercise(root, 'Squat');
    press(root, 'Add exercise');
    addExercise(root, 'Rows');

    /**
     * Whether a control is actually reachable, not merely present in the tree.
     *
     * A collapsed section keeps its children mounted so its height can be
     * animated — see Collapsible — and hides them with
     * `accessibilityElementsHidden`. "Is it in the tree" therefore stopped
     * being the right question; "would a screen reader or a thumb ever find
     * it" is, and it is the stronger assertion of the two.
     */
    const canEdit = (control: string) =>
      root
        .findAll(n => n.props?.accessibilityLabel === control)
        .some(node => {
          for (let at = node; at; at = at.parent as ReactTestInstance) {
            if (at.props?.accessibilityElementsHidden === true) {
              return false;
            }
          }
          return true;
        });

    // Nothing open to start with.
    expect(canEdit('Increase sets for Squat')).toBe(false);
    expect(canEdit('Increase rest for Squat')).toBe(false);

    // Opening Sets opens Sets, and only Sets.
    pressStartingWith(root, 'Sets for Squat');
    expect(canEdit('Increase sets for Squat')).toBe(true);
    expect(canEdit('Increase rest for Squat')).toBe(false);
    expect(canEdit('TikTok during Squat')).toBe(false);

    // Opening Rest time leaves Sets exactly where it was.
    pressStartingWith(root, 'Rest time for Squat');
    expect(canEdit('Increase sets for Squat')).toBe(true);
    expect(canEdit('Increase rest for Squat')).toBe(true);

    // Closing Rest time again leaves Sets alone too.
    pressStartingWith(root, 'Rest time for Squat');
    expect(canEdit('Increase sets for Squat')).toBe(true);
    expect(canEdit('Increase rest for Squat')).toBe(false);

    // And no row on one card reaches across to another card's rows.
    pressStartingWith(root, 'Blocked apps for Rows');
    expect(canEdit('TikTok during Rows')).toBe(true);
    expect(canEdit('Increase sets for Squat')).toBe(true);
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
    // The dialog fades out rather than vanishing instantly — see usePresence.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(hasText(root, 'End this workout?')).toBe(false);
    expect(MockBlocker.isLocked()).toBe(true);

    press(root, 'End workout');
    press(root, 'End it now');
    expect(hasText(root, 'Called it early.')).toBe(true);
    expect(MockBlocker.isLocked()).toBe(false);
  });

  it('deletes an exercise without opening anything first', async () => {
    // Delete used to live inside the expanded footer, so removing an exercise
    // meant first going to edit it. It is now a button in the card's header.
    const root = await launch();

    addExercise(root, 'Rows');
    press(root, 'Add exercise');
    addExercise(root, 'Squat');

    press(root, 'Delete Rows');
    expect(hasText(root, 'Delete Rows?')).toBe(true);

    press(root, 'Delete it');
    expect(hasText(root, 'Squat')).toBe(true);
    expect(hasText(root, 'Rows')).toBe(false);
  });

  it('asks before deleting, and keeps the exercise if you say no', async () => {
    const root = await launch();
    addExercise(root, 'Rows');

    press(root, 'Delete Rows');
    press(root, 'Keep it');

    // The dialog fades out rather than vanishing instantly — see usePresence.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(hasText(root, 'Delete Rows?')).toBe(false);
    expect(hasText(root, 'Rows')).toBe(true);
  });

  it('renames an exercise', async () => {
    const root = await launch();
    addExercise(root, 'Rows');

    pressStartingWith(root, 'Rename Rows');
    type(root, 'Exercise name', 'Barbell rows');
    press(root, 'Save name');

    expect(hasText(root, 'Barbell rows')).toBe(true);
    expect(labelStartingWith(root, 'Rename Barbell rows')).toContain('Rename');
  });

  it('carries the new name through to the workout', async () => {
    // The card announces itself by name in a dozen places — Start, the
    // steppers, the app checkboxes. A rename that only changed the heading
    // would leave every one of them stale.
    const root = await launch();
    addExercise(root, 'Rows');

    pressStartingWith(root, 'Rename Rows');
    type(root, 'Exercise name', 'Barbell rows');
    press(root, 'Save name');

    press(root, 'Start Barbell rows');
    expect(hasText(root, 'Barbell rows')).toBe(true);
    expect(hasLabel(root, 'Set 1 of 3')).toBe(true);
  });

  it('refuses a rename that collides with another exercise', async () => {
    const root = await launch();
    addExercise(root, 'Rows');
    press(root, 'Add exercise');
    addExercise(root, 'Squat');

    pressStartingWith(root, 'Rename Rows');
    type(root, 'Exercise name', 'Squat');

    // Said out loud rather than silently refused on save — the reducer would
    // drop it either way, and a field that closed and reverted with no
    // explanation is the worse half of that.
    expect(hasText(root, 'You already have an exercise called Squat')).toBe(true);

    const [save] = root.findAll(n => n.props?.accessibilityLabel === 'Save name');
    expect(save.props.accessibilityState.disabled).toBe(true);
  });

  it('leaves the other cards alone when one is renamed', async () => {
    const root = await launch();
    addExercise(root, 'Rows');
    press(root, 'Add exercise');
    addExercise(root, 'Squat');

    pressStartingWith(root, 'Rename Rows');
    type(root, 'Exercise name', 'Barbell rows');
    press(root, 'Save name');

    expect(hasText(root, 'Barbell rows')).toBe(true);
    expect(hasText(root, 'Squat')).toBe(true);
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

  it('silent mode mutes the alert without losing it', async () => {
    const root = await launch();
    addExercise(root, 'Rows');

    (notifee.createChannel as jest.Mock).mockClear();
    (notifee.createTriggerNotification as jest.Mock).mockClear();

    press(root, 'Settings');
    expect(isChecked(root, 'Sound')).toBe(true);
    expect(isChecked(root, 'Silent mode')).toBe(false);

    press(root, 'Silent mode');

    // One setting, two faces: they can never be set to disagree.
    expect(isChecked(root, 'Silent mode')).toBe(true);
    expect(isChecked(root, 'Sound')).toBe(false);

    // Run a rest period and check what actually got scheduled.
    press(root, 'Workout');
    press(root, 'Start Rows');
    press(root, 'Done with set');
    // The notification is posted behind an await on the channel, so let the
    // microtasks settle before asking what was scheduled.
    await ReactTestRenderer.act(async () => {});

    const channels = (notifee.createChannel as jest.Mock).mock.calls.map(c => c[0]);
    expect(channels.some(c => c.sound === 'none')).toBe(true);

    // The point of the feature: the notification is still posted.
    expect(notifee.createTriggerNotification as jest.Mock).toHaveBeenCalled();
    const [notification] = (notifee.createTriggerNotification as jest.Mock).mock
      .calls[0];
    expect(notification.title).toBe('Time’s up!');
    // And iOS gets no sound key at all, which is how it delivers silently.
    expect(notification.ios.sound).toBeUndefined();
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
