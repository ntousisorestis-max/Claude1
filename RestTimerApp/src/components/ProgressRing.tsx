import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0 = empty, 1 = full. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** The unfilled remainder — must be set when drawing on a lime ground. */
  trackColor?: string;
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
  color = colors.lime,
  trackColor = colors.inkLine,
  children,
}: Props) {
  const reduceMotion = useReduceMotion();
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

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
