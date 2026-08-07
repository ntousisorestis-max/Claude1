import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { blocker } from '../blocking';
import {
  restExpired,
  restSkipped,
  setBanked,
  workoutDone,
  workoutStarted,
} from '../haptics';
import {
  cancelRestOverNotification,
  onRestNotificationPress,
  requestNotificationPermission,
  scheduleRestOverNotification,
} from '../notifications';
import {
  playSetComplete,
  playWorkoutComplete,
  setSoundEnabled as setSoundOutputEnabled,
} from '../sound';
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
    a.defaults.customApps.every(
      (app, i) => app.id === b.defaults.customApps[i]?.id,
    ) &&
    a.welcomed === b.welcomed &&
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
  renameExercise: (id: string, name: string) => void;
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
  /** Remembers that the welcome screen has been tapped through. */
  finishWelcome: () => void;
};

const WorkoutContext = createContext<
  ({ state: WorkoutState; hydrated: boolean } & WorkoutActions) | null
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
  /**
   * The same fact as `hydrated`, as state.
   *
   * The ref gates *writes*, which happen in effects and must not lag a render.
   * This gates what is *drawn*: until the load settles the app cannot know
   * whether the welcome screen is owed, and guessing means either flashing it
   * at someone who has seen it or skipping it for someone who hasn't.
   */
  const [loaded, setLoaded] = useState(false);
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
      .catch(err => console.warn('[liftlock] could not load', err))
      .finally(() => {
        hydrated.current = true;
        if (alive) {
          setLoaded(true);
        }
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
      blocker
        .unlockApps()
        .catch(err => console.warn('[rest-timer] unlock', err));
    }
  }, [state.appsLocked]);

  // The sound output follows the same switch as the notification channel, so
  // Silent mode means silent everywhere rather than in one of the two places
  // the app can make a noise.
  useEffect(() => {
    setSoundOutputEnabled(state.defaults.soundEnabled);
  }, [state.defaults.soundEnabled]);

  // Every haptic and every sound in the app, in one place.
  //
  // Each feedback-worthy moment *is* a phase change, so deriving them from the
  // phase rather than firing them inside the action creators means the timer
  // running out on its own feels exactly like tapping Skip rest, and finishing
  // the last set can't buzz twice on its way to the summary.
  //
  // Note which transitions make a *sound*: banking a set, and finishing. Not
  // starting one — the moment a set begins is the moment the phone should stop
  // being interesting, and a chime as you step under a bar is the app asking
  // for attention at precisely the wrong time. That one gets a haptic only.
  const previousPhase = useRef(state.phase);
  useEffect(() => {
    const from = previousPhase.current;
    const to = state.phase;
    previousPhase.current = to;

    if (from === to) {
      return;
    }
    if (to === 'active') {
      if (from === 'resting') {
        // Two beats when the timer ran out, one when the user cut it short.
        // Same transition either way, completely different situations to be in:
        // an expired rest has to reach someone who may not be looking at the
        // phone, where a skip was a deliberate press by someone who is.
        (state.skippedRest ? restSkipped : restExpired)();
      } else {
        // Anything else is the first set of the workout.
        workoutStarted();
      }
    } else if (to === 'resting') {
      setBanked();
      playSetComplete();
    } else if (to === 'complete') {
      workoutDone();
      // The last set is banked by the same transition that ends the workout, so
      // this one sound has to stand for both. It is the bigger of the two.
      playWorkoutComplete();
    }
    // `skippedRest` is read at the instant of the transition. Listing it as a
    // dependency costs nothing — a change to it without a phase change falls
    // straight through the `from === to` guard above.
  }, [state.phase, state.skippedRest]);

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

  // Tapping "Time's up!" should put you on the set you were about to do, not
  // just open the app. END_REST is exactly that transition, and the reducer
  // ignores it unless we're actually resting — so a stale tap, or one that
  // arrives after the countdown already ended rest itself, can't skip a set.
  useEffect(
    () =>
      onRestNotificationPress(() =>
        dispatch({ type: 'END_REST', now: Date.now() }),
      ),
    [],
  );

  const actions = useMemo<WorkoutActions>(
    () => ({
      // The id is minted here rather than in the reducer, which has to stay a
      // pure function of its inputs.
      addExercise: name =>
        dispatch({ type: 'ADD_EXERCISE', id: newExerciseId(), name }),
      removeExercise: id => dispatch({ type: 'REMOVE_EXERCISE', id }),
      renameExercise: (id, name) =>
        dispatch({ type: 'RENAME_EXERCISE', id, name }),
      setExerciseSets: (id, sets) =>
        dispatch({ type: 'SET_EXERCISE_SETS', id, sets }),
      setExerciseRest: (id, seconds) =>
        dispatch({ type: 'SET_EXERCISE_REST', id, seconds }),
      toggleExerciseApp: (id, appId) =>
        dispatch({ type: 'TOGGLE_EXERCISE_APP', id, appId }),
      deleteAllExercises: () => dispatch({ type: 'DELETE_ALL_EXERCISES' }),
      toggleDefaultApp: appId =>
        dispatch({ type: 'TOGGLE_DEFAULT_APP', appId }),
      setSoundEnabled: enabled =>
        dispatch({ type: 'SET_SOUND_ENABLED', enabled }),
      addCustomApp: name => dispatch({ type: 'ADD_CUSTOM_APP', name }),
      removeCustomApp: appId => dispatch({ type: 'REMOVE_CUSTOM_APP', appId }),
      startWorkout: id => {
        requestNotificationPermission();
        dispatch({ type: 'START_WORKOUT', id, now: Date.now() });
      },
      // No haptics here — see the phase-change effect above.
      finishSet: () => dispatch({ type: 'FINISH_SET', now: Date.now() }),
      endRest: () => dispatch({ type: 'END_REST', now: Date.now() }),
      endWorkout: () => dispatch({ type: 'END_WORKOUT', now: Date.now() }),
      newWorkout: () => dispatch({ type: 'NEW_WORKOUT' }),
      finishWelcome: () => dispatch({ type: 'WELCOME_DONE' }),
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, hydrated: loaded, ...actions }),
    [state, loaded, actions],
  );

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
