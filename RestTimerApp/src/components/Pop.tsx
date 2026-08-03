import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

/**
 * A number that just changed, acknowledging it.
 *
 * Scales up quickly and springs back. The whole thing is about a quarter of a
 * second — long enough to catch the eye moving past, short enough that it is
 * over before it can be described as an animation.
 *
 * Three details that are the difference between this feeling good and feeling
 * cheap:
 *
 * - **It never fires on mount.** A screen where every number pops as it appears
 *   looks like it is loading, not like something happened. The first render is
 *   skipped, so a pop always means "this changed while you were looking".
 * - **Up fast, back slow.** The rise is a 110ms ease-out and the return is a
 *   spring. Symmetrical timing reads as a pulse or a heartbeat; asymmetrical
 *   reads as something being knocked and settling, which is the physical
 *   metaphor worth having.
 * - **Scale only, on the native driver.** No layout property is touched, so it
 *   cannot reflow the row it sits in and cannot drop a frame while a countdown
 *   re-renders underneath it.
 */
export function Pop({
  /** Pop whenever this changes. Usually the number being displayed. */
  value,
  /** How far up it goes. Bigger numbers want less. */
  depth = 1.14,
  style,
  children,
}: {
  value: string | number;
  depth?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduceMotion) {
      return;
    }

    // Reset first: a value that changes twice inside the animation would
    // otherwise spring from wherever it happened to be, which looks like a
    // stutter rather than a second pop.
    scale.setValue(1);
    const animation = Animated.sequence([
      Animated.timing(scale, {
        toValue: depth,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 190,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [value, depth, scale, reduceMotion]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
