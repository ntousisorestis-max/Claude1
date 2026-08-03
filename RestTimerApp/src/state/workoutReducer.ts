import type {
  AppDefaults,
  SessionTotals,
  BlockableApp,
  CustomApp,
  Exercise,
  SavedState,
  WorkoutAction,
  WorkoutConfig,
  WorkoutState,
} from './types';

export const MIN_SETS = 1;
export const MAX_SETS = 20;
export const MIN_REST_SECONDS = 10;
export const MAX_REST_SECONDS = 600;
export const REST_PRESETS = [30, 60, 90, 120];

/**
 * Rest cut shorter than this counts as skipping it.
 *
 * Absolute rather than a fraction of the rest period: someone who taps Skip
 * with eight seconds left was waiting for the timer, not dodging it, and
 * teasing them for it would be the app misreading the room. Fifteen seconds is
 * comfortably past that and well short of any real rest period.
 */
export const SKIPPED_REST_THRESHOLD_MS = 15_000;

export const MAX_EXERCISES = 40;
export const MAX_EXERCISE_NAME_LENGTH = 32;

/**
 * What a brand new exercise starts at.
 *
 * Not a setting: sets and rest are per-exercise now, so there is no longer one
 * shared pair of numbers for Settings to hold. These are just a sane opening
 * position, and the first thing you do with a new card is adjust them.
 */
export const NEW_EXERCISE_SETS = 3;
export const NEW_EXERCISE_REST_SECONDS = 60;

/**
 * Phase 1 placeholder list. In Phase 2 on iOS this is replaced by
 * FamilyActivityPicker, which returns an opaque selection instead of names.
 */
export const BLOCKABLE_APPS: BlockableApp[] = [
  { id: 'tiktok', name: 'TikTok', tint: '#69C9D0', brand: 'tiktok' },
  { id: 'instagram', name: 'Instagram', tint: '#D6739A', brand: 'instagram' },
  { id: 'youtube', name: 'YouTube', tint: '#D96A6A', brand: 'youtube' },
  { id: 'x', name: 'X', tint: '#9AA3A9', brand: 'x' },
  { id: 'reddit', name: 'Reddit', tint: '#E2894F', brand: 'reddit' },
];

/** Cycled through for apps you add, so a list of them isn't all one colour. */
const CUSTOM_TINTS = ['#A78BFA', '#7DD3C0', '#F0A868', '#E58FB0', '#8FB8F0'];

export const MAX_CUSTOM_APPS = 10;
export const MAX_APP_NAME_LENGTH = 24;

/**
 * Everything that can be blocked: the five presets plus whatever the user
 * added. Every screen showing app pills reads this, so a custom app appears on
 * an exercise card and on the block-preview shield without either knowing it
 * exists.
 */
export function allBlockableApps(customApps: CustomApp[]): BlockableApp[] {
  return [...BLOCKABLE_APPS, ...customApps];
}

