/**
 * Steel graphite ground, chalk actions.
 *
 * The rule that holds the design together: **hue means lock state, nothing
 * else.** Amber is shielded, green is free, and no other element is allowed to
 * borrow either. Buttons and emphasis are chalk white, so the one thing you
 * need to read across a gym is the only coloured thing on screen.
 */
export const colors = {
  /** Grounds — cool graphite, not a default near-black. */
  bg: '#0D0F10',
  surface: '#15181A',
  surfaceAlt: '#1D2124',
  hairline: '#272C30',

  /** Type. */
  chalk: '#EEF2F3',
  muted: '#8A9298',
  faint: '#5D666C',

  /** State — the only hues in the app. */
  locked: '#F2A93B',
  free: '#58C98A',

  /** Reserved for leaving a workout early. */
  quit: '#E06B6B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 34,
} as const;

/** Squarer than the usual pill — this should read like equipment, not a card. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const HAIRLINE = 1;

/** Minimum comfortable tap target, mid-workout. */
export const TAP_TARGET = 56;

/** One scale, used everywhere. */
export const type = {
  display: { fontSize: 68, fontWeight: '700', letterSpacing: -2.5 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.7 },
  action: { fontSize: 19, fontWeight: '700', letterSpacing: 0.2 },
  body: { fontSize: 16, fontWeight: '500', letterSpacing: 0 },
  /** Uppercase micro-labels. Tracking does the work, not weight. */
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6 },
} as const;

/** Digits must not jitter as they count down. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

export function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** "3" -> "03". Set counters read as instrument digits. */
export function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}
