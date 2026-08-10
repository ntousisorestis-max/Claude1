/**
 * The two palettes.
 *
 * ## The rule both of them serve
 *
 * **Colour is lock state.** A screen whose ground is the app's own — near-black
 * in dark, near-white in light — means your apps are locked. The instant they
 * unlock, the ground floods violet and the content goes white.
 *
 * ## Why the flood is identical in both themes
 *
 * `accentDeep` and everything drawn on it (`white`, `mutedOnAccent`,
 * `faintOnAccent`) are the same in light and dark, deliberately. The flood has
 * to read as the *dramatic* change; lightening it to suit a light theme would
 * make it one more pale screen among pale screens, and the one colour rule that
 * carries meaning would quietly stop working.
 *
 * The happy consequence: the resting screen is identical in both themes. The
 * one screen anybody looks at mid-set never changes character, and every
 * component that only ever sits on the flood — `SetTicks`, `LockStatus`,
 * `RestingScreen` — needs no theme work at all.
 *
 * ## Why light is not dark with the numbers flipped
 *
 * Two things invert and one doesn't.
 *
 * **The elevation ramp inverts, but not symmetrically.** On dark it climbs away
 * from the ground — ink, surface, raised — because a card lighter than the page
 * reads as nearer. On light you cannot climb past white, so the page is the
 * off-white and the cards are pure white, with borders doing more of the work
 * than brightness does.
 *
 * **The greys and the violet have to go the other way.** `muted`, `faint`,
 * `accentText` and `danger` were all *lifted* to clear AA on a dark ground. On
 * near-white the identical values land at 2.4:1, 3.1:1, 3.0:1 and 2.5:1 —
 * every one a failure. Light's versions are darker, not lighter.
 *
 * **`accent` does not move.** It is the brand, it is only ever a fill behind
 * white text or a stroke, and white-on-`accent` measures the same 4.23:1 on any
 * ground. Moving it per theme would mean two different violets in one app.
 *
 * Everything here is checked by `npm run contrast`, against both palettes.
 */

export type Palette = {
  /* --- The ground and what sits on it ---------------------------------- */
  /** The screen itself. */
  ink: string;
  /** Inputs, cards, unselected pills. */
  surface: string;
  /** Interactive surfaces sitting on a card. */
  raised: string;
  /**
   * A translucent card — `surface` at reduced opacity, so whatever is behind
   * it shows through instead of being covered. See `GlassCard`; nothing else
   * uses this.
   */
  glass: string;
  /** Borders and empty tick marks. */
  hairline: string;

  /* --- Violet ----------------------------------------------------------- */
  /**
   * Primary actions and selected states. **A fill, not an ink.**
   *
   * Under 4.5:1 on both grounds at body size, so it paints buttons, borders,
   * ticks and the giant set numeral. Anything small and violet uses
   * `accentText`.
   */
  accent: string;
  /** The same violet, moved until small text on it clears AA. */
  accentText: string;
  /** The full-screen "unlocked" ground, and the slab's extruded shadow. */
  accentDeep: string;
  /** Pressed/active tick — one step from the accent. */
  accentDim: string;
  /** The faint violet behind icon tiles. Needs more weight on a light ground. */
  accentWash: string;

  /* --- Text ------------------------------------------------------------- */
  /** Headlines and anything that has to be read first. */
  white: string;
  /** Body, help, secondary lines. */
  muted: string;
  /** The de-emphasised tier — notes, micro-labels. */
  faint: string;

  /**
   * Content on violet — the flood, a button, a filled tile, a selected pill.
   *
   * **Not `white`.** `white` means "the strongest text colour on this theme's
   * ground", which on a light page is near-black. Violet fills don't change
   * between themes, so what sits on them mustn't either: using `white` for a
   * button label gives you dark text on a violet button the moment somebody
   * switches to light mode.
   */
  textOnAccent: string;
  mutedOnAccent: string;
  faintOnAccent: string;
  /** The lit edge of a violet object. See ON_ACCENT. */
  accentLit: string;
  /** A specular highlight on one. */
  specular: string;

  /* --- Meaning ---------------------------------------------------------- */
  danger: string;
  /** The tint behind a destructive row or an error. */
  dangerWash: string;

  /* --- Surfaces that were hardcoded before ------------------------------ */
  /** Behind a modal. Dark in both themes: a scrim is a shadow, not a surface. */
  scrim: string;
  /** The dark disc the gradient button's chevron sits in. */
  discOnAccent: string;
  /** Drop shadows. Violet on dark, where it reads as a glow; black on light. */
  shadow: string;
  /** How strongly `shadow` prints. A violet glow needs more than a real one. */
  shadowOpacity: number;
  /**
   * The slab's cast shadow — a real one, not a glow.
   *
   * Separate from `shadow` because the two do different jobs: `shadow` lifts a
   * button off the page, this one puts weight under the one control you hit
   * without looking. On a light ground a black shadow is still the right
   * answer; it just needs to be softer.
   */
  dropShadow: string;
  /**
   * The night the hourglass keeps.
   *
   * The Workout tab's illustration is a render of a dark scene, so on a light
   * ground it can only ever be a smudge — feathering controls where a picture
   * stops, not that it is dark. In light mode it sits on a tile of this
   * instead. In dark mode this is the ground, so the tile disappears.
   */
  stage: string;

  /* --- The background glow ---------------------------------------------- */
  /** What the two blooms are made of. */
  glow: string;
  /** Peak opacity of the main bloom, over this theme's ground. */
  glowPeak: number;
  /** The second, smaller bloom. */
  glowSecondPeak: number;
};

