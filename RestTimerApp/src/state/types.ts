/**
 * Core domain types for the rest-timer workout loop.
 */

/** Which screen the workout is on. The phase *is* the navigation. */
export type Phase = 'setup' | 'active' | 'resting' | 'complete';

/**
 * A blockable app the user can pick on the Setup screen.
 *
 * Phase 1: a hardcoded placeholder list.
 * Phase 2 (iOS): Apple's FamilyActivityPicker never tells us which apps were
 * chosen, so this list collapses into an opaque token. Keep consumers reading
 * `selectedAppIds.length` rather than the individual ids.
 */
/** The five apps that ship with a drawn brand mark. */
export type BrandId = 'tiktok' | 'instagram' | 'youtube' | 'x' | 'reddit';

export type BlockableApp = {
  id: string;
  name: string;
  /** Icon tint. Stands in for the real app icon, which iOS never gives us. */
  tint: string;
  /** Preset apps have a drawn logo; ones you add fall back to a monogram. */
  brand?: BrandId;
};

/** An app the user typed in themselves. */
export type CustomApp = {
  id: string;
  name: string;
  tint: string;
};

export type WorkoutConfig = {
  exerciseName: string;
  totalSets: number;
  /** Rest between sets, in seconds. */
  restSeconds: number;
  selectedAppIds: string[];
};

/**
 * What a new workout starts from. Edited on the Settings tab; the Setup screen
 * is seeded from these every time you come back to it.
 */
export type WorkoutDefaults = {
  totalSets: number;
  restSeconds: number;
  selectedAppIds: string[];
  /** Whether the rest-over notification makes a sound. */
  soundEnabled: boolean;
  /** Apps added by hand, on top of the five presets. */
  customApps: CustomApp[];
};

export type WorkoutState = {
  phase: Phase;
  config: WorkoutConfig;
  defaults: WorkoutDefaults;
  /** 1-based index of the set the user is on / just finished. */
  currentSet: number;
  setsCompleted: number;
  /** Wall-clock ms timestamp when the current rest period started. Null off-rest. */
  restStartedAt: number | null;
  /** Wall-clock ms timestamp when the current rest period ends. Null off-rest. */
  restEndsAt: number | null;
  /** Total seconds actually spent resting, accumulated across the workout. */
  totalRestSeconds: number;
  /** True whenever the blocker should be shielding the user's apps. */
  appsLocked: boolean;
};

export type WorkoutAction =
  | { type: 'SET_EXERCISE_NAME'; name: string }
  | { type: 'SET_TOTAL_SETS'; sets: number }
  | { type: 'SET_REST_SECONDS'; seconds: number }
  | { type: 'TOGGLE_APP'; appId: string }
  /* Settings tab — these seed the next workout rather than the current one. */
  | { type: 'SET_DEFAULT_SETS'; sets: number }
  | { type: 'SET_DEFAULT_REST'; seconds: number }
  | { type: 'TOGGLE_DEFAULT_APP'; appId: string }
  | { type: 'SET_SOUND_ENABLED'; enabled: boolean }
  | { type: 'ADD_CUSTOM_APP'; name: string }
  | { type: 'REMOVE_CUSTOM_APP'; appId: string }
  /** Back to factory settings. */
  | { type: 'RESET_DEFAULTS' }
  | { type: 'START_WORKOUT' }
  /** User tapped "Done with Set" — begins rest, or completes the workout. */
  | { type: 'FINISH_SET'; now: number }
  /** Rest ran out, or the user tapped "Skip Rest". */
  | { type: 'END_REST'; now: number }
  | { type: 'END_WORKOUT' }
  | { type: 'NEW_WORKOUT' }
  /**
   * Defaults restored from storage on launch.
   *
   * Deliberately narrower than the whole state: restoring a saved *workout*
   * would resume a session from days ago, with a `restEndsAt` long past. Only
   * the settings are worth persisting.
   */
  | { type: 'HYDRATE_DEFAULTS'; defaults: WorkoutDefaults };
