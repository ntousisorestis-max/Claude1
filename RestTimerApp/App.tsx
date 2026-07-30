/**
 * Gym rest-timer: blocks your scrolling apps during a set, unlocks them for
 * the rest period, re-locks when rest is over.
 *
 * Phase 1 — full loop with a simulated block. See src/blocking/ for the swap
 * point where real iOS Screen Time shielding lands in Phase 2.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import { ActiveSetScreen } from './src/screens/ActiveSetScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { RestingScreen } from './src/screens/RestingScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { useWorkout, WorkoutProvider } from './src/state/WorkoutContext';
import { colors } from './src/theme';
import type { Phase } from './src/state/types';

/** Free phases flood lime; locked phases stay dark. */
const isFree = (phase: Phase) => phase === 'resting' || phase === 'complete';

/** The workout phase is the navigation — no router needed for four screens. */
function CurrentScreen() {
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
 * The lock/unlock flip.
 *
 * A lime sheet sits over a permanently dark root and fades in and out — the
 * ground colour is the app's loudest signal, so it wipes rather than cuts. It
 * lives outside the safe area so the flood reaches the very edges of the
 * display, and it never takes touches.
 */
function Ground() {
  const { state } = useWorkout();
  const reduceMotion = useReduceMotion();
  const free = isFree(state.phase);
  const flood = useRef(new Animated.Value(free ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      flood.setValue(free ? 1 : 0);
      return;
    }
    const animation = Animated.timing(flood, {
      toValue: free ? 1 : 0,
      // Unlocking is a reward, so it blooms; re-locking snaps shut.
      duration: free ? 420 : 220,
      easing: free ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [free, flood, reduceMotion]);

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[styles.flood, { opacity: flood }]}
      />
      <StatusBar
        barStyle={free ? 'dark-content' : 'light-content'}
        backgroundColor={free ? colors.lime : colors.ink}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <CurrentScreen />
      </SafeAreaView>
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <Ground />
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  flood: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lime,
  },
  safe: { flex: 1 },
});

export default App;
