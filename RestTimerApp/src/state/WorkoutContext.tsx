import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { blocker } from '../blocking';
import {
  cancelRestOverNotification,
  requestNotificationPermission,
  scheduleRestOverNotification,
} from '../notifications';
import { initialState, workoutReducer } from './workoutReducer';
import type { WorkoutState } from './types';

type WorkoutActions = {
  setExerciseName: (name: string) => void;
  setTotalSets: (sets: number) => void;
  setRestSeconds: (seconds: number) => void;
  toggleApp: (appId: string) => void;
  startWorkout: () => void;
  finishSet: () => void;
  endRest: () => void;
  endWorkout: () => void;
  newWorkout: () => void;
};

const WorkoutContext = createContext<
  { state: WorkoutState } & WorkoutActions | null
>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // --- Persistence slot -----------------------------------------------------
  // Adding AsyncStorage later means two hooks here and nothing else:
  //   useEffect(() => { load().then(s => s && dispatch({type:'HYDRATE', state:s})) }, []);
  //   useEffect(() => { save(state) }, [state]);
  // -------------------------------------------------------------------------

  // The single place the OS-level shield is driven from. Every screen just
  // moves the state machine; locking follows from `appsLocked`.
  useEffect(() => {
    if (state.appsLocked) {
      blocker.lockApps().catch(err => console.warn('[rest-timer] lock', err));
    } else {
      blocker.unlockApps().catch(err => console.warn('[rest-timer] unlock', err));
    }
  }, [state.appsLocked]);

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
      startWorkout: () => {
        requestNotificationPermission();
        dispatch({ type: 'START_WORKOUT' });
      },
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
