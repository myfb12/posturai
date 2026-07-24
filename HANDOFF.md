# PosturAI — Project Handoff

**Last updated:** 2026-07-23
**Status:** Working interactive prototype with real camera + real on-device posture analysis. Not yet the shipping app.
**Repo:** `C:\Users\yasin\posturai` (git; remote `https://github.com/myfb12/posturai.git` — currently empty, nothing pushed yet)

---

## 1. What PosturAI is

An iOS app concept: the user photographs themselves **side-on**, the app reads their posture
(forward head, rounded shoulders, hip/base alignment) and gives **gentle corrective guidance** —
all **on-device**, framed as a wellness tool, never a medical diagnosis.

## 2. Current status — what works today

Everything below is a **web prototype** standing in for the iOS app (it runs on Windows, where
the native SwiftUI app can't be built — see §4). It is genuinely functional, not just mockups:

- ✅ Six-screen flow: Consent → Home → Guided Capture → Analyzing → Result → Progress
- ✅ **Live camera** (getUserMedia) with a guided side-on capture overlay
- ✅ **Gallery / file picker** to analyze an existing photo
- ✅ **Real on-device pose detection** (MediaPipe Pose Landmarker, WASM) — detects ear/shoulder/
  hip/knee/ankle, computes forward-head / trunk / base ratios, maps to qualitative bands, and
  draws the detected skeleton over the actual photo
- ✅ **Honest failure state** when no clear full-body side-on pose is found (no fake results)
- ✅ Skeleton loaders, light/dark themes, responsive to small phones, keyboard/focus a11y
- ✅ HTTPS server (self-signed) so the camera works on a phone over the LAN

**Not done:** the real native app; persistent history/trends; accounts; real exercise programming;
committing/pushing to GitHub.

## 3. Key decisions & why (from two LLM Council reviews)

These were decided by running the question through a 5-advisor "LLM Council" (independent analysis →
anonymized peer review → chairman synthesis). Treat them as deliberate, not gaps:

| Decision | Why |
|---|---|
| **On-device analysis** (Apple Vision on iOS; MediaPipe in the web prototype) | No backend, no uploads — the whole privacy story is "nothing leaves your phone." |
| **No numeric score — qualitative bands only** ("Noticeably forward", "Slightly rounded", "Well aligned") | A precise number ("your head is 12° off") from an uncalibrated 2D photo is scientifically shaky *and* an App-Store health-claim liability. |
| **Guided capture is the hard problem** | Posture is only measurable from a consistent side-on angle; garbage-in dominates. The capture screen gets the most design effort. |
| **Small v1** (6 screens) | Defer accounts, full history/trends, cloud/LLM analysis, exercise library, HealthKit until demand is proven. |
| **Weekly rhythm, not daily streak** | A daily streak contradicts a "2 min once a week" product and manufactures false obligation. |
| **Honest failure states** | If a pose can't be read, say so — don't invent results. |

Full round-2 review changes are documented in `prototype/README.md`.

**Open validation question (flagged by the council, still unaddressed):** whether a single handheld
2D photo yields a *repeatable* read shot-to-shot. Recommended first real-app task: take 50 side-on
photos of one person and check the computed angles are stable within a few degrees before trusting
any progress/trend feature.

## 4. What's built — the prototype

**Why web, not native:** the dev machine is Windows (no Xcode), and the design brief called for
Playwright + web design tooling. So the prototype is HTML/CSS/JS shown in an iPhone frame. It is the
**visual + interaction spec** for the eventual native build.

**Design system** (see `prototype/README.md` for full tokens):
- Signature motif: the **plumb line** (vertical alignment axis) — logo, capture guide, result overlay
- Palette: trust teal `#0E7A86`, aligned-green `#2FA37D`, warm coral `#E8794B` for deviations
  (coaching, not alarm-red); full light + dark tokens
- Type: **Fraunces** (serif, for verdicts/headings) + **Plus Jakarta Sans** (UI)

## 5. Repo structure

```
posturai/
├─ HANDOFF.md              ← this file
└─ prototype/
   ├─ index.html           # all six screens in an iPhone frame
   ├─ styles.css           # design tokens, components, light/dark, skeleton shimmer
   ├─ app.js               # routing, skeleton timing, camera, analysis pipeline, rendering
   ├─ pose.js              # MediaPipe Pose Landmarker wrapper (ES module, loads model from CDN)
   ├─ server.js            # static server: HTTPS :5173 (camera) + HTTP :5174
   ├─ cert.pem / key.pem   # self-signed cert (SAN includes LAN IP 192.168.1.39 + localhost)
   ├─ README.md            # prototype-level design notes + changelog
   └─ shots/               # Playwright screenshots (QA reference)
```

## 6. How to run & test

**Start the server** (from the prototype folder):
```bash
# Node must be on PATH; it was installed to "C:\Program Files\nodejs"
node server.js
```

**Open it:**

| Device | URL | Camera | Notes |
|---|---|---|---|
| **This PC** | http://localhost:5174 | ✅ webcam | localhost = secure context, so no cert warning |
| **Phone (same Wi-Fi)** | https://192.168.1.39:5173 | ✅ | accept the one-time self-signed-cert warning |

- On the PC the webcam faces you head-on, so use the **gallery button** with a side-on full-body
  photo to exercise real analysis (a head-on shot correctly hits the "couldn't read a pose" state).
- The MediaPipe model loads from a CDN on first use → needs internet the first time (a few seconds).
  The photo itself never leaves the device.

**Automated testing:** done with the **Playwright** skill (Chromium). Test scripts used during
development live in the session scratchpad (screenshot flow + a verify script that exercises the
real-render, failure, and gallery paths with a fake camera). Re-run pattern:
```bash
# PATH must include node; NODE_PATH must point at the playwright skill's node_modules
node <script>.js
```

## 7. Known limitations & honest caveats

- Side-view pose accuracy varies with framing/lighting/background; a single 2D photo is a *relative*
  read, not a clinical angle (hence qualitative bands).
- The IP `192.168.1.39` and the self-signed cert are tied to the current Wi-Fi; both change if the
  network changes (regenerate the cert with the new IP in the SAN).
- Detection thresholds in `app.js` (`computeMetrics` / `band`) are hand-tuned and unvalidated —
  calibrate against real photos.
- Nothing is committed to git yet.

## 8. Recommended next steps

1. **Validate the measurement** (the council's "do this first"): 50 same-pose side-on photos → check
   angle stability before building any trend/progress feature.
2. **Pick the real stack:**
   - **Native iOS (SwiftUI + Apple Vision)** — the council's recommendation; best on-device story.
   - **Expo / React Native** — cross-platform; then Expo Go is the right test tool and the 6 screens
     get ported to native components. (This is a pivot away from native iOS.)
3. **Port the prototype** screen-by-screen to the chosen stack, using this prototype as the spec.
4. **Commit & push** the prototype to the GitHub remote (not done yet — ask and it'll be set up).
5. Tune detection thresholds; add first-run empty state; consider bundling the pose model for offline.

## 9. Environment / toolchain notes (for whoever picks this up)

- **OS:** Windows 11. Shell examples assume the node binary is on PATH (`C:\Program Files\nodejs`).
- **Node:** installed via `winget` (OpenJS.NodeJS.LTS). **Python is not installed.**
- **Playwright:** set up under the global skill at `~/.claude/skills/playwright-skill` (Chromium
  downloaded). Standalone scripts outside that folder need `NODE_PATH` pointed at its `node_modules`.
- **Claude Code skills installed** (global `~/.claude/skills/`): `llm-council`, `playwright-skill`,
  `ui-ux-pro-max`, `frontend-design`. Freshly-installed skills only become directly invocable after
  a Claude Code restart.
