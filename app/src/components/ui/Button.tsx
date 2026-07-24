import React from "react";
import { Pressable, Text, View, PressableProps } from "react-native";
import { Icon, IconName } from "./Icon";
import { color } from "../../theme/tokens";

type BtnProps = PressableProps & {
  label: string;
  icon?: IconName;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
};

// Acid-lime primary CTA with black ink. ≥44pt, opacity press feedback (no layout shift).
export function Button({ label, icon, variant = "primary", className = "", ...rest }: BtnProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const bg = isPrimary ? "bg-acid" : isDanger ? "bg-coral" : "bg-white/[0.06]";
  const border = isPrimary || isDanger ? "" : "border border-white/[0.1]";
  const ink = isPrimary || isDanger ? "#050507" : color.zinc100;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-[16px] px-6 ${bg} ${border} ${className}`}
      style={({ pressed }) => [
        isPrimary
          ? { shadowColor: color.acid, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
          : null,
        { opacity: pressed ? 0.78 : 1 },
      ]}
    >
      {icon && <Icon name={icon} size={18} color={ink} strokeWidth={2} />}
      <Text
        className="font-display-bold text-[15px]"
        style={{ color: ink, letterSpacing: 0.3 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Circular icon-only control (camera flip/flash/close). 44pt hit area.
export function IconButton({
  icon,
  onPress,
  label,
  color: c = color.zinc100,
  active = false,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  color?: string;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      className={`h-11 w-11 items-center justify-center rounded-full border ${
        active ? "border-acid/60 bg-acid/15" : "border-white/[0.1] bg-white/[0.05]"
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name={icon} size={20} color={active ? color.acid : c} />
    </Pressable>
  );
}

export { View };
