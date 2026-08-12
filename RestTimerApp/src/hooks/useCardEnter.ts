import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/**
 * A card's entrance in a freshly-rendered list: fades and rises like
 * `useEnter`, but lands with a spring overshoot instead of easing to a stop,
 * and takes an index rather than a raw delay so a list can stagger itself by
 * just mapping over its items.
 *
 * Kept separate from `useEnter` rather than folded in as an option: that
 * hook's timing is tuned for screens that swap on every phase transition
 * mid-workout, where a bouncier landing would be one distraction too many.
 * This is for the one list that benefits from feeling lively on open — the
 * Workout tab's saved exercises.
 */
export function useCardEnter(index: number) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.sequence([
      Animated.delay(index * 70),
      Animated.spring(progress, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress, index, reduceMotion]);

  return {
    opacity: progress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
    ],
  };
}
