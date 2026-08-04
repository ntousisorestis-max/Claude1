/**
 * The app's voice, in one file.
 *
 * Tone: a training partner who has been doing this a while. Dry, confident,
 * occasionally taking the piss — never a mascot, never an exclamation mark it
 * hasn't earned, never a pun. The app has already taken the user's phone away;
 * it does not also need to shout, and it definitely doesn't need to be cute
 * about it.
 *
 * Three rules that keep it on the right side of the line:
 *
 * - **Short.** Every one of these sits under or beside something that is the
 *   actual point of the screen. A joke that needs two lines isn't one.
 * - **Never at the user's expense for failing.** Ending a workout early, a
 *   broken streak, an empty list — those get warmth, not a jab. The only thing
 *   teased is skipping *rest*, which is a person being impatient, not weak.
 * - **No fake stakes.** Nothing here implies a consequence the app can't
 *   deliver on, and nothing congratulates a number the app didn't actually
 *   measure.
 *
 * Keeping it together in one module rather than scattered through the screens
 * means the voice can be read end to end, which is the only way to notice when
 * one line has drifted funnier than the rest.
 */

/**
 * Picks one line, deterministically per `seed`.
 *
 * Not `Math.random()` at the call site: these are rendered inside components
 * that re-render on every tick of a countdown, and a line that reshuffles
 * itself sixty times a minute is the single most annoying thing an interface
 * can do. Callers pass something stable for the life of the moment — the rest
 * period's end time, the number of sets done — and get the same line back every
 * render until that moment ends.
 */
export function pick(lines: readonly string[], seed: number): string {
  const index = Math.abs(Math.floor(seed)) % lines.length;
  return lines[index];
}

/** A genuinely random index, for the one caller that wants a fresh line. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 100_000);
}

/* -------------------------------------------------------------------------- */
/* Rest                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One short line under the countdown, picked fresh each rest period.
 *
 * Deliberately short — this sits under a ring that is the actual point of the
 * screen. Half of these are encouragement and half are the app being slightly
 * smug about having your phone; the mix is what stops it reading like a poster
 * in a changing room.
 */
export const REST_LINES = [
  'One more rep.',
  'Earn your scroll.',
  'Sit down. That’s an order.',
  'This counts as training too.',
  'Breathe. Then lift.',
  'This is the easy part.',
  'Nobody’s watching. Rest properly.',
  'You’ve got sixty seconds of freedom.',
  'The bar doesn’t care how you feel.',
  'Nobody regrets the set they did.',
  'Go on, check something. It’ll wait.',
  'Sixty seconds of being a normal person.',
  'Your feed survived without you.',
  'Look busy. Nobody has to know.',
  'This is the bit you were looking forward to.',
  'Enjoy it. It’s on a timer.',
  'Breathe like you meant to do that.',
  'The next set is the one that counts.',
] as const;

/* -------------------------------------------------------------------------- */
/* Cutting rest short                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Shown on the next set when the user skipped a meaningful chunk of rest.
 *
 * The one place the app is allowed to be cheeky at the user's expense, because
 * the failure mode is impatience rather than weakness — and because someone who
 * skips rest usually meant to, so a line that assumed they'd made a mistake
 * would be more irritating than a line that raises an eyebrow.
 */
export const SKIPPED_REST_LINES = [
  'Rest? Never heard of it.',
  'Straight back in. Noted.',
  'Someone’s in a hurry.',
  'You barely sat down.',
  'The timer had plans.',
  'Impatient. Respect.',
] as const;

/* -------------------------------------------------------------------------- */
/* The rest-over notification                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Bodies for the "Time's up!" alert.
 *
 * The title stays fixed — a notification whose *title* changes every time reads
 * as a different app each time, and this one has to be recognisable at a glance
 * from a lock screen. The body is where the personality goes.
 *
 * Each takes the set it's calling the user back to, because a notification that
 * doesn't say what it wants is a notification you have to open to understand.
 */
export const REST_OVER_BODIES = [
  (set: number, total: number) => `Back under it. Set ${set} of ${total}.`,
  (set: number, total: number) => `Phone down. Set ${set} of ${total}.`,
  (set: number, total: number) => `That’s your lot. Set ${set} of ${total}.`,
  (set: number, total: number) => `Break’s over. Set ${set} of ${total}.`,
  (set: number, total: number) => `Up. Set ${set} of ${total}.`,
] as const;

