/**
 * Guards both palettes against eating legibility.
 *
 *     npm run contrast          (needs `npm run build:web` + a server on :8099)
 *
 * The background glow lightens the screen, and every point of lightness is
 * contrast taken away from the text on top of it. This checks that what's left
 * still clears WCAG AA, in **light and dark**, two ways — because either alone
 * can lie:
 *
 * 1. **Analytic** — each palette colour against that theme's glow peak
 *    composited over that theme's ground. That's the worst the background can
 *    ever be, anywhere on any screen, so passing here passes everywhere.
 * 2. **Measured** — real pixels from a real browser in both colour schemes,
 *    sampled in the side gutters with text made transparent, confirming the
 *    model matches what renders rather than what the maths hoped for.
 *
 * ## The palettes are imported, not copied
 *
 * This used to restate every hex value as a local constant, which meant the
 * budget could pass while the app looked different — the two drifting apart is
 * exactly the failure a budget exists to prevent. Node strips the types and
 * imports `src/theme/palettes.ts` directly, so what is checked *is* what ships.
 * That is what `--experimental-strip-types` in the npm script is for.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import sharp from 'sharp';
import { legibleOn, palettes, RECORD_SUNK } from '../src/theme/palettes.ts';
import { BLOCKABLE_APPS } from '../src/state/workoutReducer.ts';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8099/';

/** AA: 4.5 for body text, 3.0 for large (>=18.66px bold / 24px regular). */
const BODY = 4.5;
const LARGE = 3.0;

/** The bloom over the violet flood. Fixed — see GlowBackground. */
const ON_ACCENT_PEAK = 0.06;

/** `colors.glass`'s alpha in both themes — see src/theme/palettes.ts. */
const GLASS_ALPHA = 0.65;

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = px =>
  '#' + px.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const srgb = c => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** `over` seen through `top` at `alpha`. */
const composite = (top, over, alpha) =>
  hex(top).map((c, i) => alpha * c + (1 - alpha) * hex(over)[i]);

let failed = false;
const check = (what, fg, ground, need) => {
  const r = ratio(hex(fg), hex(ground));
  const ok = r >= need;
  if (!ok) {
    failed = true;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${what.padEnd(36)} ${r.toFixed(2)}:1  (needs ${need.toFixed(1)})`,
  );
};
/** For colours declared as rgba() — composited onto the ground first. */
const checkAlpha = (what, fg, alpha, ground, need) =>
  check(what, toHex(composite(fg, ground, alpha)), ground, need);

/* -------------------------------------------------------------------------- */
/* Per theme                                                                  */
/* -------------------------------------------------------------------------- */

for (const [name, c] of Object.entries(palettes)) {
  // The lightest the ground gets: the glow at full peak over it.
  const ground = toHex(composite(c.glow, c.ink, c.glowPeak));

  console.log(`\n=== ${name.toUpperCase()} — ground ${c.ink} -> ${ground} ===`);

  console.log('Text on the glowed ground:');
  check('white — headlines 26-46px', c.white, ground, LARGE);
  check('white — at body size too', c.white, ground, BODY);
  check('accentText — eyebrows, links', c.accentText, ground, BODY);
  check('accent — the 92px set numeral', c.accent, ground, LARGE);
  check('muted — body, help', c.muted, ground, BODY);
  check('faint — notes, SET label', c.faint, ground, BODY);
  check('danger — End workout', c.danger, ground, BODY);

  console.log('Text on cards, which the glow never reaches:');
  for (const [surface, label] of [[c.surface, 'surface'], [c.raised, 'raised']]) {
    check(`white on ${label}`, c.white, surface, BODY);
    check(`accentText on ${label}`, c.accentText, surface, BODY);
    check(`muted on ${label}`, c.muted, surface, BODY);
    check(`faint on ${label}`, c.faint, surface, BODY);
    check(`danger on ${label}`, c.danger, surface, BODY);
  }

  // A translucent card, unlike an opaque one, doesn't fully cover whatever
  // is behind it — so its *effective* colour is the glass tint composited
  // over the worst the page behind it gets, not the tint alone. `SessionStats`
  // is the one card that uses this so far.
  console.log('Text on the glass card, over the glowed ground behind it:');
  const glassCard = toHex(composite(c.surface, ground, GLASS_ALPHA));
  check('white — the stat value', c.white, glassCard, LARGE);
  check('accentText — THIS SESSION', c.accentText, glassCard, BODY);
  check('muted — the stat label', c.muted, glassCard, BODY);

  console.log('Non-text (WCAG 1.4.11 wants 3.0 for UI):');
  check('accent fill vs the ground', c.accent, ground, LARGE);
  // The Streaks tab's two progress bars and its streak ring are all this pair.
  // If the fill can't be told from the track, the bar carries no information.
  check('progress fill vs its track', c.accent, c.hairline, LARGE);

  // The app pills carry somebody else's brand colours, which cannot be moved
  // to suit a theme — so the check is that they stay *distinguishable* on the
  // ground they sit on, not that they read as text. AppPill draws the name in
  // a palette colour for exactly this reason.
  // Somebody else's colours, so they are darkened rather than replaced — see
  // `legibleOn`. This checks the value the pill actually draws.
  console.log('Brand tints on a selected pill (non-text):');
  for (const app of BLOCKABLE_APPS) {
    check(`${app.name}`, legibleOn(app.tint, c.raised), c.raised, LARGE);
  }
}

/* -------------------------------------------------------------------------- */
/* The violet flood — the same in both themes, so checked once                */
/* -------------------------------------------------------------------------- */

const { dark: c } = palettes;
const flood = toHex(composite('#FFFFFF', c.accentDeep, ON_ACCENT_PEAK));

console.log(`\n=== THE FLOOD — ${c.accentDeep} -> ${flood} (both themes) ===`);
check('textOnAccent — Scroll away.', c.textOnAccent, flood, LARGE);
checkAlpha('mutedOnAccent (white @ .88)', '#FFFFFF', 0.88, flood, BODY);
checkAlpha('faintOnAccent (white @ .68)', '#FFFFFF', 0.68, flood, LARGE);

// The complete screen's personal-best banner: ink at 32% over the flood.
const record = toHex(composite(RECORD_SUNK.color, flood, RECORD_SUNK.alpha));
console.log('The personal-best banner, sunk into the flood:');
check('textOnAccent — the record line', c.textOnAccent, record, BODY);
checkAlpha('mutedOnAccent — PERSONAL BEST', '#FFFFFF', 0.88, record, BODY);

// White on accent is 4.23:1 — over AA's 3.0 for large text, under the 4.5 for
// body. WCAG's line is 18.66px bold, so every label on an accent fill is sized
// past it: `BigButton` is 20px/800, and `GradientButton`, `AuthSheet`'s submit,
// `ConfirmDialog`'s buttons, both account buttons, the segmented pills and
// `ExerciseCard`'s save pill are 19px/800. A new accent button at body size
// would make this 3.0 bar the wrong one to be checking.
console.log('Content on an accent fill:');
check('textOnAccent on the accent tile', c.textOnAccent, c.accent, LARGE);
check('textOnAccent, gradient dark end', c.textOnAccent, c.accentDeep, LARGE);
check('textOnAccent, gradient light end', c.textOnAccent, c.accent, LARGE);

/* -------------------------------------------------------------------------- */
/* Measured in Chromium, in both schemes                                      */
/* -------------------------------------------------------------------------- */

const browser = await chromium.launch();

/**
 * Brightest pixel in the side gutters, which hold nothing but background.
 * Stops above the tab bar — its top hairline runs the full width and would be
 * measured as if it were glow.
 */
async function gutterPeak(page) {
  const shot = await page.screenshot();
  let best = [0, 0, 0];
  let bestL = -1;
  for (const box of [
    { left: 0, top: 0, width: 16, height: 780 },
    { left: 404, top: 0, width: 16, height: 780 },
  ]) {
    const { data } = await sharp(shot)
      .extract(box)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 3) {
      const px = [data[i], data[i + 1], data[i + 2]];
      if (lum(px) > bestL) {
        bestL = lum(px);
        best = px;
      }
    }
  }
  return best;
}

/**
 * The measured ground has to sit *under* the modelled one, and the direction
 * of "under" flips with the theme: on dark the risk is the glow making the
 * page too light, on light it is the glow making it too dark.
 */
const measured = (label, px, ceiling, theme) => {
  const slack = 0.002;
  const ok =
    theme === 'dark'
      ? lum(px) <= lum(hex(ceiling)) + slack
      : lum(px) >= lum(hex(ceiling)) - slack;
  if (!ok) {
    failed = true;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} ${toHex(px)} vs limit ${ceiling}`,
  );
};

