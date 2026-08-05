import type { StreakState } from './days';

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
  /**
   * Workouts where every planned set got banked — `workoutsFinished` minus the
   * ones cut short. Drives the Streaks tab's challenge.
   *
   * A counter and not a ratio on purpose. "78% completion" invites reading a
   * bad week as a failing grade, and this app doesn't grade anyone; a count
   * only ever goes up, so a session ended early costs nothing except not
   * counting. It also means the field ratchets in the security rules like every
   * other total, instead of needing one that can go down.
   */
  fullWorkouts: number;
};

export const NO_TOTALS: FocusTotals = {
  focusSeconds: 0,
  setsCompleted: 0,
  workoutsFinished: 0,
  fullWorkouts: 0,
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
  /**
   * How many sets the workout set out to do.
   *
   * Snapshotted into `config` when Start was tapped, so editing the exercise
   * card mid-workout can't move the goalposts — which is exactly what makes
   * `setsCompleted >= plannedSets` a fact rather than an opinion, and the whole
   * reason the "finish what you start" challenge is measurable at all.
   */
  plannedSets: number;
  restSeconds: number;
  /** Wall-clock ms when the workout ended, on the device that ran it. */
  endedAt: number;
  /**
   * The local calendar day the workout ended on, as `YYYY-MM-DD`.
   *
   * Decided on the device and carried on the record, rather than derived from
   * `endedAt` later. Only the phone knows which day its owner thinks it is —
   * see the note at the top of days.ts.
   */
  day: string;
};

/** One day's training, as stored per account. Drives the week strip and Insights. */
export type DayTotals = {
  /** `YYYY-MM-DD`, local. Also the document's id. */
  day: string;
  workouts: number;
  focusSeconds: number;
  setsCompleted: number;
};

/**
 * The best single workout an account has ever had.
 *
 * Maxima, not sums, which is the whole reason they need their own fields: every
 * other number on the account document is a running total, and no amount of
 * adding tells you what the largest single entry was. Kept up to date at write
 * time in the same transaction as the totals, exactly as the streak is.
 */
export type PersonalRecords = {
  /** Longest stretch of locked time in one workout, in seconds. */
  longestFocusSeconds: number;
  /** Most sets banked in one workout. */
  mostSetsInWorkout: number;
};

export const NO_RECORDS: PersonalRecords = {
  longestFocusSeconds: 0,
  mostSetsInWorkout: 0,
};

/** Everything held on the account document, in one shape. */
export type AccountData = {
  totals: FocusTotals;
  streak: StreakState;
  records: PersonalRecords;
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
  /**
   * Watches the signed-in user's lifetime totals and streak. Unsubscribes when
   * they sign out.
   */
  observeAccount(uid: string, onChange: (data: AccountData) => void): () => void;
  /**
   * Watches the most recent `count` days the user trained, newest first.
   *
   * Days with no training have no document, so this returns only the days that
   * happened — the caller lines them up against the calendar it wants to draw.
   */
  observeDays(
    uid: string,
    count: number,
    onChange: (days: DayTotals[]) => void,
  ): () => void;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Writes one workout and folds it into the user's totals. Idempotent. */
  recordWorkout(uid: string, record: WorkoutRecord): Promise<void>;
};
