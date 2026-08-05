/**
 * The two ladders on the Streaks tab.
 *
 * Pure arithmetic, so it gets pure tests. The reason this file exists at all is
 * that "how far along am I" looks like one line of division until it's measured
 * from the wrong end — and a progress bar that lies is worse than none, because
 * it lies confidently.
 */
import {
  CHALLENGE_RUNGS,
  nextRung,
  STREAK_MILESTONES,
} from '../src/cloud/milestones';

describe('nextRung', () => {
  it('starts on the first rung, measured from zero', () => {
    expect(nextRung(STREAK_MILESTONES, 0)).toEqual({
      target: 3,
      from: 0,
      remaining: 3,
      progress: 0,
    });
    expect(nextRung(STREAK_MILESTONES, 1)?.progress).toBeCloseTo(1 / 3);
    expect(nextRung(STREAK_MILESTONES, 2)?.remaining).toBe(1);
  });

  it('moves up the moment a rung is reached, not after', () => {
    // Landing exactly on 3 is clearing it. A ladder that kept 3 as the target
    // would show a full bar next to "0 more days", which reads as broken.
    const rung = nextRung(STREAK_MILESTONES, 3);
    expect(rung?.target).toBe(7);
    expect(rung?.remaining).toBe(4);
  });

  it('measures each leg from the rung just cleared', () => {
    // The whole point. Arriving at 100 must not hand you a bar to 200 that is
    // already half full before a single day of that leg has been done.
    const fresh = nextRung(STREAK_MILESTONES, 100);
    expect(fresh).toEqual({ target: 200, from: 100, remaining: 100, progress: 0 });

    expect(nextRung(STREAK_MILESTONES, 150)?.progress).toBeCloseTo(0.5);
  });

  it('has nothing left above the top rung', () => {
    expect(nextRung(STREAK_MILESTONES, 365)).toBeNull();
    expect(nextRung(STREAK_MILESTONES, 10_000)).toBeNull();
  });

  it('never returns a fraction outside 0 to 1, on either ladder', () => {
    for (const ladder of [STREAK_MILESTONES, CHALLENGE_RUNGS]) {
      for (let value = 0; value <= ladder[ladder.length - 1]; value++) {
        const rung = nextRung(ladder, value);
        if (rung) {
          expect(rung.progress).toBeGreaterThanOrEqual(0);
          expect(rung.progress).toBeLessThan(1);
          expect(rung.remaining).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('treats a fractional or negative count as the integer below it', () => {
    expect(nextRung(CHALLENGE_RUNGS, 2.9)?.remaining).toBe(1);
    expect(nextRung(CHALLENGE_RUNGS, -4)).toEqual(
      nextRung(CHALLENGE_RUNGS, 0),
    );
  });

  it('keeps both ladders strictly ascending', () => {
    // A rung out of order would silently become unreachable — `nextRung` walks
    // the array once and returns the first target above the count.
    for (const ladder of [STREAK_MILESTONES, CHALLENGE_RUNGS]) {
      for (let i = 1; i < ladder.length; i++) {
        expect(ladder[i]).toBeGreaterThan(ladder[i - 1]);
      }
    }
  });
});
