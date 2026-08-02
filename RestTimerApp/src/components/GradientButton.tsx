import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Icon, type IconName } from './Icon';
import { usePressScale } from '../hooks/usePressScale';
import { colors, radius, sized, TAP_TARGET, type } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The card's primary action: a violet gradient bar with a round glyph on the end.
 *
 * The gradient is an SVG rect behind the content rather than a library —
 * `expo-linear-gradient` isn't available in a bare app and
 * `react-native-linear-gradient` would be a fourth native dependency for one
 * button. `react-native-svg` is already here and already renders on all three
 * targets, so it draws this too.
 *
 * The glyph sits in its own dark disc, which is what stops the button reading
 * as a plain coloured slab — and gives the eye somewhere to land.
 */
export function GradientButton({
  label,
  text,
  icon,
  onPress,
  style,
}: {
  /** What a screen reader announces. */
  label: string;
  /** Visible text, when it needs to be shorter than the label. */
  text?: string;
  icon: IconName;
  onPress: () => void;
  style?: ViewStyle;
}) {
  const press = usePressScale({ haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.wrap, press.style, style]}>
      <Svg style={styles.fill} width="100%" height="100%">
        <Defs>
          {/* Both ends are existing palette tokens, and the light one is
              capped at `accent`: a brighter violet looked better and dropped
              white text to 2.99:1, under AA. `npm run contrast` guards it. */}
          <LinearGradient id="btn" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accentDeep} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          rx={TAP_TARGET / 2}
          fill="url(#btn)"
        />
      </Svg>

      <Text style={styles.label}>{text ?? label}</Text>

      <View style={styles.disc}>
        <Icon name={icon} color={colors.white} size={18} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 26,
    paddingRight: 8,
    // The glow ties it to the accent buttons elsewhere in the app.
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  /** 19px bold clears WCAG's "large text" bar (14pt bold), which is what lets
   * white sit on the accent at all — at 18px it would need 4.5:1, not 3:1. */
  label: { ...sized(type.action, 19), flex: 1, textAlign: 'center', color: colors.white },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11, 6, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
