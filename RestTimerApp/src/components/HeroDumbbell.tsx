import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme';

/**
 * The Settings header's illustration: a dumbbell, lit the way the Workout
 * tab's hourglass is.
 *
 * Same construction as `HeroHourglass` on purpose — drawn in SVG, a violet
 * bloom behind it, a gradient body and one highlight — so the two tabs look
 * like they were made by the same hand. It is static; the hourglass earns its
 * motion by being about time, and a twitching dumbbell would just be noise on
 * a settings screen.
 */

const W = 160;
const H = 116;

/** Plates, bar and collars, before the whole thing is tilted. */
const PARTS = [
  { x: 18, y: 46, width: 10, height: 24, rx: 5 },
  { x: 30, y: 32, width: 17, height: 52, rx: 8 },
  { x: 49, y: 38, width: 13, height: 40, rx: 6 },
  { x: 62, y: 52, width: 36, height: 12, rx: 6 },
  { x: 98, y: 38, width: 13, height: 40, rx: 6 },
  { x: 113, y: 32, width: 17, height: 52, rx: 8 },
  { x: 132, y: 46, width: 10, height: 24, rx: 5 },
];

export function HeroDumbbell({ size = 150 }: { size?: number }) {
  const height = (size / W) * H;

  return (
    <View style={[styles.box, { width: size, height }]} pointerEvents="none">
      <Svg width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Radial, and running all the way to zero: a gradient that stops
              short leaves a visible edge and the bloom reads as a shape. */}
          <RadialGradient
            id="db-glow"
            cx={W / 2}
            cy={H / 2}
            rx={W * 0.55}
            ry={H * 0.62}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.4} />
            <Stop offset="0.5" stopColor={colors.accent} stopOpacity={0.14} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
          {/* Lit from the top-left, like the hourglass's sand. */}
          <LinearGradient id="db-body" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor="#C4A5FF" />
            <Stop offset="0.55" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.accentDeep} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill="url(#db-glow)" />

        {/* Tilted, so it reads as an object rather than a diagram. */}
        <G transform={`rotate(-16 ${W / 2} ${H / 2})`}>
          {PARTS.map(part => (
            <Rect key={part.x} {...part} fill="url(#db-body)" />
          ))}
          {/* One highlight along the top of each big plate. */}
          <Rect x={34} y={36} width={9} height={20} rx={4.5} fill="#FFFFFF" opacity={0.28} />
          <Rect x={117} y={36} width={9} height={20} rx={4.5} fill="#FFFFFF" opacity={0.28} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
