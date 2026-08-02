/**
 * Your Firebase project's address book.
 *
 * ## Filling this in
 *
 * See FIREBASE_SETUP.md for the click-by-click walkthrough. The short version:
 * Firebase console -> your project -> Project settings -> "Your apps" -> the
 * web app -> "SDK setup and configuration" -> Config. Copy the six values out
 * of the `firebaseConfig` block it shows you and paste them below.
 *
 * ## Is it safe to commit these?
 *
 * Yes. Every one of these values ships inside the app binary and the web
 * bundle, so anyone with the app already has them — Google's own documentation
 * says to check them in. `apiKey` is not a password; it only identifies which
 * project a request is for. What actually protects your data is the Firestore
 * security rules in firestore.rules, which is why that file matters far more
 * than this one.
 *
 * ## Until it is filled in
 *
 * The app runs exactly as it did before: no accounts, no sync, nothing to sign
 * in to, and no errors. `isFirebaseConfigured()` is checked everywhere that
 * would otherwise touch the network, so an empty config is a supported state
 * rather than a broken one — and the tests run in it.
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/**
 * True once the config above has been filled in.
 *
 * Only the three values that are load-bearing for Auth and Firestore are
 * checked. `storageBucket` and `messagingSenderId` belong to products this app
 * doesn't use, and a project created without them would otherwise look
 * unconfigured forever.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.authDomain &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.appId,
  );
}
