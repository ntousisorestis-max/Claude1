/**
 * Everything visual that is *not* a colour: the type scale, the spacing ramp,
 * the corner radii, and the formatters that turn numbers into things a person
 * reads.
 *
 * None of it changes between light and dark, which is why it lives apart from
 * the palettes. See ./palettes.ts for the colours and ./ThemeContext.tsx for
 * how a component gets hold of them.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  /** Between major sections — this is what makes the screens breathe. */
  xxl: 44,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 26,
  pill: 999,
} as const;

export const HAIRLINE = 1;
export const TAP_TARGET = 60;

/**
 * One scale. Weight carries the hierarchy: 800–900 for headlines and numbers,
 * 500 for body, 400 for anything secondary. Nothing in between competes.
 */
export const type = {
  mega: { fontSize: 92, fontWeight: '900', letterSpacing: -5 },
  display: { fontSize: 44, fontWeight: '900', letterSpacing: -1.8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  action: { fontSize: 20, fontWeight: '800', letterSpacing: 0.4 },
  /** Primary reading text. */
  body: { fontSize: 16, fontWeight: '500', letterSpacing: -0.1 },
  /** Secondary — help, notes, hints. Deliberately lighter than body. */
  helper: { fontSize: 15, fontWeight: '400', letterSpacing: 0 },
  /** Uppercase micro-labels. Tracking does the work, not weight. */
  tag: { fontSize: 12, fontWeight: '700', letterSpacing: 1.3 },
} as const;

/**
 * Re-sizes one of the scale's steps, carrying its tracking with it.
 *
 * The tracking above is written in pixels but *means* a proportion of the size:
 * `mega`'s -5 is -5.4% of 92px. Spreading `...type.mega` and overriding only
 * `fontSize` therefore keeps tracking meant for a much larger face — at 52px
 * that same -5px is -9.6%, which is enough to shove the two l's of "Called"
 * into each other.
 *
 * So don't do that. Use this instead:
 *
 * ```ts
 * headline: { ...sized(type.mega, 52), color: colors.white }
 * ```
 *
 * It reads the ratio off the token, so a change to the scale flows through to
 * everything derived from it.
 */
export function sized<T extends { fontSize: number; letterSpacing: number }>(
  scale: T,
  fontSize: number,
): T {
  return {
    ...scale,
    fontSize,
    letterSpacing: (scale.letterSpacing / scale.fontSize) * fontSize,
  };
}

/** Digits must not jitter as they count down. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

export function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** "3" -> "03". */
export function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

/**
 * A duration in the largest unit that doesn't lie about it.
 *
 * Returns the parts separately so the number can be counted up on its own
 * while its unit sits still — animating "14 minutes" as one string would mean
 * the word jittering in and out of the plural.
 *
 * Under a minute stays in seconds: "0 minutes" is a worse thing to show
 * someone at the end of a workout than "40 seconds".
 */
export function describeDuration(totalSeconds: number): {
  value: number;
  unit: string;
} {
  const safe = Math.max(0, Math.round(totalSeconds));
  if (safe < 60) {
    return { value: safe, unit: safe === 1 ? 'second' : 'seconds' };
  }
  const minutes = Math.round(safe / 60);
  return { value: minutes, unit: minutes === 1 ? 'minute' : 'minutes' };
}

/**
 * The same idea for spans that have had months to accumulate.
 *
 * `describeDuration` tops out at minutes, which is right for one workout and
 * absurd for a lifetime total — nobody reads "14,208 minutes" as an amount of
 * time. Past an hour this switches to `4h 12m`, letters and all, so the value
 * carries its own unit and the caller leaves `unit` off.
 *
 * Kept separate rather than folded into `describeDuration` because that one
 * feeds a count-up animation on the complete screen, which needs a number it
 * can tween. This returns a string on purpose.
 *
 * ## Under a minute it says seconds
 *
 * It used to round everything to whole minutes, which turned eleven seconds of
 * real focus time into a screen reading "0 minutes" next to "3 workouts done".
 * That is arithmetically correct and reads as broken, which is worse than
 * either — an honest zero is fine, a zero that isn't one is not. Anything under
 * a minute now reports the seconds it actually measured.
 */
export function describeSpan(totalSeconds: number): {
  value: string;
  unit: string;
} {
  const safe = Math.max(0, Math.round(totalSeconds));

  if (safe < 60) {
    return { value: String(safe), unit: safe === 1 ? 'second' : 'seconds' };
  }

  if (safe < 3600) {
    const minutes = Math.round(safe / 60);
    // 59m30s rounds to 60, which would render as "60 minutes" — the same
    // wrongness the hour branch below already guards against.
    return minutes === 60
      ? { value: '1h', unit: '' }
      : {
          value: String(minutes),
          unit: minutes === 1 ? 'minute' : 'minutes',
        };
  }

  const hours = Math.floor(safe / 3600);
  const minutes = Math.round((safe % 3600) / 60);
  // 59m30s rounds to 60, which would render as "4h 60m".
  return minutes === 60
    ? { value: `${hours + 1}h`, unit: '' }
    : {
        value: minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`,
        unit: '',
      };
}
