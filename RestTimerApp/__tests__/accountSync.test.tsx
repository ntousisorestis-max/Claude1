/**
 * The account layer, driven through the real screens with a fake cloud.
 *
 * No Firebase here on purpose. `CloudBackend` is the seam the app is written
 * against, so everything worth testing — that a finished workout is filed once
 * and only once, that a failed write is kept and retried with the same id, that
 * signing out doesn't leave one person's workout queued against the next
 * person's account — is testable without a network, a project, or a key.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { createReturningStorage } from '../src/state/storage';
import type {
  AccountData,
  AuthUser,
  CloudBackend,
  DayTotals,
  FocusTotals,
  WorkoutRecord,
} from '../src/cloud/types';

import { NO_TOTALS } from '../src/cloud/types';
import { NO_STREAK } from '../src/cloud/days';

/* -------------------------------------------------------------------------- */
/* A cloud that does what the test tells it to                                */
/* -------------------------------------------------------------------------- */

function createFakeCloud() {
  let notifyUser: ((user: AuthUser | null) => void) | null = null;
  let notifyAccount: ((data: AccountData) => void) | null = null;
  let notifyDays: ((days: DayTotals[]) => void) | null = null;

  const recorded: WorkoutRecord[] = [];
  const attempts: WorkoutRecord[] = [];
  /** How many of the next recordWorkout calls should fail. */
  let failures = 0;
  /** Set to make signIn/signUp reject the way Firebase would. */
  let authError: { code: string } | null = null;

  const backend: CloudBackend = {
    observeUser(onChange) {
      notifyUser = onChange;
      onChange(null);
      return () => {
        notifyUser = null;
      };
    },
    observeAccount(_uid, onChange) {
      notifyAccount = onChange;
      onChange({ totals: NO_TOTALS, streak: NO_STREAK });
      return () => {
        notifyAccount = null;
      };
    },
    observeDays(_uid, _count, onChange) {
      notifyDays = onChange;
      onChange([]);
      return () => {
        notifyDays = null;
      };
    },
    async signUp(email, _password, displayName) {
      if (authError) {
        throw authError;
      }
      notifyUser?.({ uid: 'u1', displayName: displayName || email });
    },
    async signIn(email) {
      if (authError) {
        throw authError;
      }
      notifyUser?.({ uid: 'u1', displayName: email });
    },
    async signOut() {
      notifyUser?.(null);
    },
    async recordWorkout(_uid, record) {
      attempts.push(record);
      if (failures > 0) {
        failures -= 1;
        throw new Error('offline');
      }
      recorded.push(record);
    },
  };

  return {
    backend,
    /** Workouts the server accepted. */
    recorded,
    /** Every call, including the ones that failed. */
    attempts,
    failNext(count: number) {
      failures = count;
    },
    rejectAuthWith(code: string) {
      authError = { code };
    },
    pushTotals(totals: FocusTotals) {
      ReactTestRenderer.act(() =>
        notifyAccount?.({ totals, streak: NO_STREAK }),
      );
    },
    pushAccount(data: AccountData) {
      ReactTestRenderer.act(() => notifyAccount?.(data));
    },
    pushDays(days: DayTotals[]) {
      ReactTestRenderer.act(() => notifyDays?.(days));
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers, shared in spirit with workoutFlow.test.tsx                        */
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

/** Presses something whose handler is async, and lets it settle. */
const pressAsync = async (root: ReactTestInstance, accessibilityLabel: string) => {
  const [node] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onPress === 'function',
  );
  if (!node) {
    throw new Error(`No pressable labelled "${accessibilityLabel}"`);
  }
  await ReactTestRenderer.act(async () => {
    await node.props.onPress();
  });
};

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

const fill = (root: ReactTestInstance, accessibilityLabel: string, value: string) => {
  const [input] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onChangeText === 'function',
  );
  if (!input) {
    throw new Error(`No input labelled "${accessibilityLabel}"`);
  }
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

describe('accounts and focus-stat sync', () => {
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

  /** Creates an account through the real sheet on the Settings tab. */
  const signUp = async (root: ReactTestInstance, name = 'Alex') => {
    press(root, 'Settings');
    press(root, 'Sign in or create an account');
    fill(root, 'Display name', name);
    fill(root, 'Email', 'alex@example.com');
    fill(root, 'Password', 'hunter2!');
    await pressAsync(root, 'Create account');
  };

  /** Adds a one-set exercise and returns having run it to completion. */
  const runOneSetWorkout = async (root: ReactTestInstance, name = 'Squat') => {
    press(root, 'Workout');
    typeInto(root, 'Bench press', name);
    press(root, 'Save exercise');

    // Down to a single set, so finishing it completes the workout outright.
    pressStartingWith(root, `Sets for ${name}`);
    press(root, `Decrease sets for ${name}`);
    press(root, `Decrease sets for ${name}`);

    press(root, `Start ${name}`);
    // Two minutes with the phone locked away.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(120_000);
    });
    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {});
  };

  /**
   * Back to the exercise list.
   *
   * The tab bar is deliberately hidden for the whole of a workout, summary
   * included, so nothing on Settings is reachable until the summary is
   * dismissed.
   */
  const backToList = (root: ReactTestInstance) => press(root, 'New workout');

  it('signs up, then files a finished workout against the account', async () => {
    const root = await launch();

    press(root, 'Settings');
    expect(hasText(root, 'Not signed in.')).toBe(true);
    press(root, 'Workout');

    await signUp(root);

    // The sheet closes and the card knows who you are.
    press(root, 'Settings');
    expect(hasText(root, 'Alex')).toBe(true);

    await runOneSetWorkout(root);
    backToList(root);

    expect(cloud.recorded).toHaveLength(1);
    expect(cloud.recorded[0]).toMatchObject({
      exerciseName: 'Squat',
      focusSeconds: 120,
      setsCompleted: 1,
    });
    expect(cloud.recorded[0].id).toMatch(/^w_/);
  });

  it('sends nothing while signed out', async () => {
    const root = await launch();

    await runOneSetWorkout(root);

    // The workout itself is unaffected — the summary still shows the local
    // number. An account is an add-on, not a requirement.
    expect(hasText(root, 'You kept your phone down for')).toBe(true);
    expect(cloud.attempts).toHaveLength(0);
  });

  it('keeps a failed workout and retries it under the same id', async () => {
    // The one that matters: `increment` is not idempotent, so a retry that
    // minted a fresh id would count the same session twice — indistinguishable
    // from cheating once there's a leaderboard.
    const root = await launch();
    await signUp(root);

    cloud.failNext(1);
    await runOneSetWorkout(root);

    expect(cloud.attempts).toHaveLength(1);
    expect(cloud.recorded).toHaveLength(0);

    backToList(root);
    press(root, 'Settings');
    expect(hasText(root, 'A workout is waiting to be saved')).toBe(true);

    // The retry timer comes round.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(31_000);
    });

    expect(cloud.recorded).toHaveLength(1);
    expect(cloud.attempts[1].id).toBe(cloud.attempts[0].id);
    expect(hasText(root, 'Everything saved')).toBe(true);
  });

  it('drops a queued workout when the user signs out', async () => {
    // It belongs to the account that just left. Holding it would file one
    // person's session against whoever signs in next on this phone.
    const root = await launch();
    await signUp(root);

    cloud.failNext(5);
    await runOneSetWorkout(root);
    expect(cloud.recorded).toHaveLength(0);

    backToList(root);
    press(root, 'Settings');
    press(root, 'Sign out');
    await pressAsync(root, 'Sign me out');

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(120_000);
    });

    expect(cloud.recorded).toHaveLength(0);
    expect(hasText(root, 'Not signed in.')).toBe(true);
  });

  it('shows a readable message when sign-in fails', async () => {
    const root = await launch();
    cloud.rejectAuthWith('auth/invalid-credential');

    press(root, 'Settings');
    press(root, 'Sign in or create an account');
    press(root, 'Sign in to an existing account');
    fill(root, 'Email', 'alex@example.com');
    fill(root, 'Password', 'wrongpass');
    await pressAsync(root, 'Sign in');

    expect(hasText(root, 'Wrong email or password.')).toBe(true);
    // And the sheet stays open, with what they typed still in it.
    expect(hasText(root, 'Welcome back')).toBe(true);
  });

  it('shows the lifetime totals the server reports', async () => {
    const root = await launch();
    await signUp(root);

    cloud.pushTotals({
      focusSeconds: 3 * 3600,
      setsCompleted: 42,
      workoutsFinished: 7,
    });

    press(root, 'Settings');
    // 10800s reads as 180 minutes, not "3h" — describeDuration tops out at
    // minutes, which is the honest thing until there's a reason not to.
    expect(hasText(root, '180')).toBe(true);
    expect(hasText(root, '42')).toBe(true);
    expect(hasText(root, '7')).toBe(true);
  });

  it('refuses a half-filled form', async () => {
    const root = await launch();

    press(root, 'Settings');
    press(root, 'Sign in or create an account');
    fill(root, 'Display name', 'Alex');
    fill(root, 'Email', 'not-an-email');
    fill(root, 'Password', '123');

    const [submit] = root.findAll(
      n => n.props?.accessibilityLabel === 'Create account',
    );
    expect(submit.props.accessibilityState.disabled).toBe(true);

    fill(root, 'Email', 'alex@example.com');
    fill(root, 'Password', 'longenough');

    const [ready] = root.findAll(
      n => n.props?.accessibilityLabel === 'Create account',
    );
    expect(ready.props.accessibilityState.disabled).toBe(false);
  });
});
