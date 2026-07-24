import React from "react";
import { View, ScrollView, Platform } from "react-native";
import { color } from "../../theme/tokens";

// Full-bleed pitch-black canvas with an ambient acid glow at the top — the
// house background every screen sits on. Reserves top space for the status bar.
export function Screen({
  children,
  scroll = true,
  contentClassName = "",
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentClassName?: string;
}) {
  const topInset = Platform.OS === "ios" ? 54 : 28;

  const body = (
    <View className={`px-5 pb-10 ${contentClassName}`} style={{ paddingTop: topInset }}>
      {children}
    </View>
  );

  return (
    <View className="flex-1 overflow-hidden bg-canvas" style={{ backgroundColor: color.canvas }}>
      {/* ambient top glow (clipped by overflow-hidden so it never widens the page) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -160,
          left: 0,
          right: 0,
          height: 340,
          backgroundColor: color.acid,
          opacity: 0.06,
          borderRadius: 400,
          filter: "blur(80px)" as any,
        }}
      />
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {body}
        </ScrollView>
      ) : (
        <View className="flex-1">{body}</View>
      )}
    </View>
  );
}
