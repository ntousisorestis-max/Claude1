# Testing the app

A step-by-step guide to running Rest Timer yourself. Written for Windows, since
that's what you're on — the commands are the same on macOS and Linux apart from
finding your IP address in step 7.

**This runs the web build.** It is the real app — the same screens, state
machine and animations the phones run — but a browser can't block apps, send OS
notifications, or buzz. See [What web can't test](#what-web-cant-test).

---

## Step 1 — Check you have Node 22.11 or newer

Open **PowerShell** and run:

```powershell
node -v
```

You need `v22.11.0` or higher. If it's older or the command isn't found, install
the LTS build from [nodejs.org](https://nodejs.org), close PowerShell, reopen
it, and check again.

## Step 2 — Get the code

If you don't have the repo yet:

```powershell
git clone https://github.com/ntousisorestis-max/Claude1.git
cd Claude1
git checkout claude/gym-rest-timer-app-a8ma91
```

If you already have it, just get the latest:

```powershell
cd Claude1
git checkout claude/gym-rest-timer-app-a8ma91
git pull
```

## Step 3 — Go into the app folder

The app lives in a subfolder, not at the repo root. This trips people up.

```powershell
cd RestTimerApp
```

## Step 4 — Install dependencies

```powershell
npm install
```

Takes a few minutes the first time. Warnings about vulnerabilities and funding
are normal and safe to ignore. **Do not run `npm audit fix --force`** — it will
upgrade React Native and break the build.

## Step 5 — Start it

```powershell
npm run web
```

Wait for `compiled successfully`. Leave this window open — closing it stops the
app.

## Step 6 — Open it in Chrome

Go to **http://localhost:3000**

You should see a black screen headed **New workout** with three numbered lines
explaining how the app works. If you do, everything is working.

To stop the app later, click the PowerShell window and press `Ctrl + C`.

---

## Step 7 — (Optional) Use it on your phone

Same Wi-Fi network, with `npm run web` still running.

1. In PowerShell, run `ipconfig` and find **IPv4 Address** under your Wi-Fi
   adapter — something like `192.168.1.42`.
2. On your phone's browser, go to `http://192.168.1.42:3000` (your address, not
   that one).
3. **iPhone:** Share → *Add to Home Screen*. It gets an icon and opens
   fullscreen with no browser bars — close to a real installed app.

If the page won't load, Windows Firewall is blocking it. The first time you run
`npm run web`, Windows shows a prompt — click **Allow access** on private
networks. If you missed it, allow Node.js through the firewall in Windows
Defender settings.

---

## What to test

Work down this list. Expected result is on the right.

### Building your list

| Do this | You should see |
|---|---|
| Open the app | "Nothing saved yet", with the name box already open |
| Leave the name empty | **Save exercise** is dimmed — a name is required |
| Type `Bench press`, tap **Save exercise** | A card: the name, `3 sets · 60s rest`, the apps it blocks, and a **Start** |
| Tap **+ Add exercise**, add `Tricep pulldowns` | A second card, independent of the first |
| Try adding `bench press` again | "You already have a Bench press" and the button stays dimmed |

### Each exercise keeps its own settings

| Do this | You should see |
|---|---|
| Tap the **Bench press** card | It opens in place, violet outline, chevron flips |
| Tap **−** and **+** under *Sets* | The big number changes, 1 to 20 |
| Tap the `30s` / `60s` / `90s` / `120s` pills | The chosen one fills violet, and the number above matches |
| Tap the app pills (TikTok, Instagram…) | They spring, and the violet outline toggles on and off |
| Tap the card header again to close it | The summary line now shows what you just set |
| Look at **Tricep pulldowns** | Still `3 sets · 60s rest` — untouched. This is the point of the restructure |
| Open a card and tap **Delete** | A confirm box; confirming removes that card only |

### The main loop

**Set one exercise to 30s rest first**, so you don't wait a full minute to see
the timer run out.

| Do this | You should see |
|---|---|
| Tap **Start** on that card | Screen stays near-black. Panel at the top reads **Apps Locked** with your app names under it, and the padlock is shut |
| Read the middle | Exercise name, **SET 1 of 3**, and one tick per set |
| Tap the **Apps Locked** panel | Full-screen *Blocked* preview listing your apps |
| Tap **Back to workout** | Returns to the set |
| Press and hold **Done with set** | The button sinks onto its shadow, then springs back |
| Release it | **The whole screen floods violet from the centre** |
| Read the rest screen | **Apps Unlocked**, the padlock swings open, `00:30` counting down inside the ring, and a one-line prompt under it |
| Wait until under 5 seconds | Label changes to **LOCKING NOW** and the clock pulses once a second |
| Keep waiting for zero | **Screen snaps back to near-black on its own** and shows **SET 2 of 3** |

That last row is the whole point of the app — the lock coming back without you
touching anything. It's worth watching once.

### Finishing

| Do this | You should see |
|---|---|
| Tap **Done with set**, then **Skip rest** | Re-locks immediately, moves to the next set |
| Finish the final set | 🔥 **That's the work**, screen stays violet |
| Check the summary | Exercise name, sets completed, and total time spent resting |
| Tap **New workout** | Back to your list, every exercise still saved |
| Start again, tap **End workout** | A confirm box; confirming shows **Called it early** instead |

### Settings

| Do this | You should see |
|---|---|
| Open the **Settings** tab | Sound, the app list, and *Delete all exercises* — no sets or rest |
| Untick **YouTube**, go back, add a new exercise | The new card starts without YouTube; the cards you already had are unchanged |
| Type a name into *Add another app* and tap **+** | It joins the list, already ticked |
| Tap **Delete all exercises** | A confirm box naming how many; confirming empties the Workout tab |

### If you want to check accessibility

Turn on *reduce motion* in your OS settings and reload. Everything should still
work, just without the animations — screens change instantly instead of sliding
and flooding.

---

## What web can't test

Not broken — impossible in a browser:

- **No real app blocking.** Nothing stops you opening TikTok. The lock is
  simulated; the chip and the 🔒 preview stand in for it. Real blocking is
  Phase 2 and iOS-only.
- **No notifications.** On a phone you'd get an alert when rest ends even if
  you'd navigated away. On web there's nothing.
- **No haptics.** The buzz on finishing a set is Android-only anyway.

Everything else — the timer, the state machine, the layout, the animations — is
exactly what runs on a phone.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `node : command not found` | Node isn't installed or isn't on PATH. Reinstall from nodejs.org and reopen PowerShell |
| `npm : command not found` | Same as above — npm ships with Node |
| `Cannot find module` after `npm run web` | `npm install` didn't finish. Run it again |
| `Port 3000 is already in use` | Something else is on that port. Run `npm run web -- --port 3001` and use http://localhost:3001 |
| Page is blank and white | Check the PowerShell window for a red error, and open Chrome DevTools (`F12`) → Console |
| Phone can't load the page | Firewall (see step 7), or the phone is on a different network — guest Wi-Fi often blocks this |
| Changes don't show up | Hard-reload with `Ctrl + Shift + R` |

## Running the automated checks

Not required, but this is what CI would run:

```powershell
npm test              # 14 tests: the state machine and a full workout
npm run test:android  # the same suite with Android module resolution
npx tsc --noEmit      # type check
npm run lint
```
