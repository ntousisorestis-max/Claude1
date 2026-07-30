/**
 * Acid lime on black, and the screen flips when you're free.
 *
 * The rule from the last pass survives, just louder: **colour is lock state.**
 * Locked screens are near-black with lime on top. The instant your apps unlock,
 * the whole screen floods lime and the type goes black. Lights off, lights on —
 * you can read it from the other end of the gym without focusing.
 *
 * Violet is the only other colour and it never grounds a screen; it's reserved
 * for the payoff on the finish screen.
 */
export const colors = {
  /** Locked ground. */
  ink: '#0B0B0F',
  inkSoft: '#14141B',
  inkLine: '#272733',

  /** Free ground, and the hero colour on dark. */
  lime: '#D9FF3D',
  limeDim: '#A8C82A',

  /** Payoff only. Never a ground. */
  violet: '#7C4DFF',

  white: '#FFFFFF',
  mutedOnDark: '#8B8B9A',
  faintOnDark: '#55555F',
  /** Type on a lime ground. */
  mutedOnLime: 'rgba(11, 11, 15, 0.62)',
  faintOnLime: 'rgba(11, 11, 15, 0.42)',

  bail: '#FF5C5C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 34,
} as const;

/** Soft everywhere, pill where it's tappable. */
export const radius = {
  sm: 10,
  md: 16,
  lg: 26,
  pill: 999,
} as const;

export const HAIRLINE = 1;
export const TAP_TARGET = 60;

/** Big, tight, heavy. The numbers are the graphics. */
export const type = {
  mega: { fontSize: 92, fontWeight: '900', letterSpacing: -5 },
  display: { fontSize: 44, fontWeight: '900', letterSpacing: -1.8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.9 },
  action: { fontSize: 20, fontWeight: '800', letterSpacing: 0.4 },
  body: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
  /** Sticker-chip / micro-label text. */
  tag: { fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
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
