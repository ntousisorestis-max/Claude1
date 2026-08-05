/**
 * Ladders: the next number worth reaching, and how far along you are.
 *
 * Pure arithmetic over two constant arrays, with no imports — same shape as
 * days.ts and for the same reason. The Streaks tab's two progress bars are the
 * only thing in the app that turns a plain count into "you are 40% of the way
 * somewhere", and that conversion is exactly the kind of thing that is obvious
 * until it is off by one in front of a user. It gets its own file and its own
 * tests rather than being four lines inside a component.
 */

/**
 * Streak milestones, in days.
 *
 * Three is the first: it means a weekend was survived, which is the first
 * evidence a streak isn't just one good Monday. Seven is a week. Fourteen is
 * where showing up stops being a decision each morning. Then a month.
 *
 * The gaps roughly double from there, which is the actual rule — 30 straight to
 * 100 leaves seventy days where the bar moves under one and a half percent a
 * session, and a card that looks frozen for two months is worse than no card at
 * the exact point somebody is doing well.
 *
 * It ends at a year. There is no 500, because inventing rungs beyond the top
 * one anybody has reached is filler; past 365 the card says so instead.
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365] as const;

/**
 * The challenge ladder: workouts finished without leaving a set on the table.
 *
 * Shorter and flatter than the streak's. A streak is one a day and paced by the
 * calendar; this is paced by how often somebody trains, so the same doubling
 * would put the third rung a year away.
 */
export const CHALLENGE_RUNGS = [3, 5, 10, 25, 50, 100] as const;

/** Where a count sits on a ladder. `null` means every rung is behind them. */
export type Rung = {
  /** The number being worked toward. */
  target: number;
  /** The rung just cleared — where this leg started. Zero for the first. */
  from: number;
  /** How many more are needed. Always at least 1. */
  remaining: number;
  /** 0–1 across *this leg* of the ladder, for a progress bar. */
  progress: number;
};

/**
 * The next rung above `value`, or `null` when there isn't one.
 *
 * ## Why the bar measures the leg and not the whole ladder
 *
 * Progress runs from the rung just cleared to the next one, not from zero. On a
 * ladder where the gaps double, measuring from zero means arriving at 100 with
 * the bar to 200 already half full — the leg is handed to you at 50% before a
 * single day of it has been done, and then crawls. Per-leg, every milestone
 * starts empty and fills at a rate you can feel.
 */
export function nextRung(ladder: readonly number[], value: number): Rung | null {
  const count = Math.max(0, Math.floor(value));

  for (let i = 0; i < ladder.length; i++) {
    const target = ladder[i];
    if (count < target) {
      // `from` is never above `count`: the loop only reaches rung `i` because
      // `count` was not below rung `i - 1`. So the leg is always non-empty and
      // the fraction is always in range, with no clamping needed.
      const from = i === 0 ? 0 : ladder[i - 1];
      return {
        target,
        from,
        remaining: target - count,
        progress: (count - from) / (target - from),
      };
    }
  }
  return null;
}