/** `TikTok` -> `custom:tiktok`. Stable, so a re-add can't duplicate an id. */
export function customAppId(name: string): string {
  return `custom:${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * An id for a new exercise.
 *
 * Not derived from the name: two exercises may legitimately be called the same
 * thing, and renaming one must never silently merge it with another. Generated
 * by the caller and handed to the reducer, which stays pure.
 */
export function newExerciseId(): string {
  return `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Exported so "delete everything" and the tests share one definition. */
export const FACTORY_DEFAULTS: AppDefaults = {
  selectedAppIds: ['tiktok', 'instagram'],
  soundEnabled: true,
  customApps: [],
};

/** Nothing is running, so nothing here means anything yet. */
const EMPTY_CONFIG: WorkoutConfig = {
  exerciseName: '',
  totalSets: NEW_EXERCISE_SETS,
  restSeconds: NEW_EXERCISE_REST_SECONDS,
  selectedAppIds: [],
};

const NO_SESSION: SessionTotals = {
  setsCompleted: 0,
  lockedSeconds: 0,
  workoutsFinished: 0,
};

export const initialState: WorkoutState = {
  phase: 'setup',
  session: NO_SESSION,
  exercises: [],
  config: EMPTY_CONFIG,
  defaults: FACTORY_DEFAULTS,
  currentSet: 1,
  setsCompleted: 0,
  restStartedAt: null,
  restEndsAt: null,
  totalRestSeconds: 0,
  lockedSince: null,
  totalLockedSeconds: 0,
  appsLocked: false,
  skippedRest: false,
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Seconds elapsed since rest began, floored at 0. */
function restElapsed(state: WorkoutState, now: number): number {
  if (state.restStartedAt == null) {
    return 0;
  }
  return Math.max(0, Math.round((now - state.restStartedAt) / 1000));
}

/**
 * Seconds the apps have been locked since the current set began, floored at 0.
 *
 * Measured from wall-clock stamps rather than counted up by a timer, for the
 * same reason the countdown is: the JS thread is suspended for most of a set
 * on a phone in a pocket, and a tick-counter would simply lose that time.
 */
function lockedElapsed(state: WorkoutState, now: number): number {
  if (state.lockedSince == null) {
    return 0;
  }
  return Math.max(0, Math.round((now - state.lockedSince) / 1000));
}

/**
 * Banks the stretch of locked time that is ending now, into both the workout's
 * total and the session's. Returns them together so no caller can update one
 * and forget the other.
 */
function bankLocked(state: WorkoutState, now: number) {
  const justLocked = lockedElapsed(state, now);
  return {
    totalLockedSeconds: state.totalLockedSeconds + justLocked,
    lockedSince: null as number | null,
    session: {
      ...state.session,
      lockedSeconds: state.session.lockedSeconds + justLocked,
    },
  };
}

/**
 * Rewrites one exercise in place, leaving the rest of the list untouched.
 *
 * Every per-exercise edit goes through here, which is what keeps the cards
 * genuinely independent — there is no path that writes to more than one.
 */
function editExercise(
  state: WorkoutState,
  id: string,
  change: (exercise: Exercise) => Exercise,
): WorkoutState {
  let found = false;
  const exercises = state.exercises.map(exercise => {
    if (exercise.id !== id) {
      return exercise;
    }
    found = true;
    return change(exercise);
  });
  return found ? { ...state, exercises } : state;
}

/** Drops an app id from every exercise, the defaults and any live workout. */
function forgetApp(state: WorkoutState, appId: string): WorkoutState {
  const without = (ids: string[]) => ids.filter(id => id !== appId);

  return {
    ...state,
    defaults: {
      ...state.defaults,
      selectedAppIds: without(state.defaults.selectedAppIds),
    },
    exercises: state.exercises.map(exercise => ({
      ...exercise,
      selectedAppIds: without(exercise.selectedAppIds),
    })),
    config: {
      ...state.config,
      selectedAppIds: without(state.config.selectedAppIds),
    },
  };
}

export function workoutReducer(
  state: WorkoutState,
  action: WorkoutAction,
): WorkoutState {
  switch (action.type) {
    case 'ADD_EXERCISE': {
      const name = action.name.trim().slice(0, MAX_EXERCISE_NAME_LENGTH);

      // Blanks and duplicates are refused here as well as in the UI. The screen
      // disables the button; this makes it true of the state machine too.
      const clash = state.exercises.some(
        exercise => exercise.name.toLowerCase() === name.toLowerCase(),
      );
      if (!name || clash || state.exercises.length >= MAX_EXERCISES) {
        return state;
      }

      const exercise: Exercise = {
        id: action.id,
        name,
        totalSets: NEW_EXERCISE_SETS,
        restSeconds: NEW_EXERCISE_REST_SECONDS,
        // The one thing a new exercise inherits from Settings.
        selectedAppIds: state.defaults.selectedAppIds,
      };
      return { ...state, exercises: [...state.exercises, exercise] };
    }

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(e => e.id !== action.id),
      };

    case 'DELETE_ALL_EXERCISES':
      return { ...state, exercises: [] };

    case 'SET_EXERCISE_SETS':
      return editExercise(state, action.id, exercise => ({
        ...exercise,
        totalSets: clamp(Math.round(action.sets), MIN_SETS, MAX_SETS),
      }));

    case 'SET_EXERCISE_REST':
      return editExercise(state, action.id, exercise => ({
        ...exercise,
        restSeconds: clamp(
          Math.round(action.seconds),
          MIN_REST_SECONDS,
          MAX_REST_SECONDS,
        ),
      }));

    case 'TOGGLE_EXERCISE_APP':
      return editExercise(state, action.id, exercise => ({
        ...exercise,
        selectedAppIds: exercise.selectedAppIds.includes(action.appId)
          ? exercise.selectedAppIds.filter(id => id !== action.appId)
          : [...exercise.selectedAppIds, action.appId],
      }));

    case 'START_WORKOUT': {
      const exercise = state.exercises.find(e => e.id === action.id);
      if (!exercise) {
        return state;
      }
      return {
        ...state,
        phase: 'active',
        // Snapshotted, so editing the card later can't rewrite this workout.
        config: {
          exerciseName: exercise.name,
          totalSets: exercise.totalSets,
          restSeconds: exercise.restSeconds,
          selectedAppIds: exercise.selectedAppIds,
        },
        currentSet: 1,
        setsCompleted: 0,
        restStartedAt: null,
        restEndsAt: null,
        totalRestSeconds: 0,
        // The clock on "time reclaimed" starts here, with the first lock.
        lockedSince: action.now,
        totalLockedSeconds: 0,
        appsLocked: true,
        skippedRest: false,
      };
    }

    case 'FINISH_SET': {
      if (state.phase !== 'active') {
        return state;
      }
      const setsCompleted = state.setsCompleted + 1;

      // Either way the set just ended, so the locked stretch ends with it.
      const banked = bankLocked(state, action.now);
      const session = { ...banked.session, setsCompleted: state.session.setsCompleted + 1 };

      // Last set: no rest period, straight to the summary with apps unlocked.
      if (setsCompleted >= state.config.totalSets) {
        return {
          ...state,
          ...banked,
          session: { ...session, workoutsFinished: session.workoutsFinished + 1 },
          phase: 'complete',
          setsCompleted,
          restStartedAt: null,
          restEndsAt: null,
          appsLocked: false,
          skippedRest: false,
        };
      }

      return {
        ...state,
        ...banked,
        session,
        phase: 'resting',
        setsCompleted,
        restStartedAt: action.now,
        restEndsAt: action.now + state.config.restSeconds * 1000,
        appsLocked: false,
        // Whatever the last set was teased for, this one starts clean.
        skippedRest: false,
      };
    }

    case 'END_REST': {
      if (state.phase !== 'resting') {
        return state;
      }
      return {
        ...state,
        phase: 'active',
        currentSet: state.currentSet + 1,
        totalRestSeconds: state.totalRestSeconds + restElapsed(state, action.now),
        restStartedAt: null,
        restEndsAt: null,
        // Locked again, so a new stretch of reclaimed time starts.
        lockedSince: action.now,
        appsLocked: true,
        // Worked out here because this is the last moment anything knows what
        // the rest period was going to be.
        skippedRest:
          state.restEndsAt != null &&
          state.restEndsAt - action.now > SKIPPED_REST_THRESHOLD_MS,
      };
    }

    case 'END_WORKOUT': {
      if (state.phase !== 'active' && state.phase !== 'resting') {
        return state;
      }
      // `now` comes in on the action rather than being read here — a reducer
      // that calls Date.now() isn't a pure function of its inputs, which makes
      // it untestable at the exact boundaries that matter.
      const resting = state.phase === 'resting';
      // Ending mid-set still counts the part of it you did.
      const banked = bankLocked(state, action.now);
      return {
        ...state,
        ...banked,
        session: {
          ...banked.session,
          // A workout you bailed on before banking a single set isn't one.
          workoutsFinished:
            banked.session.workoutsFinished + (state.setsCompleted > 0 ? 1 : 0),
        },
        phase: 'complete',
        totalRestSeconds: resting
          ? state.totalRestSeconds + restElapsed(state, action.now)
          : state.totalRestSeconds,
        restStartedAt: null,
        restEndsAt: null,
        appsLocked: false,
      };
    }

    case 'TOGGLE_DEFAULT_APP': {
      const selected = state.defaults.selectedAppIds;
      // Seeds the next new exercise only. Existing cards keep their own picks —
      // that independence is the whole point of per-exercise settings.
      return {
        ...state,
        defaults: {
          ...state.defaults,
          selectedAppIds: selected.includes(action.appId)
            ? selected.filter(id => id !== action.appId)
            : [...selected, action.appId],
        },
      };
    }

    case 'SET_SOUND_ENABLED':
      return {
        ...state,
        defaults: { ...state.defaults, soundEnabled: action.enabled },
      };

    case 'ADD_CUSTOM_APP': {
      const name = action.name.trim().slice(0, MAX_APP_NAME_LENGTH);
      const id = customAppId(name);
      const known = allBlockableApps(state.defaults.customApps);

      // Silently ignore blanks, duplicates and anything over the cap.
      //
      // Matched on id *and* name: a preset's id is bare ("tiktok") while a
      // custom one is namespaced ("custom:tiktok"), so an id check alone would
      // happily add a second TikTok pill.
      const clash = known.some(
        app => app.id === id || app.name.toLowerCase() === name.toLowerCase(),
      );
      if (!name || clash || state.defaults.customApps.length >= MAX_CUSTOM_APPS) {
        return state;
      }

      const custom = {
        id,
        name,
        tint: CUSTOM_TINTS[state.defaults.customApps.length % CUSTOM_TINTS.length],
      };
      return {
        ...state,
        defaults: {
          ...state.defaults,
          customApps: [...state.defaults.customApps, custom],
          // Added apps start selected — you typed it in to block it.
          selectedAppIds: [...state.defaults.selectedAppIds, id],
        },
      };
    }

    case 'REMOVE_CUSTOM_APP': {
      // Forgotten everywhere at once, or a deleted app keeps being counted as
      // blocked by whichever exercise still lists it.
      const forgotten = forgetApp(state, action.appId);
      return {
        ...forgotten,
        defaults: {
          ...forgotten.defaults,
          customApps: forgotten.defaults.customApps.filter(
            app => app.id !== action.appId,
          ),
        },
      };
    }

    case 'NEW_WORKOUT':
      // Back to the list. The exercise that was just worked through is
      // untouched — it's still saved, with its own numbers, ready to run again.
      return {
        ...initialState,
        exercises: state.exercises,
        defaults: state.defaults,
        // Survives, deliberately: the stats card counts the whole session, not
        // the last workout in it.
        session: state.session,
      };

    case 'HYDRATE': {
      const customApps = (action.saved.defaults.customApps ?? []).slice(
        0,
        MAX_CUSTOM_APPS,
      );
      const known = allBlockableApps(customApps);
      const isKnown = (id: string) => known.some(app => app.id === id);

      // Clamped and filtered on the way in: stored values are last session's
      // data, which may predate a change to the limits or the app list.
      const defaults: AppDefaults = {
        selectedAppIds: action.saved.defaults.selectedAppIds.filter(isKnown),
        soundEnabled:
          action.saved.defaults.soundEnabled ?? FACTORY_DEFAULTS.soundEnabled,
        customApps,
      };

      const exercises = (action.saved.exercises ?? [])
        .slice(0, MAX_EXERCISES)
        .filter(exercise => exercise?.name?.trim())
        .map(exercise => ({
          id: exercise.id,
          name: exercise.name.trim().slice(0, MAX_EXERCISE_NAME_LENGTH),
          totalSets: clamp(Math.round(exercise.totalSets), MIN_SETS, MAX_SETS),
          restSeconds: clamp(
            Math.round(exercise.restSeconds),
            MIN_REST_SECONDS,
            MAX_REST_SECONDS,
          ),
          selectedAppIds: (exercise.selectedAppIds ?? []).filter(isKnown),
        }));

      // Nothing has started yet on launch. A workout in progress is never
      // disturbed, since hydration only ever happens once, on mount.
      return { ...state, defaults, exercises };
    }

    default:
      return state;
  }
}

/** The slice of state that gets persisted. */
export function toSaved(state: WorkoutState): SavedState {
  return { defaults: state.defaults, exercises: state.exercises };
}
