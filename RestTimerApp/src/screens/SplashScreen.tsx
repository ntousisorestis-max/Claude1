import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, spacing } from '../theme';

/**
 * Timings, in ms. They add up to the whole splash: 1200ms door to door.
 *
 * Timing curves rather than springs — a spring's duration is a consequence of
 * its stiffness, and this needs to land inside a known budget.
 */
const IN_MS = 440; // logo fades and scales up
const HOLD_MS = 480; // logo sits still
const OUT_MS = 280; // whole screen fades away

/** One full sweep of the loading dots. */
const PULSE_MS = 1000;

/**
 * Launch screen.
 *
 * Reads `assets/logo.png` directly, so replacing that file changes this with
 * no build step — unlike the app icons, which have to be baked into the
 * native projects by `npm run icons`.
 *
 * This is the JS-level splash, which appears once React has mounted. The
 * native launch screen covering the milliseconds *before* that is a separate
 * thing (LaunchScreen.storyboard on iOS, a theme on Android) and can't be
 * built or verified without a native build.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      const id = setTimeout(onDone, IN_MS + HOLD_MS);
      return () => clearTimeout(id);
    }

    const sequence = Animated.sequence([
      Animated.timing(enter, {
        toValue: 1,
        duration: IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS),
      Animated.timing(out, {
        toValue: 0,
        duration: OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
    return () => sequence.stop();
  }, [enter, out, onDone, reduceMotion]);

  const screenStyle = [styles.screen, { opacity: reduceMotion ? 1 : out }];
  const logoStyle = {
    opacity: enter,
    transform: [
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
    ],
  };

  return (
    <Animated.View style={screenStyle} pointerEvents="none">
      <Animated.View style={logoStyle}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Rest Timer"
        />
      </Animated.View>

      <LoadingDots reduceMotion={reduceMotion} fade={enter} />
    </Animated.View>
  );
}

/**
 * Three dots running a slow wave.
 *
 * One looping value drives all three, phase-shifted by their interpolation
 * ranges — cheaper than three animations, and they can't drift apart. The loop
 * is stopped on unmount, which happens ~1.2s in.
 */
function LoadingDots({
  reduceMotion,
  fade,
}: {
  reduceMotion: boolean;
  fade: Animated.Value;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const rowStyle = [styles.dots, { opacity: fade }];

  return (
    <Animated.View style={rowStyle}>
      {[0, 1, 2].map(i => (
        <Animated.View
          key={i}
          style={[styles.dot, reduceMotion ? styles.dotStill : dotWave(pulse, i)]}
        />
      ))}
    </Animated.View>
  );
}

/** Phase-shifts one shared 0→1 loop into a per-dot rise and fall. */
function dotWave(pulse: Animated.Value, index: number) {
  const start = index * 0.16;
  const peak = start + 0.16;
  const end = start + 0.32;

  return {
    opacity: pulse.interpolate({
      inputRange: [0, start, peak, end, 1],
      outputRange: [0.28, 0.28, 1, 0.28, 0.28],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, start, peak, end, 1],
          outputRange: [1, 1, 1.35, 1, 1],
        }),
      },
    ],
  };
}

const styles = StyleSheet.create({
  screen: {
    // RN 0.86's types don't expose absoluteFillObject; spell it out.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  // No border radius: the logo brings its own shape and its own dark ground,
  // which melts into this screen.
  logo: { width: 148, height: 148 },
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  dotStill: { opacity: 0.5 },
});
