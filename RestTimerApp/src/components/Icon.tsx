import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * The line-icon set.
 *
 * Deliberately thin, open and monochrome: they sit beside labels as a hint at
 * what a row is about, not as decoration competing with it. Everything is
 * stroked on a 24-unit grid with round caps, so the whole set reads as one
 * hand — a mix of filled and outlined glyphs is what makes an app look like a
 * clip-art bin.
 *
 * The brand marks in `BrandIcon` are the deliberate exception: those are
 * somebody else's logos and have to look like themselves.
 */
export type IconName =
  | 'dumbbell'
  | 'reps'
  | 'timer'
  | 'phone'
  | 'bell'
  | 'trash'
  | 'clock'
  | 'check'
  | 'flame'
  | 'trophy'
  | 'lock'
  | 'play'
  | 'chevron'
  | 'speaker'
  | 'bellOff'
  | 'plus'
  | 'user'
  | 'signOut'
  | 'pencil'
  | 'shield';

/**
 * A stroke of a glyph. `w` multiplies the icon's stroke width for this stroke
 * alone — used only by the dumbbell, whose plates have to out-weigh its bar or
 * the whole thing reads as a capital H.
 */
type Stroke = string | { d: string; w?: number; fill?: boolean };

/** Each glyph is one or more strokes, drawn on a 0 0 24 24 grid. */
const PATHS: Record<IconName, Stroke[]> = {
  /**
   * The app's own mark, reduced to strokes. Marks anything that is a lift.
   *
   * Three strokes, not the logo's five: at 15px the outer collars are ~3px
   * tall and turn into specks, so the glyph read as noise.
   *
   * The plates are **filled** capsules rather than strokes — the one place in
   * the set that breaks the outline rule, and it earns it. At 15px a stroked
   * dumbbell is indistinguishable from a capital H however the proportions or
   * stroke weights are pushed; mass on the ends is the only thing that reads.
   */
  dumbbell: [
    { d: 'M6.3 8.7a1.7 1.7 0 0 1 3.4 0v6.6a1.7 1.7 0 0 1-3.4 0z', fill: true },
    { d: 'M14.3 8.7a1.7 1.7 0 0 1 3.4 0v6.6a1.7 1.7 0 0 1-3.4 0z', fill: true },
    { d: 'M9 12h6', w: 0.9 },
  ],
  /** Three rising bars — how many times you do it. */
  reps: ['M6 16v4', 'M12 11v9', 'M18 6v14'],
  /** A stopwatch: rest between sets. */
  timer: [
    'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    'M12 9.5V13l2.5 1.5',
    'M9.5 3h5',
  ],
  /** A handset — the thing being taken away, and given back. */
  phone: [
    'M7.5 2.5h9a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1.5-1.5z',
    'M10.5 18.5h3',
  ],
  bell: [
    'M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5z',
    'M13.7 20.5a2 2 0 0 1-3.4 0',
  ],
  trash: [
    'M3.5 6h17',
    'M9 6V3.5h6V6',
    'M18.5 6l-1 14.5h-11L5.5 6',
    'M10 10.5v6',
    'M14 10.5v6',
  ],
  clock: [
    'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19z',
    'M12 6.5V12l4 2.5',
  ],
  check: ['M21 11.2V12a9.5 9.5 0 1 1-5.6-8.7', 'M21.5 4.5 12 14.02l-2.8-2.8'],
  /** Focus time. Outer flame plus an inner one, so it reads at a glance. */
  flame: [
    // The kink where the two sides meet at the tip is what separates a flame
    // from a teardrop; a symmetrical curve reads as water every time.
    'M12 2.5c-.7 2.2-2 3.6-3.2 5-1.5 1.7-3.1 4.2-3.1 7.4a6.3 6.3 0 0 0 12.6 0c0-3.2-1.6-5.7-3.1-7.4-1.2-1.4-2.5-2.8-3.2-5z',
    'M12 13c-.4 1-1 1.6-1.6 2.3-.7.8-1.2 1.8-1.2 3a2.8 2.8 0 0 0 5.6 0c0-1.2-.5-2.2-1.2-3-.6-.7-1.2-1.3-1.6-2.3z',
  ],
  trophy: [
    'M7 4h10v4.5a5 5 0 0 1-10 0V4z',
    'M7 5.5H4.5V7a3.5 3.5 0 0 0 3.2 3.5',
    'M17 5.5h2.5V7a3.5 3.5 0 0 1-3.2 3.5',
    'M12 13.5v3.5',
    'M8.5 20.5h7',
  ],
  /** The static padlock for list rows. `LockGlyph` is the animated one. */
  lock: [
    'M7 10.5h10a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V12A1.5 1.5 0 0 1 7 10.5z',
    'M8.75 10.5V7.75a3.25 3.25 0 0 1 6.5 0v2.75',
  ],
  play: [{ d: 'M9.5 6.2v11.6L18.5 12z', fill: true }],
  chevron: ['m10 6 6 6-6 6'],
  /** A speaker with two waves — the sound the rest-over alert makes. */
  speaker: [
    'M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z',
    'M15.4 9.6a3.4 3.4 0 0 1 0 4.8',
    'M18 7a7 7 0 0 1 0 10',
  ],
  /** The same bell, struck through: alerts still arrive, just quietly. */
  bellOff: [
    'M9.6 3.7A6 6 0 0 1 18 8.5c0 3 .5 5.1 1.1 6.5',
    'M6.1 6.4A6 6 0 0 0 6 8.5c0 6.5-2.5 8.5-2.5 8.5h12.4',
    'M13.7 20.5a2 2 0 0 1-3.4 0',
    'M3.5 3.5l17 17',
  ],
  plus: ['M12 5.5v13', 'M5.5 12h13'],
  /**
   * A pencil, for renaming.
   *
   * Its own glyph rather than reusing the dumbbell that marks the card: at row
   * size the dumbbell reads as a capital H, which is exactly the complaint that
   * got it redrawn as filled capsules in the first place. One more path is
   * cheaper than a row that looks like it is labelled "H".
   */
  pencil: [
    'M5 19h3.6L20.2 7.4a2.55 2.55 0 0 0-3.6-3.6L5 15.4z',
    'M15.1 5.3l3.6 3.6',
  ],
  /**
   * A shield. Marks the promise that nothing is taken without being chosen.
   *
   * One outline, no check or padlock inside it: it is used at 14px beside a
   * single line of small text, and a second path in there turns to mush at that
   * size. The word next to it is doing the explaining anyway.
   */
  shield: [
    'M12 2.6l7.5 2.8v6.1c0 4.6-3.1 8.2-7.5 9.9-4.4-1.7-7.5-5.3-7.5-9.9V5.4z',
  ],
  /** Head and shoulders — an account, and eventually a leaderboard row. */
  user: [
    'M12 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M4.5 20.5a7.5 7.5 0 0 1 15 0',
  ],
  /**
   * Out through a door. The arrow points left, away from the frame: the same
   * glyph mirrored is universally read as signing *in*, so the direction is the
   * whole meaning here.
   */
  signOut: [
    'M14 3.5h4.5A1.5 1.5 0 0 1 20 5v14a1.5 1.5 0 0 1-1.5 1.5H14',
    'M9.5 8 5.5 12l4 4',
    'M5.5 12H15',
  ],
};

export function Icon({
  name,
  color,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    // Decorative throughout: every icon in this app sits next to the words it
    // illustrates, so announcing it too would just repeat them.
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {PATHS[name].map(stroke => {
        const part = typeof stroke === 'string' ? { d: stroke } : stroke;
        return (
          <Path
            key={part.d}
            d={part.d}
            stroke={part.fill ? 'none' : color}
            strokeWidth={strokeWidth * (part.w ?? 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={part.fill ? color : 'none'}
          />
        );
      })}
    </Svg>
  );
}
