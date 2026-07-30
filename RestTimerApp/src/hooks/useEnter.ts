import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/**
 * Fade-and-rise for a screen's content on mount.
 *
 * Each phase is a different component, so this fires on every transition —
 * finishing a set, rest running out, ending the workout. Spread the returned
 * object onto an Animated.View's style.
 *
 * `delay` staggers sibling blocks; keep the steps small (60-90ms) so the
 * screen still feels immediate mid-workout.
 */
export function useEnter(delay = 0) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduceMotion]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}
