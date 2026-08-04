# Liftlock

A gym rest-timer that blocks your scrolling apps while you're doing a set, unlocks
them for the rest period, and re-locks them when the countdown hits zero.

```
Exercise list ──Start──▶ Active Set ──Done with set──▶ Resting ──0:00 / Skip──▶ Active Set
                      apps blocked (black)          apps unlocked (violet)     apps blocked
                            └───────────── last set ─────────────▶ Complete (unlocked)
```

Four tabs: **Workout** (a list of saved exercises, each carrying its own name,
sets, rest and blocked apps), **Insights** (all-time totals), **Streaks** (days
trained in a row) and **Settings**. Starting an exercise snapshots that card
into the workout, and the workout then owns the screen until it ends.

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

Three pieces are swapped at build time, all by webpack's `.web.*` resolution
rather than by edits to shared code:

- `src/notifications.web.ts` — honest no-ops. A browser has no equivalent of an
  OS alarm that survives the tab being backgrounded, which is the entire point
  of the native version, so it doesn't pretend with a `setTimeout`.
- `src/components/AnimatedCircle.web.tsx` — strips the `collapsable` prop that
  RN's animated layer forces onto whatever it wraps. There's no view flattening
  on the web, react-native-svg renders a real DOM `<circle>`, and the unknown
  attribute makes React log a warning on every rest screen.
- Haptics need no stub: `src/haptics.ts` already checks `Platform.OS`, which is
  `'web'` here, so it no-ops on its own.

