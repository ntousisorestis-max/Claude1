# Setting up Firebase

You have to do this part yourself, and it's unavoidable: a Firebase project is
tied to a Google account and a billing identity, so nobody can create one on
your behalf. It takes about ten minutes and costs nothing.

Until you've done it the app runs exactly as it always has — timer, blocking
simulation, everything — with the Account section on Settings saying accounts
aren't switched on yet. Nothing is broken in the meantime.

---

## What you're actually making

Three things, all free:

- a **Firebase project** — a container with a name
- **Authentication** — the part that checks emails and passwords, so you never
  store a password yourself
- **Firestore** — a database that holds one row per person: their display name
  and their running focus totals

## What it costs

Nothing, at this size. Firestore's free tier gives 50,000 reads and 20,000
writes a day. This app writes **one document per finished workout** and reads
one when you open Settings, so a few hundred users doing a few workouts a day
each sits inside the free tier with room to spare. Firebase will ask for a
billing card only if you choose the Blaze plan, which you should not do yet.

---

## Step 1 — Make the project

1. Go to <https://console.firebase.google.com> and sign in with a Google
   account. A personal Gmail is fine.
2. Click **Create a project** (or **Add project**).
3. Name it something like `focusboard`. Firebase will add random characters to
   make it unique — that's normal, and the ugly name never shows up anywhere a
   user can see.
4. On the Google Analytics step, switch it **off**. You don't need it, and it
   adds a second account to set up.
5. Click **Create project**, wait for the spinner, then **Continue**.

## Step 2 — Add a "web app" to the project

Do this even though you're building a phone app. This app talks to Firebase
through the JavaScript SDK on every platform, so the web app's settings are the
ones it uses on iOS and Android too.

1. On the project home screen there's a row of icons under "Get started by
   adding Firebase to your app". Click the one that looks like `</>` — the web
   icon.
2. App nickname: `Rest Timer`. Leave "Also set up Firebase Hosting"
   **unticked**.
3. Click **Register app**.
4. You'll now see a block of code with a section that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "focusboard-1a2b3.firebaseapp.com",
     projectId: "focusboard-1a2b3",
     storageBucket: "focusboard-1a2b3.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123def456"
   };
   ```

   **Keep this tab open.** You'll copy these six values in step 4.

5. Click **Continue to console**.

## Step 3 — Turn on email sign-in

1. In the left sidebar click **Build** → **Authentication**.
2. Click **Get started**.
3. You'll see a list of sign-in providers. Click **Email/Password**.
4. Turn on the **first** toggle (labelled "Email/Password"). Leave the second
   one ("Email link / passwordless sign-in") off.
5. Click **Save**.

If you skip this step, creating an account in the app fails with a message
telling you to come back here — that's this step.

## Step 4 — Paste the six values into the app

1. Open `src/cloud/firebaseConfig.ts` in this project.
2. Copy each value from the block in step 2 into the matching empty string.
   Keep the quotes. It should end up looking like:

   ```ts
   export const FIREBASE_CONFIG = {
     apiKey: 'AIzaSy...',
     authDomain: 'focusboard-1a2b3.firebaseapp.com',
     projectId: 'focusboard-1a2b3',
     storageBucket: 'focusboard-1a2b3.firebasestorage.app',
     messagingSenderId: '123456789012',
     appId: '1:123456789012:web:abc123def456',
   };
   ```

3. Save the file and restart the app (`npm run web`).

**These values are not secrets.** They ship inside every copy of the app, so
anybody who installs it has them anyway — Google's own documentation says to
check them into your repository. The thing that protects your data is step 6.

## Step 5 — Create the database

1. In the left sidebar click **Build** → **Firestore Database**.
2. Click **Create database**.
3. Pick a location close to you (for example `europe-west2` for London,
   `us-central1` for the US). **You cannot change this later**, but it only
   affects speed, not what works.
4. When it asks for a starting mode, pick **Start in production mode**. It will
   also offer test mode — don't take it. Test mode leaves the database open to
   anyone on the internet and then silently stops working after 30 days.
5. Click **Create**.

## Step 6 — Publish the security rules

This is the step that actually protects the data. Skipping it means either
nothing works (production mode's default rules deny everything) or everything is
public (test mode).

1. Still in **Firestore Database**, click the **Rules** tab along the top.
2. Select everything in the editor box and delete it.
3. Open `firestore.rules` in this project, copy the whole file, and paste it in.
4. Click **Publish**.

In plain terms, those rules say: you can only ever write to your own row; your
totals can go up but never down; the record of an individual workout can be
written once and never edited or deleted; and any signed-in person can read
anyone's display name and totals, which is the thing that makes a leaderboard
possible later. Nobody signed out can read anything at all.

## Step 7 — Check it worked

1. Run the app: `npm run web`.
2. Go to the **Settings** tab. The Account section should now offer
   **Sign in or create an account** instead of saying accounts aren't switched
   on.
3. Create an account with any email and a password of at least six characters.
   It does not have to be a real inbox — nothing is emailed yet.
4. Back on the **Workout** tab, add an exercise and run it to the end.
5. Return to **Settings**. Under your name you should see "Everything saved"
   and your totals should have gone up.
6. To see the actual data: Firebase console → **Firestore Database** → **Data**.
   You'll see a `users` collection, one document with your ID, and a `workouts`
   sub-collection inside it with the workout you just did.

---

## If something goes wrong

**"Email sign-in isn't switched on for this Firebase project yet"** — step 3
wasn't done, or wasn't saved.

**"Something went wrong. Try again in a moment." right after creating the
account** — usually step 6. The account gets created by Authentication, then the
write to Firestore is refused by the rules. Check the Rules tab actually shows
the contents of `firestore.rules` and that you clicked Publish.

**"Can't reach the server."** — no connection, or the values in step 4 have a
typo. `projectId` is the one worth double-checking first.

**The Account section still says accounts aren't switched on** — the app didn't
pick up the config. Make sure you saved `firebaseConfig.ts` and fully restarted
the dev server; webpack won't always hot-reload a change to that file.

---

## What is deliberately not set up yet

Worth knowing before you rely on this:

- **No password reset.** If someone forgets their password there is currently no
  way back into their account. Firebase can send reset emails; it's a screen
  that hasn't been built.
- **No email verification.** Anyone can sign up as `nobody@nowhere.invalid`.
  That's fine for now and not fine once there's a public leaderboard.
- **Nothing stops someone inflating their own numbers.** The rules stop totals
  going *down*, but a determined person with their own login can drive the SDK
  by hand and increment them. Fixing that properly means moving the write into a
  Cloud Function, which needs the paid Blaze plan. It's the right thing to do
  before the board is competitive, and overkill before the board exists.
- **Account deletion isn't wired up.** Deleting a user needs to clear their
  workouts sub-collection too, which security rules can't do on their own.
- **Exercises and app settings still don't sync**, and still don't survive a
  restart at all. Only the focus totals go to the cloud. See
  `src/state/storage.ts` for where local persistence would land.
