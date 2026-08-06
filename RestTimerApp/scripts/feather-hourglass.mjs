/**
 * Turns the hourglass render into the asset the app actually ships.
 *
 *     node scripts/feather-hourglass.mjs
 *
 * Reads `assets/hourglass-source.png` and writes `assets/hourglass.png`.
 *
 * ## Why the asset is generated rather than just used
 *
 * The render is a finished picture on an opaque near-black ground. Dropped
 * straight onto the app it reads as a rectangle floating on the screen — the
 * render's background is close to the app's, but not the same, and the corners
 * give it away instantly.
 *
 * Cutting the hourglass out properly is not on the table: the glass is
 * transparent, so the background genuinely shows *through* the bulbs, and no
 * threshold or colour key can remove the outside without punching holes through
 * the middle. (A subject-segmentation cutout was tried; it came back with the
 * glass filled solid white, which is the same problem wearing a different hat.)
 *
 * So instead of cutting an edge, this dissolves one. An elliptical alpha
 * falloff takes the picture to fully transparent before it reaches any border,
 * which leaves the object at full strength, keeps the render's own ring and
 * glow, and means there is no boundary anywhere for the eye to catch. The
 * cropped stone slab along the bottom edge fades out with it, which is a bonus:
 * it was never a whole object.
 *
 * ## The two numbers that were fought over
 *
 * **The plateau has to hug the object.** The fade must reach zero before the
 * canvas ends, or the top edge keeps ~40% alpha and there is still a boundary,
 * just a faint one. The obvious fix — pad the canvas and widen the fully-opaque
 * middle — makes it worse, not better: the render's background is *darker* than
 * the app's ground, so every extra pixel of background held at full opacity
 * becomes a visible dark rounded rectangle sitting behind the hourglass. Padded
 * variants at 10%, 14% and 18% with a wide plateau all showed it clearly at
 * display size.
 *
 * So: pad a little (`PAD`) purely to give the fade somewhere to finish, and
 * start the fade early (`STOPS`) so barely any pure background is ever at full
 * strength. Four combinations were rendered at true 132pt on the real ground
 * and compared before this one was picked.
 *
 * **`quality: 90`** quantises 577KB down to 66KB. Side by side at display size
 * the two are indistinguishable — the image is all smooth gradient, which is
 * the easy case for a palette.
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = new URL('../assets/hourglass-source.png', import.meta.url).pathname;
const OUT = new URL('../assets/hourglass.png', import.meta.url).pathname;

/** Transparent margin added on every side, as a fraction of the render. */
const PAD = 0.08;
/** Centre and reach of the falloff, and how its alpha ramps down. */
const FALLOFF = { cy: 0.47, r: 0.5, stops: [[0.36, 1], [0.68, 0.6], [1, 0]] };

const source = await sharp(SOURCE).metadata();
const padX = Math.round(source.width * PAD);
const padY = Math.round(source.height * PAD);
const width = source.width + padX * 2;
const height = source.height + padY * 2;

const padded = await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: SOURCE, left: padX, top: padY }])
  .png()
  .toBuffer();

const stops = FALLOFF.stops
  .map(([offset, alpha]) =>
    `<stop offset="${offset}" stop-color="#fff" stop-opacity="${alpha}"/>`)
  .join('');

const mask = Buffer.from(
  `<svg width="${width}" height="${height}">
     <defs>
       <radialGradient id="m" cx="50%" cy="${FALLOFF.cy * 100}%" r="${FALLOFF.r * 100}%">
         ${stops}
       </radialGradient>
     </defs>
     <rect width="${width}" height="${height}" fill="url(#m)"/>
   </svg>`,
);

const out = await sharp(padded)
  // `dest-in` keeps the picture and takes its alpha from the mask.
  .composite([{ input: mask, blend: 'dest-in' }])
  .png({ quality: 90, compressionLevel: 9, effort: 10 })
  .toBuffer();

// Written straight from the buffer. Handing it back to sharp to write would
// re-encode it with default settings and quietly undo the quantisation — the
// file lands at 87KB instead of 66KB, looking for all the world like it worked.
await writeFile(OUT, out);

console.log(
  `assets/hourglass.png  ${width}x${height}  ${(out.length / 1024).toFixed(0)} KB`,
);
