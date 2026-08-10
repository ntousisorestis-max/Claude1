import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/**
 * A circle of colour that spreads from the exact point you tapped, filling
 * whatever it's drawn on.
 *
 * The colour counterpart to `usePressScale`, in the same shape: handlers to
 * spread onto a `Pressable`, and a style for the `Animated.View` that draws
 * the circle. Unlike `usePressScale` this one also needs to know how big the
 * button is, so its `onLayout` has to be spread onto the button too.
 *
 * The circle is a 1×1 point at rest, positioned at the tap and scaled up —
 * scaling is what the native driver can animate smoothly, growing an actual
 * width/height can't run off the JS thread. It has to sit inside a clipped,
 * rounded container to read as filling the button rather than spilling past
 * its edges; that's the caller's job, same as it already is for the
 * button's own gradient fill.
 */
export function useTapFill({
  /** Usually `washOnAccent(…)` — this hook only handles the motion. */
  color,
}: {
  color: string;
}) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState({ width: 0, height: 0 });

  // The diagonal is a safe upper bound on the distance from any point inside
  // the box to its farthest corner — reaching it only when the tap lands
  // exactly on the opposite corner. Any overshoot elsewhere is invisible:
  // the clipped container throws away whatever spills past the button.
  const diagonal = Math.hypot(box.width, box.height);

  const grow = (e: GestureResponderEvent) => {
    setOrigin({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const shrink = () => {
    if (reduceMotion) {
      progress.setValue(0);
      return;
    }
    // Fades rather than scaling back down — a circle visibly closing in on
    // itself reads as the fill undoing itself, not as it settling.
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return {
    handlers: { onPressIn: grow, onPressOut: shrink },
    onLayout: (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setBox({ width, height });
    },
    style: {
      position: 'absolute' as const,
      left: origin.x,
      top: origin.y,
      width: 1,
      height: 1,
      marginLeft: -0.5,
      marginTop: -0.5,
      borderRadius: 999,
      backgroundColor: color,
      opacity: progress,
      transform: [
        {
          // Scaled to twice the diagonal: the circle's radius (half its
          // scaled diameter) needs to reach the diagonal, and the base
          // diameter here is 1.
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, diagonal * 2],
          }),
        },
      ],
    },
  };
}
