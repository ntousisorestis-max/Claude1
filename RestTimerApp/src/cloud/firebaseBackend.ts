import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  doc,
  documentId,
  increment,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { afterTrainingOn, isDayKey, NO_STREAK, type StreakState } from './days';
import { FIREBASE_CONFIG } from './firebaseConfig';
import {
  NO_RECORDS,
  NO_TOTALS,
  type AuthUser,
  type CloudBackend,
  type FocusTotals,
  type PersonalRecords,
  type WorkoutRecord,
} from './types';

/**
 * The Firebase implementation of `CloudBackend`.
 *
 * ## Why the JS SDK and not @react-native-firebase
 *
 * @react-native-firebase is the more common choice for a bare RN app and has
 * better offline behaviour, but it is native-only: it cannot run in the web
 * build, which is currently the only target that has ever actually run (see
 * README — no native toolchain has compiled here yet). Picking a backend that
 * can't be exercised would mean shipping this whole layer unverified. The JS
 * SDK runs on web *and* React Native from one codebase, so every line below is
 * covered by the browser tests.
 *
 * The cost is real and worth naming: Firestore's offline cache is weaker
 * through the JS SDK on React Native, which is why unsent workouts are queued
 * by the caller rather than trusted to the SDK. See AccountContext.
 */

/* -------------------------------------------------------------------------- */
/* Lazy initialisation                                                        */
/* -------------------------------------------------------------------------- */

type Services = { app: FirebaseApp; auth: Auth; db: Firestore };

let services: Services | null = null;

/**
 * Starts Firebase on first use, once.
 *
 * Deliberately not done at import time. This module is imported by the account
 * provider, which is mounted in every test and in every run where the config is
 * still blank — initialising there would fire network calls the moment the app
 * loads, and throw for anyone who hasn't set up a project yet.
 */
function firebase(): Services {
  if (services) {
    return services;
  }
  const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);

  // Long-polling auto-detect: React Native's networking stack doesn't support
  // the streaming transport Firestore prefers, and without this the first
  // listener can hang instead of failing. Harmless on web, where the detection
  // finds a working stream and uses it.
  const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

  // Persistence is not configured here on purpose. Each platform's build of
  // firebase/auth picks its own: browsers use localStorage, and React Native
  // uses AsyncStorage automatically because @react-native-async-storage is
  // installed — it is an optional peer dependency of @firebase/auth, and
  // without it a signed-in user would be signed out again by every app launch.
  const auth = getAuth(app);

  services = { app, auth, db };
  return services;
}

/* -------------------------------------------------------------------------- */
/* Shaping                                                                    */
/* -------------------------------------------------------------------------- */

/** Falls back to the part of the email before the @, never to the whole email. */
function nameFor(displayName: string | null, email: string | null): string {
  const chosen = displayName?.trim();
  if (chosen) {
    return chosen;
  }
  return email?.split('@')[0] || 'Athlete';
}

/**
 * Reads a number off a document, defensively.
 *
 * Every read here has to survive a document written by an older build. The
 * streak fields in particular did not exist before the Insights and Streaks
 * tabs, so every account that predates them is missing all three — and reading
 * `undefined` as `NaN` would poison the totals rather than showing a zero.
 */
const num = (data: Record<string, unknown> | undefined, key: string): number =>
  typeof data?.[key] === 'number' ? (data[key] as number) : 0;

function totalsFrom(data: Record<string, unknown> | undefined): FocusTotals {
  return data
    ? {
        focusSeconds: num(data, 'focusSeconds'),
        setsCompleted: num(data, 'setsCompleted'),
        workoutsFinished: num(data, 'workoutsFinished'),
      }
    : NO_TOTALS;
}

function recordsFrom(data: Record<string, unknown> | undefined): PersonalRecords {
  return data
    ? {
        longestFocusSeconds: num(data, 'longestFocusSeconds'),
        mostSetsInWorkout: num(data, 'mostSetsInWorkout'),
      }
    : NO_RECORDS;
}

function streakFrom(data: Record<string, unknown> | undefined): StreakState {
  if (!data) {
    return NO_STREAK;
  }
  const last = data.lastActiveDay;
  return {
    currentStreak: num(data, 'currentStreak'),
    bestStreak: num(data, 'bestStreak'),
    // Validated, not just cast: a malformed key would flow into date maths and
    // come back as NaN days apart, which reads as "streak broken" forever.
    lastActiveDay: isDayKey(last) ? last : null,
  };
}

/* -------------------------------------------------------------------------- */
/* The backend                                                                */
/* -------------------------------------------------------------------------- */