**Don't use `Alert` anywhere.** `react-native-web`'s implementation is an empty
function body, so anything behind an `Alert.alert` confirmation is silently
dead in a browser — no dialog, no error, nothing. Destructive actions go
through `src/components/ConfirmDialog.tsx`, which draws its own modal and
behaves identically on all three targets. `Alert.prompt` is worse: it doesn't
exist on Android either.

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
npm run contrast     # WCAG check of the palette against the background glow
```

`npm run contrast` needs a built bundle being served on `:8099`. It drives a
real browser, so it catches what the maths alone would miss.

**Nothing native has ever been compiled yet** — no `Podfile.lock`, no Gradle
build. The web bundle builds and runs; iOS and Android are unproven until
someone with the toolchain runs them. See [Known risks](#known-risks).

## The name

The app is **Liftlock**. A handful of identifiers still read `RestTimer`, and
they are all deliberate:

- `app.json`'s `name` is the `AppRegistry` key and has to match what the native
  host registers. Renaming it breaks launch on both platforms.
- `RestTimerScreenTime` is the Phase 2 native module's name, fixed by the Swift
  side that doesn't exist yet.
- The notification channel ids (`rest-timer`, `rest-timer-silent`) and the
  storage key (`rest-timer.state.v2`) are keys, not labels. An Android channel's
  settings are immutable once created, so changing its id orphans whatever the
  user had configured.
- The channel *names* — "Rest timer" and "Rest timer (silent)" — are visible in
  Android's notification settings, and describe the notification's purpose
  rather than the app. Under an app called Liftlock, a channel called "Rest
  timer" is the right label; renaming it to "Liftlock" would tell the user
  nothing.

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

Under all of it sits a soft, deliberately off-centre glow — a large violet
bloom high and left, a smaller fainter one low and right. It's drawn once at
the root rather than per screen, which is what makes it read as one surface the
app sits on instead of decoration each screen happens to have. There are two
copies cross-faded on the same value that drives the flip: violet on the
near-black, light on the violet, because a violet bloom on a violet ground
would vanish at exactly the moment the screen floods.

**The glow has a contrast budget.** Every point of background lightness is
contrast taken from the text on top, so `GlowBackground.tsx` has fixed peak
opacities and `npm run contrast` checks the whole palette against them — once
analytically at the worst case, once by sampling real pixels in a browser.
Raising a peak means re-running it. Fitting inside that budget is why `accent`
is a fill with a separate lighter `accentText` for small type: at 12–17px the
button violet lands at 3.9–4.3:1, under AA, glow or no glow.

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

### Collapsing sections

The exercise card's Sets / Rest time / Blocked apps rows animate their height
rather than snapping. That forces one design decision worth knowing about:
**the children stay mounted while the row is shut.** `open ? children : null`
cannot animate — there is nothing to measure before it appears and nothing left
to shrink once it's gone.

Content squashed to zero height is still there, so `Collapsible` shuts it off
three ways, because each platform only listens to one: `pointerEvents` (a
zero-height box still catches taps along its edge), `accessibilityElementsHidden`
on iOS, `importantForAccessibility` on Android — and a bare `aria-hidden`,
because **react-native-web implements neither of the other two**. Without it the
browser build leaves every collapsed control readable by a screen reader, which
is the exact failure the component exists to avoid. `__tests__/motion.test.tsx`
asserts all four.

Height is the one animation in the app not on the native driver — it can't be,
being a layout property. That's why it's used on a still screen and nowhere near
the rest countdown. `scaleY` *would* run natively and is the wrong tool: it
squashes the content instead of revealing it, so the text visibly stretches back
into shape.

## Voice

All the personality copy lives in `src/copy.ts` — rest lines, the tease for
skipping rest, notification bodies, both endings, empty states. Together in one
module rather than scattered through the screens, because the voice can only be
judged by reading it end to end, which is the only way to notice when one line
has drifted funnier than the rest.

Three rules hold it in place: short (every line sits under something that is the
actual point of the screen); never at the user's expense for *failing* (ending
early, a broken streak and an empty list get warmth — the only thing teased is
skipping **rest**, which is impatience rather than weakness); and no fake stakes,
so nothing congratulates a number the app didn't measure.

Rotating lines are picked by seed, not by `Math.random()` at the call site. These
render inside components that re-render on every tick of a countdown, and a line
that reshuffles sixty times a minute is the most annoying thing an interface can
do. The notification's *title* deliberately never rotates — a notification whose
title changes each time reads as a different app each time.

"Personal best" means exactly one thing: a new longest streak. It's the only
record the app keeps, so it's the only thing it can honestly call one.

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
| **Beat** | the padlock swells and blooms a halo when it locks or unlocks | the two moments the app exists for |
| **Release** | the ring swells and drops its track in the last second | the countdown hands over to the lock instead of being cut off |
| **Throw** | the settings toggle's thumb travels rather than jumping | the difference between a switch and a checkbox |
| **Count** | time reclaimed counts up on the summary | the one number worth watching arrive |

Everything except the ring sweep and the count-up runs on the native driver.
`strokeDashoffset` isn't a transform so it can't, and the count-up animates a
*number* rather than a style so it has to come back through JS — both are one
value on an otherwise still screen, which the JS thread handles comfortably.

Three rules keep it from getting silly:

- **Nothing loops and nothing idles.** The heartbeat is driven off the second
  *changing*, not a repeating animation, so it lines up exactly with the digits
  and can't outlive the screen. This also keeps the test suite deterministic —
  an infinite `Animated.loop` under fake timers is a flake waiting to happen.
- **Every animation checks `useReduceMotion()`** and collapses to an instant
  state change when the OS setting is on.
- **The extrusion reserves its layout space regardless of `disabled`**, so the
  Start button doesn't resize the moment it becomes enabled.

### Sound

Two effects, synthesised rather than sampled: a soft bell when a set is banked,
and an arpeggiated version of the same bell when the workout ends. Both are built
on a perfect fifth, everything decays exponentially, and nothing sustains — a
tone that lingers gets in the way of the next rep.

`react-native-audio-api` implements the Web Audio API natively, which is why
there is one synthesis codepath in `src/sound/index.ts` and a four-line platform
shim beside it. Files would have meant two implementations, two sets of assets,
and a regeneration step every time a note was wrong.

Two switches silence it, and they're different things.

**In software**, `defaults.soundEnabled` — the same switch that drives the
notification channel, so the app's Silent mode is silent everywhere. It doesn't
even construct an AudioContext when off, which matters on iOS: doing so takes
the audio session away from whatever the user is actually listening to.

**In hardware**, the ring/silent switch on the side of the phone. iOS decides
whether that switch applies purely from the `AVAudioSession` category, and the
difference is stark — `playback` plays straight through a silenced phone, which
is correct for a music app and is why audio libraries tend to default to it. A
rest timer is not a music app, so the session is set to **`ambient`**, which
obeys the switch, with **`mixWithOthers`** so a chime never ducks or pauses the
music someone is lifting to. See `src/sound/audioContext.ts`.

The session is configured before the first context is built, because the
category decides how the very first sound is routed. That ordering, the
category, the mixing option and the "configure once" behaviour are all asserted
in `__tests__/audioSession.test.ts` — but whether iOS honours any of it is a
question only a device can answer.

Note which moments make a sound: banking a set, and finishing. **Not starting
one.** The moment a set begins is the moment the phone should stop being
interesting, and a chime as you step under a bar is the app asking for attention
at precisely the wrong time. That one gets a haptic only.

### Haptics

Seven beats, all but two fired from the same phase-change effect in
`WorkoutContext` that drives the sounds, so no screen has to remember to buzz.
(`tap` is one exception, belonging to the press rather than a state change;
`personalBest` is the other, because it waits on a server round-trip.)

The vocabulary is small and it climbs: `tap` (light) → `restSkipped` (light) →
`setBanked` (medium) → `restExpired` (soft + rigid) → `workoutStarted` (soft +
medium) → `personalBest` (light, medium, heavy, accelerating) → `workoutDone`
(medium, medium, heavy). A phone that vibrates at everything is a phone whose
vibration means nothing.

**Rest ending is two different events.** Both are the same `resting → active`
transition, so the app tells them apart by `skippedRest` in state. Rest that
*expires* has to reach someone who may not be looking at the phone at all, so it
opens with a soft beat and lands on `rigid`. Rest you *skipped* was a deliberate
press by someone already looking at the screen, so it gets one light tick and
nothing more — anything heavier is the app telling you something you just told
it. Tapping the "Time's up!" notification counts as a skip for the same reason.

The threshold is 15 seconds: skipping with eight seconds left is waiting for the
timer, not dodging it, so it reads as an expiry. That imprecision runs in the
safe direction — the worst case is a slightly firmer buzz than needed.

`react-native-haptic-feedback` drives `UIImpactFeedbackGenerator` on iOS and the
modern `VibrationEffect` API on Android. It is loaded through a guarded
`require`, so an unlinked build falls back to core RN `Vibration` patterns — on
**Android only**, because on iOS `Vibration.vibrate` ignores the duration and
fires a fixed ~400ms buzz, which is worse than no haptic at all.

**No in-app toggle, deliberately.** The Sound switch and Silent mode are about
sound; Silent mode's own description promises the alert still arrives. Routing
haptics through it would make "silent" mean two things and would remove the
feedback from exactly the person who turned sound off because they are relying
on touch. The OS-level haptics switch *is* honoured —
`ignoreAndroidSystemSettings: false` and `enableVibrateFallback: false` mean the
fallback cannot route around it either.

**Unverifiable here.** No native build has compiled and a browser has nothing to
fire, so how any of this feels is unknown. `__tests__/haptics.test.tsx` pins the
wiring — right function, right transition, once per transition, and the two
rest-endings told apart — and that is the whole of what can be checked.

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
- **Haptics and sound are both optional native modules.**
  `react-native-haptic-feedback` and `react-native-audio-api` are each loaded
  through a guarded `require`, so a build where they aren't linked yet degrades
  to the Android-only `Vibration` fallback and to silence rather than crashing.
  That means the *first* native build will feel flatter than the web build until
  `pod install` runs — and it means a linking failure is invisible rather than
  loud. `hasNativeHaptics` is exported from src/haptics.ts to check.
- **Firebase auth persistence on native.** `@firebase/auth` keeps the signed-in
  session in AsyncStorage on React Native, picked up automatically because
  `@react-native-async-storage/async-storage` is installed as its optional peer
  dependency. That resolution has only been proven on web, where the browser
  build uses `localStorage` instead. If a native build signs the user out on
  every launch, this is why — and it needs `pod install` on iOS.
- **Bundle weight.** The Firebase SDK takes the production web bundle from
  ~0.6 MB to ~1.4 MB. `getBackend()` avoids *evaluating* it when no project is
  configured, but bundlers still include it; splitting it out would mean an
  async `import()` and is only worth doing if load time becomes a complaint.

## Layout

```
App.tsx                      root; the workout phase *is* the navigation
src/
  copy.ts                    every line of personality, in one place
  haptics.ts                 six intents, native module with a Vibration fallback
  sound/
    index.ts                 the two effects, synthesised
    audioContext.ts          native shim (.web.ts twin for the browser)
  state/
    types.ts                 domain types
    workoutReducer.ts        the whole state machine, no side effects
    WorkoutContext.tsx       provider; the only place lock/unlock is triggered
  blocking/
    Blocker.ts               the interface the app codes against
    MockBlocker.ts           Phase 1 — drives the in-app overlay
    ScreenTimeBlocker.ts     Phase 2 — FamilyControls/ManagedSettings bridge (not wired)
    index.ts                 picks the real blocker if the native module exists
  cloud/
    days.ts                  day keys and streak arithmetic — pure, no imports
    types.ts                 CloudBackend, AuthUser, FocusTotals — no Firebase import
    backend.ts               picks the backend; the local no-op one; error copy
    firebaseBackend.ts       the only file that imports firebase/*
    AccountContext.tsx       who's signed in, lifetime totals, the sync outbox
    WorkoutSync.tsx          the one seam: workout 'complete' -> recordWorkout
    firebaseConfig.ts        your project's six values (see FIREBASE_SETUP.md)
  screens/                   Exercises / ActiveSet / Resting / Complete
                             Insights / Streaks / Settings
  components/                ExerciseCard, SessionStats, SettingsSection,
                             HeroHourglass, HeroDumbbell, GradientButton, Icon,
                             SectionLabel, AppPill, ConfirmDialog, BigButton,
                             Stepper, Segmented, ProgressRing, SetTicks,
                             LockStatus, LockGlyph
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
- **The "Time's up!" notification is scheduled with the OS**, not fired by a JS
  timer, for the same reason.
- **Silent mode and the Sound toggle are one setting, not two.** They're
  inverses, so two independent flags could be set to contradict each other and
  neither would be the truth. Both write `soundEnabled`. The behaviour under
  them — alert still delivered, just without a sound — is why
  `notifications.ts` keeps two Android channels: a channel's sound can't be
  changed once it exists, so silencing means posting to a different one.
- **Tapping it is routed into the state machine, not left to the OS.** The
  handler dispatches `END_REST`, which is exactly the "rest is over, next set"
  transition — so a tap lands you on the set you were about to do rather than
  on whatever screen the app happened to be showing. The reducer ignores
  `END_REST` unless the phase is still `resting`, which makes a stale or
  duplicated tap a no-op instead of a skipped set. See
  `onRestNotificationPress` in `notifications.ts` for the three arrival routes
  (foreground, background, cold start).
- **A cold start can't resume the workout**, because the workout is
  deliberately never persisted — only the exercise list and preferences are.
  Tap the alert after the OS has killed the app and you land on your list, not
  mid-set. Fixing that means persisting the live workout with a freshness
  window, so a session from eight hours ago isn't resumed; it's a design
  decision, not an oversight.

## Android notes

Phase 1 is fully cross-platform — nothing in the loop is iOS-only, and the suite
passes under Android module resolution (`npm run test:android`). Specifics:

- **The violet flip and simulated shield work identically on Android.** They're
  plain RN views, not a Screen Time feature. Only *real* blocking is iOS-first.
- **The notification's small icon is generated, not the launcher icon.** Android
  silhouettes the small icon — alpha kept, colours discarded — so pointing it at
  the full-colour launcher icon gives a white blob. `npm run icons` writes a
  white-on-transparent `ic_notification.png` into the five `drawable-*`
  buckets, and `android.color` tints it violet in the shade.
- **"Time's up!" notifications use AlarmManager, not WorkManager.** Notifee's
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

## Accounts and the Focusboard

Optional, and off until someone fills in `src/cloud/firebaseConfig.ts` — see
**[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** for the click-by-click walkthrough.
With it blank the app behaves exactly as it did before accounts existed, which
is the state the whole test suite runs in.

What exists today is the foundation, not the feature: email/password accounts,
and each finished workout synced to Firestore so there is real data to rank
people by. There is no leaderboard screen and no friends list yet.

Three decisions worth knowing:

- **The Firebase JS SDK, not `@react-native-firebase`.** The latter is the more
  usual pick for a bare RN app and has better offline behaviour, but it is
  native-only — and no native build has ever compiled in this project (see
  [Known risks](#known-risks)). A backend that can't be exercised would ship
  unverified. The JS SDK runs on web *and* React Native from one codebase, so
  every line of it is covered by the browser build.
- **Two totals, deliberately not merged.** `session` counts since launch and is
  never saved; the Firestore doc counts lifetime and is what a leaderboard would
  read. The Workout tab's stats card shows the first, the Settings account card
  shows the second, and each says which it is.
- **Writes are idempotent.** A workout id is minted once when the workout ends
  and reused by every retry. The workout doc and the `increment` on the totals
  go up in one transaction that bails if that id is already on file — `increment`
  on its own is not idempotent, and a retried write would count the same session
  twice, which on a leaderboard is indistinguishable from cheating.

### Streaks and days

A day counts if at least one workout **finished** on it. Not sets, not minutes —
the point of a streak is showing up, and one you can lose by having a short
session punishes exactly the day you most needed a reason to go.

Three things about it are load-bearing:

- **The device decides what day it is.** `WorkoutSync` stamps the local day onto
  the record the moment the workout ends, and the server stores what it's told.
  A UTC timestamp would tell someone in Auckland their Tuesday morning session
  happened on Monday. The trade-off — that crossing time zones can double or
  skip a day — is documented in `days.ts` and always errs towards keeping a
  streak rather than breaking one.
- **The streak is folded at write time, and decayed at read time.** It only ever
  changes when a workout lands, so there is nothing to schedule; but a stored
  streak is only true as of the day it was written, so `streakToday()` takes off
  a missed day when the screen asks. Yesterday still counts, or everyone's
  streak would read zero every morning until they got to the gym.
- **The week strip is rolling, not Monday-to-Sunday.** A calendar week puts
  empty boxes to the right of today for most of the week, and a box you haven't
  reached yet looks exactly like one you missed.

All of that arithmetic lives in `src/cloud/days.ts` as pure functions with no
imports, because it is the kind of logic that looks obviously right and is wrong
at month boundaries, leap days and the two nights a year the clocks change.
`__tests__/days.test.ts` covers each of those.

`firestore.rules` is the security model and has to be pasted into the Firebase
console by hand — **including again after this change**, which added the `days`
collection. The API key in `firebaseConfig.ts` protects nothing and is meant to
be committed.

## State & persistence

One `useReducer` at the root, no backend. Three slices:

- **`exercises`** — the saved list. Every edit goes through one helper that
  rewrites a single entry by id, so there is no code path that can change two
  exercises at once. That's what makes the cards genuinely independent.
- **`defaults`** — app-wide preferences: the sound switch, the pool of
  blockable apps, and which of them a *newly created* exercise starts with
  ticked. Toggling one never reaches an exercise that already exists.
- **`totalLockedSeconds`** — how long the apps were locked this workout, which
  is the time the phone was genuinely out of reach. Revealed on the summary as
  "time reclaimed" and deliberately never shown while it accrues: a live
  counter would put a number on screen at exactly the moment the app wants you
  looking away from it. Session-only, reset by the next `START_WORKOUT`.
- **`session`** — running totals for every workout since launch: sets, focus
  time, workouts done. Never persisted, so it starts at zero on each launch.
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
payments, per-workout history screens, friends, streak badges, challenges,
charts, and the Focusboard leaderboard screen itself.
