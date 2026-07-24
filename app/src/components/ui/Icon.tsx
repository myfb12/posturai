import React from "react";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
import { color } from "../../theme/tokens";

// Vector-only icon set (checklist: no emoji as structural icons). One consistent
// 1.7px stroke, 24px grid, currentColor-style via the `color` prop.
export type IconName =
  | "camera"
  | "image"
  | "flipCamera"
  | "flashOn"
  | "flashOff"
  | "close"
  | "check"
  | "chevronRight"
  | "flame"
  | "bolt"
  | "target"
  | "shield"
  | "arrowUp"
  | "share";

export function Icon({
  name,
  size = 24,
  color: c = color.zinc100,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = {
    stroke: c,
    strokeWidth,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "camera" && (
        <>
          <Path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.2-1.8A1 1 0 0 1 9 4.7h6a1 1 0 0 1 .8.5L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" {...p} />
          <Circle cx="12" cy="13" r="3.2" {...p} />
        </>
      )}
      {name === "image" && (
        <>
          <Path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...p} />
          <Circle cx="8.5" cy="9.5" r="1.6" {...p} />
          <Polyline points="4,17 9,12 13,15 17,11 20,15" {...p} />
        </>
      )}
      {name === "flipCamera" && (
        <>
          <Path d="M4 10a8 8 0 0 1 13-3l2 2" {...p} />
          <Path d="M20 14a8 8 0 0 1-13 3l-2-2" {...p} />
          <Polyline points="19,5 19,9 15,9" {...p} />
          <Polyline points="5,19 5,15 9,15" {...p} />
        </>
      )}
      {name === "flashOn" && <Path d="M13 2 4 14h6l-1 8 9-12h-6z" {...p} fill={c} />}
      {name === "flashOff" && (
        <>
          <Path d="M13 2 4 14h6l-1 8 9-12h-6z" {...p} />
          <Line x1="3" y1="3" x2="21" y2="21" {...p} />
        </>
      )}
      {name === "close" && (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...p} />
          <Line x1="18" y1="6" x2="6" y2="18" {...p} />
        </>
      )}
      {name === "check" && <Polyline points="4,12 10,18 20,6" {...p} />}
      {name === "chevronRight" && <Polyline points="9,5 16,12 9,19" {...p} />}
      {name === "flame" && (
        <Path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8.6 10 9 12 10.5 12 12 12 11 8 12 3z" {...p} fill={c} />
      )}
      {name === "bolt" && <Path d="M13 2 4 14h6l-1 8 9-12h-6z" {...p} />}
      {name === "target" && (
        <>
          <Circle cx="12" cy="12" r="8" {...p} />
          <Circle cx="12" cy="12" r="3.4" {...p} />
        </>
      )}
      {name === "shield" && <Path d="M12 3 5 6v5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" {...p} />}
      {name === "arrowUp" && (
        <>
          <Line x1="12" y1="20" x2="12" y2="5" {...p} />
          <Polyline points="6,11 12,5 18,11" {...p} />
        </>
      )}
      {name === "share" && (
        <>
          <Circle cx="6" cy="12" r="2.4" {...p} />
          <Circle cx="17" cy="6" r="2.4" {...p} />
          <Circle cx="17" cy="18" r="2.4" {...p} />
          <Line x1="8.1" y1="10.9" x2="14.9" y2="7.1" {...p} />
          <Line x1="8.1" y1="13.1" x2="14.9" y2="16.9" {...p} />
        </>
      )}
    </Svg>
  );
}
