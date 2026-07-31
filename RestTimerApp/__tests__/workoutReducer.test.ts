import {
  customAppId,
  FACTORY_DEFAULTS,
  initialState,
  MAX_CUSTOM_APPS,
  MAX_EXERCISES,
  NEW_EXERCISE_REST_SECONDS,
  NEW_EXERCISE_SETS,
  workoutReducer,
} from '../src/state/workoutReducer';
import type { Exercise, WorkoutState } from '../src/state/types';

const T0 = 1_700_000_000_000;

/** A list with one exercise on it, set up for a short workout. */
const BENCH: Exercise = {
  id: 'ex_bench',
  name: 'Bench',
  totalSets: 2,
  restSeconds: 60,
  selectedAppIds: ['tiktok'],
};

const withBench = (over: Partial<WorkoutState> = {}): WorkoutState => ({
  ...initialState,
  exercises: [BENCH],
  ...over,
});

const start = (state = withBench()) =>
  workoutReducer(state, { type: 'START_WORKOUT', id: BENCH.id });

describe('the exercise list', () => {
  const add = (state: WorkoutState, name: string, id = `ex_${name}`) =>
    workoutReducer(state, { type: 'ADD_EXERCISE', id, name });

  it('adds an exercise seeded from the Settings apps', () => {
    const s = add(initialState, 'Bench press');

    expect(s.exercises).toHaveLength(1);
    expect(s.exercises[0].name).toBe('Bench press');
    expect(s.exercises[0].totalSets).toBe(NEW_EXERCISE_SETS);
    expect(s.exercises[0].restSeconds).toBe(NEW_EXERCISE_REST_SECONDS);
    expect(s.exercises[0].selectedAppIds).toEqual(FACTORY_DEFAULTS.selectedAppIds);
  });

  it('refuses blanks and duplicate names', () => {
    expect(add(initialState, '   ')).toBe(initialState);

    const once = add(initialState, 'Squat');
    expect(add(once, '  squat ')).toBe(once);
  });

  it('stops at the cap', () => {
    let s = initialState;
    for (let i = 0; i < MAX_EXERCISES + 3; i++) {
      s = add(s, `Lift ${i}`, `ex_${i}`);
    }
    expect(s.exercises).toHaveLength(MAX_EXERCISES);
  });

  it('edits one exercise without touching any other', () => {
    let s = add(add(initialState, 'Bench', 'a'), 'Pulldowns', 'b');
    s = workoutReducer(s, { type: 'SET_EXERCISE_SETS', id: 'a', sets: 8 });
    s = workoutReducer(s, { type: 'SET_EXERCISE_REST', id: 'a', seconds: 90 });
    s = workoutReducer(s, { type: 'TOGGLE_EXERCISE_APP', id: 'a', appId: 'tiktok' });

    expect(s.exercises[0]).toMatchObject({ totalSets: 8, restSeconds: 90 });
    expect(s.exercises[0].selectedAppIds).not.toContain('tiktok');

    // The whole point of the restructure: the other card is untouched.
    expect(s.exercises[1]).toMatchObject({
      totalSets: NEW_EXERCISE_SETS,
      restSeconds: NEW_EXERCISE_REST_SECONDS,
    });
    expect(s.exercises[1].selectedAppIds).toContain('tiktok');
  });

  it('clamps sets and rest to sane ranges', () => {
    const s = add(initialState, 'Bench', 'a');

    expect(
      workoutReducer(s, { type: 'SET_EXERCISE_SETS', id: 'a', sets: 0 })
        .exercises[0].totalSets,
    ).toBe(1);
    expect(
      workoutReducer(s, { type: 'SET_EXERCISE_SETS', id: 'a', sets: 99 })
        .exercises[0].totalSets,
    ).toBe(20);
    expect(
      workoutReducer(s, { type: 'SET_EXERCISE_REST', id: 'a', seconds: 1 })
        .exercises[0].restSeconds,
    ).toBe(10);
    expect(
      workoutReducer(s, { type: 'SET_EXERCISE_REST', id: 'a', seconds: 9999 })
        .exercises[0].restSeconds,
    ).toBe(600);
  });

  it('ignores an edit aimed at an id that is not in the list', () => {
    const s = add(initialState, 'Bench', 'a');
    expect(workoutReducer(s, { type: 'SET_EXERCISE_SETS', id: 'gone', sets: 9 })).toBe(s);
  });

  it('deletes one, and deletes them all', () => {
    let s = add(add(initialState, 'Bench', 'a'), 'Pulldowns', 'b');

    s = workoutReducer(s, { type: 'REMOVE_EXERCISE', id: 'a' });
    expect(s.exercises.map(e => e.id)).toEqual(['b']);

    s = workoutReducer(s, { type: 'DELETE_ALL_EXERCISES' });
    expect(s.exercises).toEqual([]);
    // Preferences are not exercises — they survive.
    expect(s.defaults).toEqual(FACTORY_DEFAULTS);
  });
});

