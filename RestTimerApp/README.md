# Rest Timer

A gym rest-timer that blocks your scrolling apps while you're doing a set, unlocks
them for the rest period, and re-locks them when the countdown hits zero.

```
Setup ──Start──▶ Active Set ──Done with Set──▶ Resting ──0:00 / Skip──▶ Active Set
                  🔒 locked                     🔓 unlocked                🔒 locked
                       └────────── last set ──────────▶ Complete (🔓 unlocked)
```

**This is Phase 1: the block is simulated.** The full loop works, but no app is
actually shielded yet. See [Phase 2](#phase-2--real-ios-blocking) for what real
blocking needs — including things only you can do on your Apple Developer account.

## Running it

Bare React Native 0.86, so you need the [RN environment
setup](https://reactnative.dev/docs/set-up-your-environment) (Xcode for iOS,
Android Studio + JDK 17 for Android).

```sh
npm install

# iOS (macOS only)
bundle install && bundle exec pod install --project-directory=ios
npm run ios

# Android
npm run android
```

Checks:

```sh
npm test          # reducer + full-loop integration tests
npx tsc --noEmit
npm run lint
```

## Trying the simulated block

Phase 1 can't intercept another app, so the lock state shows as a pill at the top
of the Active Set and Resting screens: **🔒 2 apps blocked** / **🔓 Apps unlocked**.
While locked, tap the pill to see the full-screen shield you'd get when opening
TikTok. In Phase 2 that pill stops being tappable — iOS draws the real shield.

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
  components/                BigButton, Stepper, ProgressRing, LockIndicator
  hooks/useCountdown.ts      wall-clock countdown
  notifications.ts           OS-scheduled "rest over" alert
  theme.ts                   dark-first palette
```

Two details worth knowing before you change things:

- **The countdown is wall-clock, not tick-counted.** It reads `Date.now()` every
  tick, because JS timers get throttled or suspended the moment the user leaves
  for TikTok — which is the entire point of the rest period. If the deadline
  passed while the app was suspended, the re-lock fires on the next foreground.
- **The rest-over notification is scheduled with the OS**, not fired by a JS
  timer, for the same reason.

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
`LockIndicator` and the Setup screen are written so that swap is contained.

## Not in scope (yet)

Motion detection, camera exercise recognition, Android blocking (Phase 3),
accounts, backend, payments, workout history.
