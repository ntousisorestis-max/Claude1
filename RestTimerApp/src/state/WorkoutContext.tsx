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
import {
  memoryDefaultsStorage,
  type DefaultsStorage,
} from './defaultsStorage';
import { initialState, workoutReducer } from './workoutReducer';
import type { WorkoutDefaults, WorkoutState } from './types';

/**
 * Every field, deliberately. A missed one here means that setting silently
 * never gets written — the failure is invisible until a user reports it.
 */
function sameDefaults(
  a: WorkoutDefaults | null,
  b: WorkoutDefaults,
): boolean {
  return (
    a != null &&
    a.totalSets === b.totalSets &&
    a.restSeconds === b.restSeconds &&
    a.soundEnabled === b.soundEnabled &&
    sameIds(a.selectedAppIds, b.selectedAppIds) &&
    a.customApps.length === b.customApps.length &&
    a.customApps.every((app, i) => app.id === b.customApps[i]?.id)
  );
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

type WorkoutActions = {
  setExerciseName: (name: string) => void;
  setTotalSets: (sets: number) => void;
  setRestSeconds: (seconds: number) => void;
  toggleApp: (appId: string) => void;
  setDefaultSets: (sets: number) => void;
  setDefaultRest: (seconds: number) => void;
  toggleDefaultApp: (appId: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  addCustomApp: (name: string) => void;
  removeCustomApp: (appId: string) => void;
  resetDefaults: () => void;
  startWorkout: () => void;
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
   * Where Settings defaults live between launches. Defaults to an in-memory
   * store; pass an AsyncStorage- or localStorage-backed one to make them stick.
   * See src/state/defaultsStorage.ts.
   */
  storage = memoryDefaultsStorage,
}: {
  children: React.ReactNode;
  storage?: DefaultsStorage;
}) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Load once on mount. Only defaults are restored — never a saved workout,
  // which would resume a session whose rest timer expired days ago.
  const hydrated = useRef(false);
  const lastPersisted = useRef<WorkoutDefaults | null>(null);

  useEffect(() => {
    let alive = true;
    storage
      .load()
      .then(saved => {
        if (alive && saved) {
          lastPersisted.current = saved;
          dispatch({ type: 'HYDRATE_DEFAULTS', defaults: saved });
        }
      })
      .catch(err => console.warn('[rest-timer] could not load defaults', err))
      .finally(() => {
        hydrated.current = true;
      });
    return () => {
      alive = false;
    };
  }, [storage]);

  // Save whenever they change.
  //
  // Two guards, both load-bearing: nothing is written until the load has
  // settled, so factory defaults can't overwrite what's on disk; and nothing
  // is written that matches what was just read, so a launch where the user
  // changes nothing performs no writes at all.
  useEffect(() => {
    if (!hydrated.current || sameDefaults(lastPersisted.current, state.defaults)) {
      return;
    }
    lastPersisted.current = state.defaults;
    storage
      .save(state.defaults)
      .catch(err => console.warn('[rest-timer] could not save defaults', err));
  }, [state.defaults, storage]);

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
      setExerciseName: name => dispatch({ type: 'SET_EXERCISE_NAME', name }),
      setTotalSets: sets => dispatch({ type: 'SET_TOTAL_SETS', sets }),
      setRestSeconds: seconds => dispatch({ type: 'SET_REST_SECONDS', seconds }),
      toggleApp: appId => dispatch({ type: 'TOGGLE_APP', appId }),
      setDefaultSets: sets => dispatch({ type: 'SET_DEFAULT_SETS', sets }),
      setDefaultRest: seconds => dispatch({ type: 'SET_DEFAULT_REST', seconds }),
      toggleDefaultApp: appId => dispatch({ type: 'TOGGLE_DEFAULT_APP', appId }),
      setSoundEnabled: enabled => dispatch({ type: 'SET_SOUND_ENABLED', enabled }),
      addCustomApp: name => dispatch({ type: 'ADD_CUSTOM_APP', name }),
      removeCustomApp: appId => dispatch({ type: 'REMOVE_CUSTOM_APP', appId }),
      resetDefaults: () => dispatch({ type: 'RESET_DEFAULTS' }),
      startWorkout: () => {
        requestNotificationPermission();
        dispatch({ type: 'START_WORKOUT' });
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