describe('workout loop', () => {
  it('locks apps and snapshots the exercise when the workout starts', () => {
    const s = start();

    expect(s.phase).toBe('active');
    expect(s.appsLocked).toBe(true);
    expect(s.currentSet).toBe(1);
    expect(s.config).toEqual({
      exerciseName: 'Bench',
      totalSets: 2,
      restSeconds: 60,
      selectedAppIds: ['tiktok'],
    });
  });

  it('ignores a start for an exercise that is not in the list', () => {
    const s = withBench();
    expect(workoutReducer(s, { type: 'START_WORKOUT', id: 'gone' })).toBe(s);
  });

  it('does not let a mid-workout edit rewrite the running workout', () => {
    // The config is a snapshot, so the set you are on cannot move.
    const active = start();
    const s = workoutReducer(active, {
      type: 'SET_EXERCISE_SETS',
      id: BENCH.id,
      sets: 12,
    });

    expect(s.config.totalSets).toBe(2);
    expect(s.exercises[0].totalSets).toBe(12);
  });

  it('unlocks apps for rest after finishing a set', () => {
    const resting = workoutReducer(start(), { type: 'FINISH_SET', now: T0 });

    expect(resting.phase).toBe('resting');
    expect(resting.appsLocked).toBe(false);
    expect(resting.restEndsAt).toBe(T0 + 60_000);
    expect(resting.setsCompleted).toBe(1);
    // Still on set 1 until rest ends.
    expect(resting.currentSet).toBe(1);
  });

  it('re-locks and advances the set when rest ends', () => {
    const resting = workoutReducer(start(), { type: 'FINISH_SET', now: T0 });
    const next = workoutReducer(resting, { type: 'END_REST', now: T0 + 60_000 });

    expect(next.phase).toBe('active');
    expect(next.appsLocked).toBe(true);
    expect(next.currentSet).toBe(2);
    expect(next.totalRestSeconds).toBe(60);
  });

  it('counts only the time actually rested when rest is skipped', () => {
    const resting = workoutReducer(start(), { type: 'FINISH_SET', now: T0 });
    const next = workoutReducer(resting, { type: 'END_REST', now: T0 + 18_000 });

    expect(next.totalRestSeconds).toBe(18);
  });

  it('goes straight to complete after the last set, with apps unlocked', () => {
    let s = start();
    s = workoutReducer(s, { type: 'FINISH_SET', now: T0 });
    s = workoutReducer(s, { type: 'END_REST', now: T0 + 60_000 });
    s = workoutReducer(s, { type: 'FINISH_SET', now: T0 + 90_000 });

    expect(s.phase).toBe('complete');
    expect(s.appsLocked).toBe(false);
    expect(s.setsCompleted).toBe(2);
    expect(s.restEndsAt).toBeNull();
  });

  it('lifts the block when the workout is ended early', () => {
    const ended = workoutReducer(start(), { type: 'END_WORKOUT' });

    expect(ended.phase).toBe('complete');
    expect(ended.appsLocked).toBe(false);
    expect(ended.setsCompleted).toBe(0);
  });

  it('ignores a late END_REST once the phase moved on', () => {
    const active = start();
    expect(workoutReducer(active, { type: 'END_REST', now: T0 })).toBe(active);
  });

  it('ignores a double FINISH_SET tap', () => {
    const resting = workoutReducer(start(), { type: 'FINISH_SET', now: T0 });
    const again = workoutReducer(resting, { type: 'FINISH_SET', now: T0 + 10 });

    expect(again).toBe(resting);
  });

  it('returns to the list, with the exercise still saved', () => {
    let s = workoutReducer(start(), { type: 'END_WORKOUT' });
    s = workoutReducer(s, { type: 'NEW_WORKOUT' });

    expect(s.phase).toBe('setup');
    expect(s.exercises).toEqual([BENCH]);
    expect(s.setsCompleted).toBe(0);
    expect(s.appsLocked).toBe(false);
  });
});

