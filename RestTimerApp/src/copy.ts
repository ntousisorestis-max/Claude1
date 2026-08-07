/**
 * The app's voice, in one file.
 *
 * Tone: a training partner who has been doing this a while. Dry, confident,
 * occasionally taking the piss — never a mascot, never an exclamation mark it
 * hasn't earned, never a pun. The app has already taken the user's phone away;
 * it does not also need to shout, and it definitely doesn't need to be cute
 * about it.
 *
 * (The one import is a type. Nothing here reaches into a component — the
 * welcome's feature rows just name an icon each, and this keeps a typo in one
 * of those names a compile error rather than a blank square.)
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

import type { IconName } from './components/Icon';

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
 * know what they've opened, and it describes the loop — lock, rest, re-lock —
 * rather than the problem, which anybody who downloaded this already knows they
 * have.
 *
 * ## Written in the present tense, for an app that doesn't do it yet
 *
 * "Apps lock automatically" is a promise Phase 1 can't keep: the blocking is
 * simulated until the Screen Time entitlement lands. This screen still says it
 * plainly, because a welcome hedged into "will eventually sort of" describes
 * nothing, and the honest version of the caveat already exists where somebody
 * can act on it — the note under the app list in Settings. One line explaining
 * the product, one line admitting the state of the build, in the two places
 * each belongs.
 *
 * ## The split strings
 *
 * `name` and `subheadline` are broken up so half of each can be violet. They
 * are pieces of one sentence, not separate lines: keep the spaces at the seams.
 */
export const WELCOME = {
  eyebrow: 'Hey, welcome to',
  /** The wordmark. `lock` and its full stop carry the accent. */
  name: { lead: 'Lift', accent: 'lock.' },
  subheadline: {
    lead:
      'Your rest time is your phone time. We lock the noise while you work, ' +
      'so you can focus on ',
    accent: 'lifting more',
    tail: ' and scrolling less.',
  },
  /**
   * Three rows: what you get, what the app does, what it adds up to. In that
   * order, because the first one is the part nobody expects — this is not
   * another app that takes your phone away and leaves it there.
   */
  features: [
    {
      icon: 'timer',
      title: 'Use your rest time',
      body: 'Rest is yours. Scroll all you like — it’s on a timer.',
    },
    {
      icon: 'lock',
      title: 'Apps lock automatically',
      body: 'When rest is up, the noise goes away again.',
    },
    {
      // The flame, not the dumbbell that marks a lift everywhere else: on a
      // filled tile at this size the dumbbell's plates lose against their own
      // bar and the glyph reads as a capital H — the exact complaint that got
      // it redrawn once already. The flame is this app's focus-time mark, and
      // "watch the time add up" is what this row is about anyway.
      icon: 'flame',
      title: 'Lift more. Scroll less.',
      body: 'Show up, bank the sets, watch the time add up.',
    },
  ],
  action: 'Let’s lift.',
  /** The last thing read before the tap. Nothing is taken, only lent out. */
  reassurance: 'You’re in control. You choose what gets locked.',
} as const satisfies {
  eyebrow: string;
  name: { lead: string; accent: string };
  subheadline: { lead: string; accent: string; tail: string };
  features: readonly { icon: IconName; title: string; body: string }[];
  action: string;
  reassurance: string;
};

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
/* Streaks                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The consistency tab.
 *
 * The rule this whole screen is written against: **never make a missed day into
 * a telling-off.** Somebody looking at a broken streak already knows. Every line
 * below that could have been a jab is a door back in instead, and the shield
 * card states the rule flatly rather than dressing a loss up as a lesson.
 *
 * The other rule is the app's usual one — nothing here promises a mechanic that
 * doesn't exist. There is no freeze, no rest day, no pass, so the card says so
 * in as many words rather than leaving a gap somebody fills in hopefully.
 */
export const STREAKS = {
  /** Under the ring. Four states of the same integer, and they're not alike. */
  ring: {
    none: 'Nothing running yet. Finish a workout today and that’s day one.',
    open: 'Still alive. One workout today and it stays that way.',
    firstDay: 'Day one, done. The hard part is tomorrow.',
    banked: 'Today’s in the bank. Nothing left to prove.',
  },
  milestone: {
    label: 'NEXT MILESTONE',
    bestLabel: 'BEST EVER',
    /** Before there is a best to show. Not "0 days". */
    noBest: 'No best yet',
    /** Past the top rung. Rare, and it should feel like it. */
    done: 'You’re past every milestone there is. Genuinely — that’s the lot.',
  },
  challenge: {
    label: 'CHALLENGE',
    title: 'Finish what you start',
    body:
      'Workouts where you banked every set you planned. Ending one early ' +
      'costs you nothing — it just doesn’t count toward this.',
    /** Sits under the bar at zero, where "0 of 3" alone reads as a locked door. */
    empty: 'Finish every set you planned, three times over.',
    /**
     * Past the top rung.
     *
     * Its own line because the alternative is a bar reading "140 of 140" — a
     * tautology under a full bar, which looks like a placeholder rather than
     * like having finished the thing.
     */
    done: (count: number) =>
      `Every rung of this one is behind you — ${count} workouts, every ` +
      'planned set banked.',
  },
  shield: {
    title: 'One missed day ends it',
    body:
      'A streak breaks when a whole calendar day goes by with no finished ' +
      'workout. Any workout protects it — one set counts. There’s no freeze, ' +
      'no rest day and no way to buy it back.',
  },
  footer: 'Nobody’s watching. That’s rather the point.',
} as const;

/* -------------------------------------------------------------------------- */
/* Appearance                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The theme picker.
 *
 * No opinion offered about which is better. It's a preference, and a line
 * nudging somebody toward the dark one would be the app being precious about
 * itself.
 */
export const APPEARANCE = {
  title: 'Appearance',
  description: 'Light or dark. System follows your phone.',
  options: { system: 'System', light: 'Light', dark: 'Dark' },
} as const;

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
