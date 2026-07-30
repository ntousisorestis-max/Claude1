/**
 * Gym rest-timer: blocks your scrolling apps during a set, unlocks them for
 * the rest period, re-locks when rest is over.
 *
 * Phase 1 — full loop with a simulated block. See src/blocking/ for the swap
 * point where real iOS Screen Time shielding lands in Phase 2.
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
 * Carries the phase's ground colour all the way out to the safe-area insets, so
 * a flooded screen floods edge to edge instead of leaving dark bands top and
 * bottom.
 */
function Ground() {
  const { state } = useWorkout();
  const free = isFree(state.phase);
  const ground = free ? colors.lime : colors.ink;

  return (
    <View style={[styles.root, { backgroundColor: ground }]}>
      <StatusBar
        barStyle={free ? 'dark-content' : 'light-content'}
        backgroundColor={ground}
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
  root: { flex: 1 },
  safe: { flex: 1 },
});

export default App;
