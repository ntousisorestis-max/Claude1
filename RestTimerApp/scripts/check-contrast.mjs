/**
 * Guards the background glow against eating legibility.
 *
 *     npm run contrast          (needs `npm run build:web` + a server on :8099)
 *
 * The glow lightens the screen background, and every point of background
 * lightness is contrast taken away from the text on top of it. This checks that
 * what's left still clears WCAG AA, two ways, because either alone can lie:
 *
 * 1. **Analytic** — each palette colour against the glow's peak composited over
 *    the ground. That's the lightest the background can ever be, anywhere on
 *    any screen, so passing here passes everywhere.
 * 2. **Measured** — real pixels from a real browser, sampled in the side
 *    gutters with text made transparent, confirming the model matches what
 *    actually renders rather than what the maths hoped for.
 *
 * If you raise the peaks in GlowBackground.tsx, run this.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8099/';

// Must match src/theme.ts and src/components/GlowBackground.tsx.
const INK = '#0F0B1A';
const ACCENT_DEEP = '#6D42D9';
const ACCENT = '#8B5CF6';
const ACCENT_TEXT = '#9E76F7';
const WHITE = '#FFFFFF';
const SURFACE = '#17122A';
const RAISED = '#201A38';
const PEAK_ON_INK = 0.12;
const PEAK_ON_ACCENT = 0.06;

/** AA: 4.5 for body text, 3.0 for large (>=18.66px bold / 24px regular). */
const BODY = 4.5;
const LARGE = 3.0;

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

const glowedInk = toHex(composite(ACCENT, INK, PEAK_ON_INK));
const glowedAccent = toHex(composite(WHITE, ACCENT_DEEP, PEAK_ON_ACCENT));

let failed = false;
const check = (what, fg, ground, need) => {
  const r = ratio(hex(fg), hex(ground));
  const ok = r >= need;
  if (!ok) {
    failed = true;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${what.padEnd(38)} ${r.toFixed(2)}:1  (needs ${need.toFixed(1)})`,
  );
};
/** For colours declared as rgba() — composited onto the ground first. */
const checkAlpha = (what, alpha, ground, need) =>
  check(what, toHex(composite(WHITE, ground, alpha)), ground, need);

console.log('=== Analytic worst case: the glow at full peak ===');
console.log(`  dark ground   ${INK} -> ${glowedInk}`);
console.log(`  violet ground ${ACCENT_DEEP} -> ${glowedAccent}\n`);

console.log('Text on the glowed DARK ground:');
check('white — headlines 26-46px', WHITE, glowedInk, LARGE);
check('accentText — eyebrow, + Add', ACCENT_TEXT, glowedInk, BODY);
check('accent — set numeral, 92px', ACCENT, glowedInk, LARGE);
check('mutedOnDark — body, help', '#A29BBC', glowedInk, BODY);
check('faintOnDark — notes, SET label', '#8F88AA', glowedInk, BODY);
check('danger — End workout', '#FF6B81', glowedInk, BODY);

console.log('\nText on cards, which the glow never reaches:');
check('accentText on surface', ACCENT_TEXT, SURFACE, BODY);
check('accentText on raised', ACCENT_TEXT, RAISED, BODY);
check('faintOnDark on surface', '#8F88AA', SURFACE, BODY);
check('mutedOnDark on surface', '#A29BBC', SURFACE, BODY);

console.log('\nText on the glowed VIOLET ground:');
check('white — Scroll away., clock', WHITE, glowedAccent, LARGE);
checkAlpha('mutedOnAccent (white @ .88)', 0.88, glowedAccent, BODY);
checkAlpha('faintOnAccent (white @ .68)', 0.68, glowedAccent, LARGE);

console.log('\nThe gradient Start button, at both ends of its ramp:');
// 19px bold is "large text", so 3.0 — see GradientButton.tsx.
check('white on the gradient, dark end', WHITE, ACCENT_DEEP, LARGE);
check('white on the gradient, light end', WHITE, ACCENT, LARGE);

console.log('\nNon-text contrast (WCAG 1.4.11 wants 3.0 for UI):');
check('accent fill vs dark ground', ACCENT, glowedInk, LARGE);
check('white on the accent button', WHITE, ACCENT, LARGE);

// --- Confirm the model against what actually renders ---------------------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForTimeout(1800);
// Strip text so only ground + glow is left in the gutters.
await page.addStyleTag({ content: '*{color:transparent !important}' });

/**
 * Brightest pixel in the side gutters, which hold nothing but background.
 * Stops above the tab bar — its top hairline runs the full width and would be
 * measured as if it were glow.
 */
async function gutterPeak() {
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

const measured = (label, px, ceiling) => {
  const ok = lum(px) <= lum(hex(ceiling)) + 0.002;
  if (!ok) {
    failed = true;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(38)} ${toHex(px)} vs ceiling ${ceiling}`,
  );
};

console.log('\n=== Measured in Chromium ===');
measured('exercise list background', await gutterPeak(), glowedInk);

await page.getByLabel('Exercise name').fill('Bench press');
await page.getByLabel('Save exercise').click();
await page.waitForTimeout(500);
await page.getByLabel('Start Bench press').click();
await page.waitForTimeout(700);
measured('active set background', await gutterPeak(), glowedInk);

await page.getByLabel('Done with set').click();
await page.waitForTimeout(1400);
measured('resting background', await gutterPeak(), glowedAccent);

await browser.close();
console.log(failed ? '\nSOME CHECKS FAILED' : '\nAll contrast checks pass.');
process.exitCode = failed ? 1 : 0;
