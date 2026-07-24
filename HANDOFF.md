# PosturAI — Project Handoff

**Last updated:** 2026-07-24
**Repo:** `C:\Users\yasin\posturai` · git remote `https://github.com/myfb12/posturai.git` (pushed, `main`)
**Latest commit:** `16e9943`

---

## 1. TL;DR — what this is and where it stands

PosturAI: photograph yourself **side-on**, it reads your posture (forward head, rounded shoulders,
base alignment) and gives gentle guidance — **all on-device, a wellness tool, never a diagnosis.**

The repo has **two tracks**:

| Track | Path | What it is | Status |
|---|---|---|---|
| **The app** (current focus) | [`app/`](app/) | Expo / React Native / TypeScript rebuild as a viral "Umax / Cal AI style" product (dark + acid-lime, biometric matrix, scan animation). Runs on the **web target** so it's testable on Windows. | Six screens built, real on-device pose wired (web), Playwright-verified. Native real-camera pending an EAS dev build. |
| **The prototype** | [`prototype/`](prototype/) | The original HTML/CSS/JS proof that the on-device MediaPipe pipeline works, plus a repeatability lab. | Complete; it's the **reference** for the pose pipeline and the honest-analysis stance. |

Both are committed and pushed. Everything below is honest about what's real vs. mock.

---

## 2. The app (`app/`) — primary deliverable

Expo **SDK 57** + React **19.2** + React Native **0.86** + **NativeWind 4** + **Zustand 5** +
**react-native-web** (so `expo start --web` gives a browser build we can drive with Playwright).

### 2.1 Run & test

```bash
cd app
npm install
npm run web        # Metro web build at http://localhost:8081  (Playwright-testable)
# npm run ios / npm run android → Expo Go on a physical device (camera works there, not on web)
```

- On the **web target** the camera usually isn't available, so use the **gallery button** and pick a
  side-on full-body photo — that runs the *real* MediaPipe engine. The shutter falls back to a
  labelled SAMPLE result so the flow is always demoable.
- On a **phone** (same Wi-Fi) open `http://<LAN-IP>:8081` — the layout is the real mobile UI.
- Type check: `npx tsc --noEmit` (clean).

### 2.2 The six screens (all store-driven)

`Consent → Home → Capture → Analyzing → Results → Progress`, routed entirely by a single global
**Zustand `PostureStore`** ([`app/src/store/postureStore.ts`](app/src/store/postureStore.ts)). A scan
updates the store, which dynamically populates Home, Results, and Progress — no hardcoded per-screen
copy.

- **Consent** — on-device privacy as the loud hero; wellness-not-diagnosis disclaimer.
- **Home** — dynamic index dashboard, 🔥 day-streak, week/trend cards, fully-unlocked "De-Hump
  Routine" checklist (no paywalls / locked states).
- **Capture** — guided side-on capture; real `expo-camera` + `expo-image-picker` with permission
  checks, flip/flash state, plumb-line + framing overlay.
- **Analyzing** — 3.4s diagnostic scan: sweeping laser, 0–100% bar, live terminal log; it runs the
  pose engine during the animation and routes to the honest outcome. Reduced-motion aware.
- **Results** — the **6-card biometric matrix**, floating Cal-AI callout pins over the photo/figure,
  an SVG population bell curve, and an interactive current↔potential morph slider. Shows the captured
  `<Image>` under the pins when a photo exists; a RETAKE fallback (never empty space) when it doesn't;
  and an honest "Couldn't read a pose" screen when detection fails.
- **Progress** — index trend chart + per-measure band movement over the seeded history.

### 2.3 On-device pose engine (`app/src/pose/`)

Analysis is **real and on-device — no cloud, no API.** Platform-split module:

- **`poseEngine.web.ts`** — runs **MediaPipe Pose Landmarker (WASM)**, the same model as the
  prototype. Detects landmarks from the captured/selected photo → normalized ratios → `analyzeRatios()`.
  Only the model code is fetched (CDN, needs internet first run); the image never leaves the device.
- **`poseEngine.native.ts`** — returns `unavailable` for now (see §5) → app falls back to a labelled
  SAMPLE result.
- `poseEngine.ts` is the TS entry; Metro substitutes `.web`/`.native` at build time.

