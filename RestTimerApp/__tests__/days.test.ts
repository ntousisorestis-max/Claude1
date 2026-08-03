/**
 * The streak arithmetic, at the edges where it actually breaks.
 *
 * Pure functions, so these are cheap — which is the point of having pulled the
 * logic out of the backend in the first place.
 */
import {
  afterTrainingOn,
  dayKey,
  daysApart,
  isDayKey,
  NO_STREAK,
  recentDays,
  shiftDay,
  streakToday,
  trainedToday,
  weekdayOf,
  type StreakState,
} from '../src/cloud/days';

/** Local noon on a given date, which is what dayKey is asked about. */
const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

describe('day keys', () => {
  it('uses the local calendar day, not UTC', () => {
    expect(dayKey(noon(2026, 8, 3))).toBe('2026-08-03');
    // 00:04 local is still today, however far from UTC midnight that is.
    expect(dayKey(new Date(2026, 7, 3, 0, 4).getTime())).toBe('2026-08-03');
    // And 23:58 has not become tomorrow.
    expect(dayKey(new Date(2026, 7, 3, 23, 58).getTime())).toBe('2026-08-03');
  });

  it('pads months and days', () => {
    expect(dayKey(noon(2026, 1, 9))).toBe('2026-01-09');
  });

  it('recognises its own format and rejects anything else', () => {
    expect(isDayKey('2026-08-03')).toBe(true);
    expect(isDayKey('2026-8-3')).toBe(false);
    expect(isDayKey(20260803)).toBe(false);
    expect(isDayKey(null)).toBe(false);
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftDay('2026-08-31', 1)).toBe('2026-09-01');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    // A leap year, because February is where naive date maths dies.
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDay('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('measures whole days in both directions', () => {
    expect(daysApart('2026-08-03', '2026-08-04')).toBe(1);
    expect(daysApart('2026-08-03', '2026-08-03')).toBe(0);
    expect(daysApart('2026-08-04', '2026-08-03')).toBe(-1);
    expect(daysApart('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('spans a daylight-saving change without gaining or losing a day', () => {
    // The UK springs forward on 2026-03-29 and back on 2026-10-25. Anchoring
    // at noon is what keeps these exact; at midnight one of them is off by one.
    expect(daysApart('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysApart('2026-10-24', '2026-10-26')).toBe(2);
    expect(shiftDay('2026-03-28', 1)).toBe('2026-03-29');
    expect(shiftDay('2026-10-24', 1)).toBe('2026-10-25');
  });

  it('lists the last seven days oldest first, ending today', () => {
    const week = recentDays('2026-08-03', 7);
    expect(week).toHaveLength(7);
    expect(week[6]).toBe('2026-08-03');
    expect(week[0]).toBe('2026-07-28');
  });

  it('names weekdays', () => {
    // 2026-08-03 is a Monday.
    expect(weekdayOf('2026-08-03')).toBe('Mon');
    expect(weekdayOf('2026-08-09')).toBe('Sun');
  });
});

describe('building a streak', () => {
  const on = (state: StreakState, ...days: string[]) =>
    days.reduce(afterTrainingOn, state);

  it('starts at one', () => {
    expect(afterTrainingOn(NO_STREAK, '2026-08-03')).toEqual({
      currentStreak: 1,
      bestStreak: 1,
      lastActiveDay: '2026-08-03',
    });
  });

  it('extends on consecutive days', () => {
    const state = on(NO_STREAK, '2026-08-03', '2026-08-04', '2026-08-05');
    expect(state.currentStreak).toBe(3);
    expect(state.bestStreak).toBe(3);
  });

  it('counts days trained, not workouts — a second one today changes nothing', () => {
    const once = afterTrainingOn(NO_STREAK, '2026-08-03');
    const twice = afterTrainingOn(once, '2026-08-03');
    expect(twice).toEqual(once);
  });

  it('restarts at one after a gap, and remembers the best', () => {
    const built = on(NO_STREAK, '2026-08-01', '2026-08-02', '2026-08-03');
    const afterGap = afterTrainingOn(built, '2026-08-06');
    expect(afterGap.currentStreak).toBe(1);
    expect(afterGap.bestStreak).toBe(3);
  });

  it('ignores a workout that arrives out of order', () => {
    // Yesterday's session finally syncing today must not rewind the streak.
    const built = on(NO_STREAK, '2026-08-03', '2026-08-04');
    expect(afterTrainingOn(built, '2026-08-02')).toEqual(built);
  });

  it('carries the streak across a month boundary', () => {
    const state = on(NO_STREAK, '2026-08-30', '2026-08-31', '2026-09-01');
    expect(state.currentStreak).toBe(3);
  });
});

describe('reading a streak back', () => {
  const state: StreakState = {
    currentStreak: 12,
    bestStreak: 20,
    lastActiveDay: '2026-08-03',
  };

  it('stands on the day it was earned', () => {
    expect(streakToday(state, '2026-08-03')).toBe(12);
    expect(trainedToday(state, '2026-08-03')).toBe(true);
  });

  it('still stands the next morning, before you have trained', () => {
    // The whole point: nobody should be told their streak is zero at breakfast.
    expect(streakToday(state, '2026-08-04')).toBe(12);
    expect(trainedToday(state, '2026-08-04')).toBe(false);
  });

  it('is gone once a whole day has been missed', () => {
    expect(streakToday(state, '2026-08-05')).toBe(0);
    expect(streakToday(state, '2026-09-01')).toBe(0);
  });

  it('is zero for an account that has never trained', () => {
    expect(streakToday(NO_STREAK, '2026-08-03')).toBe(0);
  });

  it('does not wipe a streak when the clock says the future', () => {
    expect(streakToday(state, '2026-08-01')).toBe(12);
  });
});
