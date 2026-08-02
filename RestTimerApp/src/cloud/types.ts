/**
 * Types for the account + sync layer.
 *
 * Deliberately free of any Firebase import. Screens talk to these; only
 * src/cloud/firebaseBackend.ts knows what a `User` or a `DocumentSnapshot` is,
 * which is what lets the whole app be tested and run with Firebase absent.
 */

/** The signed-in person, reduced to what this app actually shows. */
export type AuthUser = {
  uid: string;
  /** What a leaderboard would put next to their score. */
  displayName: string;
};

/**
 * A person's running totals, as held in Firestore.
 *
 * These are lifetime numbers across every device they sign in on — the thing
 * that makes a leaderboard possible. `SessionTotals` in src/state/types.ts is
 * the separate, deliberately unsaved "since you opened the app" counter, and
 * the two are not interchangeable.
 */
export type FocusTotals = {
  /**
   * Seconds the apps were locked, summed over every workout ever. The lifetime
   * form of "time reclaimed", and the number a Focusboard would rank on.
   */
  focusSeconds: number;
  setsCompleted: number;
  workoutsFinished: number;
};

export const NO_TOTALS: FocusTotals = {
  focusSeconds: 0,
  setsCompleted: 0,
  workoutsFinished: 0,
};

/**
 * One finished workout, on its way to the cloud.
 *
 * `id` is minted once when the workout ends and reused for every retry, so a
 * write that goes up twice is counted once. See firebaseBackend.recordWorkout.
 */
export type WorkoutRecord = {
  id: string;
  exerciseName: string;
  focusSeconds: number;
  setsCompleted: number;
  restSeconds: number;
  /** Wall-clock ms when the workout ended, on the device that ran it. */
  endedAt: number;
};

/** Where the account layer currently is. Drives everything the UI says. */
export type AccountStatus =
  /** No Firebase config — the app is running in its original local-only mode. */
  | 'unconfigured'
  /** Configured, but we haven't heard back from Firebase yet. */
  | 'loading'
  | 'signed-out'
  | 'signed-in';

/** Whether the last sync attempt got through. */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending';

/**
 * What the account layer offers the rest of the app.
 *
 * An interface rather than a direct import, for the same reason `Blocker` is
 * one: there are two implementations — Firebase and a do-nothing local mode —
 * and no screen should know which one it got.
 */
export type CloudBackend = {
  /**
   * Watches who is signed in. Fires immediately with the restored session (or
   * null), then on every change. Returns an unsubscribe.
   */
  observeUser(onChange: (user: AuthUser | null) => void): () => void;
  /** Watches the signed-in user's totals. Unsubscribes when they sign out. */
  observeTotals(uid: string, onChange: (totals: FocusTotals) => void): () => void;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Writes one workout and folds it into the user's totals. Idempotent. */
  recordWorkout(uid: string, record: WorkoutRecord): Promise<void>;
};
