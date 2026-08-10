import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/**
 * Keeps a modal mounted long enough to animate out, and materialises it in
 * rather than just fading it.
 *
 * RN's `Modal` only offers a flat, same-speed-both-ways fade or slide as its
 * built-in `animationType` — no scale, no spring, and nothing on the way out
 * beyond an instant unmount. This drives a proper arrival instead: a quick,
 * critically-damped spring (no overshoot — this is a programmatic open, not
 * something a flick just threw) that grows the card in from just under full
 * size while it fades up, and a quicker fade-and-settle on the way out. The
 * `Modal` itself should be told `animationType="none"` by the caller, so its
 * own transition doesn't run at the same time as this one and compound it.
 *
 * `mounted` stays true until the exit animation finishes, so the caller's
 * `<Modal visible={mounted}>` doesn't vanish out from under the animation.
 */
export function usePresence(visible: boolean) {
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }
      const animation = Animated.spring(progress, {
        toValue: 1,
        speed: 16,
        bounciness: 0,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }

    if (reduceMotion) {
      progress.setValue(0);
      setMounted(false);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [visible, progress, reduceMotion]);

  return {
    mounted,
    /** Opacity alone — for a backdrop/scrim, which fades but doesn't scale. */
    opacity: progress,
    /** Opacity and a slight scale — for the card materialising in front of it. */
    style: {
      opacity: progress,
      transform: [
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.94, 1],
          }),
        },
      ],
    },
  };
}
