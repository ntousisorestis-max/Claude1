/**
 * Acid lime on black, and the screen flips when you're free.
 *
 * The rule that holds it together: **colour is lock state.** Locked screens are
 * near-black with lime on top. The instant your apps unlock, the whole screen
 * floods lime and the type goes black.
 *
 * The one deliberate exception is brand colour on the app icons — those exist
 * to identify TikTok from Instagram at a glance, which is a different job.
 */
export const colors = {
  /**
   * Elevation ramp. Four steps rather than a single flat black, so a card
   * reads as sitting on the screen instead of being cut out of it. Each step
   * is a visible jump; anything subtler disappears under gym lighting.
   */
  ink: '#0A0A0E', // the screen itself
  surface: '#13131A', // inputs, cards, unselected pills
  raised: '#1C1C26', // interactive surfaces sitting on a card
  hairline: '#2A2A36', // borders and empty tick marks

  /** Free ground, and the hero colour on dark. */
  lime: '#D9FF3D',
  limeDim: '#A8C82A',
  /** Lime at low alpha, for glows and tinted fills. */
  limeGlow: 'rgba(217, 255, 61, 0.45)',
  limeWash: 'rgba(217, 255, 61, 0.10)',

  white: '#FFFFFF',
  mutedOnDark: '#9494A4',
  faintOnDark: '#5E5E6C',
  /** Type on a lime ground. */
  mutedOnLime: 'rgba(10, 10, 14, 0.66)',
  faintOnLime: 'rgba(10, 10, 14, 0.45)',

  danger: '#FF5C5C',
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
