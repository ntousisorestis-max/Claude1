import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/**
 * Counts from zero up to `target`, easing to a stop.
 *
 * The one place in the app that animates a *number* rather than a style, so it
 * has to run through a JS listener — which means `useNativeDriver: false`. That
 * is fine here and nowhere else: it fires once, on a screen that is otherwise
 * completely still, and stops.
 *
 * State is only pushed when the rounded value actually changes, so a count to
 * 14 re-renders fifteen times over a second rather than sixty.
 */
export function useCountUp(target: number, duration = 1100): number {
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(reduceMotion ? target : 0);
  const settled = useRef(false);

  useEffect(() => {
    // Nothing to count, or the user asked for no motion: just say the number.
    if (reduceMotion || target <= 0 || settled.current) {
      setShown(target);
      return;
    }

    const value = new Animated.Value(0);
    let last = -1;
    const listener = value.addListener(({ value: current }) => {
      const rounded = Math.round(current);
      if (rounded !== last) {
        last = rounded;
        setShown(rounded);
      }
    });

    const animation = Animated.timing(value, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        settled.current = true;
        setShown(target);
      }
    });

    return () => {
      animation.stop();
      value.removeListener(listener);
    };
  }, [target, duration, reduceMotion]);

  return shown;
}
