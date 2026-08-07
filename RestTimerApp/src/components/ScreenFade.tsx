import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

/**
 * Softens the swap between screens.
 *
 * Whenever `screenKey` changes the contents fade up from 0 and rise a few
 * pixels, so moving between tabs or workout phases reads as a transition
 * rather than a cut.
 *
 * Opacity and a small translate only — the individual screens run their own
 * staggered entrances inside this, and anything heavier here would fight them.
 */
export function ScreenFade({
  screenKey,
  children,
}: {
  screenKey: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [screenKey, enter, reduceMotion]);

  const style = {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
