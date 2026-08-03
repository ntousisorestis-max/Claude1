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
  'Discipline beats motivation.',
  'Rest is part of the work.',
  'Breathe. Then lift.',
  'This is the easy part.',
  'Strength is built between sets.',
  'Show up. Then show up again.',
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
  'Barely sat down.',
  'The timer had plans for you.',
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
  (set: number, total: number) => `Back to it — set ${set} of ${total} is ready.`,
  (set: number, total: number) => `Phone down. Set ${set} of ${total}.`,
  (set: number, total: number) => `That’s your lot. Set ${set} of ${total}.`,
  (set: number, total: number) => `Time’s up — set ${set} of ${total} is waiting.`,
  (set: number, total: number) => `Rest over. Set ${set} of ${total}, let’s go.`,
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
  'Full house. Your phone missed you.',
  'That’s the whole thing. Nicely done.',
  'Clean sweep. Enjoy the walk home.',
  'Finished what you started. Rare.',
] as const;

/**
 * The line under "Called it early."
 *
 * Warm, never a jab. Someone looking at this screen already knows they stopped
 * short, and the app's job is to make sure they come back tomorrow rather than
 * to agree with them about it.
 */
export const CUT_SHORT_LINES = [
  'Still counts. Everything you did is banked.',
  'Something beats nothing, every time.',
  'Called it. That’s a decision, not a failure.',
  'Banked what you did. Same time tomorrow?',
  'Short one. The sets you did still happened.',
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
/* Empty states                                                               */
/* -------------------------------------------------------------------------- */

export const EMPTY_EXERCISES = {
  title: 'Nothing saved yet.',
  body:
    'Add the lifts you actually do. Each one keeps its own sets, rest and list ' +
    'of apps to lock away — so leg day and arm day can disagree about how long ' +
    'you need.',
} as const;

export const EMPTY_STREAK = {
  title: 'No streak yet.',
  body: 'Finish one workout today and you’re on the board.',
} as const;