Outcomes the Analyzing screen routes to: **real result** (`isSample:false`, so the SAMPLE label drops
on its own) · **honest failure** ("Couldn't read a pose" + retake) when no clear side-on pose is found
· **labelled sample** for the no-photo / native-stub path.

### 2.4 Honesty model — READ BEFORE CHANGING RESULTS

Everything numeric on screen is a **transparent derivation of the real pose ratios**, computed in one
place: [`app/src/data/postureModel.ts`](app/src/data/postureModel.ts). There are deliberately **NO
fabricated clinical units** — no "lbs of spinal force", no "inches of height lost". A 2D photo can't
produce them.

- **PosturAI Index (0–100)** — a composite of the ratios, framed as an app index, not a clinical score.
- **Estimated angle ranges** ("~12–16°, est."), never false-precision decimals.
- **Letter grades** are app grades, explicitly "not a diagnosis".
- **Percentile** is labelled a modeled estimate vs an app baseline.
- The **potential morph** is an illustration of corrected alignment, not a promised outcome.

Do **not** reintroduce absolute clinical units, unlabelled precise degrees, or cloud analysis without
the user explicitly revisiting this — it reverses two LLM Council rulings and the privacy promise.

### 2.5 Design system

- **Palette** ([`app/src/theme/tokens.ts`](app/src/theme/tokens.ts) + `tailwind.config.js`): canvas
  `#050507`, translucent-slate glass `#0E0F14` w/ `border-white/[0.08]` + backdrop blur, **acid-lime
  `#CCFF00`** (CTA/active), cyber-mint `#00FF9D` (optimal), crimson-coral `#FF2A54` (deficit).
- **Type:** Space Mono micro-caps eyebrows + Space Grotesk bold numeric gauges.
- **Signature:** the **plumb line** carried into the dark aesthetic; the scanned joint-chain figure
  (`PostureFigure`) is driven by the same ratios as the index, so picture and numbers can't disagree.
- All icons are vector (`components/ui/Icon.tsx`) — no emoji as structural icons.
- On desktop web the app is locked into a centered `max-w-[430px]` phone frame.

### 2.6 App structure

```
app/
├─ App.tsx                    # fonts + store-driven router + web phone-frame
├─ app.json                   # dark UI, camera/picker permission strings, web=metro
├─ tailwind.config.js · babel.config.js · metro.config.js · global.css
└─ src/
   ├─ theme/tokens.ts         # raw color/space/radius tokens (SVG/Animated use these)
   ├─ data/
   │  ├─ postureModel.ts      # ★ ratios → Index / grades / ranges (the honesty source)
   │  └─ mockScans.ts         # seeded history + sample fresh scan
   ├─ pose/                   # on-device engine (web = MediaPipe, native = stub)
   ├─ store/postureStore.ts   # global Zustand state + capture→analyze→result pipeline
   ├─ components/             # PostureFigure, CalloutPin, BellCurve, PotentialSlider, IndexRing, ui/*
   └─ screens/                # the six screens
```

---

## 3. The prototype (`prototype/`) — reference pipeline

The original interactive **web** prototype (HTML/CSS/JS in an iPhone frame). It proved the on-device
MediaPipe pipeline and remains the reference. It uses the *original* calm brand (trust-teal
`#0E7A86`, Fraunces + Plus Jakarta Sans) and qualitative bands — the app productizes this.

**Run it:**
```bash
cd prototype
sh make-cert.sh    # first run / after a Wi-Fi change (regenerates the self-signed cert)
node server.js     # HTTPS :5173 (camera) + HTTP :5174 — prints the detected LAN IP
```
| Device | URL | Camera |
|---|---|---|
| This PC | http://localhost:5174 | ✅ webcam (use the gallery button with a side-on photo) |
| Phone (same Wi-Fi) | https://&lt;LAN-IP&gt;:5173 | ✅ (accept the one-time cert warning) |

The cert (`cert.pem`/`key.pem`) is **git-ignored** (private key, network-specific) — regenerate with
`make-cert.sh`. Key files: `pose.js` (MediaPipe wrapper), `metrics.js` (shared ratios→bands, single
source of truth for `app.js` + the lab), `lab.html` (see §6).

---

## 4. Decisions log (LLM Council + honesty stance)

