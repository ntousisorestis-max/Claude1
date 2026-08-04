/**
 * The persistence seam.
 *
 * These exist so that swapping the in-memory store for AsyncStorage is a
 * one-line change with evidence behind it, rather than a hopeful comment.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { createMemoryStorage } from '../src/state/storage';
import { useWorkout, WorkoutProvider } from '../src/state/WorkoutContext';
import {
  FACTORY_DEFAULTS,
  initialState,
  workoutReducer,
} from '../src/state/workoutReducer';
import type { AppStorage } from '../src/state/storage';
import type { Exercise, SavedState } from '../src/state/types';

const BENCH: Exercise = {
  id: 'ex_bench',
  name: 'Bench press',
  totalSets: 7,
  restSeconds: 120,
  selectedAppIds: ['youtube'],
};

/** Renders nothing; hands the live state back to the test. */
function Probe({ onState }: { onState: (s: ReturnType<typeof useWorkout>) => void }) {
  const ctx = useWorkout();
  onState(ctx);
  return null;
}

async function mount(storage: AppStorage) {
  let latest!: ReturnType<typeof useWorkout>;
  let tree!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <WorkoutProvider storage={storage}>
        <Probe onState={s => (latest = s)} />
      </WorkoutProvider>,
    );
  });
  // Let the load promise settle.
  await ReactTestRenderer.act(async () => {});

  return {
    get state() {
      return latest.state;
    },
    get actions() {
      return latest;
    },
    unmount: () => ReactTestRenderer.act(() => tree.unmount()),
  };
}

describe('persistence seam', () => {
  it('restores saved exercises and preferences on launch', async () => {
    const saved: SavedState = {
      defaults: { ...FACTORY_DEFAULTS, soundEnabled: false },
      welcomed: true,
      exercises: [BENCH],
    };
    const app = await mount(createMemoryStorage(saved));

    expect(app.state.exercises).toEqual([BENCH]);
    expect(app.state.defaults.soundEnabled).toBe(false);

    app.unmount();
  });

  it('writes back when an exercise is added', async () => {
    const storage = createMemoryStorage();
    const save = jest.spyOn(storage, 'save');
    const app = await mount(storage);

    await ReactTestRenderer.act(async () => {
      app.actions.addExercise('Pulldowns');
    });

    expect(save).toHaveBeenCalled();
    const written = (await storage.load()) as SavedState;
    expect(written.exercises.map(e => e.name)).toEqual(['Pulldowns']);

    app.unmount();
  });

  it('writes back when a preference changes', async () => {
    const storage = createMemoryStorage();
    const app = await mount(storage);

    await ReactTestRenderer.act(async () => {
      app.actions.setSoundEnabled(false);
    });

    await expect(storage.load()).resolves.toMatchObject({
      defaults: { soundEnabled: false },
    });

    app.unmount();
  });

  it('does not write before the load has settled', async () => {
    // Otherwise an empty list would clobber the saved one on launch.
    const storage = createMemoryStorage({
      defaults: FACTORY_DEFAULTS,
      welcomed: true,
      exercises: [BENCH],
    });
    const save = jest.spyOn(storage, 'save');
    const app = await mount(storage);

    expect(save).not.toHaveBeenCalled();
    await expect(storage.load()).resolves.toMatchObject({
      welcomed: true,
      exercises: [expect.objectContaining({ name: 'Bench press' })],
    });

    app.unmount();
  });

  it('survives a storage that throws', async () => {
    const broken: AppStorage = {
      load: () => Promise.reject(new Error('disk gone')),
      save: () => Promise.reject(new Error('disk gone')),
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = await mount(broken);

    // Falls back to an empty list rather than blowing up.
    expect(app.state.exercises).toEqual([]);
    expect(app.state.defaults).toEqual(FACTORY_DEFAULTS);

    app.unmount();
    warn.mockRestore();
  });
});

describe('HYDRATE', () => {
  const hydrate = (saved: SavedState) =>
    workoutReducer(initialState, { type: 'HYDRATE', saved });

  it('clamps stored exercise values that are out of range', () => {
    const s = hydrate({
      defaults: FACTORY_DEFAULTS,
      welcomed: true,
      exercises: [{ ...BENCH, totalSets: 999, restSeconds: 1 }],
    });

    expect(s.exercises[0].totalSets).toBe(20);
    expect(s.exercises[0].restSeconds).toBe(10);
  });

  it('drops app ids the app no longer knows about', () => {
    const s = hydrate({
      defaults: { ...FACTORY_DEFAULTS, selectedAppIds: ['tiktok', 'myspace'] },
      welcomed: true,
      exercises: [{ ...BENCH, selectedAppIds: ['myspace', 'x'] }],
    });

    expect(s.defaults.selectedAppIds).toEqual(['tiktok']);
    expect(s.exercises[0].selectedAppIds).toEqual(['x']);
  });

  it('keeps a saved selection that refers to a custom app', () => {
    // Filtering only against the presets would silently drop every app the
    // user had added themselves.
    const s = hydrate({
      defaults: {
        ...FACTORY_DEFAULTS,
        customApps: [{ id: 'custom:strava', name: 'Strava', tint: '#A78BFA' }],
        selectedAppIds: ['tiktok', 'custom:strava'],
      },
      welcomed: true,
      exercises: [{ ...BENCH, selectedAppIds: ['custom:strava'] }],
    });

    expect(s.defaults.selectedAppIds).toEqual(['tiktok', 'custom:strava']);
    expect(s.exercises[0].selectedAppIds).toEqual(['custom:strava']);
  });

  it('drops an exercise with no usable name', () => {
    const s = hydrate({
      defaults: FACTORY_DEFAULTS,
      welcomed: true,
      exercises: [
        { ...BENCH, name: '  ' },
        { ...BENCH, id: 'ok' },
      ],
    });

    expect(s.exercises.map(e => e.id)).toEqual(['ok']);
  });
});
