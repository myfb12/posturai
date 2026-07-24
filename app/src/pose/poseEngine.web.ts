// Web pose engine — REAL on-device detection, ported from the prototype's
// pose.js. Uses MediaPipe Pose Landmarker (WASM). The image is analyzed in the
// browser; only the model code is fetched (from CDN, same as the prototype).
// Metro serves this file for the web target; native gets poseEngine.native.ts.
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Ratios } from "../data/postureModel";
import { PoseEngine, PoseResult } from "./poseEngine.types";

const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

let landmarker: PoseLandmarker | null = null;
let loading: Promise<PoseLandmarker> | null = null;

async function load(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "IMAGE",
          numPoses: 1,
        });
        return landmarker;
      } catch (e) {
        if (delegate === "CPU") throw e;
      }
    }
    throw new Error("pose landmarker init failed");
  })();
  return loading;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load"));
    img.src = uri;
  });
}

// visibility-weighted average of a left/right landmark pair (side view collapses them)
function avg(a: any, b: any) {
  const va = a.visibility == null ? 1 : a.visibility;
  const vb = b.visibility == null ? 1 : b.visibility;
  return { x: (a.x * va + b.x * vb) / (va + vb || 1), y: (a.y * va + b.y * vb) / (va + vb || 1), v: Math.max(va, vb) };
}

async function detectRatios(uri: string): Promise<PoseResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(uri);
  } catch {
    return { ok: false, reason: "load" };
  }

  let lm: any;
  try {
    const model = await load();
    const res = model.detect(img);
    lm = res && res.landmarks && res.landmarks[0];
  } catch {
    return { ok: false, reason: "engine" };
  }
  if (!lm) return { ok: false, reason: "no-pose" };

  const ear = avg(lm[7], lm[8]);
  const shoulder = avg(lm[11], lm[12]);
  const hip = avg(lm[23], lm[24]);
  const knee = avg(lm[25], lm[26]);
  const ankle = avg(lm[27], lm[28]);

  if (ear.v < 0.4 || shoulder.v < 0.4 || hip.v < 0.4) return { ok: false, reason: "low-confidence" };
  const torsoLen = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
  if (torsoLen < 0.06) return { ok: false, reason: "too-small" };

  const torsoY = Math.abs(shoulder.y - hip.y) || 0.001;
  const baseY = Math.abs(hip.y - ankle.y) || 0.001;
  const ratios: Ratios = {
    head: Math.abs(ear.x - shoulder.x) / torsoY,
    trunk: Math.abs(shoulder.x - hip.x) / torsoY,
    base: Math.abs(hip.x - ankle.x) / baseY,
  };
  const visibility = (ear.v + shoulder.v + hip.v + knee.v + ankle.v) / 5;
  return { ok: true, ratios, visibility };
}

export const poseEngine: PoseEngine = { detectRatios, available: true };
