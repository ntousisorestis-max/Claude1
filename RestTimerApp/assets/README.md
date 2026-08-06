# assets

## logo.png — the one file you edit

**Save your logo here, exactly as `assets/logo.png`.**

Requirements:
- **PNG**, square, **1024×1024 or larger**
- **A transparent background is strongly preferred.** The splash screen draws
  this file directly on the app's background with nothing around it — no card,
  no border. A logo painted edge-to-edge on its own colour will therefore show
  up as a coloured tile floating on the dark screen. Transparent art has no
  edge to see.
- Keep anything important away from the very edges: iOS rounds the corners of
  the app icon and Android may mask it to a circle.
- The icon generator flattens transparency onto the app's dark background, so
  a transparent source still produces valid opaque app icons.

The file currently in this folder is a **placeholder** — a violet dumbbell on a
transparent ground. Overwrite it with yours.

## After you replace it

```sh
npm run icons
```

That reads `logo.png` and writes every size the platforms need:

| Where | What |
|---|---|
| `ios/RestTimerApp/Images.xcassets/AppIcon.appiconset/` | `icon-1024.png` + `Contents.json` |
| `android/app/src/main/res/mipmap-*/` | `ic_launcher.png` and `ic_launcher_round.png`, five densities |
| `public/` | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |

Everything it writes is generated. Don't hand-edit the outputs — change
`logo.png` and re-run.

**The in-app splash screen needs no command.** It reads `logo.png` directly, so
it picks up your file on the next reload.

---

## hourglass.png — the Workout tab's illustration

**Two files, and only one of them is edited by hand.**

| File | What it is |
|---|---|
| `hourglass-source.png` | The 3D render, exactly as supplied. The source of truth. |
| `hourglass.png` | **Generated.** What the app actually loads. Don't hand-edit it. |

The render is a finished picture on an opaque near-black ground. Dropped
straight onto the app it reads as a rectangle floating on the screen, because
the render's background is close to the app's but not the same, and the corners
give it away instantly.

Cutting the hourglass out isn't possible: the glass is transparent, so the
background genuinely shows *through* the bulbs, and nothing that removes the
outside can avoid punching holes through the middle. (A subject-segmentation
cutout was tried. It came back with the glass filled solid white.)

So instead of cutting an edge, the build dissolves one — an elliptical alpha
falloff that reaches fully transparent before any border. The object keeps its
full strength, the render's own ring and glow survive, and there is no boundary
anywhere for the eye to catch.

### To replace the art

```sh
node scripts/feather-hourglass.mjs
```

Overwrite `hourglass-source.png` and run that. It writes `hourglass.png` and
prints the size it landed at. `scripts/feather-hourglass.mjs` documents the
falloff numbers and the variants that were tried and rejected.

**If you ever get a render with a genuinely transparent background** — glass
included, not just the outside — say so. The feather comes off, the ring gets
drawn in code where it can sweep and pulse, and the rotation opens up. See
`src/components/HeroHourglass.tsx`.
