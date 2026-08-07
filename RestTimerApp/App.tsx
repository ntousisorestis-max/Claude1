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
import { AccountProvider } from './src/cloud/AccountContext';
import { WorkoutSync } from './src/cloud/WorkoutSync';
import { GlowBackground } from './src/components/GlowBackground';
import { ScreenFade } from './src/components/ScreenFade';
import { TabBar, type Tab } from './src/components/TabBar';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import { ActiveSetScreen } from './src/screens/ActiveSetScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { RestingScreen } from './src/screens/RestingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StreaksScreen } from './src/screens/StreaksScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ExercisesScreen } from './src/screens/ExercisesScreen';
import { getDeviceStorage } from './src/state/deviceStorage';
import { useWorkout, WorkoutProvider } from './src/state/WorkoutContext';
import { themed, useColors } from './src/theme';
import type { CloudBackend } from './src/cloud/types';
import type { AppStorage } from './src/state/storage';
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
      return <ExercisesScreen />;
    case 'active':
      return <ActiveSetScreen />;
    case 'resting':
      return <RestingScreen />;
    case 'complete':
      return <CompleteScreen />;
  }
}

/** Which screen a tab shows. The Workout tab defers to the workout's phase. */
function TabScreen({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'workout':
      return <WorkoutTab />;
    case 'insights':
      return <InsightsScreen />;
    case 'streaks':
      return <StreaksScreen />;
    case 'settings':
      return <SettingsScreen />;
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
  const styles = useStyles();
  const colors = useColors();
  const { state } = useWorkout();
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('workout');
  const free = isFree(state.phase);
  // Any tab other than Workout keeps its bar: a workout only takes the screen
  // over on the tab it is running in. With two tabs this read `tab ===
  // 'settings'`, which stopped being the same statement the moment there were
  // four of them.
  const tabsVisible = tab !== 'workout' || showsTabs(state.phase);

  // Diagonal, so the disc still covers the corners at scale 1.
  const diameter = Math.ceil(Math.hypot(width, height)) + 2;
  const reveal = useRef(new Animated.Value(free ? 1 : 0)).current;
  /** The dark-ground glow is simply the inverse: one fades out as the other in. */
  const dimGlow = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

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
            // Scale never reaches exactly 0 — some Android builds drop a
            // zero-scaled view rather than animating it back up — which leaves
            // a single violet pixel sitting in the middle of every locked
            // screen. Fading the last sliver out hides it.
            opacity: reveal.interpolate({
              inputRange: [0, 0.01, 1],
              outputRange: [0, 1, 1],
            }),
            transform: [
              {
                scale: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.001, 1],
                }),
              },
            ],
          },
        ]}
      />

      {/* The glow sits above the disc and below everything else, so it reads on
          both grounds. Two of them, cross-faded on the same value that drives
          the reveal: violet on the near-black, light on the violet. A violet
          bloom on a violet ground would be invisible, and the screen would go
          flat at exactly the moment it floods. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: dimGlow }]}
      >
        <GlowBackground tone="onInk" />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: reveal }]}
      >
        <GlowBackground tone="onAccent" />
      </Animated.View>

      {/* Content is light on both grounds now, so the bar never flips. */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={free ? colors.accentDeep : colors.ink}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          {/* Keyed on tab *and* phase, so both kinds of change transition. */}
          <ScreenFade screenKey={`${tab}:${state.phase}`}>
            <TabScreen tab={tab} />
          </ScreenFade>
        </View>
        {tabsVisible ? <TabBar active={tab} onChange={setTab} /> : null}
      </SafeAreaView>
    </View>
  );
}

/**
 * The welcome screen, and the decision about whether it is owed.
 *
 * Renders nothing until the saved state has actually loaded. That wait is the
 * whole feature: guessing before the answer arrives means either flashing this
 * at somebody who tapped through it months ago, or skipping it for somebody who
 * has never seen it. The splash is on top for the whole of it, so the wait is
 * invisible.
 */
function FirstRun() {
  const { state, hydrated, finishWelcome } = useWorkout();

  if (!hydrated || state.welcomed) {
    return null;
  }
  return <WelcomeScreen onDone={finishWelcome} />;
}

function App({
  /**
   * Where exercises, preferences and the welcome flag are kept.
   *
   * Defaults to real device storage — AsyncStorage on a phone, localStorage in
   * a browser. The tests pass their own, because the alternative is every test
   * run inheriting whatever the last one saved.
   */
  storage = getDeviceStorage(),
  /**
   * The cloud the account layer talks to. Left undefined it's Firebase when
   * src/cloud/firebaseConfig.ts has been filled in, and a do-nothing local
   * backend when it hasn't — which is the state the tests run in unless they
   * pass a fake. See src/cloud/firebaseBackend.ts.
   */
  backend,
}: {
  storage?: AppStorage;
  backend?: CloudBackend;
} = {}) {
  const [splashDone, setSplashDone] = useState(false);
  const dismissSplash = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
      {/* Outside the workout, deliberately. Who is signed in outlives any one
          workout, and the workout state machine knows nothing about accounts —
          the dependency runs one way, through <WorkoutSync/> below. */}
      <AccountProvider backend={backend}>
        <WorkoutProvider storage={storage}>
          <WorkoutSync />
          <Ground />
          {/* Both overlaid rather than swapped, so the app underneath is
              already laid out by the time either of them clears. */}
          <FirstRun />
          {splashDone ? null : <SplashScreen onDone={dismissSplash} />}
        </WorkoutProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ink, overflow: 'hidden' },
    screen: { flex: 1 },
    disc: { position: 'absolute', backgroundColor: colors.accentDeep },
    glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    safe: { flex: 1 },
  }),
);

export default App;
