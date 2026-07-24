import React, { useRef, useState } from "react";
import { View, Text, PanResponder, LayoutChangeEvent, Pressable } from "react-native";
import { PostureFigure } from "./PostureFigure";
import { Ratios } from "../data/postureModel";
import { MonoLabel, Numeric } from "./ui/Typography";
import { color } from "../theme/tokens";

// Interactive "Current frame ↔ Maximized potential" control. Dragging morphs the
// posture figure toward ideal alignment and the index toward its ceiling. The
// morph is an ILLUSTRATION of corrected alignment — not a promise of inches.
export function PotentialSlider({
  ratios,
  index,
  potential,
}: {
  ratios: Ratios;
  index: number;
  potential: number;
}) {
  const [t, setT] = useState(0);
  const trackW = useRef(0);

  const setFromX = (x: number) => {
    const w = trackW.current || 1;
    setT(Math.max(0, Math.min(1, x / w)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.current = e.nativeEvent.layout.width;
  };

  const shownIndex = Math.round(index + (potential - index) * t);

  return (
    <View>
      <View className="flex-row items-end justify-between">
        <View>
          <MonoLabel>{t < 0.5 ? "Current frame" : "Maximized potential"}</MonoLabel>
          <Numeric className="text-[40px]" style={{ color: t < 0.5 ? color.zinc100 : color.acid }}>
            {shownIndex}
          </Numeric>
        </View>
        <View className="items-center pb-2">
          <PostureFigure ratios={ratios} t={t} width={90} height={150} />
        </View>
      </View>

      {/* track */}
      <View
        {...pan.panHandlers}
        onLayout={onLayout}
        className="mt-2 h-11 justify-center"
        accessibilityRole="adjustable"
        accessibilityLabel="Potential preview slider"
      >
        <View className="h-2 rounded-full bg-white/[0.08]" />
        <View
          className="absolute h-2 rounded-full bg-acid"
          style={{ width: `${t * 100}%` }}
        />
        <View
          className="absolute h-6 w-6 rounded-full border-2 border-canvas bg-acid"
          style={{
            left: `${t * 100}%`,
            marginLeft: -12,
            shadowColor: color.acid,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      </View>

      <View className="mt-1 flex-row justify-between">
        <Pressable onPress={() => setT(0)} accessibilityLabel="Show current posture">
          <Text className="font-mono text-[10px] text-zinc-500" style={{ letterSpacing: 1 }}>
            NOW
          </Text>
        </Pressable>
        <Pressable onPress={() => setT(1)} accessibilityLabel="Show maximized potential">
          <Text className="font-mono text-[10px] text-acid" style={{ letterSpacing: 1 }}>
            POTENTIAL · +{potential - index}
          </Text>
        </Pressable>
      </View>
      <Text className="mt-2 font-mono text-[9px] text-zinc-500" style={{ letterSpacing: 0.5 }}>
        Illustration of corrected alignment, not a guaranteed outcome.
      </Text>
    </View>
  );
}