/**
 * Colours that belong to violet objects rather than to a ground.
 *
 * The flood, the content drawn on it, and the shading on the violet dumbbell
 * are all the same in both themes for one reason: they are lit surfaces, not
 * backgrounds. A highlight on a violet plate is the same highlight whichever
 * page the plate is sitting on.
 */
const ON_ACCENT = {
  accentDeep: '#6D42D9',
  textOnAccent: '#FFFFFF',
  /** The lit edge of a violet object, where the light lands first. */
  accentLit: '#C4A5FF',
  /** A specular highlight. Always white; the opacity does the work. */
  specular: '#FFFFFF',
  mutedOnAccent: 'rgba(255, 255, 255, 0.88)',
  faintOnAccent: 'rgba(255, 255, 255, 0.68)',
  discOnAccent: 'rgba(11, 6, 24, 0.55)',
  scrim: 'rgba(6, 4, 12, 0.78)',
} as const;

export const dark: Palette = {
  ...ON_ACCENT,

  ink: '#0F0B1A',
  surface: '#17122A',
  raised: '#201A38',
  /** `surface`'s own rgb, at 0.65 — see `npm run contrast` for why not lower. */
  glass: 'rgba(23, 18, 42, 0.65)',
  hairline: '#2E2647',

  accent: '#8B5CF6',
  accentText: '#9E76F7',
  accentDim: '#7048E8',
  accentWash: 'rgba(139, 92, 246, 0.12)',

  white: '#FFFFFF',
  /** Purple-leaning greys — a neutral grey next to violet reads as dirty. */
  muted: '#A29BBC',
  faint: '#8F88AA',

  danger: '#FF6B81',
  dangerWash: 'rgba(255, 107, 129, 0.09)',

  /** Violet, so it prints as a glow rather than a shadow. */
  shadow: '#8B5CF6',
  shadowOpacity: 0.5,
  dropShadow: '#000000',
  /** The ground already is the stage. */
  stage: 'transparent',

  glow: '#8B5CF6',
  glowPeak: 0.12,
  glowSecondPeak: 0.06,
};

