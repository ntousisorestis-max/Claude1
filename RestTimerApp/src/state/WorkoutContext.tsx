import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { blocker } from '../blocking';
import { lockedShut, setBanked, workoutDone, workoutStarted } from '../haptics';
import {
  cancelRestOverNotification,
  requestNotificationPermission,
  scheduleRestOverNotification,
} from '../notifications';
import { memoryStorage, type AppStorage } from './storage';
import {
  initialState,
  newExerciseId,
  toSaved,
  workoutReducer,
} from './workoutReducer';
import type { Exercise, SavedState, WorkoutState } from './types';

/**
 * Every field, deliberately. A missed one here means that setting silently
 * never gets written — the failure is invisible until a user reports it.
 */
function sameSaved(a: SavedState | null, b: SavedState): boolean {
  return (
    a != null &&
    a.defaults.soundEnabled === b.defaults.soundEnabled &&
    sameIds(a.defaults.selectedAppIds, b.defaults.selectedAppIds) &&
    a.defaults.customApps.length === b.defaults.customApps.length &&
    a.defaults.customApps.every((app, i) => app.id === b.defaults.customApps[i]?.id) &&
    a.exercises.length === b.exercises.length &&
    a.exercises.every((exercise, i) => sameExercise(exercise, b.exercises[i]))
  );
}

function sameExercise(a: Exercise, b: Exercise | undefined): boolean {
  return (
    b != null &&
    a.id === b.id &&
    a.name === b.name &&
    a.totalSets === b.totalSets &&
    a.restSeconds === b.restSeconds &&
    sameIds(a.selectedAppIds, b.selectedAppIds)
  );
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

type WorkoutActions = {
  addExercise: (name: string) => void;
  removeExercise: (id: string) => void;
  setExerciseSets: (id: string, sets: number) => void;
  setExerciseRest: (id: string, seconds: number) => void;
  toggleExerciseApp: (id: string, appId: string) => void;
  deleteAllExercises: () => void;
  toggleDefaultApp: (appId: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  addCustomApp: (name: string) => void;
  removeCustomApp: (appId: string) => void;
  startWorkout: (id: string) => void;
  finishSet: () => void;
  endRest: () => void;
  endWorkout: () => void;
  newWorkout: () => void;
};

const WorkoutContext = createContext<
  { state: WorkoutState } & WorkoutActions | null
>(null);

export function WorkoutProvider({
  children,
  /**
   * Where exercises and preferences live between launches. Defaults to an
   * in-memory store; pass an AsyncStorage- or localStorage-backed one to make
   * them stick. See src/state/storage.ts.
   */
  storage = memoryStorage,
}: {
  children: React.ReactNode;
  storage?: AppStorage;
}) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Load once on mount. Only the list and the preferences are restored — never
  // a saved workout, which would resume a session whose rest timer expired
  // days ago.
  const hydrated = useRef(false);
  const lastPersisted = useRef<SavedState | null>(null);

  useEffect(() => {
    let alive = true;
    storage
      .load()
      .then(saved => {
        if (alive && saved) {
          lastPersisted.current = saved;
          dispatch({ type: 'HYDRATE', saved });
        }
      })
      .catch(err => console.warn('[rest-timer] could not load', err))
      .finally(() => {
        hydrated.current = true;
      });
    return () => {
      alive = false;
    };
  }, [storage]);

  // Save whenever the list or the preferences change.
  //
  // Two guards, both load-bearing: nothing is written until the load has
  // settled, so an empty list can't overwrite what's on disk; and nothing is
  // written that matches what was just read, so a launch where the user
  // changes nothing performs no writes at all.
  useEffect(() => {
    const saved = toSaved(state);
    if (!hydrated.current || sameSaved(lastPersisted.current, saved)) {
      return;
    }
    lastPersisted.current = saved;
    storage
      .save(saved)
      .catch(err => console.warn('[rest-timer] could not save', err));
  }, [state, storage]);

  // The single place the OS-level shield is driven from. Every screen just
  // moves the state machine; locking follows from `appsLocked`.
  useEffect(() => {
    if (state.appsLocked) {
      blocker.lockApps().catch(err => console.warn('[rest-timer] lock', err));
    } else {
      blocker.unlockApps().catch(err => console.warn('[rest-timer] unlock', err));
    }
  }, [state.appsLocked]);

  // Every haptic in the app, in one place.
  //
  // Each buzz-worthy moment *is* a phase change, so deriving them from the
  // phase rather than firing them inside the action creators means the timer
  // running out on its own feels exactly like tapping Skip rest, and finishing
  // the last set can't buzz twice on its way to the summary.
  const previousPhase = useRef(state.phase);
  useEffect(() => {
    const from = previousPhase.current;
    const to = state.phase;
    previousPhase.current = to;

    if (from === to) {
      return;
    }
    if (to === 'active') {
      // Coming back from rest is a re-lock; anything else is the first set.
      (from === 'resting' ? lockedShut : workoutStarted)();
    } else if (to === 'resting') {
      setBanked();
    } else if (to === 'complete') {
      workoutDone();
    }
  }, [state.phase]);

  // Backup alert for rest ending while the user is inside a scrolling app.
  useEffect(() => {
    if (state.phase === 'resting' && state.restEndsAt != null) {
      scheduleRestOverNotification(
        state.restEndsAt,
        state.currentSet + 1,
        state.config.totalSets,
        state.defaults.soundEnabled,
      );
      return () => {
        cancelRestOverNotification();
      };
    }
  }, [
    state.phase,
    state.restEndsAt,
    state.currentSet,
    state.config.totalSets,
    state.defaults.soundEnabled,
  ]);

  const actions = useMemo<WorkoutActions>(
    () => ({
      // The id is minted here rather than in the reducer, which has to stay a
      // pure function of its inputs.
      addExercise: name =>
        dispatch({ type: 'ADD_EXERCISE', id: newExerciseId(), name }),
      removeExercise: id => dispatch({ type: 'REMOVE_EXERCISE', id }),
      setExerciseSets: (id, sets) =>
        dispatch({ type: 'SET_EXERCISE_SETS', id, sets }),
      setExerciseRest: (id, seconds) =>
        dispatch({ type: 'SET_EXERCISE_REST', id, seconds }),
      toggleExerciseApp: (id, appId) =>
        dispatch({ type: 'TOGGLE_EXERCISE_APP', id, appId }),
      deleteAllExercises: () => dispatch({ type: 'DELETE_ALL_EXERCISES' }),
      toggleDefaultApp: appId => dispatch({ type: 'TOGGLE_DEFAULT_APP', appId }),
      setSoundEnabled: enabled => dispatch({ type: 'SET_SOUND_ENABLED', enabled }),
      addCustomApp: name => dispatch({ type: 'ADD_CUSTOM_APP', name }),
      removeCustomApp: appId => dispatch({ type: 'REMOVE_CUSTOM_APP', appId }),
      startWorkout: id => {
        requestNotificationPermission();
        dispatch({ type: 'START_WORKOUT', id });
      },
      // No haptics here — see the phase-change effect above.
      finishSet: () => dispatch({ type: 'FINISH_SET', now: Date.now() }),
      endRest: () => dispatch({ type: 'END_REST', now: Date.now() }),
      endWorkout: () => dispatch({ type: 'END_WORKOUT' }),
      newWorkout: () => dispatch({ type: 'NEW_WORKOUT' }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout must be used inside <WorkoutProvider>');
  }
  return ctx;
}
