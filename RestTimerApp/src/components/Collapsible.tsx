import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

/**
 * Content that grows and shrinks instead of appearing and vanishing.
 *
 * ## Why the children stay mounted
 *
 * The obvious implementation renders `open ? children : null`, and it cannot
 * animate: there is nothing to measure before it appears and nothing left to
 * shrink once it's gone. So the children are mounted from the start and the
 * container's height is animated between zero and whatever they measured.
 *
 * That has a cost which has to be paid properly. Content squashed to zero
 * height is still *there* — still focusable, still tappable along its top edge,
 * still read out by a screen reader in the middle of a list of collapsed rows.
 * All three are shut off below. Hiding something visually and leaving it in the
 * accessibility tree is worse than not animating at all.
 *
 * ## Why height isn't on the native driver
 *
 * It can't be — height is a layout property, and the native driver only handles
 * transforms and opacity. That's the one real cost of doing this properly, and
 * it's why this is used on the exercise cards (a still screen, one row at a
 * time) and nowhere near the rest countdown.
 *
 * A `scaleY` transform *would* run on the native driver, and is the wrong tool:
 * it squashes the content rather than revealing it, so the text inside would
 * visibly stretch back into shape.
 */
export function Collapsible({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReduceMotion();

  /** 0 = shut, 1 = fully open. Height and opacity both hang off this. */
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [measured, setMeasured] = useState<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(open ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      // Opening is the thing you asked for, so it takes its time; closing is
      // tidying up and gets out of the way. The same asymmetry as the lock
      // reveal at the root of the app.
      duration: open ? 220 : 170,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [open, progress, reduceMotion]);

  const onLayout = (event: LayoutChangeEvent) => {
    const height = Math.round(event.nativeEvent.layout.height);
    // Only ever grows to fit. A measurement of 0 arrives on some platforms
    // before the children have laid out, and letting it through would pin the
    // row shut on its first open.
    if (height > 0 && height !== measured) {
      setMeasured(height);
    }
  };

  return (
    <Animated.View
      style={[
        styles.clip,
        // Until the first measurement lands there is no number to animate to,
        // so the row is simply shut. The measurement arrives on the same
        // layout pass the card mounts on, long before anyone can tap a row.
        measured == null
          ? open
            ? null
            : styles.shut
          : {
              height: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, measured],
              }),
              opacity: progress.interpolate({
                // Fades in over the first half of the growth and is fully
                // opaque for the rest, so the text is readable before the row
                // stops moving rather than arriving after it.
                inputRange: [0, 0.55, 1],
                outputRange: [0, 1, 1],
              }),
            },
      ]}
      // Everything below keeps closed content genuinely inert rather than
      // merely invisible. Three props because each platform only listens to
      // one of them: `accessibilityElementsHidden` is iOS,
      // `importantForAccessibility` is Android, and react-native-web
      // implements *neither* — without the bare `aria-hidden` the collapsed
      // controls stay in the browser's accessibility tree, which was exactly
      // the failure this component exists to avoid. (Same reason
      // SettingsScreen passes a raw `aria-checked`.)
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!open}>
      {/* The measured child. It must be free to take its natural height, so the
          animated height lives on the parent and this one is never constrained. */}
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  /** Before the first measurement there is nothing to animate to. */
  shut: { height: 0 },
});
