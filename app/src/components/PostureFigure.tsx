import React from "react";
import Svg, { Circle, Line, Path, Defs, RadialGradient, Stop, G } from "react-native-svg";
import { Ratios } from "../data/postureModel";
import { color } from "../theme/tokens";

// Signature element: the plumb line. A vertical alignment axis (posture's oldest
// instrument) with the detected joint chain hung off it. Driven by the SAME
// ratios the index uses, and lerp-able toward ideal alignment for the
// "potential" morph — so the picture and the numbers always agree.

const IDEAL: Ratios = { head: 0.08, trunk: 0.05, base: 0.05 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Vertical joint anchors in the 200×320 viewBox.
const Y = { ear: 42, shoulder: 108, hip: 192, knee: 252, ankle: 300 };
const PLUMB_X = 96;
const TORSO = Y.hip - Y.shoulder; // px used as the ratio scale
const LEG = Y.ankle - Y.hip;

export function PostureFigure({
  ratios,
  t = 0,
  width = 200,
  height = 320,
  showPlumb = true,
}: {
  ratios: Ratios;
  t?: number; // 0 = current posture, 1 = corrected/potential
  width?: number;
  height?: number;
  showPlumb?: boolean;
}) {
  const r: Ratios = {
    head: lerp(ratios.head, IDEAL.head, t),
    trunk: lerp(ratios.trunk, IDEAL.trunk, t),
    base: lerp(ratios.base, IDEAL.base, t),
  };

  const ankleX = PLUMB_X;
  const hipX = ankleX + r.base * LEG;
  const shoulderX = hipX + r.trunk * TORSO;
  const earX = shoulderX + r.head * TORSO;
  const kneeX = ankleX + r.base * LEG * 0.5;

  const joints = [
    { x: earX, y: Y.ear, r: 9 }, // head
    { x: shoulderX, y: Y.shoulder, r: 5 },
    { x: hipX, y: Y.hip, r: 5 },
    { x: kneeX, y: Y.knee, r: 4 },
    { x: ankleX, y: Y.ankle, r: 4 },
  ];

  // deviation intensity → line color (mint aligned, coral forward)
  const dev = r.head + r.trunk + r.base;
  const lineColor = t > 0.6 || dev < 0.22 ? color.mint : dev < 0.4 ? color.amber : color.coral;

  const spine = `M ${earX} ${Y.ear} L ${shoulderX} ${Y.shoulder} L ${hipX} ${Y.hip} L ${kneeX} ${Y.knee} L ${ankleX} ${Y.ankle}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 200 320">
      <Defs>
        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
          <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {showPlumb && (
        <>
          {/* the plumb line: ideal vertical axis through the base */}
          <Line
            x1={PLUMB_X}
            y1={16}
            x2={PLUMB_X}
            y2={312}
            stroke={color.acid}
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeDasharray="2 6"
          />
          <Circle cx={PLUMB_X} cy={16} r={2.5} fill={color.acid} />
        </>
      )}

      {/* soft halo behind the head */}
      <Circle cx={earX} cy={Y.ear} r={34} fill="url(#halo)" />

      {/* joint chain (the "spine read") */}
      <Path d={spine} stroke={lineColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <G>
        {joints.map((j, i) => (
          <React.Fragment key={i}>
            <Circle cx={j.x} cy={j.y} r={j.r + 4} fill={lineColor} opacity={0.16} />
            <Circle cx={j.x} cy={j.y} r={j.r} fill={color.canvas} stroke={lineColor} strokeWidth={2} />
          </React.Fragment>
        ))}
      </G>
    </Svg>
  );
}
