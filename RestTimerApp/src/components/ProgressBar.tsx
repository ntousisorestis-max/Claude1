import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, radius } from '../theme';

/**
 * A track with a violet fill that slides in from the left.
 *
 * ## Why it's translated rather than widened
 *
 * The obvious implementation animates `width` from 0%, which cannot use the
 * native driver — layout properties are recalculated on the JS thread every
 * frame. Instead the fill is laid out at the track's full measured width and
 * pushed off to the left by however much is missing, with the track clipping
 * it. That makes the whole animation a `translateX`, which is a transform, so
 * it runs on the native driver and stays smooth while the rest of the screen is
 * still mounting.
 *
 * The measurement is what buys that, and it is the only reason this takes a
 * layout pass before it can draw. The first frame is an empty track, which is
 * also where the animation would have started anyway.
 *
 * The fill keeps its own pill radius, but at the left edge you see the track's
 * rounding instead — the fill's left cap is always off past the clip.
 */
export function ProgressBar({
  value,
  max,
  label,
  height = 10,
  /** Staggered with the card it sits in, so the bar isn't already full on arrival. */
  delay = 0,
}: {
  value: number;
  max: number;
  /** What a screen reader announces. The numbers come from `value` and `max`. */
  label: string;
  height?: number;
  delay?: number;
}) {
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(fraction);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: fraction,
      duration: 720,
      delay,
      // Decelerating: it arrives at the number rather than stopping at it.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, progress, delay, reduceMotion]);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}
      onLayout={onLayout}
      style={[styles.track, { height, borderRadius: height / 2 }]}>
      {width > 0 ? (
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              borderRadius: height / 2,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.hairline,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
});
