/**
 * Violet on charcoal-purple.
 *
 * The rule that holds it together: **colour is lock state.** Locked screens are
 * near-black with violet accents. The instant your apps unlock, the ground
 * floods violet and the content goes white.
 *
 * Why the flood uses a deeper violet than the buttons: a full screen of the
 * bright accent reads as loud, and black text on it only just clears contrast
 * minimums. The deeper tone with white content is calmer *and* more legible.
 *
 * The one deliberate exception to the rule is brand colour on the app icons —
 * those exist to tell TikTok from Instagram at a glance, a different job.
 */
export const colors = {
  /**
   * Elevation ramp. Four steps rather than one flat black, so a card reads as
   * sitting on the screen instead of being cut out of it. Each carries a
   * little violet in it, so the ground never looks like dead grey.
   */
  ink: '#0F0B1A', // the screen itself
  surface: '#17122A', // inputs, cards, unselected pills
  raised: '#201A38', // interactive surfaces sitting on a card
  hairline: '#2E2647', // borders and empty tick marks

  /**
   * Primary actions and selected states. **A fill, not an ink.**
   *
   * At 12–17px on any of this app's grounds it lands at 3.9–4.3:1, under the
   * 4.5:1 that WCAG AA wants for text that size — and the background glow costs
   * a little more on top. So it paints buttons, borders, ticks and the giant
   * set numeral; anything small and violet uses `accentText`.
   */
  accent: '#8B5CF6',
  /**
   * The same violet, lifted for small text. Clears 4.5:1 on every ground it
   * lands on — glowed ink, card surface and raised — with room to spare.
   */
  accentText: '#9E76F7',
  /** The full-screen "unlocked" ground, and the slab's extruded shadow. */
  accentDeep: '#6D42D9',
  /** Pressed/active tick — one step down from the accent. */
  accentDim: '#7048E8',
  accentWash: 'rgba(139, 92, 246, 0.12)',

  white: '#FFFFFF',
  /** Purple-leaning greys — a neutral grey next to violet reads as dirty. */
  mutedOnDark: '#A29BBC',
  /**
   * The de-emphasised tier. Lifted from #6C6489, which sat at 3.0–3.3:1 on this
   * app's grounds — under AA before the glow existed, and worse after. This
   * clears 4.5:1 everywhere while staying a clear step down from `mutedOnDark`,
   * which is the only job it has.
   */
  faintOnDark: '#8F88AA',

  /**
   * Content on the flooded violet ground.
   *
   * Raised from 0.76/0.52: the deep violet is a light ground by contrast
   * standards, and at the old alphas these sat at 4.2:1 and 2.8:1 — under AA
   * before the glow touched them, and further under after.
   */
  mutedOnAccent: 'rgba(255, 255, 255, 0.88)',
  faintOnAccent: 'rgba(255, 255, 255, 0.68)',

  danger: '#FF6B81',
} as const;

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
 */
export function describeSpan(totalSeconds: number): {
  value: string;
  unit: string;
} {
  const safe = Math.max(0, Math.round(totalSeconds));

  if (safe < 3600) {
    const minutes = Math.round(safe / 60);
    return { value: String(minutes), unit: minutes === 1 ? 'minute' : 'minutes' };
  }

  const hours = Math.floor(safe / 3600);
  const minutes = Math.round((safe % 3600) / 60);
  // 59m30s rounds to 60, which would render as "4h 60m".
  return minutes === 60
    ? { value: `${hours + 1}h`, unit: '' }
    : { value: minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`, unit: '' };
}
