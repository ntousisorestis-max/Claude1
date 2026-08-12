/**
 * The Insights tab, driven through the real app with a fake cloud and a
 * frozen clock. The leaderboard has its own file — see leaderboard.test.tsx.
 *
 * The clock matters more than usual here: every number on this screen is a
 * function of what day it is, so the tests pin the date and then move it.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { DATA_UNREACHABLE, EMPTY_CHART, EMPTY_RECORDS } from '../src/copy';
import { createReturningStorage } from '../src/state/storage';
import { NO_STREAK, type StreakState } from '../src/cloud/days';
import {
  NO_RECORDS,
  NO_TOTALS,
  type AccountData,
  type AuthUser,
  type CloudBackend,
  type DayTotals,
  type FocusTotals,
  type PersonalRecords,
  type WorkoutRecord,
} from '../src/cloud/types';

/** 10am on Monday 3 August 2026, local time. */
const MONDAY = new Date(2026, 7, 3, 10, 0, 0).getTime();

function createFakeCloud() {
  let notifyUser: ((user: AuthUser | null) => void) | null = null;
  let notifyAccount: ((data: AccountData) => void) | null = null;
  let notifyDays: ((days: DayTotals[]) => void) | null = null;
  /** The window the app asked for, so the query's shape can be asserted. */
  let daysSince: string | null = null;
  let failDays: ((reason: unknown) => void) | null = null;
  const recorded: WorkoutRecord[] = [];
  /** The last snapshot pushed, so one field can be changed without the rest. */
  let latest: AccountData = {
    totals: NO_TOTALS,
    streak: NO_STREAK,
    records: NO_RECORDS,
  };

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
    observeDays(_uid, since, onChange, onError) {
      daysSince = since;
      notifyDays = onChange;
      failDays = onError ?? null;
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
    // Partial, so a test names only the numbers it cares about — and adding a
    // field to FocusTotals doesn't mean editing every call site.
    push(totals: Partial<FocusTotals>, streak: StreakState = NO_STREAK) {
      latest = {
        totals: { ...NO_TOTALS, ...totals },
        streak,
        records: latest.records,
      };
      ReactTestRenderer.act(() => notifyAccount?.(latest));
    },
    pushRecords(records: PersonalRecords) {
      latest = { ...latest, records };
      ReactTestRenderer.act(() => notifyAccount?.(latest));
    },
    pushDays(days: DayTotals[]) {
      ReactTestRenderer.act(() => notifyDays?.(days));
    },
    /** What `since` the days listener was opened with. */
    get daysSince() {
      return daysSince;
    },
    /** Stops the days listener the way a rejected query does. */
    breakDays() {
      ReactTestRenderer.act(() => failDays?.(new Error('failed-precondition')));
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

const pressAsync = async (
  root: ReactTestInstance,
  accessibilityLabel: string,
) => {
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

const fill = (
  root: ReactTestInstance,
  accessibilityLabel: string,
  value: string,
) => {
  const [input] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onChangeText === 'function',
  );
  ReactTestRenderer.act(() => input.props.onChangeText(value));
};

const typeInto = (
  root: ReactTestInstance,
  placeholder: string,
  value: string,
) => {
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

describe('Insights', () => {
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
    for (const tab of ['Workout', 'Insights', 'Ranks', 'Settings']) {
      expect(labels(root)).toContain(tab);
    }
  });

  it('offers an account rather than numbers when signed out', async () => {
    const root = await launch();
    press(root, 'Insights');

    expect(hasText(root, 'Save your progress')).toBe(true);

    // Empty, and honest about it: an em-dash where a number will go, never a
    // zero and never a demo figure.
    expect(hasLabel(root, 'Time saved: nothing yet')).toBe(true);
    expect(hasLabel(root, 'Sets finished: nothing yet')).toBe(true);
    expect(hasText(root, EMPTY_RECORDS)).toBe(true);
    expect(hasText(root, EMPTY_CHART)).toBe(true);

    // The session card belongs to the Workout tab and only there.
    expect(hasText(root, 'THIS SESSION')).toBe(false);
    press(root, 'Workout');
    expect(hasText(root, 'THIS SESSION')).toBe(true);
  });

  it('shows the four headline numbers once there is an account', async () => {
    const root = await launch();
    await signIn(root);

    cloud.push(
      { focusSeconds: 15_120, setsCompleted: 214, workoutsFinished: 31 },
      { currentStreak: 5, bestStreak: 9, lastActiveDay: '2026-08-03' },
    );

    press(root, 'Insights');

    // 15,120s is 4h 12m. Not "252 minutes", which is the same number and
    // unreadable as an achievement.
    expect(hasLabel(root, 'Time saved: 4h 12m')).toBe(true);
    expect(hasLabel(root, 'Sets finished: 214 sets')).toBe(true);
    expect(hasLabel(root, 'Workouts: 31 done')).toBe(true);
    // 15,120s over 31 workouts is 487s, which rounds to 8 minutes. The fourth
    // tile is an average rather than the streak: the streak has a hero ring of
    // its own one tab over, and one number in two places is one too many.
    expect(hasLabel(root, 'Avg. per workout: 8 minutes')).toBe(true);
    expect(hasLabel(root, 'Current streak: 5 days')).toBe(false);

    // The account card has done its job and got out of the way.
    expect(hasText(root, 'Save your progress')).toBe(false);
  });

  it('asks for a window of days, not a count', async () => {
    // The shape of the query is the bug. It used to ask for "the newest N",
    // which needs the days ordered — by document id, descending, which
    // Firestore will not do without an index somebody has to create by hand.
    // Every call came back `failed-precondition`, the error went to the
    // console, and the chart drew its empty state at somebody who had been
    // training. A window needs no ordering and therefore no index.
    const root = await launch();
    await signIn(root);

    // Fourteen days back from today, inclusive of both ends.
    expect(cloud.daysSince).toBe('2026-07-21');
    expect(typeof cloud.daysSince).toBe('string');
  });

  it('says the data is unreachable rather than pretending it is empty', async () => {
    const root = await launch();
    await signIn(root);
    cloud.pushDays([{ ...day('2026-08-03'), focusSeconds: 600 }]);

    press(root, 'Insights');
    expect(hasText(root, EMPTY_CHART)).toBe(false);

    // The listener falls over the way a rejected query does.
    cloud.breakDays();

    expect(hasText(root, DATA_UNREACHABLE)).toBe(true);
    // And crucially *not* the empty-state line, which would be a different
    // claim about the same blank chart — the one that hid this for a month.
    expect(hasText(root, EMPTY_CHART)).toBe(false);
  });

  it('prices this week against a lifetime pace, not against itself', async () => {
    // 3600s over 60 sets is a minute a set; a 600s week is ten sets' worth.
    // Dividing all-time focus by all-time focus-per-set would just print 60
    // back — the set count already on screen.
    const root = await launch();
    await signIn(root);

    cloud.push({ focusSeconds: 3600, setsCompleted: 60, workoutsFinished: 12 });
    cloud.pushDays([{ ...day('2026-08-03'), focusSeconds: 600 }]);

    press(root, 'Insights');

    expect(hasText(root, 'That’s about 10 more sets at your usual pace.')).toBe(
      true,
    );
  });

  it('says nothing about pace when there is no pace to know', async () => {
    const root = await launch();
    await signIn(root);

    cloud.pushDays([{ ...day('2026-08-03'), focusSeconds: 600 }]);

    press(root, 'Insights');

    // No sets ever finished means no seconds-per-set, so there is nothing
    // honest to divide by. A card reading "about 0 more sets" is worse than no
    // card.
    expect(hasText(root, 'at your usual pace')).toBe(false);
  });

  it('shows personal records, and an empty state before there are any', async () => {
    const root = await launch();
    await signIn(root);

    press(root, 'Insights');
    expect(hasText(root, EMPTY_RECORDS)).toBe(true);

    cloud.pushRecords({ longestFocusSeconds: 2_760, mostSetsInWorkout: 8 });

    expect(hasLabel(root, 'Longest focused workout: 46 minutes')).toBe(true);
    expect(hasLabel(root, 'Most sets in one workout: 8')).toBe(true);
    expect(hasText(root, EMPTY_RECORDS)).toBe(false);
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

  it('keeps the tab bar on Insights and the leaderboard while a workout is running', async () => {
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

    press(root, 'Ranks');
    expect(labels(root)).toContain('Workout');
    expect(hasText(root, 'Leaderboard')).toBe(true);
  });
});
