import type {
  BlockableApp,
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

const defaultConfig: WorkoutConfig = {
  exerciseName: '',
  totalSets: 3,
  restSeconds: 60,
  selectedAppIds: ['tiktok', 'instagram'],
};

export const initialState: WorkoutState = {
  phase: 'setup',
  config: defaultConfig,
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

    case 'NEW_WORKOUT':
      // Keep the config — most people repeat the same setup.
      return { ...initialState, config: state.config };

    case 'HYDRATE':
      return action.state;

    default:
      return state;
  }
}
