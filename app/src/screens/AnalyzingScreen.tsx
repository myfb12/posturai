import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, AccessibilityInfo } from "react-native";
import { Screen } from "../components/ui/Screen";
import { PostureFigure } from "../components/PostureFigure";
import { MonoLabel, Numeric } from "../components/ui/Typography";
import { color } from "../theme/tokens";
import { usePostureStore } from "../store/postureStore";
import { sampleFreshScan } from "../data/mockScans";

const SCAN_MS = 3400;

// Diagnostic scan sequence. Progress 0→100, a laser line sweeping the figure,
// and a live terminal log. Logs describe what the pipeline genuinely does.
const LOG_STEPS: { at: number; text: string }[] = [
  { at: 0.05, text: "› boot on-device pose engine" },
  { at: 0.18, text: "› detecting body landmarks…" },
  { at: 0.34, text: "› mapping cervical angle…" },
  { at: 0.5, text: "› measuring trunk offset…" },
  { at: 0.64, text: "› checking base / standing line…" },
  { at: 0.78, text: "› scoring composite index…" },
  { at: 0.9, text: "› estimating potential ceiling…" },
  { at: 0.99, text: "✓ read complete" },
];

export function AnalyzingScreen() {
  const completeAnalysis = usePostureStore((s) => s.completeAnalysis);
  const [pct, setPct] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const sweep = useRef(new Animated.Value(0)).current;
  const reduced = useRef(false);

  // Preview the figure being scanned (sample ratios in the web-first phase).
  const preview = useRef(sampleFreshScan()).current;

  useEffect(() => {
    let raf: number;
    let done = false;
    const start = Date.now();

    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      reduced.current = r;
      if (!r) {
        Animated.loop(
          Animated.timing(sweep, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          })
        ).start();
      }
    });

    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / SCAN_MS);
      setPct(Math.round(p * 100));
      setLogs(LOG_STEPS.filter((s) => p >= s.at).map((s) => s.text));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        setTimeout(() => completeAnalysis(), 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sweepY = sweep.interpolate({ inputRange: [0, 1], outputRange: [10, 300] });

  return (
    <Screen scroll={false}>
      <View className="mt-2">
        <MonoLabel className="text-acid">Diagnostic scan</MonoLabel>
        <Text className="mt-1 font-display-bold text-white text-[22px]">Reading your alignment</Text>
      </View>

      {/* Figure + sweeping laser */}
      <View className="mt-4 flex-1 items-center justify-center">
        <View style={{ width: 220, height: 320 }}>
          <PostureFigure ratios={preview.ratios} t={0} width={220} height={320} />
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              top: sweepY,
              backgroundColor: color.acid,
              shadowColor: color.acid,
              shadowOpacity: 0.9,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 60,
              top: Animated.subtract(sweepY, 60),
              backgroundColor: color.acid,
              opacity: 0.08,
            }}
          />
        </View>
      </View>

      {/* Progress */}
      <View className="mb-2">
        <View className="flex-row items-end justify-between">
          <Numeric className="text-[52px] text-acid">{pct}
            <Text className="font-mono text-[16px] text-zinc-500">%</Text>
          </Numeric>
          <MonoLabel className="mb-3">On-device · secure</MonoLabel>
        </View>
        <View className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <View className="h-full rounded-full bg-acid" style={{ width: `${pct}%` }} />
        </View>
      </View>

      {/* Terminal log */}
      <View className="mb-4 h-[132px] rounded-2xl border border-white/[0.08] bg-black/40 p-3">
        {logs.map((l, i) => (
          <Text
            key={i}
            className="font-mono text-[11px]"
            style={{ color: i === logs.length - 1 ? color.mint : color.zinc500, lineHeight: 16 }}
          >
            {l}
          </Text>
        ))}
      </View>
    </Screen>
  );
}
