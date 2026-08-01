/**
 * Turns assets/logo.png into every icon the platforms want.
 *
 *     npm run icons
 *
 * Run it whenever you replace the logo. Everything it writes is generated —
 * don't hand-edit the outputs, edit assets/logo.png and re-run.
 *
 * Source requirements: square PNG, 1024x1024 or larger. Anything the platforms
 * need smaller than that is produced here.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'assets', 'logo.png');

/**
 * What transparency lands on.
 *
 * Every icon here is flattened, not just the ones the platforms demand it for.
 * A launcher icon with holes in it shows whatever wallpaper is behind it, which
 * looks broken rather than transparent — and the shipped logo has a transparent
 * ground on purpose, so the in-app splash can sit the mark straight on the
 * screen with no box around it.
 */
const OPAQUE_BACKGROUND = { r: 15, g: 11, b: 26, alpha: 1 }; // colors.ink
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const ANDROID_DENSITIES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

/**
 * The notification small icon, at 24dp across the density buckets.
 *
 * Android draws this as a **silhouette**: it keeps the alpha channel and throws
 * the colours away, tinting what's left with `android.color`. Handing it the
 * full-colour launcher icon gives you a solid white blob, so this is generated
 * separately — the logo's alpha, filled white.
 */
const ANDROID_NOTIFICATION_DENSITIES = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96,
};

/**
 * Xcode 14 and later accept one 1024px universal icon and derive the rest,
 * which beats committing nine near-identical PNGs.
 */
const IOS_CONTENTS = {
  images: [{ filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
  info: { author: 'generate-icons.mjs', version: 1 },
};

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`\nNo logo found at assets/logo.png\n`);
    console.error('Save your PNG there (square, 1024x1024 or larger), then re-run.\n');
    process.exit(1);
  }

  const { width, height } = await sharp(SOURCE).metadata();
  if (!width || !height) {
    throw new Error('Could not read the logo dimensions.');
  }
  if (width !== height) {
    console.warn(
      `! assets/logo.png is ${width}x${height}, not square. It will be squashed ` +
        'to fit — crop it square for a clean result.',
    );
  }
  if (width < 1024) {
    console.warn(
      `! assets/logo.png is only ${width}px wide. 1024px or larger avoids a ` +
        'soft App Store icon.',
    );
  }

  const square = (size) =>
    sharp(SOURCE)
      .resize(size, size, { fit: 'fill' })
      .flatten({ background: OPAQUE_BACKGROUND })
      .png();

  // ---- iOS -----------------------------------------------------------------
  const iosDir = join(root, 'ios', 'RestTimerApp', 'Images.xcassets', 'AppIcon.appiconset');
  mkdirSync(iosDir, { recursive: true });
  await square(1024).toFile(join(iosDir, 'icon-1024.png'));
  writeFileSync(
    join(iosDir, 'Contents.json'),
    JSON.stringify(IOS_CONTENTS, null, 2) + '\n',
  );
  console.log('ios      icon-1024.png + Contents.json');

  // ---- Android -------------------------------------------------------------
  for (const [dir, size] of Object.entries(ANDROID_DENSITIES)) {
    const out = join(root, 'android', 'app', 'src', 'main', 'res', dir);
    mkdirSync(out, { recursive: true });

    await square(size).toFile(join(out, 'ic_launcher.png'));

    // The round variant is masked here rather than left to the launcher, so
    // corners can't bleed outside the circle on older Android versions.
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
    );
    await square(size)
      .composite([{ input: circle, blend: 'dest-in' }])
      .toFile(join(out, 'ic_launcher_round.png'));

    console.log(`android  ${dir}/ (${size}px)`);
  }

  // ---- Android notification icon -------------------------------------------
  for (const [dir, size] of Object.entries(ANDROID_NOTIFICATION_DENSITIES)) {
    const out = join(root, 'android', 'app', 'src', 'main', 'res', dir);
    mkdirSync(out, { recursive: true });

    // Material wants the glyph inset inside the 24dp box rather than bleeding
    // to its edges, so it's drawn at ~80% and padded back out.
    const glyph = Math.round(size * 0.8);
    const pad = Math.round((size - glyph) / 2);

    const alpha = await sharp(SOURCE)
      .resize(glyph, glyph, { fit: 'contain', background: TRANSPARENT })
      .extend({ top: pad, bottom: size - glyph - pad, left: pad, right: size - glyph - pad, background: TRANSPARENT })
      .extractChannel('alpha')
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 3, background: '#ffffff' },
    })
      .joinChannel(alpha)
      .png()
      .toFile(join(out, 'ic_notification.png'));

    console.log(`android  ${dir}/ic_notification.png (${size}px)`);
  }

  // ---- Web -----------------------------------------------------------------
  const publicDir = join(root, 'public');
  mkdirSync(publicDir, { recursive: true });
  await square(192).toFile(join(publicDir, 'icon-192.png'));
  await square(512).toFile(join(publicDir, 'icon-512.png'));
  await square(180).toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('web      icon-192, icon-512, apple-touch-icon');

  console.log('\nDone. The in-app splash reads assets/logo.png directly, so it\n' +
    'updates without running anything.\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
