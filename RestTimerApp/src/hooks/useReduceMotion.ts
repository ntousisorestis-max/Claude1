import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * True when the OS "reduce motion" setting is on. Every animation in the app
 * checks this and collapses to an instant state change rather than easing.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (alive) {
          setReduce(value);
        }
      })
      .catch(() => {
        // Not worth breaking a workout over.
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