for (const theme of ['dark', 'light']) {
  const p = palettes[theme];
  const ceiling = toHex(composite(p.glow, p.ink, p.glowPeak));
  const floodCeiling = toHex(composite('#FFFFFF', p.accentDeep, ON_ACCENT_PEAK));

  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  // A fresh profile is a first launch, and a first launch is the welcome
  // screen — which would be measured as if it were the exercise list. Seeded
  // as somebody who has been here before, which is the state every ground
  // below belongs to. The welcome gets its own pass at the end.
  await page.addInitScript(() => {
    localStorage.setItem(
      'liftlock.state.v3',
      JSON.stringify({
        welcomed: true,
        exercises: [],
        theme: 'system',
        defaults: { selectedAppIds: [], soundEnabled: true, customApps: [] },
      }),
    );
  });

  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForTimeout(1800);
  // Strip text so only ground + glow is left in the gutters.
  await page.addStyleTag({ content: '*{color:transparent !important}' });

  console.log(`\n=== MEASURED IN CHROMIUM — ${theme} ===`);
  measured('exercise list background', await gutterPeak(page), ceiling, theme);

  await page.getByLabel('Exercise name').fill('Bench press');
  await page.getByLabel('Save exercise').click();
  await page.waitForTimeout(500);
  await page.getByLabel('Start Bench press').click();
  await page.waitForTimeout(700);
  measured('active set background', await gutterPeak(page), ceiling, theme);

  await page.getByLabel('Done with set').click();
  await page.waitForTimeout(1400);
  // The flood is the same violet in both themes, so this one has a fixed
  // ceiling and is only ever checked the dark way.
  measured('resting background', await gutterPeak(page), floodCeiling, 'dark');

  // The welcome, on an unseeded profile — a genuine first launch. It carries
  // a second light source nothing else does: the halo behind the logo is its
  // own radial bloom stacked on the root glow.
  const first = await browser.newPage({
    viewport: { width: 420, height: 900 },
    colorScheme: theme,
  });
  await first.goto(BASE, { waitUntil: 'commit' });
  await first.waitForTimeout(1800);
  await first.addStyleTag({ content: '*{color:transparent !important}' });
  measured('welcome background', await gutterPeak(first), ceiling, theme);

  await context.close();
}

await browser.close();
console.log(failed ? '\nSOME CHECKS FAILED' : '\nAll contrast checks pass.');
process.exitCode = failed ? 1 : 0;
