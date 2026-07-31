/**
 * One short line on the rest screen, picked fresh each rest period.
 *
 * Kept deliberately short — this sits under a countdown that is the actual
 * point of the screen, and anything longer than a few words competes with it.
 * The tone is dry rather than shouty: the app already took your phone away, so
 * it doesn't also need to yell.
 */
export const REST_LINES = [
  'One more rep.',
  'Earn your scroll.',
  'Discipline beats motivation.',
  'Rest is part of the work.',
  'Breathe. Then lift.',
  'This is the easy part.',
  'Strength is built between sets.',
  'Show up. Then show up again.',
  'The bar doesn’t care how you feel.',
  'Nobody regrets the set they did.',
] as const;

/** A random line. Call once per rest period, not once per render. */
export function pickRestLine(): string {
  return REST_LINES[Math.floor(Math.random() * REST_LINES.length)];
}
