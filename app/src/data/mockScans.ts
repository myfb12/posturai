// Seeded sample scans so the Home dashboard and Progress screen have honest
// history to render before any real capture. Clearly flagged isSample.
import { analyzeRatios, Ratios, ScanResult } from "./postureModel";

const DAY = 24 * 60 * 60 * 1000;

// A gentle improvement arc over three weeks (worse → better) to demo Progress.
const history: { daysAgo: number; ratios: Ratios }[] = [
  { daysAgo: 21, ratios: { head: 0.31, trunk: 0.24, base: 0.16 } },
  { daysAgo: 14, ratios: { head: 0.27, trunk: 0.21, base: 0.14 } },
  { daysAgo: 7, ratios: { head: 0.24, trunk: 0.18, base: 0.12 } },
];

export function seedHistory(now = Date.now()): ScanResult[] {
  return history.map((h, i) =>
    analyzeRatios(h.ratios, {
      id: `sample_${i}`,
      takenAt: now - h.daysAgo * DAY,
      isSample: true,
    })
  );
}

// A fresh "just scanned" result used when the user runs a demo scan on web
// (where the real on-device pose engine isn't wired yet). Mid-range so the
// results screen shows a meaningful gap to close.
export function sampleFreshScan(now = Date.now()): ScanResult {
  return analyzeRatios(
    { head: 0.25, trunk: 0.17, base: 0.11 },
    { id: `sample_fresh_${now}`, takenAt: now, isSample: true }
  );
}
