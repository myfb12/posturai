// Honest posture model.
//
// Ground truth the pipeline can actually produce from a 2D side-on photo:
// normalized ratios (horizontal offset / body-segment height). Everything the
// UI shows is a TRANSPARENT DERIVATION of those ratios — a composite index, a
// letter grade, an estimated angle RANGE — never a fabricated clinical unit
// (no pounds of spinal force, no inches of height lost presented as measured).
//
// The prior LLM Council's line holds: no numeric claim we can't defend from an
// uncalibrated photo. This file is the single place that turns ratios into the
// numbers on screen, so the framing stays consistent and reviewable.

import { Band } from "../theme/tokens";

export type Ratios = {
  head: number; // ear→shoulder horizontal offset / torso height
  trunk: number; // shoulder→hip horizontal offset / torso height
  base: number; // hip→ankle horizontal offset / leg height
};

export type Measure = {
  key: "head" | "trunk" | "base" | "upper";
  label: string;
  band: Band;
  // Human-readable value. Estimates carry "est." / relative framing on purpose.
  display: string;
  caption: string;
};

export type ScanResult = {
  id: string;
  takenAt: number; // epoch ms
  ratios: Ratios;
  index: number; // 0–100 PosturAI Index (composite, not clinical)
  potential: number; // 0–100 achievable if alignment reaches the good range
  gap: number; // potential − index
  percentile: number; // modeled estimate vs app baseline (0–100)
  measures: Measure[];
  overallBand: Band;
  isSample: boolean; // true = mock/prototype data, not a real on-device scan
};

// Thresholds mirror the web prototype's metrics.js (good / mild / deficit).
const T = {
  head: { good: 0.18, mild: 0.4 },
  trunk: { good: 0.12, mild: 0.26 },
  base: { good: 0.1, mild: 0.2 },
};

const IDEAL: Ratios = { head: 0.08, trunk: 0.05, base: 0.05 };

function bandFor(v: number, t: { good: number; mild: number }): Band {
  return v < t.good ? "good" : v < t.mild ? "mild" : "deficit";
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Per-measure 0–100 sub-score. Linear falloff from an ideal ratio; deliberately
// simple and explainable rather than pseudo-precise.
function subScore(v: number, ideal: number, k: number): number {
  return clamp(Math.round(100 - (v - ideal) * k), 0, 100);
}

// Letter grade from a sub-score — an APP grade, not a clinical kyphosis stage.
function letterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 82) return "A-";
  if (score >= 74) return "B";
  if (score >= 66) return "B-";
  if (score >= 58) return "C";
  if (score >= 50) return "C-";
  return "D";
}

// Head ratio → estimated forward-lean angle RANGE, always labelled "est."
// Rough small-angle mapping; the ± range is the honesty (a photo can't pin a decimal).
function headAngleRange(head: number): { lo: number; hi: number } {
  const mid = head * 55; // relative, uncalibrated
  return { lo: Math.max(0, Math.round(mid - 2)), hi: Math.round(mid + 2) };
}

// Standard-normal CDF for the percentile (modeled estimate, clearly labelled).
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return 1 - p;
}

// App-baseline reference distribution for the PosturAI Index (a modeled
// reference, not a clinical population norm — surfaced as "estimate").
const BASELINE = { mean: 64, sd: 15 };

export function analyzeRatios(
  ratios: Ratios,
  opts: { id?: string; takenAt?: number; isSample?: boolean } = {}
): ScanResult {
  const headScore = subScore(ratios.head, IDEAL.head, 180);
  const trunkScore = subScore(ratios.trunk, IDEAL.trunk, 240);
  const baseScore = subScore(ratios.base, IDEAL.base, 260);
  // "Upper-back" curve read is derived from trunk rounding (the pipeline's
  // thoracic proxy) — framed as an app grade, not a diagnosis.
  const upperScore = clamp(Math.round(trunkScore * 0.85 + headScore * 0.15), 0, 100);

  const index = Math.round(headScore * 0.4 + trunkScore * 0.35 + baseScore * 0.25);

  const idealIndex = Math.round(
    subScore(IDEAL.head, IDEAL.head, 180) * 0.4 +
      subScore(IDEAL.trunk, IDEAL.trunk, 240) * 0.35 +
      subScore(IDEAL.base, IDEAL.base, 260) * 0.25
  );
  // Personalised ceiling: most of the way to ideal, never a fake 100.
  const potential = clamp(Math.round(index + (idealIndex - index) * 0.85), index, 96);

  const headBand = bandFor(ratios.head, T.head);
  const trunkBand = bandFor(ratios.trunk, T.trunk);
  const baseBand = bandFor(ratios.base, T.base);
  const upperBand: Band = upperScore >= 74 ? "good" : upperScore >= 58 ? "mild" : "deficit";

  const angle = headAngleRange(ratios.head);
  const percentile = Math.round(normalCdf((index - BASELINE.mean) / BASELINE.sd) * 100);

  const overallBand: Band =
    [headBand, trunkBand, baseBand].includes("deficit")
      ? "deficit"
      : [headBand, trunkBand, baseBand].includes("mild")
        ? "mild"
        : "good";

  const measures: Measure[] = [
    {
      key: "head",
      label: "Head Alignment",
      band: headBand,
      display: `~${angle.lo}–${angle.hi}°`,
      caption: "forward lean · estimate",
    },
    {
      key: "trunk",
      label: "Forward Load",
      band: trunkBand,
      display: trunkBand === "good" ? "Low" : trunkBand === "mild" ? "Elevated" : "High",
      caption: "relative load index",
    },
    {
      key: "base",
      label: "Standing Line",
      band: baseBand,
      display: baseBand === "good" ? "Stacked" : "Shifted",
      caption: "hip-over-ankle · estimate",
    },
    {
      key: "upper",
      label: "Upper-Back Curve",
      band: upperBand,
      display: `Grade ${letterGrade(upperScore)}`,
      caption: "posture grade · not a diagnosis",
    },
  ];

  return {
    id: opts.id ?? `scan_${Math.random().toString(36).slice(2, 9)}`,
    takenAt: opts.takenAt ?? Date.now(),
    ratios,
    index,
    potential,
    gap: potential - index,
    percentile,
    measures,
    overallBand,
    isSample: opts.isSample ?? true,
  };
}

export function bandLabel(band: Band): string {
  return band === "good" ? "OPTIMAL" : band === "mild" ? "WATCH" : "NEEDS WORK";
}
