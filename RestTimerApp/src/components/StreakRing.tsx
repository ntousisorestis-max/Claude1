import React, { useEffect, useId, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Pop } from './Pop';
import { ProgressRing } from './ProgressRing';
import { tap } from '../haptics';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { sized, tabular, themed, type, useColors } from '../theme';

const SIZE = 216;
const STROKE = 14;
/** The bloom is drawn past the ring so its falloff isn't cut off by the edge. */
const GLOW = SIZE + 76;

/**
 * The streak, as a ring you can read from across a gym.
 *
 * ## What the ring measures
 *
 * **Today, not the streak.** The arc is empty while today is still open and
 * closes into a full circle the moment a workout lands. That is the one thing
 * on this screen anybody can actually do something about right now, and it is
 * the only quantity here that is honestly a fraction — "eleven days" isn't a
 * proportion of anything, so a ring filled by the streak itself would need a
 * denominator invented for it. Progress toward the next milestone is a real
 * fraction, and it already has its own bar in the card below; drawing it twice
 * would make the two disagree at a glance about what the screen is about.
 *
 * ## The pulse
 *
 * A bloom behind the ring, breathing. It runs wider and dimmer while today is
 * open — a thing still waiting — and settles tighter and brighter once the day
 * is banked. Same animation, two amplitudes, so the screen reads differently
 * from the doorway before a single number has been focused on.
 */
export function StreakRing({
  streak,
  trainedToday,
  line,
}: {
  streak: number;
  trainedToday: boolean;
  /** The encouraging line under the ring. */
  line: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Parked mid-breath rather than at either end: the still frame should
      // look like the animation's average, not like it stopped on a peak.
      breath.setValue(0.5);
      return;
    }
    const half = (toValue: number) =>
      Animated.timing(breath, {
        toValue,
        duration: trainedToday ? 1900 : 1500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([half(1), half(0)]));
    loop.start();
    return () => loop.stop();
  }, [breath, trainedToday, reduceMotion]);

  const glowStyle = {
    opacity: breath.interpolate({
      inputRange: [0, 1],
      outputRange: trainedToday ? [0.72, 1] : [0.34, 0.66],
    }),
    transform: [
      {
        scale: breath.interpolate({
          inputRange: [0, 1],
          outputRange: trainedToday ? [0.97, 1.02] : [0.9, 1.04],
        }),
      },
    ],
  };

  const unit = streak === 1 ? 'day' : 'days';

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        // The number and the unit are read out here rather than left to the two
        // Texts inside, which would announce as "11" and "DAY STREAK" — a
        // spelled-out tag and a bare integer, in that order, for a control whose
        // whole meaning is the two together.
        accessibilityLabel={`${streak} ${unit}, ${
          trainedToday ? 'trained today' : 'not trained today yet'
        }`}
        accessibilityHint={line}
        onPress={tap}
        style={styles.ring}
      >
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Bloom />
        </Animated.View>

        <ProgressRing
          progress={trainedToday ? 1 : 0}
          size={SIZE}
          strokeWidth={STROKE}
          color={colors.accent}
          trackColor={colors.hairline}
        >
          <View style={styles.centre}>
            <Pop value={streak} depth={1.1}>
              <Text style={styles.value}>{streak}</Text>
            </Pop>
            <Text style={styles.unit}>DAY STREAK</Text>
          </View>
        </ProgressRing>
      </Pressable>

      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

/** The soft violet ground the ring floats on. */
function Bloom() {
  const colors = useColors();
  // SVG gradient ids share one global namespace on the web. See GlowBackground.
  const id = `streak-glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg width={GLOW} height={GLOW}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.accent} stopOpacity={0.3} />
          <Stop offset="0.55" stopColor={colors.accent} stopOpacity={0.14} />
          <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: 18 },
    ring: {
      width: SIZE,
      height: SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      width: GLOW,
      height: GLOW,
      alignItems: 'center',
      justifyContent: 'center',
    },

    centre: { alignItems: 'center' },
    value: { ...sized(type.mega, 76), ...tabular, color: colors.white },
    unit: { ...sized(type.tag, 11), color: colors.accentText, marginTop: 2 },

    line: {
      ...type.helper,
      fontSize: 15,
      lineHeight: 21,
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
  }),
);
