# PosturAI — mobile app (Expo / React Native)

The native rebuild of PosturAI as a viral, high-conversion posture-analysis app in the
**Umax / Cal AI** mold — pitch-black canvas, acid-lime accent, glassmorphism, a diagnostic
scan animation, and a high-density biometric results matrix. Built with **Expo (SDK 57) +
TypeScript + NativeWind**, runnable on the web target so it can be Playwright-tested from Windows.

> The web prototype in [`../prototype/`](../prototype) remains the honest reference for the real
> on-device pose pipeline (MediaPipe). This app is the productized UI; pose detection is wired in a
> later phase (see "Honesty model" and "Roadmap").

## Run it

```bash
cd app
npm install
npm run web        # opens the web target (Playwright-testable) at http://localhost:8081
# npm run ios / npm run android  → Expo Go on a device (camera works there, not on web)
```

The camera + gallery use `expo-camera` / `expo-image-picker` with real permission checks. On the
web target (no camera in headless/most browsers) the shutter falls back to a sample scan so the full
flow is demoable and testable.

## The six screens (store-driven)

`Consent → Home → Capture → Analyzing → Results → Progress`, all routed by a single global
**Zustand `PostureStore`** (`src/store/postureStore.ts`). Taking or picking a photo dispatches into
the store, which owns the analyze→result pipeline and dynamically populates Home, Results, and
Progress — no hardcoded per-screen copy.

- **Consent** — on-device privacy as the loud hero; wellness-not-diagnosis disclaimer.
- **Home** — dynamic index dashboard, 🔥 day-streak, week/trend cards, and the fully-unlocked
  "De-Hump Routine" checklist (no paywalls / locked states).
- **Capture** — guided side-on capture: plumb-line + framing overlay, flip/flash, gallery picker.
- **Analyzing** — 3.4s diagnostic scan: sweeping laser over the figure, 0–100% bar, live terminal log.
- **Results** — the 6-card biometric matrix, floating Cal-AI callout pins over the scanned figure,
  an SVG population bell curve, and an interactive "current ↔ potential" morph slider.
- **Progress** — index trend chart + per-measure band movement over the seeded history.

## Design system

- **Palette** (`tailwind.config.js` + `src/theme/tokens.ts`): canvas `#050507`, translucent slate
  glass `#0E0F14` w/ `border-white/[0.08]` + backdrop blur, **acid lime `#CCFF00`** (CTA/active),
  cyber-mint `#00FF9D` (optimal), crimson-coral `#FF2A54` (deficit).
- **Type**: Space Mono micro-caps eyebrows (`tracking`, 10px, uppercase, zinc-400) + Space Grotesk
  bold numeric gauges.
- **Signature**: the **plumb line** — a vertical alignment axis carried from the brand into the dark
  aesthetic; the scanned joint-chain figure (`PostureFigure`) hangs off it and is driven by the same
  ratios the index uses, so the picture and the numbers can never disagree.
- Icons are all vector (`src/components/ui/Icon.tsx`) — no emoji as structural icons.

## Honesty model (important)

This was reviewed by an LLM Council. The verdict: build the full viral experience, but **never present
fabricated clinical numbers as real measurements**. So there are no "lbs of spinal force" or "inches
of height lost" — a 2D photo can't yield them. Instead everything on screen is a *transparent
derivation* of the real normalized pose ratios, in `src/data/postureModel.ts`:

- **PosturAI Index (0–100)** — a composite of the ratios, framed as an app index, not a clinical score.
- **Estimated angle ranges** ("~12–16°, est."), never false-precision decimals.
- **Letter grades** are app grades, explicitly "not a diagnosis".
- **Percentile** is labelled a modeled estimate vs an app baseline.
- The **potential morph** is an illustration of corrected alignment, not a promised outcome.

`postureModel.ts` is the single place ratios become on-screen numbers, so the framing stays reviewable.

## Testing

Verified with Playwright against the web target (`expo start --web`): full six-screen flow,
mobile viewport, zero console/page errors, no horizontal overflow on any screen, all six matrix
cards present, and assertions that no fabricated lbs/inches claims appear while the honest
estimate/disclaimer labels do. Reference screenshots in [`shots/`](shots).

## Roadmap

- Wire real on-device pose (react-native-vision-camera + a TFLite/MediaPipe frame processor) via an
  EAS dev build — replace the sample result in `PostureStore.completeAnalysis` with `analyzeRatios(realRatios)`.
- Run the [`../prototype/lab.html`](../prototype) repeatability check on real photos before trusting the trend line.
- Persist streak/scans (async-storage is installed) and add share/export.