export function restOverBody(set: number, total: number, seed: number): string {
  const index = Math.abs(Math.floor(seed)) % REST_OVER_BODIES.length;
  return REST_OVER_BODIES[index](set, total);
}

/* -------------------------------------------------------------------------- */
/* Finishing                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The line under "That's the work."
 *
 * The headline is fixed — it is the payoff of the whole session and it should
 * be the same words every time, the way a bell is the same note every time.
 * These rotate underneath it.
 */
export const FINISHED_LINES = [
  'Every set, done. Go be smug about it.',
  'All of them. Not bad.',
  'Full house. Phone survived.',
  'That’s the lot. Well held.',
  'Clean sweep. Go eat.',
  'Finished what you started. Rare, that.',
] as const;

/**
 * The line under "Called it early."
 *
 * Warm, never a jab. Someone looking at this screen already knows they stopped
 * short, and the app's job is to make sure they come back tomorrow rather than
 * to agree with them about it.
 */
export const CUT_SHORT_LINES = [
  'Still counts. It’s all banked.',
  'Something beats nothing, every time.',
  'A decision, not a failure.',
  'Banked what you did. Same time tomorrow?',
  'Short one. Still happened.',
  'Good enough is still in the bank.',
] as const;

/**
 * Shown when a workout pushes the best-ever streak past where it was.
 *
 * "Personal best" means exactly one thing in this app — the longest run of days
 * with a finished workout — because that is the only record it actually keeps.
 * Anything else would be congratulating a number nobody measured.
 */
export function personalBestLine(days: number): string {
  if (days === 1) {
    return 'First day on the board. Everything starts here.';
  }
  if (days === 2) {
    return 'Two in a row. That’s officially a habit forming.';
  }
  return `${days} days straight. That’s a new record.`;
}

/* -------------------------------------------------------------------------- */
/* The welcome                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Seen exactly once, on the first launch.
 *
 * It names the app because this is the one screen where the reader doesn't yet
 * know what they've opened, and the body describes the loop — lock, rest,
 * re-lock — rather than the problem, which anybody who downloaded this already
 * knows they have.
 */
export const WELCOME = {
  headline: 'Welcome to Liftlock.',
  subheadline: 'Your phone, locked away between sets.',
  body:
    'Pick a lift, hit start, and your scrolling apps shut off until the set is ' +
    'done. Rest earns them back. Then they lock again.',
  action: 'Let’s lift.',
} as const;

/* -------------------------------------------------------------------------- */
/* Insights                                                                   */
/* -------------------------------------------------------------------------- */

/** The account card, on the tab whose numbers an account is what preserves. */
export const SAVE_PROGRESS = {
  title: 'Save your progress',
  body:
    'An account keeps your streak, your records and every minute of focus in ' +
    'sync across your devices — and safe if you lose this one.',
  action: 'Sign in or create an account',
  /** Shown instead of the button until there is a project to sign in to. */
  setup:
    'Accounts need a Firebase project first. FIREBASE_SETUP.md walks through ' +
    'it — about ten minutes, and free.',
} as const;

export const EMPTY_CHART = 'Your week fills in as you train.';

export const EMPTY_RECORDS =
  'No records yet. Your first finished workout sets all of them.';

/**
 * Time saved, converted into something with a shape.
 *
 * Deliberately compares *this week* against a *lifetime* rate. The obvious
 * version — all-time focus divided by all-time focus-per-set — cancels down to
 * the set count you already have on screen, and would print your own number
 * back at you wearing a hat. Comparing a window to a rate is the only version
 * of this that carries information.
 */
export function extraSetsLine(sets: number): string {
  return sets === 1
    ? 'That’s about one more set at your usual pace.'
    : `That’s about ${sets} more sets at your usual pace.`;
}

/* -------------------------------------------------------------------------- */
/* Empty states                                                               */
/* -------------------------------------------------------------------------- */

export const EMPTY_EXERCISES = {
  title: 'Nothing here yet.',
  body:
    'Add the lifts you actually do. Each one keeps its own sets, rest and ' +
    'blocked apps.',
} as const;

/**
 * Streaks, with nothing to show until there's an account.
 *
 * Written out rather than built from a template with the subject slotted in.
 * The template read "Your all-time totals **is** saved to your account" — a
 * noun phrase substituted into a sentence that had already committed to being
 * singular. Insights has its own card now; this is the last one left.
 */
export const EMPTY_STREAKS = {
  title: 'No streak yet',
  body:
    'Your streak lives on your account. Make one in Settings and today can be ' +
    'day one.',
} as const;
