import React from "react";
import { View, Text } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import { Screen } from "../components/ui/Screen";
import { GlassCard } from "../components/ui/Glass";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { MonoLabel, Numeric, Body } from "../components/ui/Typography";
import { color } from "../theme/tokens";
import { usePostureStore } from "../store/postureStore";

function BrandMark() {
  return (
    <View className="flex-row items-center gap-2">
      <Svg width={22} height={30} viewBox="0 0 22 30">
        <Line x1="11" y1="2" x2="11" y2="28" stroke={color.acid} strokeWidth={2} strokeDasharray="2 4" />
        <Circle cx="11" cy="2" r="2.4" fill={color.acid} />
        <Circle cx="11" cy="15" r="4" fill={color.canvas} stroke={color.acid} strokeWidth={2} />
      </Svg>
      <Text className="font-display-bold text-white text-[17px]" style={{ letterSpacing: 0.5 }}>
        PosturAI
      </Text>
    </View>
  );
}

export function ConsentScreen() {
  const giveConsent = usePostureStore((s) => s.giveConsent);

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BrandMark />
        <MonoLabel>V1 · ON-DEVICE</MonoLabel>
      </View>

      <View className="mt-16">
        <MonoLabel className="text-acid">Private by design</MonoLabel>
        <Numeric className="mt-3 text-[38px] leading-[42px]">
          Your photo{"\n"}never leaves{"\n"}this phone.
        </Numeric>
        <Body className="mt-4 text-[15px]">
          PosturAI reads your posture from a side-on photo and scores your alignment — all
          computed on your device. No upload, no account, no cloud.
        </Body>
      </View>

      <GlassCard className="mt-8 p-5" glow={color.acid}>
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-acid/15">
            <Icon name="shield" size={20} color={color.acid} />
          </View>
          <View className="flex-1">
            <Text className="font-display-bold text-white text-[15px]">On-device analysis</Text>
            <Text className="mt-1 font-display text-zinc-400 text-[13px] leading-5">
              The pose model runs locally. Your images stay in your camera roll.
            </Text>
          </View>
        </View>
      </GlassCard>

      <View className="mt-4 flex-row items-center gap-2 px-1">
        <Icon name="check" size={14} color={color.mint} strokeWidth={2.4} />
        <Text className="flex-1 font-display text-zinc-500 text-[12px] leading-5">
          A wellness tool for tracking alignment — not a medical device, diagnosis, or treatment.
        </Text>
      </View>

      <View className="mt-8">
        <Button label="Start my first scan" icon="chevronRight" onPress={giveConsent} />
      </View>
    </Screen>
  );
}
