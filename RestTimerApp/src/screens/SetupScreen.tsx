import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BigButton } from '../components/BigButton';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { useEnter } from '../hooks/useEnter';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useWorkout } from '../state/WorkoutContext';
import {
  BLOCKABLE_APPS,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, radius, spacing, type } from '../theme';

/**
 * Spelled out in three steps, because the whole premise — an app that
 * deliberately takes your phone away — needs explaining before someone taps
 * Start for the first time.
 */
const HOW_IT_WORKS = [
  'While you lift, your chosen apps are blocked.',
  'Finish a set and they unlock for your rest.',
  'When rest runs out, they lock again.',
];

export function SetupScreen() {
  const {
    state: { config },
    setExerciseName,
    setTotalSets,
    setRestSeconds,
    toggleApp,
    startWorkout,
  } = useWorkout();

  const canStart = config.exerciseName.trim().length > 0;
  const enter = useEnter();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={enter}>
          <Text style={styles.masthead}>New workout</Text>

          <View style={styles.steps}>
            {HOW_IT_WORKS.map((step, i) => (
              <View key={step} style={styles.step}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.block}>
          <Text style={styles.label}>EXERCISE</Text>
          <TextInput
            value={config.exerciseName}
            onChangeText={setExerciseName}
            placeholder="Bench press"
            placeholderTextColor={colors.faintOnDark}
            style={styles.input}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>HOW MANY SETS</Text>
          <Stepper
            label="Sets"
            value={config.totalSets}
            onChange={setTotalSets}
            min={MIN_SETS}
            max={MAX_SETS}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>REST BETWEEN SETS</Text>
          <Stepper
            label="Rest"
            value={config.restSeconds}
            onChange={setRestSeconds}
            step={5}
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            unit="SECONDS"
          />
          <Segmented
            label="Rest"
            options={REST_PRESETS}
            value={config.restSeconds}
            onChange={setRestSeconds}
            format={n => `${n}s`}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>APPS TO BLOCK</Text>
          <Text style={styles.help}>Tap the apps you want locked while you lift.</Text>
          <View style={styles.apps}>
            {BLOCKABLE_APPS.map(app => (
              <AppPill
                key={app.id}
                name={app.name}
                tint={app.tint}
                checked={config.selectedAppIds.includes(app.id)}
                onPress={() => toggleApp(app.id)}
              />
            ))}
          </View>
          <Text style={styles.note}>
            Preview only for now — no apps are actually blocked yet.
          </Text>
        </View>

        <BigButton
          label="Start workout"
          onPress={startWorkout}
          disabled={!canStart}
        />
        {!canStart ? (
          <Text style={styles.hint}>Enter an exercise name to start.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Springs when you toggle it, so picking your apps has some snap to it. */
function AppPill({
  name,
  tint,
  checked,
  onPress,
}: {
  name: string;
  tint: string;
  checked: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) {
      return;
    }
    pop.setValue(checked ? 0.88 : 1.06);
    const animation = Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 16,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [checked, pop, reduceMotion]);

  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={name}
        onPress={onPress}
        style={({ pressed }) => [
          styles.app,
          checked && styles.appOn,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.dotMark, { backgroundColor: tint }]} />
        <Text style={[styles.appName, checked && styles.appNameOn]}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  masthead: { ...type.display, fontSize: 46, color: colors.white },
  steps: { gap: spacing.sm, marginTop: spacing.md },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNumber: {
    ...type.tag,
    color: colors.lime,
    width: 16,
    lineHeight: 22,
  },
  stepText: { ...type.body, flex: 1, color: colors.mutedOnDark, lineHeight: 22 },
  block: { gap: spacing.sm },
  label: { ...type.tag, color: colors.faintOnDark },
  help: { ...type.body, fontSize: 14, color: colors.mutedOnDark },
  input: {
    ...type.title,
    fontSize: 30,
    color: colors.white,
    backgroundColor: colors.inkSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  app: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.inkSoft,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appOn: { borderColor: colors.lime },
  dotMark: { width: 10, height: 10, borderRadius: 5 },
  appName: { ...type.body, fontWeight: '700', color: colors.faintOnDark },
  appNameOn: { color: colors.white },
  note: { ...type.body, fontSize: 13, color: colors.faintOnDark },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  hint: { ...type.body, fontSize: 13, color: colors.faintOnDark, textAlign: 'center' },
});
