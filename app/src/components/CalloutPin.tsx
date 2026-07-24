import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Band, bandColor } from "../theme/tokens";
import { Icon, IconName } from "./ui/Icon";

// Cal-AI-style floating callout: a glowing radar pin + a glass label, absolutely
// positioned over the scanned figure. Labels stay honest ("~14° est.", relative
// load) — no fabricated clinical units.
export function CalloutPin({
  x,
  y,
  label,
  band,
  icon,
  align = "right",
}: {
  x: number; // 0..1 of container width
  y: number; // 0..1 of container height
  label: string;
  band: Band;
  icon?: IconName;
  align?: "left" | "right";
}) {
  const c = bandColor[band];
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        flexDirection: align === "right" ? "row" : "row-reverse",
        alignItems: "center",
        transform: [{ translateX: align === "right" ? -6 : 6 }, { translateY: -14 }],
      }}
    >
      {/* radar pin */}
      <Svg width={26} height={26} viewBox="0 0 26 26">
        <Circle cx="13" cy="13" r="12" fill={c} opacity={0.14} />
        <Circle cx="13" cy="13" r="7" fill={c} opacity={0.22} />
        <Circle cx="13" cy="13" r="3.4" fill={c} />
        <Circle cx="13" cy="13" r="3.4" fill="none" stroke="#050507" strokeWidth={1} />
      </Svg>

      <View
        className="rounded-full border border-white/[0.1] bg-surface/80 px-2.5 py-1"
        style={
          {
            marginLeft: align === "right" ? 4 : 0,
            marginRight: align === "left" ? 4 : 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backdropFilter: "blur(12px)",
          } as any
        }
      >
        {icon && <Icon name={icon} size={12} color={c} strokeWidth={2.2} />}
        <Text className="font-mono-bold text-[11px]" style={{ color: c, letterSpacing: 0.3 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
