import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useColors } from '../theme';

/**
 * A soft radial glow — the app's one recurring "anchor" technique.
 *
 * Sits behind the one thing a screen wants looked at first: the streak ring,
 * an Insights hero number, the workout hourglass. Same soft falloff
 * everywhere, so "this is the thing that matters here" reads the same way
 * from screen to screen without a caption having to say so — color used as a
 * single spotlight rather than spread thin across a dozen small accents.
 *
 * Static by default. `StreakRing` wraps its own instance in a breathing
 * animation because that ring measures something still in progress; most
 * anchors don't, and shouldn't borrow the motion just because it's there.
 */
export function Bloom({
  size,
  color,
  peak = 0.3,
  mid = 0.14,
}: {
  size: number;
  /** Defaults to the theme's accent. Pass `colors.white` on an accent flood. */
  color?: string;
  peak?: number;
  mid?: number;
}) {
  const colors = useColors();
  const fill = color ?? colors.accent;
  // SVG gradient ids share one global namespace on the web — see GlowBackground.
  const id = `bloom-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={fill} stopOpacity={peak} />
            <Stop offset="0.55" stopColor={fill} stopOpacity={mid} />
            <Stop offset="1" stopColor={fill} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
