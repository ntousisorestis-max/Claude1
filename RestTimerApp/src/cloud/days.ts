/**
 * Days and streaks, as arithmetic.
 *
 * Every function here is pure and knows nothing about Firebase, React or the
 * workout. That is deliberate: streak logic is the kind of thing that looks
 * obviously right and is wrong at the edges — the day you cross a month
 * boundary, the day the clocks change, the workout you finish at 00:04 — and
 * the only way to be sure is to be able to test it directly.
 *
 * ## Why days are strings
 *
 * A day is `'2026-08-03'`, in the device's **local** time, not a timestamp.
 *
 * "Did I train today" is a question about the calendar on your wall, and the
 * only clock that knows which day that is, is the one in your pocket. A UTC
 * timestamp would tell an athlete in Auckland that their 9am Tuesday session
 * happened on Monday. So the device decides the day, writes it as the day
 * document's id, and the server stores what it's told.
 *
 * The cost of that choice, stated plainly: fly far enough east or west and you
 * can end up with two workouts on one local day, or a day that never happens.
 * Both are rare, both fail in the user's favour (a streak is preserved, not
 * broken), and the alternative — a fixed timezone per account — is worse for
 * everyone who doesn't travel.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day a moment falls on, as `YYYY-MM-DD`. */
export function dayKey(ms: number): string {
  const at = new Date(ms);
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/**
 * A day key back to a Date, anchored at local noon.
 *
 * Noon, not midnight. On the night the clocks go forward, local midnight in
 * some zones does not exist, and a Date built on it silently lands on the
 * previous or next day — which would show up as a broken streak twice a year.
 * Noon is twelve hours from either edge, so no DST shift can push it over.
 */
function atNoon(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** True for anything this module is willing to treat as a day. */
export function isDayKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** The day `delta` days after `key`. Handles month, year and DST boundaries. */
export function shiftDay(key: string, delta: number): string {
  const at = atNoon(key);
  at.setDate(at.getDate() + delta);
  return dayKey(at.getTime());
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysApart(from: string, to: string): number {
  const ms = atNoon(to).getTime() - atNoon(from).getTime();
  // Rounded, because a DST change makes one of these spans 23 or 25 hours.
  return Math.round(ms / 86_400_000);
}

/** The last `count` days ending at `today`, oldest first. */
export function recentDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftDay(today, i - (count - 1)));
}

/** Mon, Tue… for a day key, in the device's locale-independent short form. */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayOf(key: string): string {
  return WEEKDAYS[atNoon(key).getDay()];
}

/** What the streak fields on the account become after training on `day`. */
export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  /** The most recent day with at least one finished workout. */
  lastActiveDay: string | null;
};

export const NO_STREAK: StreakState = {
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDay: null,
};

/**
 * Folds one day's training into the stored streak.
 *
 * The four cases, in the order they're checked:
 *
 * - **The same day again.** A second workout today doesn't extend anything. The
 *   streak counts days trained, not workouts.
 * - **The next day.** Extends by one.
 * - **A gap.** Starts again at one — today still counts, so the answer is 1 and
 *   never 0.
 * - **Earlier than the last active day.** Left alone. This is a workout arriving
 *   out of order: a session that failed to sync yesterday and went up today, or
 *   a device whose clock is wrong. Rebuilding the streak properly would need
 *   every day ever recorded, and guessing would let a stale write shorten a
 *   streak the user actually earned.
 */
export function afterTrainingOn(state: StreakState, day: string): StreakState {
  const last = state.lastActiveDay;

  if (last == null) {
    return { currentStreak: 1, bestStreak: Math.max(state.bestStreak, 1), lastActiveDay: day };
  }

  const gap = daysApart(last, day);

  if (gap === 0) {
    return state;
  }
  if (gap < 0) {
    return state;
  }

  const currentStreak = gap === 1 ? state.currentStreak + 1 : 1;
  return {
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    lastActiveDay: day,
  };
}

/**
 * The streak as of right now, which is not the same as the stored number.
 *
 * A stored streak is only true as of the day it was written. Someone with a
 * 12-day streak who then trained nothing for a week still has `currentStreak:
 * 12` in the database — it is a record of what was, and rewriting it would need
 * a server that wakes up at midnight in every timezone to expire it.
 *
 * So the decay happens at read time, here, in exactly one place.
 *
 * Yesterday still counts. A streak isn't broken until a whole day has gone by
 * without training — otherwise everyone's streak would read zero every morning
 * until they got to the gym, which is both wrong and the most discouraging
 * possible moment to show it.
 */
export function streakToday(state: StreakState, today: string): number {
  if (state.lastActiveDay == null) {
    return 0;
  }
  const since = daysApart(state.lastActiveDay, today);
  // `since < 0` means the last active day is in the future — a clock that was
  // wrong then or is wrong now. Trust the stored streak rather than wiping it.
  return since <= 1 ? state.currentStreak : 0;
}

/** True when today has already been trained, so the UI can say so. */
export function trainedToday(state: StreakState, today: string): boolean {
  return state.lastActiveDay === today;
}
