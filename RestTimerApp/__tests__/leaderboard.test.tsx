/**
 * The Leaderboard tab: global and friends scope, ranking, and adding a
 * friend by code — driven through the real app with a fake cloud.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { EMPTY_LEADERBOARD } from '../src/copy';
import { createReturningStorage } from '../src/state/storage';
import { NO_STREAK, type StreakState } from '../src/cloud/days';
import {
  NO_RECORDS,
  NO_TOTALS,
  type AuthUser,
  type CloudBackend,
  type LeaderboardEntry,
} from '../src/cloud/types';

/** 10am on Monday 3 August 2026, local time — matches insights.test.tsx. */
const MONDAY = new Date(2026, 7, 3, 10, 0, 0).getTime();

type Profile = { displayName: string; streak: StreakState; friendCode: string };

function createFakeCloud() {
  let notifyUser: ((user: AuthUser | null) => void) | null = null;
  const profiles: Record<string, Profile> = {};
  const friends: Record<string, Set<string>> = {};
  let failLeaderboard = false;

  const entryFor = (uid: string): LeaderboardEntry => ({
    uid,
    displayName: profiles[uid].displayName,
    streak: profiles[uid].streak,
  });

  const backend: CloudBackend = {
    observeUser(onChange) {
      notifyUser = onChange;
      onChange(null);
      return () => {};
    },
    observeAccount(_uid, onChange) {
      onChange({ totals: NO_TOTALS, streak: NO_STREAK, records: NO_RECORDS });
      return () => {};
    },
    observeDays(_uid, _since, onChange) {
      onChange([]);
      return () => {};
    },
    async signUp(_email, _password, displayName) {
      profiles.u1 = profiles.u1 ?? {
        displayName,
        streak: NO_STREAK,
        friendCode: 'MYCODE',
      };
      notifyUser?.({ uid: 'u1', displayName });
    },
    async signIn(_email, _password) {
      notifyUser?.({ uid: 'u1', displayName: profiles.u1?.displayName ?? 'Alex' });
    },
    async signOut() {
      notifyUser?.(null);
    },
    async recordWorkout() {},

    async getGlobalLeaderboard(limit) {
      if (failLeaderboard) {
        throw new Error('permission-denied');
      }
      return Object.keys(profiles)
        .map(entryFor)
        .slice(0, limit);
    },
    async getFriendsLeaderboard(uid) {
      if (failLeaderboard) {
        throw new Error('permission-denied');
      }
      const mine = [...(friends[uid] ?? [])];
      return [uid, ...mine].filter(u => profiles[u]).map(entryFor);
    },
    async findByFriendCode(code) {
      const found = Object.entries(profiles).find(
        ([, p]) => p.friendCode === code,
      );
      return found ? { uid: found[0], displayName: found[1].displayName } : null;
    },
    async addFriend(uid, friendUid) {
      (friends[uid] ??= new Set()).add(friendUid);
    },
    async getOrCreateFriendCode(uid) {
      return profiles[uid]?.friendCode ?? 'NOCODE';
    },
  };

  return {
    backend,
    seed(uid: string, profile: Profile) {
      profiles[uid] = profile;
    },
    breakLeaderboard() {
      failLeaderboard = true;
    },
  };
}

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
  if (!node) {
    throw new Error(`No pressable labelled "${accessibilityLabel}"`);
  }
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

const labels = (root: ReactTestInstance): string[] =>
  root
    .findAll(n => typeof n.props?.accessibilityLabel === 'string')
    .map(n => n.props.accessibilityLabel);

const hasLabel = (root: ReactTestInstance, needle: string) =>
  labels(root).some(l => l.includes(needle));

