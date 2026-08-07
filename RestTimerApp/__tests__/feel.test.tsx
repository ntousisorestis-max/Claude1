/**
 * The personality layer: the tease for skipping rest, the personal-best
 * flourish, and the sound gate.
 *
 * These are the parts of "make it feel good" that are actually logic rather
 * than taste — when a line appears, when it doesn't, and whether Silent mode is
 * genuinely silent. The taste is in copy.ts and can only be judged by reading
 * it.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { createReturningStorage } from '../src/state/storage';
import { NO_STREAK, type StreakState } from '../src/cloud/days';
import {
  NO_RECORDS,
  NO_TOTALS,
  type AccountData,
  type AuthUser,
  type CloudBackend,
  type DayTotals,
} from '../src/cloud/types';
import { CUT_SHORT_LINES, FINISHED_LINES, SKIPPED_REST_LINES } from '../src/copy';

/* -------------------------------------------------------------------------- */
/* A cloud whose account data the test drives                                 */
/* -------------------------------------------------------------------------- */

function createFakeCloud() {
  let notifyUser: ((user: AuthUser | null) => void) | null = null;
  let notifyAccount: ((data: AccountData) => void) | null = null;

  const backend: CloudBackend = {
    observeUser(onChange) {
      notifyUser = onChange;
      onChange(null);
      return () => {};
    },
    observeAccount(_uid, onChange) {
      notifyAccount = onChange;
      onChange({ totals: NO_TOTALS, streak: NO_STREAK, records: NO_RECORDS });
      return () => {};
    },
    observeDays(_uid, _since, onChange: (days: DayTotals[]) => void) {
      onChange([]);
      return () => {};
    },
    async signUp(_email, _password, displayName) {
      notifyUser?.({ uid: 'u1', displayName });
    },
    async signIn(email) {
      notifyUser?.({ uid: 'u1', displayName: email });
    },
    async signOut() {
      notifyUser?.(null);
    },
    async recordWorkout() {},
  };

  return {
    backend,
    pushStreak(streak: StreakState) {
      ReactTestRenderer.act(() =>
        notifyAccount?.({ totals: NO_TOTALS, streak, records: NO_RECORDS }),
      );
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

const pressAsync = async (root: ReactTestInstance, accessibilityLabel: string) => {
  const [node] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onPress === 'function',
  );
  await ReactTestRenderer.act(async () => {
    await node.props.onPress();
  });
};

const fill = (root: ReactTestInstance, accessibilityLabel: string, value: string) => {
  const [input] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onChangeText === 'function',
  );
  ReactTestRenderer.act(() => input.props.onChangeText(value));
};

const typeInto = (root: ReactTestInstance, placeholder: string, value: string) => {
  const [input] = root.findAll(n => n.props?.placeholder === placeholder);
  ReactTestRenderer.act(() => input.props.onChangeText(value));
};

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

/** True when any of a set of alternative lines is on screen. */
const hasOneOf = (root: ReactTestInstance, lines: readonly string[]) =>
  lines.some(line => hasText(root, line));

describe('personality and feedback', () => {
  const trees: ReactTestRenderer.ReactTestRenderer[] = [];
  let cloud: ReturnType<typeof createFakeCloud>;

  beforeEach(() => {
    jest.useFakeTimers();
    cloud = createFakeCloud();
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
        <App storage={createReturningStorage()} backend={cloud.backend} />,
      );
    });
    trees.push(tree);
    return tree.root;
  };

  const startWorkout = (root: ReactTestInstance, name = 'Squat') => {
    press(root, 'Workout');
    typeInto(root, 'Bench press', name);
    press(root, 'Save exercise');
    press(root, `Start ${name}`);
  };

  const signIn = async (root: ReactTestInstance) => {
    press(root, 'Settings');
    press(root, 'Sign in or create an account');
    fill(root, 'Display name', 'Alex');
    fill(root, 'Email', 'alex@example.com');
    fill(root, 'Password', 'hunter2!');
    await pressAsync(root, 'Create account');
  };

  /* --- Skipping rest --------------------------------------------------- */

  it('teases the next set when rest is cut short', async () => {
    const root = await launch();
    startWorkout(root);

    press(root, 'Done with set');
    // Straight back in with ~60 seconds still on the clock.
    press(root, 'Skip rest');

    expect(hasOneOf(root, SKIPPED_REST_LINES)).toBe(true);
  });

  it('says nothing when rest is allowed to run out', async () => {
    const root = await launch();
    startWorkout(root);

    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(61_000);
    });

    expect(hasOneOf(root, SKIPPED_REST_LINES)).toBe(false);
  });

  it('says nothing when rest was nearly over anyway', async () => {
    // Someone tapping Skip with eight seconds left was waiting for the timer,
    // not dodging it. Teasing them would be the app misreading the room.
    const root = await launch();
    startWorkout(root);

    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(52_000);
    });
    press(root, 'Skip rest');

    expect(hasOneOf(root, SKIPPED_REST_LINES)).toBe(false);
  });

  it('drops the tease once the teased set is banked', async () => {
    const root = await launch();
    startWorkout(root);

    press(root, 'Done with set');
    press(root, 'Skip rest');
    expect(hasOneOf(root, SKIPPED_REST_LINES)).toBe(true);

    // Through rest and back to a set that was rested for properly.
    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(61_000);
    });
    expect(hasOneOf(root, SKIPPED_REST_LINES)).toBe(false);
  });

  /* --- Finishing ------------------------------------------------------- */

  it('lands a line under both endings', async () => {
    const root = await launch();
    startWorkout(root, 'Rows');

    press(root, 'End workout');
    press(root, 'End it now');

    expect(hasText(root, 'Called it early.')).toBe(true);
    expect(hasOneOf(root, CUT_SHORT_LINES)).toBe(true);
    // Never the wrong set — the two endings must not share vocabulary.
    expect(hasOneOf(root, FINISHED_LINES)).toBe(false);
  });

  /* --- Personal best --------------------------------------------------- */

  it('celebrates a new best streak on the summary', async () => {
    const root = await launch();
    await signIn(root);

    // The first snapshot is the baseline, not a record.
    cloud.pushStreak({ currentStreak: 3, bestStreak: 3, lastActiveDay: '2026-08-01' });

    startWorkout(root, 'Rows');
    press(root, 'End workout');
    press(root, 'End it now');
    expect(hasText(root, 'PERSONAL BEST')).toBe(false);

    // The workout lands server-side and pushes the record past where it was.
    cloud.pushStreak({ currentStreak: 4, bestStreak: 4, lastActiveDay: '2026-08-02' });

    expect(hasText(root, 'PERSONAL BEST')).toBe(true);
    expect(hasText(root, '4 days straight')).toBe(true);
  });

  it('does not celebrate a record that was already standing', async () => {
    // Otherwise every launch congratulates the user for a streak they set weeks
    // ago, and the flourish stops meaning anything by the third time.
    const root = await launch();
    await signIn(root);

    cloud.pushStreak({ currentStreak: 9, bestStreak: 12, lastActiveDay: '2026-08-01' });
    cloud.pushStreak({ currentStreak: 10, bestStreak: 12, lastActiveDay: '2026-08-02' });

    startWorkout(root, 'Rows');
    press(root, 'End workout');
    press(root, 'End it now');

    expect(hasText(root, 'PERSONAL BEST')).toBe(false);
  });

  it('forgets a record once the next workout begins', async () => {
    const root = await launch();
    await signIn(root);

    cloud.pushStreak({ currentStreak: 1, bestStreak: 1, lastActiveDay: '2026-08-01' });

    startWorkout(root, 'Rows');
    press(root, 'End workout');
    press(root, 'End it now');
    cloud.pushStreak({ currentStreak: 2, bestStreak: 2, lastActiveDay: '2026-08-02' });
    expect(hasText(root, 'PERSONAL BEST')).toBe(true);

    press(root, 'New workout');
    press(root, 'Start Rows');
    press(root, 'End workout');
    press(root, 'End it now');

    expect(hasText(root, 'PERSONAL BEST')).toBe(false);
  });
});
