import { isFirebaseConfigured } from './firebaseConfig';
import { NO_TOTALS, type CloudBackend } from './types';

/**
 * Which cloud the app talks to, and what it says when there isn't one.
 *
 * Nothing here imports Firebase. That is the point of the file: `firebase/app`
 * runs a pile of module-level registration the moment it is imported, and this
 * module is loaded by the account provider on every launch — including the
 * launches where no Firebase project exists, and every test run. The SDK is
 * pulled in by `getBackend()` below, at the first moment it can possibly be
 * needed and not before.
 */

/**
 * The backend when there is no Firebase project yet.
 *
 * Not null and not a throwing stub: the provider mounts it unconditionally, so
 * every call has to be safe. It reports nobody signed in and quietly drops
 * writes, which is precisely the app's behaviour before this feature existed.
 */
export const localOnlyBackend: CloudBackend = {
  observeUser(onChange) {
    onChange(null);
    return () => {};
  },
  observeTotals(_uid, onChange) {
    onChange(NO_TOTALS);
    return () => {};
  },
  async signUp() {
    throw new Error('Firebase is not configured');
  },
  async signIn() {
    throw new Error('Firebase is not configured');
  },
  async signOut() {},
  async recordWorkout() {},
};

/**
 * The one the app gets. Mirrors `getBlocker()` in src/blocking.
 *
 * `require` rather than a top-level import, deliberately. A static import would
 * evaluate the whole Firebase SDK on every launch to then not use it, and would
 * drag its ESM build into Jest, which does not transform node_modules.
 */
export function getBackend(): CloudBackend {
  if (!isFirebaseConfigured()) {
    return localOnlyBackend;
  }
  return (require('./firebaseBackend') as typeof import('./firebaseBackend'))
    .firebaseBackend;
}

/**
 * Firebase's error codes, in words a person can act on.
 *
 * The raw messages are written for developers ("Firebase: Error
 * (auth/invalid-credential)") and putting one in front of a user is the same as
 * showing nothing. Anything unmapped falls through to a generic line rather
 * than leaking the code.
 *
 * Lives here rather than beside the SDK because it only ever reads `err.code`
 * off a plain object — no Firebase types involved — and this is the module the
 * UI can import for free.
 */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/missing-password': 'Enter a password.',
  'auth/weak-password': 'Passwords need to be at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account with that email. Create one instead?',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your connection.',
  'auth/operation-not-allowed':
    'Email sign-in isn’t switched on for this Firebase project yet. See FIREBASE_SETUP.md, step 3.',
};

/** The message to actually show for a thrown Firebase error. */
export function describeAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
  return AUTH_MESSAGES[code] ?? 'Something went wrong. Try again in a moment.';
}
