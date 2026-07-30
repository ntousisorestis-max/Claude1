# Rest Timer

A gym rest-timer that blocks your scrolling apps while you're doing a set, unlocks
them for the rest period, and re-locks them when the countdown hits zero.

```
Setup ──Start──▶ Active Set ──Done with Set──▶ Resting ──0:00 / Skip──▶ Active Set
                  black · locked               lime · free            black · locked
                       └────────── last set ──────────▶ Complete (lime · free)
```

**This is Phase 1: the block is simulated.** The full loop works, but no app is
actually shielded yet. See [Phase 2](#phase-2--real-ios-blocking) for what real
blocking needs — including things only you can do on your Apple Developer account.

## Running it

Bare React Native 0.86. Phase 1 has no iOS-only code, so **Android is enough to
try the whole loop** — no Mac required.

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
npx tsc --noEmit
npm run lint
```

## Design rule

**Colour means lock state, and it's the whole screen.** Locked phases are
near-black with acid lime on top; the moment your apps unlock, the ground floods
lime and the type goes black. Lights off, lights on — legible from across a gym
without reading a word. The flood is applied at the root so it covers the
safe-area insets too, rather than leaving dark bands. Violet is the only other
colour and never grounds a screen.

Type is oversized and heavy, everything tappable is a pill, and set counts are
instrument digits (`01/03`) with a chunky tick per set.

**The slang is a paint job, and it stops at the accessibility layer.** Buttons
print `LOCK IN` and `SET DONE` but announce "Start workout" and "Done with set"
via `BigButton`'s `a11yLabel`. Anything load-bearing — timers, set counts, the
summary — stays literal. "go be delulu for a sec" is a joke on the rest screen;
`00:42` is not.

## Trying the simulated block

Phase 1 can't intercept another app, so lock state shows as the screen's own
colour, backed by a chip reading **PHONE LOCKED** /
**PHONE UNLOCKED**. While locked the chip is tappable (marked `TAP`) and opens
the full-screen shield you'd hit when opening TikTok. In Phase 2 that affordance
disappears — iOS draws the real shield.

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
  screens/                   Setup / ActiveSet / Resting / Complete
  components/                BigButton, Stepper, Segmented, ProgressRing,
                             SetTicks, StatusTag
  hooks/useCountdown.ts      wall-clock countdown
  notifications.ts           OS-scheduled "rest over" alert
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

- **The lime flip and simulated shield work identically on Android.** They're
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

Local only — one `useReducer` at the root, no backend. There is no persistence
yet, but `WorkoutContext.tsx` has the slot marked: a `HYDRATE` action already
exists, so adding AsyncStorage is two `useEffect`s and nothing else.

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
token. The Setup screen's checkbox list therefore becomes a single "Choose apps"
button, and the UI can only ever say "3 apps blocked", never "TikTok blocked".
`StatusTag` and the Setup screen are written so that swap is contained.

## Not in scope (yet)

Motion detection, camera exercise recognition, Android blocking (Phase 3),
accounts, backend, payments, workout history.
