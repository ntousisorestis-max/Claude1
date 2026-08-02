import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { describeAuthError, getBackend } from './backend';
import { isFirebaseConfigured } from './firebaseConfig';
import {
  NO_TOTALS,
  type AccountStatus,
  type AuthUser,
  type CloudBackend,
  type FocusTotals,
  type SyncStatus,
  type WorkoutRecord,
} from './types';

/**
 * Who is signed in, what their lifetime totals are, and getting finished
 * workouts up to Firestore.
 *
 * Kept entirely separate from WorkoutContext. The workout state machine is the
 * app; this is an optional layer bolted to the side of it, and the app has to
 * keep working perfectly with this layer switched off — which is what happens
 * before a Firebase project exists, and any time the user is signed out.
 *
 * The one seam between them is <WorkoutSync/>, which reads the workout phase
 * and calls `recordWorkout` here.
 */

type Account = {
  status: AccountStatus;
  user: AuthUser | null;
  /** Lifetime numbers from Firestore. All zero unless signed in. */
  totals: FocusTotals;
  sync: SyncStatus;
  /** Workouts finished but not yet accepted by the server. */
  pendingCount: number;
  /** Set by the last failed sign-in/sign-up. Cleared when a new one starts. */
  error: string | null;
  busy: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  recordWorkout: (record: WorkoutRecord) => void;
};

const AccountContext = createContext<Account | null>(null);

/** How often to retry workouts that haven't made it up yet. */
const RETRY_MS = 30_000;

export function AccountProvider({
  children,
  /**
   * The cloud to talk to. Defaults to Firebase when configured and to a
   * do-nothing local backend when it isn't — the tests pass a fake, which is
   * how this file is covered without a network or a Firebase project.
   */
  backend,
}: {
  children: React.ReactNode;
  backend?: CloudBackend;
}) {
  // Resolved once. `getBackend()` reads module-level config that cannot change
  // at runtime, and re-resolving it on every render would tear down the auth
  // listener each time.
  const cloud = useRef(backend ?? getBackend()).current;
  const configured = backend != null || isFirebaseConfigured();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!configured);
  const [totals, setTotals] = useState<FocusTotals>(NO_TOTALS);
  const [sync, setSync] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* --- Who's signed in --------------------------------------------------- */

  useEffect(() => {
    if (!configured) {
      return;
    }
    return cloud.observeUser(next => {
      setUser(next);
      // The first callback is the answer to "is there a restored session?", so
      // this is the moment the account layer stops being 'loading'.
      setReady(true);
      if (!next) {
        setTotals(NO_TOTALS);
        setSync('idle');
      }
    });
  }, [cloud, configured]);

  /* --- Their totals ------------------------------------------------------ */

  useEffect(() => {
    if (!configured || !user) {
      return;
    }
    return cloud.observeTotals(user.uid, setTotals);
  }, [cloud, configured, user]);

  /* --- The outbox -------------------------------------------------------- */

  /**
   * Workouts finished but not yet on the server.
   *
   * A ref, not state: `flush` is called from effects and callbacks that would
   * otherwise close over a stale copy, and dropping a finished workout because
   * two of them raced is the one failure this whole layer exists to prevent.
   *
   * It is *not* written to disk, so a workout finished offline and then killed
   * from the app switcher is lost. That's the same honest limit the rest of the
   * app has today — nothing survives a restart yet — and the fix is the same
   * one: give AppStorage a real driver. See src/state/storage.ts.
   */
  const outbox = useRef<WorkoutRecord[]>([]);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    const uid = user?.uid;
    if (!configured || !uid || flushing.current || outbox.current.length === 0) {
      return;
    }
    flushing.current = true;
    setSync('syncing');

    // Oldest first, and stop at the first failure rather than ploughing on —
    // if the network is down, the second attempt will fail for the same reason
    // and the only thing racing through the queue achieves is a burst of
    // doomed writes.
    while (outbox.current.length > 0) {
      const next = outbox.current[0];
      try {
        await cloud.recordWorkout(uid, next);
        outbox.current = outbox.current.slice(1);
        setPendingCount(outbox.current.length);
      } catch (err) {
        console.warn('[focusboard] workout not synced, will retry', err);
        break;
      }
    }

    flushing.current = false;
    setSync(outbox.current.length === 0 ? 'synced' : 'pending');
  }, [cloud, configured, user]);

  const recordWorkout = useCallback(
    (record: WorkoutRecord) => {
      // A workout that reclaimed no time is still a workout, but one with
      // nothing in it at all isn't worth a row.
      if (record.setsCompleted === 0 && record.focusSeconds === 0) {
        return;
      }
      outbox.current = [...outbox.current, record];
      setPendingCount(outbox.current.length);
      setSync('pending');
      // Can't reject — every failure inside is caught and re-queued.
      flush();
    },
    [flush],
  );

  // Signing in is the other moment the outbox can suddenly become sendable.
  useEffect(() => {
    if (user) {
      flush();
    }
  }, [user, flush]);

  // And a plain retry for the case where nothing else happens — the user
  // finished a workout on a train and is now just looking at the app. Only
  // ticks while there is something to send, so an idle app schedules nothing.
  useEffect(() => {
    if (pendingCount === 0 || !user) {
      return;
    }
    const timer = setInterval(flush, RETRY_MS);
    return () => clearInterval(timer);
  }, [pendingCount, user, flush]);

  /* --- Sign in / up / out ------------------------------------------------ */

  /** Shared shape for the two that can fail in front of the user. */
  const attempt = useCallback(async (run: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await run();
      return true;
    } catch (err) {
      setError(describeAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signUp = useCallback(
    (email: string, password: string, displayName: string) =>
      attempt(() => cloud.signUp(email.trim(), password, displayName.trim())),
    [attempt, cloud],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      attempt(() => cloud.signIn(email.trim(), password)),
    [attempt, cloud],
  );

  const signOut = useCallback(async () => {
    await cloud.signOut();
    // Anything still queued belongs to the account that just left. Keeping it
    // would file one person's workout against the next person to sign in.
    outbox.current = [];
    setPendingCount(0);
  }, [cloud]);

  const clearError = useCallback(() => setError(null), []);

  const status: AccountStatus = !configured
    ? 'unconfigured'
    : !ready
    ? 'loading'
    : user
    ? 'signed-in'
    : 'signed-out';

  const value = useMemo<Account>(
    () => ({
      status,
      user,
      totals,
      sync,
      pendingCount,
      error,
      busy,
      signUp,
      signIn,
      signOut,
      clearError,
      recordWorkout,
    }),
    [
      status,
      user,
      totals,
      sync,
      pendingCount,
      error,
      busy,
      signUp,
      signIn,
      signOut,
      clearError,
      recordWorkout,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error('useAccount must be used inside <AccountProvider>');
  }
  return ctx;
}
