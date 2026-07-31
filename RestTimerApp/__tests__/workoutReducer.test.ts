import { initialState, workoutReducer } from '../src/state/workoutReducer';
import type { WorkoutState } from '../src/state/types';

const T0 = 1_700_000_000_000;

const configured = (over: Partial<WorkoutState> = {}): WorkoutState => ({
  ...initialState,
  config: { ...initialState.config, exerciseName: 'Bench', totalSets: 2, restSeconds: 60 },
  ...over,
});

describe('workout loop', () => {
  it('locks apps when the workout starts', () => {
    const s = workoutReducer(configured(), { type: 'START_WORKOUT' });
    expect(s.phase).toBe('active');
    expect(s.appsLocked).toBe(true);
    expect(s.currentSet).toBe(1);
  });

  it('unlocks apps for rest after finishing a set', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const resting = workoutReducer(active, { type: 'FINISH_SET', now: T0 });

    expect(resting.phase).toBe('resting');
    expect(resting.appsLocked).toBe(false);
    expect(resting.restEndsAt).toBe(T0 + 60_000);
    expect(resting.setsCompleted).toBe(1);
    // Still on set 1 until rest ends.
    expect(resting.currentSet).toBe(1);
  });

  it('re-locks and advances the set when rest ends', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const resting = workoutReducer(active, { type: 'FINISH_SET', now: T0 });
    const next = workoutReducer(resting, { type: 'END_REST', now: T0 + 60_000 });

    expect(next.phase).toBe('active');
    expect(next.appsLocked).toBe(true);
    expect(next.currentSet).toBe(2);
    expect(next.totalRestSeconds).toBe(60);
  });

  it('counts only the time actually rested when rest is skipped', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const resting = workoutReducer(active, { type: 'FINISH_SET', now: T0 });
    const next = workoutReducer(resting, { type: 'END_REST', now: T0 + 18_000 });

    expect(next.totalRestSeconds).toBe(18);
  });

  it('goes straight to complete after the last set, with apps unlocked', () => {
    let s = workoutReducer(configured(), { type: 'START_WORKOUT' });
    s = workoutReducer(s, { type: 'FINISH_SET', now: T0 });
    s = workoutReducer(s, { type: 'END_REST', now: T0 + 60_000 });
    s = workoutReducer(s, { type: 'FINISH_SET', now: T0 + 90_000 });

    expect(s.phase).toBe('complete');
    expect(s.appsLocked).toBe(false);
    expect(s.setsCompleted).toBe(2);
    expect(s.restEndsAt).toBeNull();
  });

  it('lifts the block when the workout is ended early', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const ended = workoutReducer(active, { type: 'END_WORKOUT' });

    expect(ended.phase).toBe('complete');
    expect(ended.appsLocked).toBe(false);
    expect(ended.setsCompleted).toBe(0);
  });

  it('ignores a late END_REST once the phase moved on', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const late = workoutReducer(active, { type: 'END_REST', now: T0 });

    expect(late).toBe(active);
  });

  it('ignores a double FINISH_SET tap', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const resting = workoutReducer(active, { type: 'FINISH_SET', now: T0 });
    const again = workoutReducer(resting, { type: 'FINISH_SET', now: T0 + 10 });

    expect(again).toBe(resting);
  });

  it('keeps the exercise name but resets progress on a new workout', () => {
    let s = workoutReducer(configured(), { type: 'START_WORKOUT' });
    s = workoutReducer(s, { type: 'END_WORKOUT' });
    s = workoutReducer(s, { type: 'NEW_WORKOUT' });

    expect(s.phase).toBe('setup');
    expect(s.config.exerciseName).toBe('Bench');
    expect(s.setsCompleted).toBe(0);
    expect(s.appsLocked).toBe(false);
  });

  it('re-seeds sets and rest from the settings defaults on a new workout', () => {
    // Configured for 2 sets / 60s rest; Settings says 5 sets / 90s.
    let s = workoutReducer(configured(), { type: 'SET_DEFAULT_SETS', sets: 5 });
    s = workoutReducer(s, { type: 'SET_DEFAULT_REST', seconds: 90 });
    s = workoutReducer(s, { type: 'START_WORKOUT' });
    s = workoutReducer(s, { type: 'END_WORKOUT' });
    s = workoutReducer(s, { type: 'NEW_WORKOUT' });

    expect(s.config.totalSets).toBe(5);
    expect(s.config.restSeconds).toBe(90);
  });
});

describe('settings defaults', () => {
  it('mirrors onto the live config while still on the setup screen', () => {
    const s = workoutReducer(configured(), { type: 'SET_DEFAULT_REST', seconds: 90 });

    expect(s.defaults.restSeconds).toBe(90);
    // Nothing has started, so the two must not disagree.
    expect(s.config.restSeconds).toBe(90);
  });

  it('leaves a running workout alone', () => {
    const active = workoutReducer(configured(), { type: 'START_WORKOUT' });
    const s = workoutReducer(active, { type: 'SET_DEFAULT_REST', seconds: 90 });

    expect(s.defaults.restSeconds).toBe(90);
    expect(s.config.restSeconds).toBe(60);
  });

  it('clamps defaults to the same ranges as the setup screen', () => {
    expect(
      workoutReducer(initialState, { type: 'SET_DEFAULT_SETS', sets: 99 }).defaults
        .totalSets,
    ).toBe(20);
    expect(
      workoutReducer(initialState, { type: 'SET_DEFAULT_REST', seconds: 1 }).defaults
        .restSeconds,
    ).toBe(10);
  });

  it('toggles a default app without touching a running workout', () => {
    const off = workoutReducer(initialState, {
      type: 'TOGGLE_DEFAULT_APP',
      appId: 'tiktok',
    });
    expect(off.defaults.selectedAppIds).not.toContain('tiktok');
  });
});

describe('setup inputs', () => {
  it('clamps sets and rest to sane ranges', () => {
    expect(workoutReducer(initialState, { type: 'SET_TOTAL_SETS', sets: 0 }).config.totalSets).toBe(1);
    expect(workoutReducer(initialState, { type: 'SET_TOTAL_SETS', sets: 99 }).config.totalSets).toBe(20);
    expect(
      workoutReducer(initialState, { type: 'SET_REST_SECONDS', seconds: 1 }).config.restSeconds,
    ).toBe(10);
    expect(
      workoutReducer(initialState, { type: 'SET_REST_SECONDS', seconds: 9999 }).config.restSeconds,
    ).toBe(600);
  });

  it('toggles app selection', () => {
    const off = workoutReducer(initialState, { type: 'TOGGLE_APP', appId: 'tiktok' });
    expect(off.config.selectedAppIds).not.toContain('tiktok');
    const on = workoutReducer(off, { type: 'TOGGLE_APP', appId: 'tiktok' });
    expect(on.config.selectedAppIds).toContain('tiktok');
  });
});