export const light: Palette = {
  ...ON_ACCENT,

  /**
   * Off-white with the same violet lean the dark ground has, so the two themes
   * are recognisably the same app. Pure #FFF as the page would leave no room
   * for a card to sit on top of it.
   */
  ink: '#F6F4FB',
  surface: '#FFFFFF',
  raised: '#F0EDF8',
  /** `surface`'s own rgb, at 0.65 — see `npm run contrast` for why not lower. */
  glass: 'rgba(255, 255, 255, 0.65)',
  /** Darker than dark's hairline in relative terms — a pale border vanishes. */
  hairline: '#DDD6EC',

  accent: '#8B5CF6',
  /**
   * Darker than the accent, not lighter. #9E76F7 — dark mode's small-text
   * violet — measures 3.01:1 here, which fails AA outright.
   */
  accentText: '#6438C4',
  accentDim: '#7048E8',
  /** Heavier than dark's 0.12, which is all but invisible on white. */
  accentWash: 'rgba(139, 92, 246, 0.14)',

  /** "White" means the strongest text colour, which on a light ground is ink. */
  white: '#160F27',
  muted: '#544B70',
  faint: '#6A6188',

  danger: '#C2283F',
  dangerWash: 'rgba(194, 40, 63, 0.08)',

  /** A real shadow here — a violet glow on white just looks like a stain. */
  shadow: '#2A1F4A',
  shadowOpacity: 0.16,
  dropShadow: '#2A1F4A',
  /** The tile the hourglass keeps its night on. Dark mode's ground exactly. */
  stage: '#0F0B1A',

  glow: '#8B5CF6',
  /**
   * Far weaker than dark's 0.12. A violet bloom over near-white tints the whole
   * page violet, and a page that reads as faintly violet is a page competing
   * with the flood that means "your apps are unlocked".
   */
  glowPeak: 0.05,
  glowSecondPeak: 0.025,
};

/**
 * A white wash at `alpha`, for things drawn on the violet flood.
 *
 * The flood is the same violet in both themes, so anything sitting on it is
 * theme-independent by construction — tick marks, the progress track, the tile
 * behind the lock glyph. A function rather than six single-use tokens, because
 * naming `washOnAccent12` and `washOnAccent24` separately would be inventing
 * vocabulary for what is one idea at six strengths.
 */
export const washOnAccent = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;

/**
 * The personal-best banner on the complete screen: the dark ground sunk into
 * the flood. Fixed, for the same reason — it only ever appears on the violet.
 *
 * Kept as parts as well as a string so the contrast budget can composite it
 * rather than parse it back out of `rgba(…)`.
 */
export const RECORD_SUNK = { color: '#0F0B1A', alpha: 0.32 } as const;
export const RECORD_GROUND = 'rgba(15, 11, 26, 0.32)';

/**
 * Darkens a colour until it can be told apart from the ground it sits on.
 *
 * For the app tints. Those are somebody else's brand colours, picked to read
 * on a near-black pill — on a near-white one TikTok's lands at 1.67:1, which
 * is a logo you cannot see. Rather than keeping two tints per app (and a
 * migration for the custom ones people have already saved), the light variant
 * is derived: the hue is kept and the channels are walked down together until
 * the pair clears the bar.
 *
 * Memoised, because it is called per pill per render and the answer for a
 * given colour never changes.
 */
const legibleCache = new Map<string, string>();

export function legibleOn(color: string, ground: string, need = 3.2): string {
  const key = `${color}|${ground}|${need}`;
  const cached = legibleCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const parse = (h: string) =>
    [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (px: number[]) =>
    0.2126 * channel(px[0]) + 0.7152 * channel(px[1]) + 0.0722 * channel(px[2]);
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const base = parse(color);
  const onto = parse(ground);
  let result = color;

  // 40 steps of 2.5% is enough to reach black from anything, and stopping at
  // the first pass keeps as much of the original colour as the bar allows.
  for (let step = 0; step <= 40; step++) {
    const scaled = base.map(c => Math.round(c * (1 - step * 0.025)));
    if (contrast(scaled, onto) >= need) {
      result = '#' + scaled.map(c => c.toString(16).padStart(2, '0')).join('');
      break;
    }
  }

  legibleCache.set(key, result);
  return result;
}

export const palettes = { dark, light } as const;

export type ThemeName = keyof typeof palettes;
