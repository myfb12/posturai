// Resolved by TypeScript for types. At RUNTIME, Metro substitutes the
// platform file: poseEngine.web.ts (real MediaPipe detection) on web, or
// poseEngine.native.ts (honest "unavailable" fallback) on iOS/Android.
export * from "./poseEngine.types";
export { poseEngine } from "./poseEngine.native";
