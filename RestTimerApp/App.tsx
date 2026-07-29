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

function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <WorkoutProvider>
            <CurrentScreen />
          </WorkoutProvider>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
});

export default App;