export const firebaseBackend: CloudBackend = {
  observeUser(onChange) {
    const { auth } = firebase();
    return onAuthStateChanged(auth, user => {
      onChange(
        user
          ? { uid: user.uid, displayName: nameFor(user.displayName, user.email) }
          : null,
      );
    });
  },

  observeAccount(uid, onChange) {
    const { db } = firebase();
    return onSnapshot(
      doc(db, 'users', uid),
      snapshot => {
        const data = snapshot.data();
        onChange({
          totals: totalsFrom(data),
          streak: streakFrom(data),
          records: recordsFrom(data),
        });
      },
      // A listener that errors is a listener that has stopped. Say so in the
      // log rather than leaving the UI on stale numbers with no explanation.
      err => console.warn('[focusboard] account listener stopped', err),
    );
  },

  observeDays(uid, count, onChange) {
    const { db } = firebase();
    // Ordered by document id, which is the day key — `YYYY-MM-DD` sorts
    // chronologically as a string, so this needs no extra field and no
    // composite index. Newest first, so `limit` keeps the recent end.
    const recent = query(
      collection(db, 'users', uid, 'days'),
      orderBy(documentId(), 'desc'),
      limit(count),
    );
    return onSnapshot(
      recent,
      snapshot =>
        onChange(
          snapshot.docs
            .filter(entry => isDayKey(entry.id))
            .map(entry => ({
              day: entry.id,
              workouts: num(entry.data(), 'workouts'),
              focusSeconds: num(entry.data(), 'focusSeconds'),
              setsCompleted: num(entry.data(), 'setsCompleted'),
            })),
        ),
      err => console.warn('[focusboard] days listener stopped', err),
    );
  },

  async signUp(email, password, displayName) {
    const { auth } = firebase();
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    const name = nameFor(displayName, email);
    await updateProfile(credential.user, { displayName: name });

    // The profile row a leaderboard will eventually read. Written here so it
    // exists from the first moment, rather than appearing only after the user's
    // first workout — an account with no row is invisible to a ranked query.
    //
    // Note what is *not* stored: the email address. These docs have to be
    // readable by other signed-in users for a leaderboard to work at all, so
    // anything in them is effectively public to the app's users.
    const { db } = firebase();
    await runTransaction(db, async tx => {
      tx.set(doc(db, 'users', credential.user.uid), {
        displayName: name,
        focusSeconds: 0,
        setsCompleted: 0,
        workoutsFinished: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDay: null,
        longestFocusSeconds: 0,
        mostSetsInWorkout: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  },

  async signIn(email, password) {
    const { auth } = firebase();
    await signInWithEmailAndPassword(auth, email, password);
  },

  async signOut() {
    const { auth } = firebase();
    await firebaseSignOut(auth);
  },

  /**
   * Files one finished workout and folds it into the lifetime totals.
   *
   * Both halves happen in one transaction, and the transaction bails if a
   * workout with this id is already on file. That is what makes a retry safe:
   * `increment` on its own is not idempotent, so a write that succeeded on the
   * server but failed on the way back — a dropped connection at exactly the
   * wrong moment — would otherwise count the same 20 minutes twice, and on a
   * leaderboard that is indistinguishable from cheating.
   *
   * Three documents move together: the workout, the day it happened on, and
   * the account's lifetime totals and streak. One transaction, because a
   * streak that advanced while the day it advanced *for* failed to write would
   * be permanently unexplainable — the calendar and the number above it would
   * disagree, and nothing could reconcile them after the fact.
   */
  async recordWorkout(uid, record) {
    const { auth, db } = firebase();
    const userRef = doc(db, 'users', uid);
    const workoutRef = doc(db, 'users', uid, 'workouts', record.id);
    const dayRef = doc(db, 'users', uid, 'days', record.day);

    await runTransaction(db, async tx => {
      // Every read before every write — Firestore requires it.
      const already = await tx.get(workoutRef);
      if (already.exists()) {
        return;
      }
      const profile = await tx.get(userRef);

      // The streak is folded here rather than by a scheduled job, because a
      // streak only ever changes when a workout lands. Nothing has to run at
      // midnight; the decay is applied at read time instead. See days.ts.
      const streak = afterTrainingOn(streakFrom(profile.data()), record.day);

      // Records are maxima, so they are computed from what's stored rather than
      // incremented — the same reason the streak is. `increment` would turn a
      // personal best into a running total, which is a different (and useless)
      // number.
      const best = recordsFrom(profile.data());

      tx.set(workoutRef, {
        exerciseName: record.exerciseName,
        focusSeconds: record.focusSeconds,
        setsCompleted: record.setsCompleted,
        restSeconds: record.restSeconds,
        endedAt: record.endedAt,
        day: record.day,
        recordedAt: serverTimestamp(),
      });

      // One row per day trained. Incremented rather than set, so a second
      // workout on the same day adds to it — and so this stays correct without
      // the transaction having had to read it first.
      tx.set(
        dayRef,
        {
          workouts: increment(1),
          focusSeconds: increment(record.focusSeconds),
          setsCompleted: increment(record.setsCompleted),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // `merge` rather than a plain set, so this can't wipe displayName or
      // createdAt off an existing profile.
      //
      // The extra fields when the profile is missing are not belt-and-braces:
      // firestore.rules requires a profile doc to carry a displayName, so a
      // bare merge of three counters onto a row that doesn't exist yet is
      // *rejected*, and the workout would retry forever. It only happens if
      // sign-up half-failed — the account was created but the profile write
      // wasn't — which is exactly when a user has workouts and no row.
      tx.set(
        userRef,
        {
          focusSeconds: increment(record.focusSeconds),
          setsCompleted: increment(record.setsCompleted),
          workoutsFinished: increment(1),
          // Written as values, not increments: a streak is not a running total
          // — it resets to 1 after a gap — so it has to be computed from what
          // was there and written whole.
          currentStreak: streak.currentStreak,
          bestStreak: streak.bestStreak,
          lastActiveDay: streak.lastActiveDay,
          longestFocusSeconds: Math.max(
            best.longestFocusSeconds,
            record.focusSeconds,
          ),
          mostSetsInWorkout: Math.max(
            best.mostSetsInWorkout,
            record.setsCompleted,
          ),
          updatedAt: serverTimestamp(),
          ...(profile.exists()
            ? null
            : {
                displayName: nameFor(
                  auth.currentUser?.displayName ?? null,
                  auth.currentUser?.email ?? null,
                ),
                createdAt: serverTimestamp(),
              }),
        },
        { merge: true },
      );
    });
  },
};

export type { AuthUser, WorkoutRecord };
