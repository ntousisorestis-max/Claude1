# Liftlock

**Liftlock is an iPhone app that takes your scrolling apps away during a lifting
set and hands them back while you rest.** Start a set, the noise is locked out.
Rest begins, you get it back. Rest ends, it locks again.

The app lives in `RestTimerApp/`. The other files at the repo root
(`30_Day_Glow_Up_Guide.pdf`, `generate_book.py`) are unrelated — ignore them.

`RestTimerApp/README.md` is the long version: architecture, every design
decision and why it was made. Read it when you need depth. This file is the
things that are true in every session.

---

## Who you're talking to

**The person you're working with is not a developer.** Explain things in plain
language. That does not mean less detail — it means no unexplained jargon. If
you have to use a technical term, say what it is in the same breath.

Concretely:

- Describe what a change *does on screen*, not just what file it touches.
- When something can't be done, say why in one sentence a non-programmer can
  follow — not "the entitlement isn't provisioned".
- Don't ask them to choose between two options they have no way to evaluate.
  Recommend one and say why.

## How to work

**One focused change per prompt.** They'll ask for one thing. Do that thing
properly rather than that thing plus three improvements you noticed.

**Show the plan before editing files.** For anything beyond a trivial fix, say
what you intend to change and wait. This is a standing preference, not something
they have to repeat. For copy and design work especially: propose the actual
words and the actual layout first.

**Verify in a real browser before saying it's done.** Not "the tests pass" —
tests have been green while the screen was visibly broken. Build it, drive it in
Chromium, look at the screenshot. See "Testing" below.

**Never invent demo or placeholder data.** No fake streaks, no sample numbers to
fill a screen, no "TikTok — 12 minutes". When there's no data, design an honest
empty state that looks intentional. A placeholder that looks like data is a lie
the user discovers the moment they finish their first workout. This has been
said more than once; treat it as a hard rule.

## The stack

Bare **React Native 0.86** with TypeScript. Not Expo.

- **Styling is React Native `StyleSheet`, always.** **Never introduce Tailwind
  or NativeWind**, or any other styling library. Match the existing files.
- `react-native-svg` draws every icon, illustration, ring, chart and gradient.
- One `useReducer` at the root (`src/state/workoutReducer.ts`). The workout's
  *phase* is the navigation — there is no router.
- State is saved to the device: `localStorage` in a browser, AsyncStorage on a
  phone, one JSON blob under `liftlock.state.v3`.
- Firebase (Auth + Firestore) backs optional accounts. It's the JavaScript SDK,
  not `@react-native-firebase`, because the web build is the only target that
  has ever actually run.
- `.web.ts` / `.web.tsx` files automatically replace their native twins in the
  web build. That's how the browser gets a working version of things phones do
  natively.

## Look and voice

**Theme: violet `#8B5CF6` on near-black `#0F0B1A`.** Bold type, rounded cards,
soft glow. All tokens are in `src/theme.ts` — use them, don't hardcode colours.

The one colour rule that carries meaning: **a violet flood means your apps are
unlocked.** Near-black with violet accents means locked. Don't flood a screen
violet for decoration.

**Voice: a confident gym buddy. Dry, casual, short.** The benchmark line is
**"Let's lift."** Never a mascot, never a pun, never an exclamation mark it
hasn't earned. Three rules:

- **Short.** Every line sits under something that's the actual point of the
  screen. A joke needing two lines isn't one.
- **Never at the user's expense for failing.** Ending a workout early, a broken
  streak, an empty list — warmth, not a jab. The only thing teased is skipping
  *rest*.
- **No fake stakes.** Nothing implies a consequence the app can't deliver, and
  nothing congratulates a number the app didn't measure.

All user-facing copy lives in `src/copy.ts` so the whole voice can be read end
to end.

## What's built and what isn't

**Phase 1 — done.** The full app: exercises, sets, rest timer, streaks,
insights, accounts. The blocking is **simulated** — the app shows which apps
*would* be locked, and locks nothing.

**Phase 2 — real iOS blocking. Not built.** It needs Apple's Family Controls
entitlement, which needs a **paid Apple Developer account** they don't have yet,
plus a real iPhone to test on. This is a paperwork blocker, not a code one.
Don't propose workarounds — there aren't any; Apple gates this deliberately.

The honest caveat about simulated blocking belongs in **Settings**, where
someone can act on it. Other screens describe the loop in the present tense.

**Phase 3 — Android.** Not started.

**Screen Time can never tell the app which apps were picked.** iOS hands back an
opaque token. So a per-app breakdown ("Instagram, 8 minutes") is a number *no
version of this app will ever have*. Never design a screen that needs it, and
never estimate "scrolling avoided" — that would require knowing what someone
would otherwise have done.

## Testing

**They test on Windows, in a web browser.** That means these can be written and
reviewed but **cannot be verified locally**:

- real app blocking
- push notifications
- sounds
- haptics

No native build has ever compiled in this environment. Say so plainly rather
than implying something was tested when it wasn't.

All commands run from `RestTimerApp/`:

| Command | What it does |
|---|---|
| `npm test` | The test suite (iOS config) |
| `npm run test:android` | Same tests, Android config |
| `npx tsc --noEmit` | Type check |
| `npx eslint .` | Lint |
| `npm run build:web` | Build the browser version into `dist/` |
| `npm run web` | Dev server on port 3000 |
| `npm run contrast` | Colour-contrast budget (needs a server on :8099) |

Run all of them before saying a change is finished.

**Contrast is an enforced budget, not a guideline.** `npm run contrast` checks
every colour analytically *and* measures real pixels in Chromium. If a new
colour combination lands on screen, add it to `scripts/check-contrast.mjs`.

Playwright is at `/opt/node22/lib/node_modules/playwright` (CommonJS — import as
`import pw from '...'; const { chromium } = pw`), Chromium at
`/opt/pw-browsers/chromium`. **Keep throwaway probe scripts out of the repo** —
put them in the scratchpad directory. Build scaffolding has been accidentally
committed twice.

## Out of scope unless asked

Cosmetic theme unlocks and alternate app icons; friends and the social
leaderboard; payments; motion or camera exercise detection; streak freezes or
rest-day passes (the app has none — don't imply it does).
