// Real on-device pose detection for the PosturAI prototype.
// Uses MediaPipe Pose Landmarker (WASM) — the analysis runs entirely in the
// browser, so the photo never leaves the device. Only the model code is fetched.
import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

let landmarker = null;
let loading = null;

async function load() {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    // Try GPU first, fall back to CPU if the device/driver can't do it.
    for (const delegate of ["GPU", "CPU"]) {
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
  })();
  return loading;
}

// Returns { ok, points, avgVisibility } or { ok:false, reason }.
// points are normalized (0..1) coordinates for ear/shoulder/hip/knee/ankle,
// averaged across the visible left/right pair (side view collapses them).
async function analyze(imgEl) {
  let lm;
  try {
    const model = await load();
    const res = model.detect(imgEl);
    lm = res && res.landmarks && res.landmarks[0];
  } catch (e) {
    return { ok: false, reason: "engine", message: String(e && e.message || e) };
  }
  if (!lm) return { ok: false, reason: "no-pose" };

  const V = (a, b) => {
    // pick the landmark of the pair with higher visibility, average positions
    const va = a.visibility == null ? 1 : a.visibility;
    const vb = b.visibility == null ? 1 : b.visibility;
    return {
      x: (a.x * va + b.x * vb) / (va + vb || 1),
      y: (a.y * va + b.y * vb) / (va + vb || 1),
      v: Math.max(va, vb),
    };
  };

  const ear = V(lm[7], lm[8]);
  const shoulder = V(lm[11], lm[12]);
  const hip = V(lm[23], lm[24]);
  const knee = V(lm[25], lm[26]);
  const ankle = V(lm[27], lm[28]);

  const points = { ear, shoulder, hip, knee, ankle };
  const avgVisibility =
    (ear.v + shoulder.v + hip.v + knee.v + ankle.v) / 5;

  // need a reasonably confident upper body + a torso to measure against
  if (ear.v < 0.4 || shoulder.v < 0.4 || hip.v < 0.4) {
    return { ok: false, reason: "low-confidence", avgVisibility };
  }
  const torso = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
  if (torso < 0.06) return { ok: false, reason: "too-small", avgVisibility };

  return { ok: true, points, avgVisibility };
}

window.PosturAIPose = { analyze, preload: load };
window.dispatchEvent(new Event("posturai-pose-ready"));
