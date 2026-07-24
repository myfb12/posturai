# PosturAI — v1 Prototype

An interactive web prototype of the PosturAI iOS app. It's the **visual spec** for the
real Swift/SwiftUI build — every screen, flow, and design token here maps to what the
native app should implement.

Open `index.html` in any browser. Click the flow chips under the phone, use the shutter
and buttons inside the phone, or press ← / → to step through screens.

## What the LLM Council decided (drives this design)

- **Analysis runs on-device** (Apple Vision `VNDetectHumanBodyPoseRequest`). No backend,
  no uploads — the whole privacy story is "nothing leaves your phone."
- **The hard problem is the photo, not the model** → the Guided Capture screen is the
  most-invested screen: side-view silhouette, plumb guide, and a bubble level.
- **No degrees / no medical claims.** Findings are shown as qualitative bands
  ("Noticeably forward", "Slightly rounded", "Well aligned"), never numbers you can't
  defend on an uncalibrated 2D photo. A disclaimer states it's a wellness tool.
- **v1 scope = 6 screens:** Consent → Home → Guided Capture → Analyzing → Result →
  Progress (one before/after compare). Deferred: accounts, full history/trends, cloud/LLM
  analysis, exercise programs, HealthKit.

## Design system

- **Signature motif — the plumb line.** A vertical alignment axis (posture's oldest
  assessment instrument) recurs as the logo, the capture guide, and the result overlay.
- **Palette:** trust teal `#0E7A86`, aligned-green `#2FA37D`, and warm coral `#E8794B`
  for deviations (coaching, not alarm-red). Full light + dark tokens in `styles.css`.
- **Type:** Fraunces (soft serif) for verdict/headings, Plus Jakarta Sans for UI.
- **Skeleton loaders:** Home last-check card (first load) and the Analyzing screen use
  shimmer placeholders. Respects `prefers-reduced-motion`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All six screens inside an iPhone frame |
| `styles.css` | Design tokens, components, light/dark themes, skeleton shimmer |
| `app.js` | View routing, skeleton timing, capture micro-interactions |
| `shots/` | Playwright screenshots (flow + dark mode + 375px) |

## Design-review revisions (round 2)

A second LLM Council reviewed the built prototype via Playwright screenshots. Highest-confidence
changes now applied:

- **Removed the numeric "72" score** everywhere — it read as a medical-sounding claim the app
  disavowed, and looked like fake data before any capture. Screens now lead with qualitative
  bands ("Noticeably forward") and plain language ("Your head leans forward").
- **Home** — daily M–S streak (which contradicted the once-a-week promise and manufactured
  false obligation) replaced with a weekly "rhythm" card; last-check card is now dated so it
  reads as history, not a live gauge; the cue is tagged "Move 1 of 2" to match the result.
- **Analyzing** — the generic gray skeleton (which read as a broken load) now shows the pose
  building along the plumb line, so the skeleton state previews the result aesthetic.
- **Consent** — the on-device privacy guarantee is now the loud hero element.
- **Capture** — dropped the nonsensical "Step 1 of 1", clarified direction ("Left shoulder
  toward the camera"), brightened the guide, added a close button.
- **Compare** — reframed from raw points (64→72) to band movement with a dashed "2 wks ago"
  marker + arrow, so progress is legible beyond color/number.
- Labeled the center nav button "Check"; relabeled "plumb" as "aligned line"; added a
  status-bar scrim so scrolled content never collides with the clock.

## Real camera + real analysis (added)

The prototype now does genuine work, not just mockups:

- **Live camera** on the Check screen via `getUserMedia` (needs HTTPS — see the server).
- **Gallery picker** — the library button opens your photos; pick a side-on shot to analyze.
- **Real on-device pose detection** — `pose.js` runs **MediaPipe Pose Landmarker** (WASM) entirely
  in the browser. The photo never leaves the device; only the model code is fetched from a CDN.
  It detects ear/shoulder/hip/knee/ankle, computes real forward-head / trunk / base ratios, maps
  them to qualitative bands, and draws the **detected skeleton over your actual photo** (`app.js`
  → `drawPose`). Three result modes: real analysis, an honest **failure state** ("couldn't read a
  clear pose") when no full-body side-on pose is found, and the mock schematic for click-through.

**Caveats:** side-view detection quality varies with framing/lighting; a single 2D photo yields a
relative read, not a clinical angle (hence qualitative bands). The model loads from a CDN, so the
prototype needs internet the first time (the real app would bundle it and use Apple Vision).

### Server

`server.js` serves **HTTPS on :5173** (self-signed cert `cert.pem`/`key.pem`, required for the
camera) and plain HTTP on :5174. On a phone, accept the one-time certificate warning.

## Testing

Screens were captured and checked with Playwright (Chromium) across the full flow,
dark mode, and a 375px small phone — zero console errors. Verified against the
ui-ux-pro-max app pre-delivery checklist: ≥44pt touch targets, SVG-only icons,
4.5:1 text contrast in both themes, visible focus rings, safe-area insets, and
color never used as the sole indicator.
