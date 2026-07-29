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
export type BlockableApp = {
  id: string;
  name: string;
  emoji: string;
};

export type WorkoutConfig = {
  exerciseName: string;
  totalSets: number;
  /** Rest between sets, in seconds. */
  restSeconds: number;
  selectedAppIds: string[];
};

export type WorkoutState = {
  phase: Phase;
  config: WorkoutConfig;
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
  | { type: 'START_WORKOUT' }
  /** User tapped "Done with Set" — begins rest, or completes the workout. */
  | { type: 'FINISH_SET'; now: number }
  /** Rest ran out, or the user tapped "Skip Rest". */
  | { type: 'END_REST'; now: number }
  | { type: 'END_WORKOUT' }
  | { type: 'NEW_WORKOUT' }
  /** Rehydrate from a storage layer (AsyncStorage) — unused in Phase 1. */
  | { type: 'HYDRATE'; state: WorkoutState };
