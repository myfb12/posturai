import React from "react";
import { Text, TextProps } from "react-native";

// Micro-caps mono eyebrow: tracking-[0.2em] 10px uppercase zinc-400.
export function MonoLabel({
  children,
  className = "",
  ...rest
}: TextProps & { className?: string }) {
  return (
    <Text
      {...rest}
      className={`font-mono text-[10px] uppercase text-zinc-400 ${className}`}
      style={[{ letterSpacing: 2 }, rest.style]}
    >
      {children}
    </Text>
  );
}

// Bold numeric gauge: font-black feel via Space Grotesk 700, tight tracking.
export function Numeric({
  children,
  className = "",
  ...rest
}: TextProps & { className?: string }) {
  return (
    <Text
      {...rest}
      className={`font-display-bold text-white ${className}`}
      style={[{ letterSpacing: -1 }, rest.style]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  className = "",
  ...rest
}: TextProps & { className?: string }) {
  return (
    <Text {...rest} className={`font-display text-zinc-300 leading-6 ${className}`}>
      {children}
    </Text>
  );
}
