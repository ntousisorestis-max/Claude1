import { useRef } from 'react';
import { Animated } from 'react-native';
import { tap as hapticTap } from '../haptics';
import { useReduceMotion } from './useReduceMotion';

/**
 * The app's press feel, in one place.
 *
 * Every tappable thing spreads this: dips under the finger, springs back with
 * a little overshoot on release. Having one hook rather than per-component
 * tweaks is the whole point — a button that bounces differently from the pill
 * next to it is what makes an interface feel assembled rather than designed.
 *
 * Returns handlers to spread onto a `Pressable` and a style for the
 * `Animated.View` inside it.
 */
export function usePressScale({
  /** How far it dips. Big surfaces need less travel to read as pressed. */
  depth = 0.96,
  /** Fire a haptic tick on press. Reserve it for meaningful taps. */
  haptic = false,
}: { depth?: number; haptic?: boolean } = {}) {
  const reduceMotion = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;

  const settle = (to: number) => {
    if (reduceMotion) {
      press.setValue(to);
      return;
    }
    Animated.spring(press, {
      toValue: to,
      // Down fast so it tracks the finger; back slower, with a little bounce.
      speed: to === 1 ? 40 : 18,
      bounciness: to === 1 ? 0 : 12,
      useNativeDriver: true,
    }).start();
  };

  return {
    /** Spread onto the Pressable. */
    handlers: {
      onPressIn: () => {
        if (haptic) {
          hapticTap();
        }
        settle(1);
      },
      onPressOut: () => settle(0),
    },
    /** Spread onto the Animated.View that should visibly move. */
    style: {
      transform: [
        {
          scale: press.interpolate({
            inputRange: [0, 1],
            outputRange: [1, depth],
          }),
        },
      ],
    },
    /** For components that drive their own transform (the extruded slab). */
    press,
  };
}
