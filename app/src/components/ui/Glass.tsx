import React from "react";
import { View, ViewProps } from "react-native";

// Translucent slate glass container: #0E0F14 @ ~72%, hairline white border,
// backdrop blur (renders on the web target). The workhorse surface.
export function GlassCard({
  children,
  className = "",
  glow,
  ...rest
}: ViewProps & { className?: string; glow?: string }) {
  return (
    <View
      {...rest}
      className={`rounded-[22px] border border-white/[0.08] bg-surface/70 ${className}`}
      style={[
        // web backdrop blur; harmless on native
        { backdropFilter: "blur(20px)" } as any,
        glow
          ? {
              shadowColor: glow,
              shadowOpacity: 0.5,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }
          : null,
        rest.style,
      ]}
    >
      {children}
    </View>
  );
}
