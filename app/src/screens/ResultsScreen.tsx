import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Line } from "react-native-svg";
import { Screen } from "../components/ui/Screen";
import { GlassCard } from "../components/ui/Glass";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { BandPill, Tag } from "../components/ui/Pill";
import { MonoLabel, Numeric } from "../components/ui/Typography";
import { PostureFigure } from "../components/PostureFigure";
import { CalloutPin } from "../components/CalloutPin";
import { BellCurve } from "../components/BellCurve";
import { PotentialSlider } from "../components/PotentialSlider";
import { IndexRing } from "../components/IndexRing";
import { color, bandColor, Band } from "../theme/tokens";
import { Measure } from "../data/postureModel";
import { usePostureStore, selectCurrentResult } from "../store/postureStore";

function MetricCard({ measure }: { measure: Measure }) {
  const c = bandColor[measure.band];
  return (
    <GlassCard className="mb-3 w-[48%] p-4">
      <MonoLabel>{measure.label}</MonoLabel>
      <Text className="mt-2 font-display-bold text-[22px]" style={{ color: c, letterSpacing: -0.5 }}>
        {measure.display}
      </Text>
      <Text className="mt-0.5 font-display text-zinc-500 text-[11px]">{measure.caption}</Text>
      <View className="mt-3">
        <BandPill band={measure.band} />
      </View>
    </GlassCard>
  );
}

function headPinBand(m: Measure | undefined): Band {
  return m?.band ?? "mild";
}

