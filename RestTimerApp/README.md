# Rest Timer

A gym rest-timer that blocks your scrolling apps while you're doing a set, unlocks
them for the rest period, and re-locks them when the countdown hits zero.

```
Exercise list ──Start──▶ Active Set ──Done with set──▶ Resting ──0:00 / Skip──▶ Active Set
                      apps blocked (black)          apps unlocked (violet)     apps blocked
                            └───────────── last set ─────────────▶ Complete (unlocked)
```

The Workout tab is a list of saved exercises. Each one carries its own sets,
rest and blocked apps, and starting one snapshots that card into the workout.

**Want to run it? See [TESTING.md](TESTING.md)** for a step-by-step guide.

**This is Phase 1: the block is simulated.** The full loop works, but no app is
actually shielded yet. See [Phase 2](#phase-2--real-ios-blocking) for what real
blocking needs — including things only you can do on your Apple Developer account.

## Running it

Bare React Native 0.86. Phase 1 has no iOS-only code, so **the web build is
enough to try the whole loop** — no Mac, no Android SDK, no Apple account.

### Web — no Mac, no Android SDK, no Apple account

The fastest way to actually run this. It's the **real app** — same `App.tsx`,
screens, reducer and animations — with `react-native-web` mapping the RN
primitives onto the DOM.

```sh
npm install
npm run web          # dev server on http://localhost:3000
npm run build:web    # production bundle into dist/
```

**What web can't tell you.** No real app blocking, no OS-scheduled
notifications, no haptics — browsers can't do any of them, and Phase 2's whole
premise is iOS-only. Treat it as a way to feel the UX and prove the code runs,
not as a shippable product.

Two pieces are swapped at build time, both by webpack's `.web.*` resolution
rather than by edits to shared code:

- `src/notifications.web.ts` — honest no-ops. A browser has no equivalent of an
  OS alarm that survives the tab being backgrounded, which is the entire point
  of the native version, so it doesn't pretend with a `setTimeout`.
- Haptics need no stub: `src/haptics.ts` already checks `Platform.OS`, which is
  `'web'` here, so it no-ops on its own.

Blocking also degrades correctly on its own — `getBlocker()` only returns the
Screen Time blocker on iOS with the native module present, so web gets
`MockBlocker` and the simulated shield.

### Android (Windows or Linux)

1. **Install [Android Studio](https://developer.android.com/studio).** Pick the
   standard setup; it bundles the SDK, platform-tools, and an emulator.
2. **Install the SDK bits.** Android Studio → *More Actions* → *SDK Manager*:
   - *SDK Platforms* tab: **Android 16 (API 36)** — matches `compileSdk 36`.
   - *SDK Tools* tab: **Android SDK Build-Tools 36.0.0**, **Platform-Tools**, and
     **Android Emulator**.
3. **Install JDK 17** (Android Studio ships one; `java -version` should be 17+).
4. **Point the tools at the SDK.**
   - Windows (PowerShell, permanent):
     ```powershell
     setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
     ```
     Then add `%ANDROID_HOME%\platform-tools` to your `Path` and reopen the terminal.
   - Linux (`~/.bashrc`):
     ```sh
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
     ```
   Verify with `adb --version`.
5. **Create an emulator.** Android Studio → *Device Manager* → *Create Device* →
   Pixel 7 → API 36 image → Finish. Start it with the ▶ button.
   *Linux:* the emulator needs KVM — `ls /dev/kvm` must exist, and your user
   must be in the `kvm` group (`sudo adduser $USER kvm`, then log out and back in).
   *Windows:* enable the *Windows Hypervisor Platform* feature, or install Intel
   HAXM/AMD equivalent when Android Studio offers it.
6. **Run it:**
   ```sh
   npm install
   npm run android
   ```

**Faster alternative — a real phone.** Skip the emulator entirely: enable
*Developer options* → *USB debugging* on your Android phone, plug it in, accept
the debugging prompt, confirm `adb devices` lists it, then `npm run android`.
This is quicker than a cold emulator boot and gives you real notification
behaviour, which the emulator fakes.

### iOS on a real iPhone, without a Mac (EAS Build)

EAS builds iOS in the cloud, so no Mac is needed. The repo is already configured:
`eas.json` defines the profiles, and the bundle identifier is set to
`com.ntousisorestis.resttimer` (change it in Xcode/`project.pbxproj` if you want
a different one — do it *before* the first build, since it's what gets registered
with Apple).

**Prerequisite, and it isn't free: the Apple Developer Program, $99/year.**
Installing on a physical iPhone needs an ad-hoc provisioning profile with your
device's UDID, and Apple only issues those to paid members. The Expo account is
free; this isn't. You'll need the same membership for Phase 2 anyway — the
`family-controls` entitlement can only be requested from a paid account.

Once you're enrolled:

```sh
npm install -g eas-cli
eas login                      # free Expo account, created at expo.dev
eas build:configure            # links the project, adds a projectId
eas build --platform ios --profile device
```

The build asks for your Apple ID, then registers the device and generates
credentials for you. When it finishes, EAS gives you a URL and QR code — open it
on the iPhone, install, then trust the profile under
*Settings → General → VPN & Device Management*.

Note: this app lives in a subdirectory of its git repo, so run every `eas`
command from `RestTimerApp/`, not the repo root.

### iOS on a Mac

```sh
npm install
bundle install && bundle exec pod install --project-directory=ios
npm run ios
```

### Checks

```sh
npm test            # reducer + full-loop integration tests (iOS resolution)
npm run test:android # same suite, Platform.OS === 'android'
npm run build:web    # also a real compile check for the shared code
npx tsc --noEmit
npm run lint
```

**Nothing native has ever been compiled yet** — no `Podfile.lock`, no Gradle
build. The web bundle builds and runs; iOS and Android are unproven until
someone with the toolchain runs them. See [Known risks](#known-risks).

## Logo and icons

The single source is **`assets/logo.png`** — square PNG, 1024px or larger.
Replace it, then run `npm run icons` to regenerate the iOS asset catalogue,
the five Android mipmap densities and the web icons. The in-app splash reads
the file directly and needs no command. See [assets/README.md](assets/README.md).

The logo committed today is a placeholder.

## Design rules

**1. Say it in words first, then repeat it in colour.** Every screen states the
lock status plainly — "2 apps blocked", "apps unlocked" — and each in-workout
screen adds a line saying what happens next. The background colour then repeats
it: near-black while apps are blocked, flooding violet the moment they unlock.
Colour
is the fast confirmation, never the only signal, so the app still works if you
can't tell the two apart.

The flip is a violet disc scaling out from the centre of the screen, drawn at the
root so it covers the safe-area insets rather than leaving dark bands.

**2. Every button says exactly what it does.** "Done with set", "Skip rest",
"End workout". Printed text and screen-reader text are the same string, with one
deliberate exception: a card's Start button *shows* "Start" and *announces*
"Start Bench press", because a list of buttons that all announce "Start" tells a
screen-reader user nothing.

**3. Each exercise is set up once, not every time.** The list is the resting
state of the app: a name, `3 sets · 60s rest`, the apps it blocks, and a Start.
Tapping a card opens its own controls in place — one at a time, since two sets
of steppers on screen is how you edit the wrong exercise.

Type is oversized and heavy, everything tappable is a pill, and each set gets a
tick that fills as you bank it.

## Motion & feel

Six pieces of motion, all RN `Animated`, no library:

| | what | why |
|---|---|---|
| **Press** | button face springs onto its shadow, back with overshoot | buttons are extruded blocks; a tap should feel like it landed |
| **Flip** | violet disc scales out from centre — 460ms open, 260ms shut | the app's loudest moment deserves the one bit of choreography |
| **Enter** | content fades and rises 14px on every phase change | the screen arrives instead of appearing |
| **Heartbeat** | clock pulses once per second under 5s left | urgency, without a sound |
| **Sweep** | ring glides between the countdown's 4Hz updates | at ring size, stepping four times a second reads as a stutter |
| **Pick** | app pills spring as you toggle them | picking should feel alive too |

Everything except the ring sweep runs on the native driver.
`strokeDashoffset` isn't a transform so it can't — it's one value at 4Hz, which
the JS thread handles comfortably.

Three rules keep it from getting silly:

- **Nothing loops and nothing idles.** The heartbeat is driven off the second
  *changing*, not a repeating animation, so it lines up exactly with the digits
  and can't outlive the screen. This also keeps the test suite deterministic —
  an infinite `Animated.loop` under fake timers is a flake waiting to happen.
- **Every animation checks `useReduceMotion()`** and collapses to an instant
  state change when the OS setting is on.
- **The extrusion reserves its layout space regardless of `disabled`**, so the
  Start button doesn't resize the moment it becomes enabled.

### Haptics — Android only, on purpose

Short buzzes when a set is banked, when the lock snaps shut, and when the
workout ends. `Vibration` is core React Native so this costs no dependency, but
**iOS ignores the duration and fires a fixed ~400ms buzz** — far too heavy for a
button tap, and it would make the app feel worse rather than better. iOS wants
`UIImpactFeedbackGenerator`, which needs a native module.

To finish it: add `react-native-haptic-feedback` and swap the three function
bodies in `src/haptics.ts`. Every call site already goes through those three
functions, so nothing else changes.

## Trying the simulated block

Phase 1 can't intercept another app, so lock state shows as a chip reading
**2 APPS BLOCKED** / **APPS UNLOCKED**, backed by the screen's own colour. While
locked the chip is tappable (marked `TAP TO SEE`) and opens the full-screen
shield you'd hit when opening TikTok. In Phase 2 that affordance disappears —
iOS draws the real shield.

## Known risks

Unverified because no native build has run yet:

- **Notifee vs the New Architecture.** RN 0.86 runs the New Architecture, and
  since RN 0.82 you *cannot turn it off* — the Gradle plugin errors if you try.
  `@notifee/react-native@9.1.8` ships no `codegenConfig`, so it's a legacy
  module relying on RN's interop layer. That usually works; there's no fallback
  switch if it doesn't. If the first native build breaks here, the options are
  a newer notifee, a different notification library, or dropping the backup
  alert (the loop itself doesn't depend on it).
- **SDK levels.** Notifee declares `compileSdk 34` against this project's 36.
  It reads from `rootProject.ext`, so it should inherit — but it's untested.
- **iOS deployment target.** Notifee's podspec says 10.0 against the project's
  15.1. Harmless, may warn during `pod install`.

## Layout

```
App.tsx                      root; the workout phase *is* the navigation
src/
  state/
    types.ts                 domain types
    workoutReducer.ts        the whole state machine, no side effects
    WorkoutContext.tsx       provider; the only place lock/unlock is triggered
  blocking/
    Blocker.ts               the interface the app codes against
    MockBlocker.ts           Phase 1 — drives the in-app overlay
    ScreenTimeBlocker.ts     Phase 2 — FamilyControls/ManagedSettings bridge (not wired)
    index.ts                 picks the real blocker if the native module exists
  screens/                   Exercises / ActiveSet / Resting / Complete
  components/                ExerciseCard, AppPill, BigButton, Stepper,
                             Segmented, ProgressRing, SetTicks, LockStatus,
                             LockGlyph
  hooks/useCountdown.ts      wall-clock countdown
  hooks/useEnter.ts          screen entry animation
  hooks/usePressScale.ts     shared press-in spring for every tappable
  hooks/useReduceMotion.ts   OS reduce-motion setting
  notifications.ts           OS-scheduled "rest over" alert
  haptics.ts                 buzz on start / set banked / lock shut / done
  restLines.ts               the rest screen's one-liners
  theme.ts                   palette, type scale, spacing
```

Two details worth knowing before you change things:

- **The countdown is wall-clock, not tick-counted.** It reads `Date.now()` every
  tick, because JS timers get throttled or suspended the moment the user leaves
  for TikTok — which is the entire point of the rest period. If the deadline
  passed while the app was suspended, the re-lock fires on the next foreground.
- **The rest-over notification is scheduled with the OS**, not fired by a JS
  timer, for the same reason.

## Android notes

Phase 1 is fully cross-platform — nothing in the loop is iOS-only, and the suite
passes under Android module resolution (`npm run test:android`). Specifics:

- **The violet flip and simulated shield work identically on Android.** They're
  plain RN views, not a Screen Time feature. Only *real* blocking is iOS-first.
- **Rest-over notifications use AlarmManager, not WorkManager.** Notifee's
  default for timestamp triggers is WorkManager, which the OS batches — hopeless
  for a 30–120s rest. See `notifications.ts`. Delivery is inexact but
  Doze-exempt, which is accurate enough while the screen is on. If you later
  want to-the-second delivery, that means `SCHEDULE_EXACT_ALARM` /
  `USE_EXACT_ALARM`, which Android 14+ restricts and Play Store reviews against
  an "alarm or timer app" justification.
- **Android 13+ asks for notification permission at runtime.** The prompt fires
  on *Start Workout*. Decline it and the loop still works — you just lose the
  backup alert.
- **targetSdk 36 forces edge-to-edge**, so the simulated-shield modal insets
  itself manually; without that its buttons would sit under the gesture bar.
- **`StatusBar backgroundColor` is a no-op on Android 15+** (edge-to-edge). The
  root view's background covers that area instead, so it looks right anyway.

Not handled yet, equally on both platforms: the screen can sleep mid-set (no
keep-awake), and the hardware back button doesn't intercept an active workout.

## State & persistence

One `useReducer` at the root, no backend. Three slices:

- **`exercises`** — the saved list. Every edit goes through one helper that
  rewrites a single entry by id, so there is no code path that can change two
  exercises at once. That's what makes the cards genuinely independent.
- **`defaults`** — app-wide preferences: the sound switch, the pool of
  blockable apps, and which of them a *newly created* exercise starts with
  ticked. Toggling one never reaches an exercise that already exists.
- **`config`** — a snapshot of the exercise being run, taken by `START_WORKOUT`.
  Not a reference: editing the card mid-workout must not move the goalposts
  under the set you're on, and the summary has to describe the workout that
  actually happened.

Sets and rest deliberately have no app-wide value any more. A new exercise
opens at `NEW_EXERCISE_SETS` / `NEW_EXERCISE_REST_SECONDS`, which are a
starting position rather than a setting.

### Adding real saving

The list and the preferences already go through a storage seam —
`src/state/storage.ts` — which the app talks to instead of any storage library.
Today it's backed by an in-memory store, so everything resets on restart.
Making it stick is one new file implementing `AppStorage` (AsyncStorage on
native, `localStorage` on web via a `.web.ts` twin) plus passing it to
`<App storage={...}>`. No screen, reducer or test changes. The file carries the
code to copy.

Three details worth keeping if you rewrite it:

- **The workout is never persisted, only the list and the preferences.**
  Restoring a saved session would resume a workout whose rest timer expired
  days ago.
- **Stored values are clamped and filtered on the way in**, since they're last
  session's data and may predate a change to the limits or the app list. An
  exercise with no usable name is dropped outright.
- **The key is versioned** (`rest-timer.state.v2`). It went up when sets and
  rest moved onto the exercises; a v1 payload read as v2 would put junk
  straight into state.

## Phase 2 — real iOS blocking

`src/blocking/ScreenTimeBlocker.ts` is the JS half, already written against the
interface the app uses. `getBlocker()` falls back to the mock while the native
module is absent, so dropping the Swift side in requires no other code change.

**What's still missing is not just code — some of it is on your Apple Developer
account and can't be worked around:**

1. **`com.apple.developer.family-controls` entitlement.** Must be requested from
   Apple and approved. The frameworks refuse to authorize without it, so this
   gates everything else. Approval takes days-to-weeks and can be declined.
2. **Provisioning.** Once approved, the entitlement has to be added to the App ID
   and a fresh provisioning profile pulled down.
3. **A real device.** `AuthorizationCenter.requestAuthorization` does not work
   reliably in the Simulator.
4. **A second target.** Re-locking when the countdown ends — while the user is
   still inside TikTok — needs a `DeviceActivityMonitor` app extension with its
   own bundle ID and entitlement, plus an App Group shared with the main app.
   The app process alone can't be relied on to re-shield from the background.
5. **App Review.** Apps using this entitlement get extra scrutiny and need a
   written justification.

One product consequence, worth deciding on before Phase 2: **Apple never tells the
app which apps the user picked.** `FamilyActivityPicker` hands back an opaque
token. The per-exercise checkbox list therefore becomes a single "Choose apps"
button, and the UI can only ever say "3 apps blocked", never "TikTok blocked".
`LockStatus` and `AppPill` are written so that swap is contained — every screen
names apps from one list, and each has a count to fall back to.

## Not in scope (yet)

Motion detection, camera exercise recognition, Android blocking (Phase 3),
accounts, backend, payments, workout history.
