import { Ratios } from "../data/postureModel";

// Result of running the on-device pose engine on a captured/selected photo.
// Mirrors the honest states of the web prototype's pose.js: a real read, an
// honest failure (no clear side-on pose), or "engine not available in this build".
export type PoseReason =
  | "no-pose" // no person detected
  | "low-confidence" // found a person but key joints weren't confident
  | "too-small" // subject too small in frame
  | "load" // image failed to load
  | "engine" // pose engine error
  | "unavailable"; // real detection not compiled into this build (native w/o dev build)

export type PoseResult =
  | { ok: true; ratios: Ratios; visibility: number }
  | { ok: false; reason: PoseReason };

export interface PoseEngine {
  // Detect posture ratios from an image URI. Runs fully on-device.
  detectRatios(uri: string): Promise<PoseResult>;
  // Whether this build can do real detection (web = yes; native stub = no).
  available: boolean;
}
