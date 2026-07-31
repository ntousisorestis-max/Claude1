import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, spacing, type } from '../theme';

/** How long the logo holds before the app takes over. */
const HOLD_MS = 900;
const FADE_MS = 320;

/**
 * Launch screen.
 *
 * Reads `assets/logo.png` directly, so replacing that file changes this with
 * no build step — unlike the app icons, which have to be baked into the
 * native projects by `npm run icons`.
 *
 * This is the JS-level splash, which appears once React has mounted. The
 * native launch screen that covers the milliseconds *before* that is a
 * separate thing (LaunchScreen.storyboard on iOS, a theme on Android) and
 * can't be built or verified without a native build.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Still show it, just without the choreography.
      const id = setTimeout(onDone, HOLD_MS);
      return () => clearTimeout(id);
    }

    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(rise, {
          toValue: 1,
          speed: 12,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(out, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
    return () => sequence.stop();
  }, [fade, rise, out, onDone, reduceMotion]);

  const screenStyle = [styles.screen, { opacity: reduceMotion ? 1 : out }];
  const markStyle = {
    opacity: reduceMotion ? 1 : fade,
    transform: [
      {
        scale: reduceMotion
          ? 1
          : rise.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
      },
    ],
  };
  const wordmarkStyle = [styles.wordmark, { opacity: reduceMotion ? 1 : fade }];

  return (
    <Animated.View style={screenStyle}>
      <Animated.View style={markStyle}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Rest Timer"
        />
      </Animated.View>

      <Animated.Text style={wordmarkStyle}>REST TIMER</Animated.Text>
    </Animated.View>
  );
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
    gap: spacing.lg,
  },
  logo: { width: 132, height: 132, borderRadius: 30 },
  wordmark: { ...type.tag, color: colors.mutedOnDark },
});
