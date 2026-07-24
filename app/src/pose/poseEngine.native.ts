// Native pose engine — placeholder.
//
// Real on-device detection on iOS/Android needs a native module that does NOT
// run in Expo Go and can't be built on this Windows machine (no Xcode):
// react-native-vision-camera + a MediaPipe/TFLite frame processor (or the Apple
// Vision VNDetectHumanBodyPoseRequest path), wired through a custom EAS dev build.
//
// Until that dev build exists, native reports "unavailable" and the app falls
// back to a clearly-labelled SAMPLE result rather than pretending to measure.
// The web engine (poseEngine.web.ts) does the real detection today.
import { PoseEngine, PoseResult } from "./poseEngine.types";

async function detectRatios(_uri: string): Promise<PoseResult> {
  return { ok: false, reason: "unavailable" };
}

export const poseEngine: PoseEngine = { detectRatios, available: false };
