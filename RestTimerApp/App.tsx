/**
 * Gym rest-timer: blocks your scrolling apps during a set, unlocks them for
 * the rest period, re-locks when rest is over.
 *
 * Phase 1 — full loop with a simulated block. See src/blocking/ for the swap
 * point where real iOS Screen Time shielding lands in Phase 2.
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenFade } from './src/components/ScreenFade';
import { TabBar, type Tab } from './src/components/TabBar';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import { ActiveSetScreen } from './src/screens/ActiveSetScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { RestingScreen } from './src/screens/RestingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { useWorkout, WorkoutProvider } from './src/state/WorkoutContext';
import { colors } from './src/theme';
import type { Phase } from './src/state/types';

/** Free phases flood accent; locked phases stay dark. */
const isFree = (phase: Phase) => phase === 'resting' || phase === 'complete';

/**
 * A workout in progress owns the whole screen.
 *
 * Once you tap Start there is nowhere else to be, and the resting and complete
 * screens flood violet edge to edge — a tab bar sitting on top of that flood
 * would both break the full-screen moment and offer an escape hatch from the
 * one screen the app exists to keep you on. The bar returns as soon as the
 * workout ends.
 */
const showsTabs = (phase: Phase) => phase === 'setup';

/** The workout phase is the navigation — no router needed for four screens. */
function WorkoutTab() {
  const { state } = useWorkout();

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    case 'active':
      return <ActiveSetScreen />;
    case 'resting':
      return <RestingScreen />;
    case 'complete':
      return <CompleteScreen />;
  }
}

/**
 * The lock/unlock flip, as a circular reveal.
 *
 * A violet disc big enough to cover the display scales out from the centre when
 * your apps unlock, and sucks back in when they lock. It's the app's loudest
 * moment, so it gets the one piece of choreography here — a crossfade said the
 * same thing far more quietly.
 *
 * Scale runs on the native driver, so the wipe holds 60fps even while the
 * countdown is re-rendering underneath it.
 */
function Ground() {
  const { state } = useWorkout();
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('workout');
  const free = isFree(state.phase);
  const tabsVisible = tab === 'settings' || showsTabs(state.phase);

  // Diagonal, so the disc still covers the corners at scale 1.
  const diameter = Math.ceil(Math.hypot(width, height)) + 2;
  const reveal = useRef(new Animated.Value(free ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(free ? 1 : 0);
      return;
    }
    const animation = Animated.timing(reveal, {
      toValue: free ? 1 : 0,
      // Unlocking is the reward, so it blooms open; re-locking snaps shut.
      duration: free ? 460 : 260,
      easing: free ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [free, reveal, reduceMotion]);

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.disc,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            left: (width - diameter) / 2,
            top: (height - diameter) / 2,
            transform: [
              {
                // Never exactly 0 — some Android builds drop a zero-scaled view
                // rather than animating it back up.
                scale: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.001, 1],
                }),
              },
            ],
          },
        ]}
      />
      {/* Content is light on both grounds now, so the bar never flips. */}
      <StatusBar barStyle="light-content" backgroundColor={free ? colors.accentDeep : colors.ink} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          {/* Keyed on tab *and* phase, so both kinds of change transition. */}
          <ScreenFade screenKey={`${tab}:${state.phase}`}>
            {tab === 'workout' ? <WorkoutTab /> : <SettingsScreen />}
          </ScreenFade>
        </View>
        {tabsVisible ? <TabBar active={tab} onChange={setTab} /> : null}
      </SafeAreaView>
    </View>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const dismissSplash = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <Ground />
        {/* Overlaid rather than swapped, so the app is already laid out
            underneath by the time the logo fades. */}
        {splashDone ? null : <SplashScreen onDone={dismissSplash} />}
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, overflow: 'hidden' },
  screen: { flex: 1 },
  disc: { position: 'absolute', backgroundColor: colors.accentDeep },
  safe: { flex: 1 },
});

export default App;