describe('settings', () => {
  it('toggling a default app leaves existing exercises alone', () => {
    // The default selection seeds a *new* exercise and nothing else.
    const s = workoutReducer(withBench(), {
      type: 'TOGGLE_DEFAULT_APP',
      appId: 'youtube',
    });

    expect(s.defaults.selectedAppIds).toContain('youtube');
    expect(s.exercises[0].selectedAppIds).toEqual(['tiktok']);
  });

  it('toggles the sound preference without touching anything else', () => {
    const s = workoutReducer(withBench(), {
      type: 'SET_SOUND_ENABLED',
      enabled: false,
    });

    expect(s.defaults.soundEnabled).toBe(false);
    expect(s.exercises[0]).toEqual(BENCH);
  });
});

describe('custom apps', () => {
  const add = (state: WorkoutState, name: string) =>
    workoutReducer(state, { type: 'ADD_CUSTOM_APP', name });

  it('adds an app and selects it straight away', () => {
    const s = add(initialState, 'Strava');

    expect(s.defaults.customApps).toHaveLength(1);
    expect(s.defaults.customApps[0].name).toBe('Strava');
    // You typed it in to block it.
    expect(s.defaults.selectedAppIds).toContain(customAppId('Strava'));
  });

  it('ignores blanks and whitespace-only names', () => {
    expect(add(initialState, '   ')).toBe(initialState);
    expect(add(initialState, '')).toBe(initialState);
  });

  it('ignores a duplicate regardless of case or spacing', () => {
    const once = add(initialState, 'Strava');
    expect(add(once, '  strava ')).toBe(once);
  });

  it('ignores a name that collides with a preset', () => {
    expect(add(initialState, 'TikTok')).toBe(initialState);
  });

  it('stops at the cap', () => {
    let s = initialState;
    for (let i = 0; i < MAX_CUSTOM_APPS + 3; i++) {
      s = add(s, `App ${i}`);
    }
    expect(s.defaults.customApps).toHaveLength(MAX_CUSTOM_APPS);
  });

  it('removing one drops it from every exercise as well', () => {
    // Otherwise a deleted app keeps being counted as blocked mid-workout.
    const id = customAppId('Strava');
    let s = add(withBench(), 'Strava');
    s = workoutReducer(s, { type: 'TOGGLE_EXERCISE_APP', id: BENCH.id, appId: id });
    expect(s.exercises[0].selectedAppIds).toContain(id);

    s = workoutReducer(s, { type: 'REMOVE_CUSTOM_APP', appId: id });

    expect(s.defaults.customApps).toHaveLength(0);
    expect(s.defaults.selectedAppIds).not.toContain(id);
    expect(s.exercises[0].selectedAppIds).not.toContain(id);
  });
});
