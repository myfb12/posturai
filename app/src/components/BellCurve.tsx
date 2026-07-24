import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { color } from "../theme/tokens";
import { MonoLabel } from "./ui/Typography";

// Population bell curve with the user's position marked. The percentile is a
// MODELED estimate (labelled as such) — honest framing of "where you sit".
export function BellCurve({
  percentile,
  width = 300,
  height = 130,
}: {
  percentile: number; // 0..100
  width?: number;
  height?: number;
}) {
  const W = width;
  const H = height;
  const padY = 14;
  const N = 60;
  const pdf = (x: number) => Math.exp(-0.5 * x * x); // std normal, peak 1
  const span = 3.2; // ±3.2σ across the width

  // curve points
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const z = -span + (2 * span * i) / N;
    const px = ((z + span) / (2 * span)) * W;
    const py = H - padY - pdf(z) * (H - 2 * padY);
    pts.push({ x: px, y: py });
  }
  const curve = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // marker x from percentile (approx inverse-normal via same span mapping)
  const z = (percentile / 100) * 2 * span - span;
  const markerX = ((z + span) / (2 * span)) * W;
  const markerY = H - padY - pdf(z) * (H - 2 * padY);

  // shaded area to the LEFT of the marker (= the % you're better than)
  const left = pts.filter((p) => p.x <= markerX);
  const area =
    `M ${left[0]?.x ?? 0} ${H - padY} ` +
    left.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${markerX.toFixed(1)} ${markerY.toFixed(1)} L ${markerX.toFixed(1)} ${H - padY} Z`;

  return (
    <View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color.acid} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={color.acid} stopOpacity={0.03} />
          </LinearGradient>
        </Defs>

        {/* baseline */}
        <Line x1={0} y1={H - padY} x2={W} y2={H - padY} stroke={color.zinc800} strokeWidth={1} />
        {/* shaded "better than" region */}
        <Path d={area} fill="url(#fill)" />
        {/* curve */}
        <Path d={curve} stroke={color.zinc500} strokeWidth={1.5} fill="none" />
        {/* marker */}
        <Line x1={markerX} y1={markerY - 4} x2={markerX} y2={H - padY} stroke={color.acid} strokeWidth={2} />
        <Circle cx={markerX} cy={markerY} r={5} fill={color.acid} stroke={color.canvas} strokeWidth={1.5} />
      </Svg>
      <View className="mt-1 flex-row items-center justify-between">
        <MonoLabel>Below avg</MonoLabel>
        <MonoLabel className="text-acid">You</MonoLabel>
        <MonoLabel>Above avg</MonoLabel>
      </View>
      <Text className="mt-1 text-center font-mono text-[9px] text-zinc-500" style={{ letterSpacing: 1 }}>
        MODELED ESTIMATE VS APP BASELINE · NOT A MEDICAL MEASUREMENT
      </Text>
    </View>
  );
}