describe('Leaderboard', () => {
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

  const openLeaderboard = async (root: ReactTestInstance) => {
    press(root, 'Ranks');
    // The fetch is async even against the fake backend.
    await ReactTestRenderer.act(async () => {});
  };

  it('offers an account rather than a rank when signed out', async () => {
    const root = await launch();
    press(root, 'Ranks');

    expect(hasText(root, EMPTY_LEADERBOARD.title)).toBe(true);
    expect(hasText(root, EMPTY_LEADERBOARD.body)).toBe(true);
  });

  it('ranks the global list by current streak and highlights your own row', async () => {
    cloud.seed('u2', {
      displayName: 'Sam',
      streak: { currentStreak: 7, bestStreak: 7, lastActiveDay: '2026-08-03' },
      friendCode: 'SAMSAM',
    });
    cloud.seed('u3', {
      displayName: 'Robin',
      streak: { currentStreak: 20, bestStreak: 20, lastActiveDay: '2026-08-03' },
      friendCode: 'ROBROB',
    });

    const root = await launch();
    await signIn(root);
    // Signing up registers 'u1' with no streak, so seed it after — the fake's
    // signUp only fills in a profile if one doesn't already exist.
    cloud.seed('u1', {
      displayName: 'Alex',
      streak: { currentStreak: 12, bestStreak: 12, lastActiveDay: '2026-08-03' },
      friendCode: 'MYCODE',
    });

    await openLeaderboard(root);

    // Robin (20) > Alex (12) > Sam (7), so Alex is rank 2.
    expect(hasLabel(root, 'Your rank: 2.')).toBe(true);
    expect(
      hasLabel(root, 'You. Rank 2, Alex, 12 days'),
    ).toBe(true);
    expect(hasLabel(root, 'Rank 1, Robin, 20 days')).toBe(true);
    expect(hasLabel(root, 'Rank 3, Sam, 7 days')).toBe(true);
  });

  it('decays a stale stored streak before ranking, the same way the rest of the app does', async () => {
    // Trained last on 2026-07-01 — over a month ago, so this streak is dead
    // even though the stored number is still 40.
    cloud.seed('u2', {
      displayName: 'Stale',
      streak: { currentStreak: 40, bestStreak: 40, lastActiveDay: '2026-07-01' },
      friendCode: 'OLDOLD',
    });

    const root = await launch();
    await signIn(root);
    cloud.seed('u1', {
      displayName: 'Alex',
      streak: { currentStreak: 3, bestStreak: 3, lastActiveDay: '2026-08-03' },
      friendCode: 'MYCODE',
    });

    await openLeaderboard(root);

    // Alex (3, live) outranks Stale (40 on paper, 0 decayed).
    expect(hasLabel(root, 'Your rank: 1.')).toBe(true);
    expect(hasLabel(root, 'Rank 2, Stale, 0 days')).toBe(true);
  });

  it('switches to Friends, which always includes yourself even with no friends added', async () => {
    const root = await launch();
    await signIn(root);
    cloud.seed('u1', {
      displayName: 'Alex',
      streak: { currentStreak: 4, bestStreak: 4, lastActiveDay: '2026-08-03' },
      friendCode: 'MYCODE',
    });
    await openLeaderboard(root);

    press(root, 'Leaderboard Friends');
    await ReactTestRenderer.act(async () => {});

    expect(hasLabel(root, 'You. Rank 1, Alex, 4 days')).toBe(true);
    // The nudge to add people, since the list is just the signed-in user.
    expect(
      hasText(
        root,
        'Share your code, or enter theirs, and you’ll show up here together.',
      ),
    ).toBe(true);
  });

  it('adds a friend by code and the friends list picks them up', async () => {
    cloud.seed('u2', {
      displayName: 'Sam',
      streak: { currentStreak: 9, bestStreak: 9, lastActiveDay: '2026-08-03' },
      friendCode: 'SAMSAM',
    });

    const root = await launch();
    await signIn(root);
    cloud.seed('u1', {
      displayName: 'Alex',
      streak: { currentStreak: 4, bestStreak: 4, lastActiveDay: '2026-08-03' },
      friendCode: 'MYCODE',
    });
    await openLeaderboard(root);

    press(root, 'Leaderboard Friends');
    await ReactTestRenderer.act(async () => {});
    press(root, 'Add a friend');
    await ReactTestRenderer.act(async () => {});

    // Your own code is shown, fetched from the backend.
    expect(hasText(root, 'MYCODE')).toBe(true);

    fill(root, "Friend's code", 'samsam');
    await pressAsync(root, 'Add');

    expect(hasText(root, 'Added Sam.')).toBe(true);

    press(root, 'Done');
    await ReactTestRenderer.act(async () => {});

    expect(hasLabel(root, 'Rank 1, Sam, 9 days')).toBe(true);
    expect(hasLabel(root, 'You. Rank 2, Alex, 4 days')).toBe(true);
  });

  it('rejects a code that matches no account', async () => {
    const root = await launch();
    await signIn(root);
    cloud.seed('u1', {
      displayName: 'Alex',
      streak: NO_STREAK,
      friendCode: 'MYCODE',
    });
    await openLeaderboard(root);

    press(root, 'Leaderboard Friends');
    await ReactTestRenderer.act(async () => {});
    press(root, 'Add a friend');
    await ReactTestRenderer.act(async () => {});

    fill(root, "Friend's code", 'ZZZZZZ');
    await pressAsync(root, 'Add');

    expect(hasText(root, 'No account uses that code.')).toBe(true);
  });

  it('says the leaderboard is unreachable rather than pretending it is empty', async () => {
    const root = await launch();
    await signIn(root);
    cloud.breakLeaderboard();

    await openLeaderboard(root);

    expect(
      hasText(root, 'Can’t reach the leaderboard right now. Try again in a moment.'),
    ).toBe(true);
  });
});
