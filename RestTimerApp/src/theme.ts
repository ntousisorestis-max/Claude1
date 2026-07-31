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

  /** Primary actions and selected states. */
  accent: '#8B5CF6',
  /** The full-screen "unlocked" ground, and the slab's extruded shadow. */
  accentDeep: '#6D42D9',
  /** Pressed/active tick — one step down from the accent. */
  accentDim: '#7048E8',
  accentWash: 'rgba(139, 92, 246, 0.12)',

  white: '#FFFFFF',
  /** Purple-leaning greys — a neutral grey next to violet reads as dirty. */
  mutedOnDark: '#A29BBC',
  faintOnDark: '#6C6489',

  /** Content on the flooded violet ground. */
  mutedOnAccent: 'rgba(255, 255, 255, 0.76)',
  faintOnAccent: 'rgba(255, 255, 255, 0.52)',

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
