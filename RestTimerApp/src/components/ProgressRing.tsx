import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AnimatedCircle } from './AnimatedCircle';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { themed, useColors } from '../theme';

type Props = {
  /** 0 = empty, 1 = full. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** The unfilled remainder — must be set when drawing on a accent ground. */
  trackColor?: string;
  /**
   * The countdown is about to hit zero. The ring eases open — swelling a
   * little and letting its track go — so the hand-off to the lock is a release
   * rather than a cut.
   */
  finishing?: boolean;
  children?: React.ReactNode;
};

/**
 * Fat stroke, round cap, and a sweep that glides rather than steps.
 *
 * The countdown only reports a new value four times a second, which the eye
 * reads as a stutter on a ring this size. Easing between values linearly over
 * the same interval makes it look continuous. `strokeDashoffset` isn't a
 * transform, so this one can't use the native driver — it's a single value at
 * 4Hz, which the JS thread handles comfortably.
 */
export function ProgressRing({
  progress,
  size = 264,
  strokeWidth = 14,
  color,
  trackColor,
  finishing = false,
  children,
}: Props) {
  const styles = useStyles();
  // Resolved here rather than as default parameters, which are evaluated where
  // no hook can be called. See BrandIcon.
  const colors = useColors();
  const stroke = color ?? colors.accent;
  const track = trackColor ?? colors.hairline;
  const reduceMotion = useReduceMotion();
  const release = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  const swept = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduceMotion) {
      swept.setValue(clamped);
      return;
    }
    const animation = Animated.timing(swept, {
      toValue: clamped,
      duration: 260,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, swept, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      release.setValue(finishing ? 1 : 0);
      return;
    }
    const animation = Animated.timing(release, {
      toValue: finishing ? 1 : 0,
      duration: finishing ? 900 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [finishing, release, reduceMotion]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          {
            scale: release.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            }),
          },
        ],
      }}
    >
      {/* The track fades as the ring releases — one less thing on screen at
          the moment the countdown hands over to the lock. */}
      <Animated.View
        style={{
          opacity: release.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Svg style={styles.center} width={size} height={size}>
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={swept.interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, 0],
          })}
          // Start the sweep at 12 o'clock instead of 3.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </Animated.View>
  );
}

const useStyles = themed(() =>
  StyleSheet.create({
    center: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
);
