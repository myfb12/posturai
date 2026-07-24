import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, AccessibilityInfo } from "react-native";
import { Screen } from "../components/ui/Screen";
import { PostureFigure } from "../components/PostureFigure";
import { MonoLabel, Numeric } from "../components/ui/Typography";
import { color } from "../theme/tokens";
import { usePostureStore } from "../store/postureStore";
import { sampleFreshScan } from "../data/mockScans";
import { analyzeRatios } from "../data/postureModel";
import { poseEngine } from "../pose/poseEngine";

const MIN_MS = 2600; // floor so the scan animation reads even if detection is instant
const TIMEOUT_MS = 16000;

// Live terminal log describing what the on-device pipeline genuinely does.
const LOG_STEPS: { at: number; text: string }[] = [
  { at: 0.04, text: "› boot on-device pose engine" },
  { at: 0.16, text: "› detecting body landmarks…" },
  { at: 0.32, text: "› mapping cervical angle…" },
  { at: 0.48, text: "› measuring trunk offset…" },
  { at: 0.62, text: "› checking base / standing line…" },
  { at: 0.76, text: "› scoring composite index…" },
  { at: 0.88, text: "› estimating potential ceiling…" },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Outcome =
  | { kind: "result"; ratios: { head: number; trunk: number; base: number } }
  | { kind: "sample" }
  | { kind: "error"; reason: any };

export function AnalyzingScreen() {
  const { capturedUri, pushResult, pushError, useSampleResult } = usePostureStore();
  const [pct, setPct] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const sweep = useRef(new Animated.Value(0)).current;
  const preview = useRef(sampleFreshScan()).current;

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const start = Date.now();

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced && !cancelled) {
        Animated.loop(
          Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
        ).start();
      }
    });

    // Run the real on-device pose engine on the captured photo.
    const detection: Promise<Outcome> = (async () => {
      if (!capturedUri) return { kind: "sample" };
      const r = await poseEngine.detectRatios(capturedUri);
      if (r.ok) return { kind: "result", ratios: r.ratios };
      if (r.reason === "unavailable") return { kind: "sample" }; // native w/o dev build
      return { kind: "error", reason: r.reason };
    })();
    const guarded: Promise<Outcome> = Promise.race([
      detection,
      delay(TIMEOUT_MS).then(() => ({ kind: "error", reason: "engine" }) as Outcome),
    ]);

    const loop = () => {
      if (cancelled) return;
      const p = Math.min(0.95, (Date.now() - start) / MIN_MS * 0.95);
      setPct(Math.round(p * 100));
      setLogs(LOG_STEPS.filter((s) => p >= s.at).map((s) => s.text));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    Promise.all([guarded, delay(MIN_MS)]).then(([outcome]) => {
      if (cancelled) return;
      cancelAnimationFrame(raf);
      setPct(100);
      setLogs([...LOG_STEPS.map((s) => s.text), "✓ read complete"]);
      setTimeout(() => {
        if (cancelled) return;
        if (outcome.kind === "result") pushResult(analyzeRatios(outcome.ratios, { isSample: false }));
        else if (outcome.kind === "error") pushError(outcome.reason);
        else useSampleResult();
      }, 420);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sweepY = sweep.interpolate({ inputRange: [0, 1], outputRange: [10, 300] });

  return (
    <Screen scroll={false}>
      <View className="mt-2">
        <MonoLabel className="text-acid">Diagnostic scan</MonoLabel>
        <Text className="mt-1 font-display-bold text-white text-[22px]">Reading your alignment</Text>
      </View>

      <View className="mt-4 flex-1 items-center justify-center">
        <View style={{ width: 220, height: 320 }}>
          <PostureFigure ratios={preview.ratios} t={0} width={220} height={320} />
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute", left: 0, right: 0, height: 2, top: sweepY,
              backgroundColor: color.acid, shadowColor: color.acid, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, right: 0, height: 60, top: Animated.subtract(sweepY, 60), backgroundColor: color.acid, opacity: 0.08 }}
          />
        </View>
      </View>

      <View className="mb-2">
        <View className="flex-row items-end justify-between">
          <Numeric className="text-[52px] text-acid">
            {pct}
            <Text className="font-mono text-[16px] text-zinc-500">%</Text>
          </Numeric>
          <MonoLabel className="mb-3">On-device · secure</MonoLabel>
        </View>
        <View className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <View className="h-full rounded-full bg-acid" style={{ width: `${pct}%` }} />
        </View>
      </View>

      <View className="mb-4 h-[132px] rounded-2xl border border-white/[0.08] bg-black/40 p-3">
        {logs.map((l, i) => (
          <Text key={i} className="font-mono text-[11px]" style={{ color: i === logs.length - 1 ? color.mint : color.zinc500, lineHeight: 16 }}>
            {l}
          </Text>
        ))}
      </View>
    </Screen>
  );
}
