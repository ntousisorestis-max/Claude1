# assets

## logo.png — the one file you edit

**Save your logo here, exactly as `assets/logo.png`.**

Requirements:
- **PNG**, square, **1024×1024 or larger**
- Design it edge-to-edge. iOS rounds the corners itself and Android may mask
  it to a circle, so keep anything important away from the very edges.
- Transparency is fine. The icon generator flattens it onto the app's dark
  background, because iOS rejects icons with an alpha channel.

The file currently in this folder is a **placeholder** — a dumbbell on violet.
Overwrite it with yours.

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
