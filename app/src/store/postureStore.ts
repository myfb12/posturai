import { create } from "zustand";
import { ScanResult } from "../data/postureModel";
import { sampleFreshScan, seedHistory } from "../data/mockScans";

export type Screen =
  | "consent"
  | "home"
  | "capture"
  | "analyzing"
  | "results"
  | "progress";

export type RoutineItem = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
};

// The "De-Hump Routine" — wellness cues, fully unlocked, no paywall/locked states.
const defaultRoutine: RoutineItem[] = [
  { id: "chin", title: "Chin tucks", detail: "10 slow reps · resets forward head", done: false },
  { id: "doorway", title: "Doorway pec stretch", detail: "30s each side · opens the chest", done: false },
  { id: "wall", title: "Wall angels", detail: "12 reps · wakes up the upper back", done: false },
  { id: "ext", title: "Thoracic extension", detail: "8 reps over a chair edge", done: false },
  { id: "walk", title: "Tall-stance walk", detail: "2 min · carry the new line", done: false },
];

type State = {
  screen: Screen;
  consented: boolean;
  scans: ScanResult[]; // newest last
  currentResultId: string | null;
  streak: number;
  routine: RoutineItem[];
  capturedUri: string | null;

  // navigation
  go: (screen: Screen) => void;
  giveConsent: () => void;

  // capture → analyze → result pipeline
  submitPhoto: (uri: string | null) => void; // called by capture/gallery handlers
  completeAnalysis: () => void; // called by the analyzing screen when the scan finishes

  toggleRoutine: (id: string) => void;
  resetDemo: () => void;
};

export const usePostureStore = create<State>((set, get) => ({
  screen: "consent",
  consented: false,
  scans: seedHistory(),
  currentResultId: null,
  streak: 3,
  routine: defaultRoutine,
  capturedUri: null,

  go: (screen) => set({ screen }),

  giveConsent: () => set({ consented: true, screen: "home" }),

  // Wraps the existing (native) capture/gallery handlers: they hand us a URI,
  // we stash it and move into the scan animation. Kept UI-agnostic on purpose so
  // the real expo-camera/expo-image-picker handlers dispatch here unchanged.
  submitPhoto: (uri) => set({ capturedUri: uri, screen: "analyzing" }),

  completeAnalysis: () => {
    // Web-first phase: synthesize an honest sample result. When the on-device
    // pose engine is wired, replace this with analyzeRatios(realRatios).
    const result = sampleFreshScan();
    set((s) => ({
      scans: [...s.scans, result],
      currentResultId: result.id,
      screen: "results",
    }));
  },

  toggleRoutine: (id) =>
    set((s) => ({
      routine: s.routine.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
    })),

  resetDemo: () =>
    set({
      screen: "consent",
      consented: false,
      scans: seedHistory(),
      currentResultId: null,
      capturedUri: null,
      routine: defaultRoutine,
    }),
}));

// Selectors
export const selectCurrentResult = (s: State): ScanResult | null =>
  s.scans.find((x) => x.id === s.currentResultId) ?? s.scans[s.scans.length - 1] ?? null;

export const selectLatestScan = (s: State): ScanResult | null =>
  s.scans[s.scans.length - 1] ?? null;
