import type {
  BlockableApp,
  WorkoutAction,
  WorkoutConfig,
  WorkoutDefaults,
  WorkoutState,
} from './types';

export const MIN_SETS = 1;
export const MAX_SETS = 20;
export const MIN_REST_SECONDS = 10;
export const MAX_REST_SECONDS = 600;
export const REST_PRESETS = [30, 60, 90, 120];

/**
 * Phase 1 placeholder list. In Phase 2 on iOS this is replaced by
 * FamilyActivityPicker, which returns an opaque selection instead of names.
 */
export const BLOCKABLE_APPS: BlockableApp[] = [
  { id: 'tiktok', name: 'TikTok', tint: '#69C9D0' },
  { id: 'instagram', name: 'Instagram', tint: '#D6739A' },
  { id: 'youtube', name: 'YouTube', tint: '#D96A6A' },
  { id: 'x', name: 'X', tint: '#9AA3A9' },
  { id: 'reddit', name: 'Reddit', tint: '#E2894F' },
];

const factoryDefaults: WorkoutDefaults = {
  totalSets: 3,
  restSeconds: 60,
  selectedAppIds: ['tiktok', 'instagram'],
};

const defaultConfig: WorkoutConfig = {
  exerciseName: '',
  ...factoryDefaults,
};

export const initialState: WorkoutState = {
  phase: 'setup',
  config: defaultConfig,
  defaults: factoryDefaults,
  currentSet: 1,
  setsCompleted: 0,
  restStartedAt: null,
  restEndsAt: null,
  totalRestSeconds: 0,
  appsLocked: false,
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
 * Writes a default, and mirrors it onto the live config while the user is
 * still on the setup screen.
 *
 * Without the mirror, changing "default rest" and tapping back to a Workout
 * tab that still reads 60s looks broken — nothing has started yet, so there's
 * no reason for the two to disagree. Once a workout is running, the config is
 * left alone.
 */
function applyDefault(
  state: WorkoutState,
  defaults: Partial<WorkoutDefaults>,
  config: Partial<WorkoutConfig>,
): WorkoutState {
  return {
    ...state,
    defaults: { ...state.defaults, ...defaults },
    config: state.phase === 'setup' ? { ...state.config, ...config } : state.config,
  };
}

export function workoutReducer(
  state: WorkoutState,
  action: WorkoutAction,
): WorkoutState {
  switch (action.type) {
    case 'SET_EXERCISE_NAME':
      return { ...state, config: { ...state.config, exerciseName: action.name } };

    case 'SET_TOTAL_SETS':
      return {
        ...state,
        config: {
          ...state.config,
          totalSets: clamp(Math.round(action.sets), MIN_SETS, MAX_SETS),
        },
      };

    case 'SET_REST_SECONDS':
      return {
        ...state,
        config: {
          ...state.config,
          restSeconds: clamp(
            Math.round(action.seconds),
            MIN_REST_SECONDS,
            MAX_REST_SECONDS,
          ),
        },
      };

    case 'TOGGLE_APP': {
      const selected = state.config.selectedAppIds;
      const next = selected.includes(action.appId)
        ? selected.filter(id => id !== action.appId)
        : [...selected, action.appId];
      return { ...state, config: { ...state.config, selectedAppIds: next } };
    }

    case 'START_WORKOUT':
      return {
        ...state,
        phase: 'active',
        currentSet: 1,
        setsCompleted: 0,
        restStartedAt: null,
        restEndsAt: null,
        totalRestSeconds: 0,
        appsLocked: true,
      };

    case 'FINISH_SET': {
      if (state.phase !== 'active') {
        return state;
      }
      const setsCompleted = state.setsCompleted + 1;

      // Last set: no rest period, straight to the summary with apps unlocked.
      if (setsCompleted >= state.config.totalSets) {
        return {
          ...state,
          phase: 'complete',
          setsCompleted,
          restStartedAt: null,
          restEndsAt: null,
          appsLocked: false,
        };
      }

      return {
        ...state,
        phase: 'resting',
        setsCompleted,
        restStartedAt: action.now,
        restEndsAt: action.now + state.config.restSeconds * 1000,
        appsLocked: false,
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
        appsLocked: true,
      };
    }

    case 'END_WORKOUT': {
      if (state.phase !== 'active' && state.phase !== 'resting') {
        return state;
      }
      const now = Date.now();
      return {
        ...state,
        phase: 'complete',
        totalRestSeconds:
          state.phase === 'resting'
            ? state.totalRestSeconds + restElapsed(state, now)
            : state.totalRestSeconds,
        restStartedAt: null,
        restEndsAt: null,
        appsLocked: false,
      };
    }

    case 'SET_DEFAULT_SETS': {
      const sets = clamp(Math.round(action.sets), MIN_SETS, MAX_SETS);
      return applyDefault(state, { totalSets: sets }, { totalSets: sets });
    }

    case 'SET_DEFAULT_REST': {
      const seconds = clamp(
        Math.round(action.seconds),
        MIN_REST_SECONDS,
        MAX_REST_SECONDS,
      );
      return applyDefault(state, { restSeconds: seconds }, { restSeconds: seconds });
    }

    case 'TOGGLE_DEFAULT_APP': {
      const selected = state.defaults.selectedAppIds;
      const next = selected.includes(action.appId)
        ? selected.filter(id => id !== action.appId)
        : [...selected, action.appId];
      return applyDefault(
        state,
        { selectedAppIds: next },
        { selectedAppIds: next },
      );
    }

    case 'NEW_WORKOUT':
      // Sets, rest and apps come from Settings — that's what makes those
      // defaults mean anything. The exercise name is not a setting, and
      // retyping "Bench press" between workouts is pure friction, so it stays.
      return {
        ...initialState,
        defaults: state.defaults,
        config: { exerciseName: state.config.exerciseName, ...state.defaults },
      };

    case 'HYDRATE_DEFAULTS': {
      const defaults = {
        totalSets: clamp(Math.round(action.defaults.totalSets), MIN_SETS, MAX_SETS),
        restSeconds: clamp(
          Math.round(action.defaults.restSeconds),
          MIN_REST_SECONDS,
          MAX_REST_SECONDS,
        ),
        selectedAppIds: action.defaults.selectedAppIds.filter(id =>
          BLOCKABLE_APPS.some(app => app.id === id),
        ),
      };

      // Clamped and filtered on the way in: stored values are last session's
      // data, which may predate a change to the limits or the app list.
      return {
        ...state,
        defaults,
        // Nothing has started yet on launch, so the setup screen should show
        // what was saved. A workout in progress is never disturbed.
        config: state.phase === 'setup' ? { ...state.config, ...defaults } : state.config,
      };
    }

    default:
      return state;
  }
}
