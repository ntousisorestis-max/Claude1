import type {
  BlockableApp,
  CustomApp,
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
 * added. Every screen showing app pills reads this, so a custom app appears in
 * the setup list and the block-preview shield without either knowing it exists.
 */
export function allBlockableApps(customApps: CustomApp[]): BlockableApp[] {
  return [...BLOCKABLE_APPS, ...customApps];
}

/** `TikTok` -> `custom:tiktok`. Stable, so a re-add can't duplicate an id. */
export function customAppId(name: string): string {
  return `custom:${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/** Exported so "Reset to defaults" and the tests share one definition. */
export const FACTORY_DEFAULTS: WorkoutDefaults = {
  totalSets: 3,
  restSeconds: 60,
  selectedAppIds: ['tiktok', 'instagram'],
  soundEnabled: true,
  customApps: [],
};

const factoryDefaults = FACTORY_DEFAULTS;

const defaultConfig: WorkoutConfig = {
  exerciseName: '',
  totalSets: factoryDefaults.totalSets,
  restSeconds: factoryDefaults.restSeconds,
  selectedAppIds: factoryDefaults.selectedAppIds,
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

/** The subset of the settings that a workout config actually carries. */
function configFromDefaults(defaults: WorkoutDefaults) {
  return {
    totalSets: defaults.totalSets,
    restSeconds: defaults.restSeconds,
    selectedAppIds: defaults.selectedAppIds,
  };
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

    case 'SET_SOUND_ENABLED':
      // Settings-only: no config mirror, since the workout doesn't carry it.
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
      // Added apps start selected — you typed it in to block it.
      const selectedAppIds = [...state.defaults.selectedAppIds, id];

      return applyDefault(
        state,
        { customApps: [...state.defaults.customApps, custom], selectedAppIds },
        { selectedAppIds },
      );
    }

    case 'REMOVE_CUSTOM_APP': {
      const customApps = state.defaults.customApps.filter(
        app => app.id !== action.appId,
      );
      // Drop it from every selection too, or a deleted app keeps being counted
      // as blocked on the workout screens.
      const selectedAppIds = state.defaults.selectedAppIds.filter(
        id => id !== action.appId,
      );
      return {
        ...state,
        defaults: { ...state.defaults, customApps, selectedAppIds },
        config: {
          ...state.config,
          selectedAppIds: state.config.selectedAppIds.filter(
            id => id !== action.appId,
          ),
        },
      };
    }

    case 'RESET_DEFAULTS':
      return {
        ...state,
        defaults: FACTORY_DEFAULTS,
        config:
          state.phase === 'setup'
            ? { ...state.config, ...configFromDefaults(FACTORY_DEFAULTS) }
            : state.config,
      };

    case 'NEW_WORKOUT':
      // Sets, rest and apps come from Settings — that's what makes those
      // defaults mean anything. The exercise name is not a setting, and
      // retyping "Bench press" between workouts is pure friction, so it stays.
      return {
        ...initialState,
        defaults: state.defaults,
        config: {
          exerciseName: state.config.exerciseName,
          ...configFromDefaults(state.defaults),
        },
      };

    case 'HYDRATE_DEFAULTS': {
      const customApps = (action.defaults.customApps ?? []).slice(
        0,
        MAX_CUSTOM_APPS,
      );
      const known = allBlockableApps(customApps);

      const defaults: WorkoutDefaults = {
        totalSets: clamp(Math.round(action.defaults.totalSets), MIN_SETS, MAX_SETS),
        restSeconds: clamp(
          Math.round(action.defaults.restSeconds),
          MIN_REST_SECONDS,
          MAX_REST_SECONDS,
        ),
        // Checked against the custom apps too, or a saved selection would lose
        // every app the user had added.
        selectedAppIds: action.defaults.selectedAppIds.filter(id =>
          known.some(app => app.id === id),
        ),
        soundEnabled: action.defaults.soundEnabled ?? FACTORY_DEFAULTS.soundEnabled,
        customApps,
      };

      // Clamped and filtered on the way in: stored values are last session's
      // data, which may predate a change to the limits or the app list.
      return {
        ...state,
        defaults,
        // Nothing has started yet on launch, so the setup screen should show
        // what was saved. A workout in progress is never disturbed.
        config:
          state.phase === 'setup'
            ? { ...state.config, ...configFromDefaults(defaults) }
            : state.config,
      };
    }

    default:
      return state;
  }
}