export function ResultsScreen() {
  const result = usePostureStore(selectCurrentResult);
  const go = usePostureStore((s) => s.go);
  const capturedUri = usePostureStore((s) => s.capturedUri);
  if (!result) return null;

  const head = result.measures.find((m) => m.key === "head");
  const trunk = result.measures.find((m) => m.key === "trunk");

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <View>
          <MonoLabel className="text-acid">Scan complete</MonoLabel>
          <Text className="mt-1 font-display-bold text-white text-[24px]">Your posture read</Text>
        </View>
        <IconButton icon="share" label="Share result" />
      </View>

      {result.isSample && (
        <View className="mt-3">
          <Tag>SAMPLE DATA · PROTOTYPE</Tag>
        </View>
      )}

      {/* Hero: the captured photo (or the vector alignment preview when there's
          no photo) with floating callout pins overlaid. */}
      <GlassCard className="mt-4 p-3" glow={color.acid}>
        <View
          className="relative w-full overflow-hidden rounded-[16px]"
          style={{ height: 360, backgroundColor: "#0a0b0e" }}
        >
          {capturedUri ? (
            <>
              <Image
                source={{ uri: capturedUri }}
                resizeMode="cover"
                accessibilityLabel="Your captured scan photo"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
              />
              {/* darken toward the bottom so pins/labels stay legible on any photo */}
              <LinearGradient
                colors={["rgba(5,5,7,0.10)", "rgba(5,5,7,0.20)", "rgba(5,5,7,0.70)"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              {/* plumb line for continuity with the rest of the app */}
              <Svg width="100%" height="100%" style={{ position: "absolute" }}>
                <Line x1="50%" y1="6%" x2="50%" y2="94%" stroke={color.acid} strokeWidth={1} strokeOpacity={0.4} strokeDasharray="3 7" />
              </Svg>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <PostureFigure ratios={result.ratios} t={0} width={220} height={320} />
            </View>
          )}

          {head && (
            <CalloutPin x={0.62} y={0.14} label={`${head.display} drift`} band={head.band} icon="target" />
          )}
          {trunk && (
            <CalloutPin x={0.6} y={0.42} label={`Load: ${trunk.display}`} band={trunk.band} icon="bolt" />
          )}
          <CalloutPin x={0.44} y={0.92} label="Base" band={result.measures.find((m) => m.key === "base")!.band} align="left" />
        </View>

        {!capturedUri && (
          <View className="mt-3 flex-row items-center justify-between px-1">
            <Text className="font-mono text-[10px] text-zinc-500" style={{ letterSpacing: 1 }}>
              NO PHOTO · ALIGNMENT PREVIEW
            </Text>
            <Pressable
              onPress={() => go("capture")}
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              hitSlop={10}
              className="flex-row items-center gap-1.5 rounded-full border border-white/[0.12] px-3 py-1.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Icon name="camera" size={13} color={color.acid} />
              <Text className="font-mono text-[10px] text-acid" style={{ letterSpacing: 1 }}>
                RETAKE
              </Text>
            </Pressable>
          </View>
        )}
      </GlassCard>

      {/* Index + potential headline */}
      <View className="mt-4 flex-row items-center gap-4">
        <IndexRing value={result.index} band={result.overallBand} size={128} />
        <View className="flex-1">
          <MonoLabel>Max potential</MonoLabel>
          <View className="flex-row items-end gap-2">
            <Numeric className="text-[40px] text-acid">{result.potential}</Numeric>
            <View className="mb-2 rounded-full bg-acid px-2 py-0.5">
              <Text className="font-mono-bold text-[11px]" style={{ color: color.canvas }}>
                +{result.gap} PT GAP
              </Text>
            </View>
          </View>
          <Text className="mt-1 font-display text-zinc-400 text-[12px] leading-5">
            Reachable if your alignment moves into the optimal range.
          </Text>
        </View>
      </View>

      {/* 6-card biometric matrix */}
      <View className="mt-6">
        <MonoLabel>Biometric matrix</MonoLabel>
      </View>
      <View className="mt-3 flex-row flex-wrap justify-between">
        {/* Card 1: Index */}
        <GlassCard className="mb-3 w-[48%] p-4">
          <MonoLabel>Posture Index</MonoLabel>
          <Text className="mt-2 font-display-bold text-[28px]" style={{ color: bandColor[result.overallBand], letterSpacing: -1 }}>
            {result.index}
            <Text className="font-mono text-[13px] text-zinc-500">/100</Text>
          </Text>
          <Text className="mt-0.5 font-display text-zinc-500 text-[11px]">composite · on-device</Text>
          <View className="mt-3">
            <BandPill band={result.overallBand} />
          </View>
        </GlassCard>

        {/* Card 2: Max potential */}
        <GlassCard className="mb-3 w-[48%] p-4" glow={color.acid}>
          <MonoLabel className="text-acid">Max Potential</MonoLabel>
          <Text className="mt-2 font-display-bold text-[28px] text-acid" style={{ letterSpacing: -1 }}>
            {result.potential}
            <Text className="font-mono text-[13px] text-zinc-500">/100</Text>
          </Text>
          <Text className="mt-0.5 font-display text-zinc-500 text-[11px]">alignment ceiling</Text>
          <View className="mt-3 flex-row items-center gap-1">
            <Icon name="arrowUp" size={13} color={color.acid} strokeWidth={2.4} />
            <Text className="font-mono text-[10px] text-acid" style={{ letterSpacing: 1 }}>
              +{result.gap} TO CLOSE
            </Text>
          </View>
        </GlassCard>

        {/* Cards 3–6: measures */}
        {result.measures.map((m) => (
          <MetricCard key={m.key} measure={m} />
        ))}
      </View>

      {/* Bell curve percentile */}
      <GlassCard className="mt-2 p-5">
        <MonoLabel>Where you sit</MonoLabel>
        <Text className="mt-1 font-display-bold text-white text-[18px]">
          Better posture than{" "}
          <Text style={{ color: color.acid }}>~{result.percentile}%</Text> of app users
        </Text>
        <View className="mt-4 items-center">
          <BellCurve percentile={result.percentile} width={290} height={120} />
        </View>
      </GlassCard>

      {/* Potential slider */}
      <GlassCard className="mt-4 p-5">
        <MonoLabel className="text-acid">Your potential</MonoLabel>
        <Text className="mt-1 font-display-bold text-white text-[18px]">Drag to stand tall</Text>
        <View className="mt-4">
          <PotentialSlider ratios={result.ratios} index={result.index} potential={result.potential} />
        </View>
      </GlassCard>

      <View className="mt-6 gap-3">
        <Button label="Save & open my routine" icon="check" onPress={() => go("home")} />
        <Button label="Scan again" variant="ghost" icon="camera" onPress={() => go("capture")} />
      </View>
    </Screen>
  );
}
