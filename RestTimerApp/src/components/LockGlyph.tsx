import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

/**
 * A padlock whose shackle actually opens.
 *
 * Built from two views rather than an SVG path: the body is a rounded
 * rectangle, and the shackle is a view with only its top borders drawn and its
 * top corners fully rounded, which leaves a half-circle arch. That means the
 * open/shut animation is pure `transform` — it runs on the native driver and
 * keeps 60fps while a countdown re-renders underneath it.
 *
 * There is no transform-origin in React Native, so the hinge is faked: the
 * shackle lifts, slides right and tilts at the same time, which reads as
 * pivoting on its right foot.
 */
export function LockGlyph({
  locked,
  color,
  size = 26,
}: {
  locked: boolean;
  color: string;
  /** Width of the lock body, in px. Everything else scales off it. */
  size?: number;
}) {
  const reduceMotion = useReduceMotion();
  const open = useRef(new Animated.Value(locked ? 0 : 1)).current;

  useEffect(() => {
    const target = locked ? 0 : 1;
    if (reduceMotion) {
      open.setValue(target);
      return;
    }
    const animation = Animated.spring(open, {
      toValue: target,
      speed: 14,
      bounciness: 9,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [locked, open, reduceMotion]);

  const bodyHeight = size * 0.7;
  const shackleWidth = size * 0.6;
  // Taller than a semicircle, so the arch has straight legs under it. At
  // exactly half its width it has none, and the whole glyph reads as a handbag.
  const shackleHeight = size * 0.5;
  const stroke = Math.max(2, Math.round(size * 0.1));

  const range = (from: number, to: number) =>
    open.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    // Purely decorative: it carries no text, and the panel around it owns the
    // accessibility label that says the same thing in words.
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.shackle,
          {
            width: shackleWidth,
            height: shackleHeight,
            borderColor: color,
            borderWidth: stroke,
            // Half the width, so the top is a true semicircle.
            borderTopLeftRadius: shackleWidth / 2,
            borderTopRightRadius: shackleWidth / 2,
            // Tucks the shackle's feet behind the body.
            marginBottom: -stroke,
            transform: [
              { translateY: range(0, -size * 0.24) },
              { translateX: range(0, size * 0.15) },
              {
                rotate: open.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '16deg'],
                }),
              },
            ],
          },
        ]}
      />
      <View
        style={{
          width: size,
          height: bodyHeight,
          borderRadius: Math.round(size * 0.22),
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  /** Everything else about the shackle is computed from `size`. */
  shackle: { borderBottomWidth: 0 },
});
