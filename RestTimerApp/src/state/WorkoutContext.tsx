import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { blocker } from '../blocking';
import { lockedShut, setBanked, workoutDone } from '../haptics';
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

function sameDefaults(
  a: WorkoutDefaults | null,
  b: WorkoutDefaults,
): boolean {
  return (
    a != null &&
    a.totalSets === b.totalSets &&
    a.restSeconds === b.restSeconds &&
    a.selectedAppIds.length === b.selectedAppIds.length &&
    a.selectedAppIds.every((id, i) => id === b.selectedAppIds[i])
  );
}

type WorkoutActions = {
  setExerciseName: (name: string) => void;
  setTotalSets: (sets: number) => void;
  setRestSeconds: (seconds: number) => void;
  toggleApp: (appId: string) => void;
  setDefaultSets: (sets: number) => void;
  setDefaultRest: (seconds: number) => void;
  toggleDefaultApp: (appId: string) => void;
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

  // Buzz once when the workout finishes. Driven off the phase rather than the
  // action, so ending early and finishing the last set both get it.
  useEffect(() => {
    if (state.phase === 'complete') {
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
      );
      return () => {
        cancelRestOverNotification();
      };
    }
  }, [state.phase, state.restEndsAt, state.currentSet, state.config.totalSets]);

  const actions = useMemo<WorkoutActions>(
    () => ({
      setExerciseName: name => dispatch({ type: 'SET_EXERCISE_NAME', name }),
      setTotalSets: sets => dispatch({ type: 'SET_TOTAL_SETS', sets }),
      setRestSeconds: seconds => dispatch({ type: 'SET_REST_SECONDS', seconds }),
      toggleApp: appId => dispatch({ type: 'TOGGLE_APP', appId }),
      setDefaultSets: sets => dispatch({ type: 'SET_DEFAULT_SETS', sets }),
      setDefaultRest: seconds => dispatch({ type: 'SET_DEFAULT_REST', seconds }),
      toggleDefaultApp: appId => dispatch({ type: 'TOGGLE_DEFAULT_APP', appId }),
      startWorkout: () => {
        requestNotificationPermission();
        dispatch({ type: 'START_WORKOUT' });
      },
      finishSet: () => {
        setBanked();
        dispatch({ type: 'FINISH_SET', now: Date.now() });
      },
      endRest: () => {
        lockedShut();
        dispatch({ type: 'END_REST', now: Date.now() });
      },
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
