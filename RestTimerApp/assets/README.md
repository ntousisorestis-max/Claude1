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
