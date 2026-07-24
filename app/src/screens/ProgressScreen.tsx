import React from "react";
import { View, Text } from "react-native";
import Svg, { Polyline, Circle, Line as SvgLine } from "react-native-svg";
import { Screen } from "../components/ui/Screen";
import { GlassCard } from "../components/ui/Glass";
import { Button, IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { BandPill } from "../components/ui/Pill";
import { MonoLabel, Numeric } from "../components/ui/Typography";
import { color, bandColor } from "../theme/tokens";
import { usePostureStore } from "../store/postureStore";

function TrendChart({ values }: { values: number[] }) {
  const W = 300;
  const H = 130;
  const pad = 16;
  const min = 40;
  const max = 100;
  const n = values.length;
  const xFor = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - 2 * pad);
  const yFor = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const pts = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0, 0.5, 1].map((g, i) => (
        <SvgLine key={i} x1={pad} y1={pad + g * (H - 2 * pad)} x2={W - pad} y2={pad + g * (H - 2 * pad)} stroke={color.zinc800} strokeWidth={1} />
      ))}
      <Polyline points={pts} fill="none" stroke={color.acid} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <Circle key={i} cx={xFor(i)} cy={yFor(v)} r={i === n - 1 ? 5 : 3.5} fill={i === n - 1 ? color.acid : color.canvas} stroke={color.acid} strokeWidth={2} />
      ))}
    </Svg>
  );
}

export function ProgressScreen() {
  const { scans, go } = usePostureStore();
  const first = scans[0];
  const last = scans[scans.length - 1];
  const delta = last && first ? last.index - first.index : 0;

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <View>
          <MonoLabel className="text-acid">Your trajectory</MonoLabel>
          <Text className="mt-1 font-display-bold text-white text-[24px]">Progress</Text>
        </View>
        <IconButton icon="close" label="Back to home" onPress={() => go("home")} />
      </View>

      {/* Index trend */}
      <GlassCard className="mt-4 p-5">
        <View className="flex-row items-end justify-between">
          <View>
            <MonoLabel>Posture Index</MonoLabel>
            <Numeric className="mt-1 text-[40px]">{last?.index ?? "—"}</Numeric>
          </View>
          <View className="mb-2 flex-row items-center gap-1.5">
            <Icon name="arrowUp" size={16} color={delta >= 0 ? color.mint : color.coral} strokeWidth={2.4} />
            <Text className="font-display-bold text-[18px]" style={{ color: delta >= 0 ? color.mint : color.coral }}>
              {delta >= 0 ? "+" : ""}
              {delta}
            </Text>
          </View>
        </View>
        <View className="mt-3 items-center">
          <TrendChart values={scans.map((s) => s.index)} />
        </View>
        <Text className="mt-2 font-mono text-[9px] text-zinc-500" style={{ letterSpacing: 1 }}>
          LAST {scans.length} SCANS · OLDEST → NEWEST
        </Text>
      </GlassCard>

      {/* Band movement per measure */}
      <View className="mt-6">
        <MonoLabel>Band movement</MonoLabel>
        <Text className="mt-1 font-display text-zinc-400 text-[13px]">
          How each area shifted from your first scan to now.
        </Text>
      </View>

      <GlassCard className="mt-3 overflow-hidden">
        {last?.measures.map((m, i) => {
          const before = first?.measures.find((x) => x.key === m.key);
          const improved =
            before && before.band !== m.band && (m.band === "good" || (m.band === "mild" && before.band === "deficit"));
          return (
            <View key={m.key} className={`flex-row items-center px-4 py-3.5 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
              <Text className="flex-1 font-display text-zinc-100 text-[14px]">{m.label}</Text>
              {before && (
                <>
                  <BandPill band={before.band} />
                  <Icon name="chevronRight" size={16} color={color.zinc500} />
                </>
              )}
              <BandPill band={m.band} />
              {improved && (
                <View className="ml-2">
                  <Icon name="arrowUp" size={15} color={color.mint} strokeWidth={2.6} />
                </View>
              )}
            </View>
          );
        })}
      </GlassCard>

      <View className="mt-4 flex-row items-center gap-2 px-1">
        <Icon name="shield" size={13} color={color.zinc500} />
        <Text className="flex-1 font-display text-zinc-500 text-[11px] leading-4">
          Trends compare relative reads over time — a wellness signal, not a clinical measurement.
        </Text>
      </View>

      <View className="mt-6">
        <Button label="New scan" icon="camera" onPress={() => go("capture")} />
      </View>
    </Screen>
  );
}
