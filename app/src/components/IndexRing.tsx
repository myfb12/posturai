import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Band, bandColor, color } from "../theme/tokens";
import { Numeric, MonoLabel } from "./ui/Typography";

// Circular PosturAI Index gauge. The arc fills to the index and takes the band
// color; the number is the composite index (0–100), clearly an app score.
export function IndexRing({
  value,
  band,
  size = 148,
  label = "INDEX",
  sub,
}: {
  value: number;
  band: Band;
  size?: number;
  label?: string;
  sub?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const col = bandColor[band];

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color.zinc800} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={col}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <MonoLabel style={{ color: col }}>{label}</MonoLabel>
      <Numeric className="text-[46px]" style={{ color: col, marginTop: 2 }}>
        {value}
      </Numeric>
      <Text className="font-mono text-[9px] text-zinc-500" style={{ letterSpacing: 1 }}>
        {sub ?? "OF 100"}
      </Text>
    </View>
  );
}
