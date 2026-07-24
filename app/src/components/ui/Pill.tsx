import React from "react";
import { Text, View } from "react-native";
import { Band, bandColor } from "../../theme/tokens";
import { bandLabel } from "../../data/postureModel";

// Band chip — always carries a WORD, never color alone (accessibility rule).
export function BandPill({ band, className = "" }: { band: Band; className?: string }) {
  const c = bandColor[band];
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${className}`}
      style={{ backgroundColor: c + "1A", borderColor: c + "55", borderWidth: 1 }}
    >
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      <Text className="font-mono text-[9px]" style={{ color: c, letterSpacing: 1.5 }}>
        {bandLabel(band)}
      </Text>
    </View>
  );
}

// Neutral micro-tag (e.g. "SAMPLE DATA", "MOVE 1 OF 2").
export function Tag({ children, tone = "zinc" }: { children: string; tone?: "zinc" | "acid" }) {
  const isAcid = tone === "acid";
  return (
    <View
      className={`self-start rounded-full px-2.5 py-1 ${
        isAcid ? "bg-acid/15" : "bg-white/[0.06]"
      }`}
    >
      <Text
        className={`font-mono text-[9px] ${isAcid ? "text-acid" : "text-zinc-400"}`}
        style={{ letterSpacing: 1.5 }}
      >
        {children}
      </Text>
    </View>
  );
}
