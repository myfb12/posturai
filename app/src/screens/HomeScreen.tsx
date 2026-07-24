import React from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "../components/ui/Screen";
import { GlassCard } from "../components/ui/Glass";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { BandPill, Tag } from "../components/ui/Pill";
import { MonoLabel, Numeric, Body } from "../components/ui/Typography";
import { IndexRing } from "../components/IndexRing";
import { color } from "../theme/tokens";
import { usePostureStore, selectLatestScan } from "../store/postureStore";

function StreakBadge({ streak }: { streak: number }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-white/[0.08] bg-surface/70 px-3 py-1.5">
      <Icon name="flame" size={15} color={color.acid} />
      <Text className="font-display-bold text-white text-[13px]">{streak}</Text>
      <Text className="font-mono text-[9px] text-zinc-400" style={{ letterSpacing: 1 }}>
        DAY
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const { streak, routine, toggleRoutine, go } = usePostureStore();
  const latest = usePostureStore(selectLatestScan);
  const doneCount = routine.filter((r) => r.done).length;

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <View>
          <MonoLabel>Welcome back</MonoLabel>
          <Text className="mt-1 font-display-bold text-white text-[22px]">Your alignment</Text>
        </View>
        <StreakBadge streak={streak} />
      </View>

      {/* Latest scan hero — fully dynamic from the store */}
      <GlassCard className="mt-5 p-5" glow={latest ? color.acid : undefined}>
        {latest ? (
          <View className="flex-row items-center">
            <IndexRing value={latest.index} band={latest.overallBand} size={132} />
            <View className="ml-5 flex-1">
              <View className="flex-row items-center gap-2">
                <BandPill band={latest.overallBand} />
                {latest.isSample && <Tag>SAMPLE</Tag>}
              </View>
              <Text className="mt-2 font-display text-zinc-300 text-[13px] leading-5">
                {latest.gap > 0
                  ? `You're ${latest.gap} points off your potential ${latest.potential}.`
                  : `You're at your alignment ceiling — hold it.`}
              </Text>
              <View className="mt-3 flex-row items-center gap-1.5">
                <Icon name="arrowUp" size={13} color={color.acid} strokeWidth={2.4} />
                <Text className="font-mono text-[10px] text-acid" style={{ letterSpacing: 1 }}>
                  +{latest.gap} POTENTIAL GAP
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center py-6">
            <Body>Take your first side-on photo to see your index.</Body>
          </View>
        )}
      </GlassCard>

      <View className="mt-4 flex-row gap-3">
        <Pressable className="flex-1" onPress={() => go("progress")} accessibilityRole="button">
          <GlassCard className="p-4">
            <MonoLabel>This week</MonoLabel>
            <Numeric className="mt-1 text-[26px]">2 scans</Numeric>
            <Text className="font-mono text-[10px] text-zinc-500" style={{ letterSpacing: 0.5 }}>
              RHYTHM: STEADY
            </Text>
          </GlassCard>
        </Pressable>
        <Pressable className="flex-1" onPress={() => go("progress")} accessibilityRole="button">
          <GlassCard className="p-4">
            <MonoLabel>Trend</MonoLabel>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Icon name="arrowUp" size={18} color={color.mint} strokeWidth={2.4} />
              <Numeric className="text-[26px]" style={{ color: color.mint }}>
                +9
              </Numeric>
            </View>
            <Text className="font-mono text-[10px] text-zinc-500" style={{ letterSpacing: 0.5 }}>
              LAST 3 WEEKS
            </Text>
          </GlassCard>
        </Pressable>
      </View>

      {/* De-Hump Routine — fully unlocked, no paywall */}
      <View className="mt-6 flex-row items-center justify-between">
        <View>
          <MonoLabel className="text-acid">De-Hump Routine</MonoLabel>
          <Text className="mt-1 font-display-bold text-white text-[17px]">Today&apos;s resets</Text>
        </View>
        <Text className="font-mono text-[11px] text-zinc-400">
          {doneCount}/{routine.length}
        </Text>
      </View>

      <GlassCard className="mt-3 overflow-hidden">
        {routine.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => toggleRoutine(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={item.title}
            className={`flex-row items-center gap-3 px-4 py-3.5 ${
              i > 0 ? "border-t border-white/[0.06]" : ""
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              className="h-6 w-6 items-center justify-center rounded-md border"
              style={{
                borderColor: item.done ? color.acid : color.zinc600,
                backgroundColor: item.done ? color.acid : "transparent",
              }}
            >
              {item.done && <Icon name="check" size={14} color={color.canvas} strokeWidth={3} />}
            </View>
            <View className="flex-1">
              <Text
                className="font-display text-[14px]"
                style={{
                  color: item.done ? color.zinc500 : color.zinc100,
                  textDecorationLine: item.done ? "line-through" : "none",
                }}
              >
                {item.title}
              </Text>
              <Text className="font-display text-zinc-500 text-[11px]">{item.detail}</Text>
            </View>
          </Pressable>
        ))}
      </GlassCard>

      <View className="mt-7">
        <Button label="New posture scan" icon="camera" onPress={() => go("capture")} />
      </View>
    </Screen>
  );
}
