/**
 * The persistence seam.
 *
 * These exist so that swapping the in-memory store for AsyncStorage is a
 * one-line change with evidence behind it, rather than a hopeful comment.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { createMemoryDefaultsStorage } from '../src/state/defaultsStorage';
import { useWorkout, WorkoutProvider } from '../src/state/WorkoutContext';
import { initialState, workoutReducer } from '../src/state/workoutReducer';
import type { DefaultsStorage } from '../src/state/defaultsStorage';
import type { WorkoutDefaults } from '../src/state/types';

/** Renders nothing; hands the live state back to the test. */
function Probe({ onState }: { onState: (s: ReturnType<typeof useWorkout>) => void }) {
  const ctx = useWorkout();
  onState(ctx);
  return null;
}

async function mount(storage: DefaultsStorage) {
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

describe('defaults persistence seam', () => {
  it('restores saved defaults on launch', async () => {
    const saved: WorkoutDefaults = {
      totalSets: 7,
      restSeconds: 120,
      selectedAppIds: ['youtube'],
    };
    const app = await mount(createMemoryDefaultsStorage(saved));

    expect(app.state.defaults).toEqual(saved);
    // Nothing has started, so the setup screen shows the restored values.
    expect(app.state.config.totalSets).toBe(7);
    expect(app.state.config.restSeconds).toBe(120);

    app.unmount();
  });

  it('writes defaults back when Settings changes them', async () => {
    const storage = createMemoryDefaultsStorage();
    const save = jest.spyOn(storage, 'save');
    const app = await mount(storage);

    await ReactTestRenderer.act(async () => {
      app.actions.setDefaultSets(9);
    });

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ totalSets: 9 }));
    await expect(storage.load()).resolves.toMatchObject({ totalSets: 9 });

    app.unmount();
  });

  it('does not write before the load has settled', async () => {
    // Otherwise the factory defaults would clobber the saved ones on launch.
    const storage = createMemoryDefaultsStorage({
      totalSets: 5,
      restSeconds: 30,
      selectedAppIds: ['x'],
    });
    const save = jest.spyOn(storage, 'save');
    const app = await mount(storage);

    expect(save).not.toHaveBeenCalled();
    await expect(storage.load()).resolves.toMatchObject({ totalSets: 5 });

    app.unmount();
  });

  it('survives a storage that throws', async () => {
    const broken: DefaultsStorage = {
      load: () => Promise.reject(new Error('disk gone')),
      save: () => Promise.reject(new Error('disk gone')),
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = await mount(broken);

    // Falls back to the factory defaults rather than blowing up.
    expect(app.state.defaults.totalSets).toBe(3);

    app.unmount();
    warn.mockRestore();
  });
});

describe('HYDRATE_DEFAULTS', () => {
  it('clamps stored values that are out of range', async () => {
    const s = workoutReducer(initialState, {
      type: 'HYDRATE_DEFAULTS',
      defaults: { totalSets: 999, restSeconds: 1, selectedAppIds: [] },
    });

    expect(s.defaults.totalSets).toBe(20);
    expect(s.defaults.restSeconds).toBe(10);
  });

  it('drops app ids the app no longer knows about', async () => {
    const s = workoutReducer(initialState, {
      type: 'HYDRATE_DEFAULTS',
      defaults: { totalSets: 3, restSeconds: 60, selectedAppIds: ['tiktok', 'myspace'] },
    });

    expect(s.defaults.selectedAppIds).toEqual(['tiktok']);
  });

  it('leaves a workout in progress untouched', async () => {
    const active = workoutReducer(initialState, { type: 'START_WORKOUT' });
    const s = workoutReducer(active, {
      type: 'HYDRATE_DEFAULTS',
      defaults: { totalSets: 9, restSeconds: 120, selectedAppIds: ['x'] },
    });

    expect(s.defaults.totalSets).toBe(9);
    expect(s.config.totalSets).toBe(initialState.config.totalSets);
    expect(s.phase).toBe('active');
  });
});
