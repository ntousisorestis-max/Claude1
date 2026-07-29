/**
 * Dark-first palette. Gym lighting is bad and hands are sweaty: high contrast,
 * big type, big tap targets.
 */
export const colors = {
  bg: '#0B0D10',
  surface: '#161A20',
  surfaceAlt: '#1F252E',
  border: '#2A323D',
  text: '#F2F5F8',
  textMuted: '#8D98A7',
  accent: '#4ADE80', // go / rest / unlocked
  accentDark: '#166534',
  danger: '#F87171',
  locked: '#F59E0B', // shield on
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  md: 12,
  lg: 20,
  pill: 999,
};

/** Minimum comfortable tap target, mid-workout. */
export const TAP_TARGET = 56;

export function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