Direction has been pressure-tested through the **LLM Council** skill (5 advisors → anonymized peer
review → chairman) three times. Treat these as deliberate, not gaps:

| Decision | Why |
|---|---|
| **On-device analysis only** (MediaPipe / Apple Vision) | The whole privacy story is "nothing leaves your phone." No backend, no uploads. |
| **No fabricated clinical numbers** | Precise angles/forces/inches from an uncalibrated 2D photo are scientifically indefensible *and* an App-Store health-claim liability. App uses a transparent Index + labelled estimates instead (§2.4). |
| **Guided capture is the hard problem** | Posture is only measurable from a consistent side-on angle; garbage-in dominates. |
| **Honest failure states** | If a pose can't be read, say so — never invent results. |
| **Viral mechanics, honestly framed** | The Umax/Cal-AI conversion power comes from the visual before/after + index gap, not fake decimals. |

**Refused (2026-07-24):** a directive to route capture through **Gemini cloud vision** and bind the
cards to its JSON. Not built — it would upload body photos to a third party (reversing the on-device
promise the Consent screen is built on) and invite an LLM to fabricate precise clinical numbers. The
user chose the on-device MediaPipe path instead. Don't add cloud vision / photo upload without an
explicit privacy-tradeoff decision **and** rewriting the consent screen.

---

## 5. Known limitations & honest caveats

- **Native real-camera detection is not done.** `poseEngine.native.ts` returns `unavailable`. Real
  native needs a native module (react-native-vision-camera + a MediaPipe/TFLite frame processor, or
  Apple Vision) via a custom **EAS dev build** — which **cannot be built on this Windows machine**
  (no Xcode; Android SDK not set up). The web engine does real detection today.
- **Repeatability is unvalidated.** Whether a single hand-held 2D photo gives a *repeatable* read
  shot-to-shot has not been measured. The tool exists (§6) but needs real photos. Don't trust the
  trend line until it's run.
- **Detection thresholds** (`app/src/data/postureModel.ts`, `prototype/metrics.js`) are hand-tuned and
  unvalidated — calibrate against real photos.
- **The MediaPipe model loads from a CDN** on first use (needs internet once); a shipping app should
  bundle it. The photo itself never leaves the device.
- **The `app/` numbers are still SAMPLE** until a real side-on photo is analyzed (the label drops
  automatically on a real read). Nothing is persisted yet (async-storage is installed, unused).

---

## 6. Recommended next steps

1. **Validate repeatability first** (the council's "do this first"). Open `prototype/lab.html`, drop
   in ~50 side-on photos of one person holding one posture; it runs the real pipeline and reports
   detection rate, per-measure noise (as a share of each band), band flips, and a
   stable/borderline/not-repeatable verdict + CSV. The harness is built and Playwright-tested — it
   just needs the photos taken.
2. **Native real detection.** Implement `poseEngine.native.ts` with react-native-vision-camera + a
   MediaPipe/TFLite frame processor via an **EAS dev build** run on a physical phone. The rest of the
   pipeline already consumes its `PoseResult`. (Offer standing: set up the EAS dev-build config.)
3. **Persist** streak/scans (async-storage) and add share/export for the viral loop.
4. **Tune thresholds** against the validated photos; consider bundling the pose model for offline.

---

## 7. Environment / toolchain

- **OS:** Windows 11. Node on PATH at `C:\Program Files\nodejs` (v24.x). **Python is not installed**
  (the ui-ux-pro-max search script needs it; its reference markdown works without it).
- **Git identity** is set repo-local (`myfb12` / `yasinbhinde@gmail.com`) — change if wrong.
- **Playwright** lives under the global skill `~/.claude/skills/playwright-skill` (Chromium
  downloaded). Standalone scripts need `NODE_PATH` pointed at its `node_modules`. Verification scripts
  used during development live in the session scratchpad (full-flow, real-analysis, desktop-frame).
- **Claude Code skills** (global `~/.claude/skills/`): `llm-council`, `playwright-skill`,
  `ui-ux-pro-max`, `frontend-design`. Freshly-installed skills need a Claude Code restart to be
  invocable.
- **Metro note:** `expo start --web` runs in CI mode here (reloads disabled); after editing source,
  restart with `--clear` to defeat the cache when verifying.
