/**
 * The Insights and Streaks tabs, driven through the real app with a fake cloud
 * and a frozen clock.
 *
 * The clock matters more than usual here: every number on these two screens is
 * a function of what day it is, so the tests pin the date and then move it.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { createReturningStorage } from '../src/state/storage';
import { NO_STREAK, type StreakState } from '../src/cloud/days';
import {
  NO_TOTALS,
  type AccountData,
  type AuthUser,
  type CloudBackend,
  type DayTotals,
  type FocusTotals,
  type WorkoutRecord,
} from '../src/cloud/types';

/** 10am on Monday 3 August 2026, local time. */
const MONDAY = new Date(2026, 7, 3, 10, 0, 0).getTime();

function createFakeCloud() {
  let notifyUser: ((user: AuthUser | null) => void) | null = null;
  let notifyAccount: ((data: AccountData) => void) | null = null;
  let notifyDays: ((days: DayTotals[]) => void) | null = null;
  const recorded: WorkoutRecord[] = [];

  const backend: CloudBackend = {
    observeUser(onChange) {
      notifyUser = onChange;
      onChange(null);
      return () => {};
    },
    observeAccount(_uid, onChange) {
      notifyAccount = onChange;
      onChange({ totals: NO_TOTALS, streak: NO_STREAK });
      return () => {};
    },
    observeDays(_uid, _count, onChange) {
      notifyDays = onChange;
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
    async recordWorkout(_uid, record) {
      recorded.push(record);
    },
  };

  return {
    backend,
    recorded,
    push(totals: FocusTotals, streak: StreakState = NO_STREAK) {
      ReactTestRenderer.act(() => notifyAccount?.({ totals, streak }));
    },
    pushDays(days: DayTotals[]) {
      ReactTestRenderer.act(() => notifyDays?.(days));
    },
  };
}

/** A day document with the parts these screens read. */
const day = (key: string, workouts = 1): DayTotals => ({
  day: key,
  workouts,
  focusSeconds: 600,
  setsCompleted: 3,
});

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

const pressStartingWith = (root: ReactTestInstance, prefix: string) => {
  const [node] = root.findAll(
    n =>
      typeof n.props?.accessibilityLabel === 'string' &&
      n.props.accessibilityLabel.startsWith(prefix) &&
      typeof n.props?.onPress === 'function',
  );
  ReactTestRenderer.act(() => node.props.onPress());
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

/** Every accessibility label on screen — the week strip announces through these. */
const labels = (root: ReactTestInstance): string[] =>
  root
    .findAll(n => typeof n.props?.accessibilityLabel === 'string')
    .map(n => n.props.accessibilityLabel);

const hasLabel = (root: ReactTestInstance, needle: string) =>
  labels(root).some(l => l.includes(needle));

describe('Insights and Streaks', () => {
  const trees: ReactTestRenderer.ReactTestRenderer[] = [];
  let cloud: ReturnType<typeof createFakeCloud>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MONDAY);
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

  const signIn = async (root: ReactTestInstance) => {
    press(root, 'Settings');
    press(root, 'Sign in or create an account');
    fill(root, 'Display name', 'Alex');
    fill(root, 'Email', 'alex@example.com');
    fill(root, 'Password', 'hunter2!');
    await pressAsync(root, 'Create account');
  };

  it('offers all four tabs', async () => {
    const root = await launch();
    for (const tab of ['Workout', 'Insights', 'Streaks', 'Settings']) {
      expect(labels(root)).toContain(tab);
    }
  });

  it('tells a signed-out user why Insights is empty, and nothing else', async () => {
    const root = await launch();
    press(root, 'Insights');

    expect(hasText(root, 'Nothing to count yet')).toBe(true);

    // The session card belongs to the Workout tab and only there. It used to
    // appear here too, which put the same three numbers on two tabs and read
    // as a bug rather than as a summary.
    expect(hasText(root, 'THIS SESSION')).toBe(false);

    // And it is still on the Workout tab, where it always was.
    press(root, 'Workout');
    expect(hasText(root, 'THIS SESSION')).toBe(true);
  });

  it('shows lifetime totals and a rolling weekly count', async () => {
    const root = await launch();
    await signIn(root);

    cloud.push({ focusSeconds: 15_120, setsCompleted: 214, workoutsFinished: 31 });
    cloud.pushDays([
      day('2026-08-03'),
      day('2026-08-02', 2),
      day('2026-08-01'),
      // Eight days ago — outside the rolling week, so it must not be counted.
      day('2026-07-27'),
    ]);

    press(root, 'Insights');

    // 15,120s is 4h 12m. Not "252 minutes", which is the same number and
    // unreadable as an achievement.
    expect(hasText(root, '4h 12m')).toBe(true);
    expect(hasText(root, '214')).toBe(true);
    // 1 + 2 + 1 from the last seven days; the 27 July row is excluded.
    expect(hasText(root, '4')).toBe(true);
    expect(hasLabel(root, 'This week: 4 workouts')).toBe(true);
  });

  it('shows the streak, the best ever, and ticks the days trained', async () => {
    const root = await launch();
    await signIn(root);

    cloud.push(NO_TOTALS, {
      currentStreak: 3,
      bestStreak: 11,
      lastActiveDay: '2026-08-03',
    });
    cloud.pushDays([day('2026-08-03'), day('2026-08-02'), day('2026-08-01')]);

    press(root, 'Streaks');

    expect(hasLabel(root, 'Current streak: 3 days')).toBe(true);
    expect(hasText(root, '11')).toBe(true);
    expect(hasText(root, 'Today’s in the bank. Nothing left to prove.')).toBe(true);

    // Monday is today and trained; Sunday and Saturday before it are trained;
    // the four before that are not.
    expect(hasLabel(root, 'Mon, today: trained')).toBe(true);
    expect(hasLabel(root, 'Sun: trained')).toBe(true);
    expect(hasLabel(root, 'Sat: trained')).toBe(true);
    expect(hasLabel(root, 'Fri: no workout')).toBe(true);
    expect(hasLabel(root, 'Tue: no workout')).toBe(true);
  });

  it('keeps yesterday’s streak alive before today’s workout', async () => {
    // The rule that stops everyone's streak reading zero over breakfast.
    const root = await launch();
    await signIn(root);

    cloud.push(NO_TOTALS, {
      currentStreak: 6,
      bestStreak: 6,
      lastActiveDay: '2026-08-02',
    });

    press(root, 'Streaks');
    expect(hasLabel(root, 'Current streak: 6 days')).toBe(true);
    expect(hasText(root, 'Still alive. One workout today and it stays that way.')).toBe(
      true,
    );
  });

  it('shows a broken streak as zero without touching the best ever', async () => {
    const root = await launch();
    await signIn(root);

    cloud.push(NO_TOTALS, {
      currentStreak: 9,
      bestStreak: 9,
      lastActiveDay: '2026-07-30',
    });

    press(root, 'Streaks');
    expect(hasLabel(root, 'Current streak: 0 days')).toBe(true);
    expect(hasText(root, 'One finished workout today and you’re on the board.')).toBe(
      true,
    );
    // The record survives the streak that set it.
    expect(hasText(root, '9')).toBe(true);
  });

  it('stamps a finished workout with the local day it happened on', async () => {
    const root = await launch();
    await signIn(root);

    press(root, 'Workout');
    typeInto(root, 'Bench press', 'Squat');
    press(root, 'Save exercise');
    pressStartingWith(root, 'Sets for Squat');
    press(root, 'Decrease sets for Squat');
    press(root, 'Decrease sets for Squat');
    press(root, 'Start Squat');
    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {});

    expect(cloud.recorded).toHaveLength(1);
    expect(cloud.recorded[0].day).toBe('2026-08-03');
  });

  it('stamps late-night workouts with the day they were done, not the next one', async () => {
    // 23:58. A workout finished now and synced four minutes later belongs to
    // today; deriving the day at write time on the server would move it.
    jest.setSystemTime(new Date(2026, 7, 3, 23, 58, 0).getTime());

    const root = await launch();
    await signIn(root);

    press(root, 'Workout');
    typeInto(root, 'Bench press', 'Squat');
    press(root, 'Save exercise');
    pressStartingWith(root, 'Sets for Squat');
    press(root, 'Decrease sets for Squat');
    press(root, 'Decrease sets for Squat');
    press(root, 'Start Squat');
    press(root, 'Done with set');
    await ReactTestRenderer.act(async () => {});

    expect(cloud.recorded[0].day).toBe('2026-08-03');
  });

  it('keeps the tab bar on Insights and Streaks while a workout is running', async () => {
    // The bar is hidden on the Workout tab mid-session on purpose. That must
    // not leak into the other tabs, which would strand the user with no way
    // back — the old rule named the Settings tab explicitly.
    const root = await launch();

    press(root, 'Workout');
    typeInto(root, 'Bench press', 'Squat');
    press(root, 'Save exercise');
    press(root, 'Start Squat');

    expect(labels(root)).not.toContain('Insights');

    // The one route out is the End workout dialog; once back on the list the
    // bar returns, and every other tab keeps it.
    press(root, 'End workout');
    press(root, 'End it now');
    press(root, 'New workout');

    press(root, 'Streaks');
    expect(labels(root)).toContain('Workout');
    expect(hasText(root, 'Streaks')).toBe(true);
  });
});
