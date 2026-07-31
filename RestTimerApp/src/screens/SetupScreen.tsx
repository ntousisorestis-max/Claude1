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
import { BrandIcon } from '../components/BrandIcon';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { useEnter } from '../hooks/useEnter';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, type } from '../theme';
import type { BrandId } from '../state/types';

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
    state: { config, defaults },
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
          <Text style={styles.eyebrow}>READY TO TRAIN</Text>
          <Text style={styles.masthead}>
            Let’s lift<Text style={styles.stop}>.</Text>
          </Text>

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
          <View style={styles.card}>
            <Stepper
              label="Sets"
              value={config.totalSets}
              onChange={setTotalSets}
              min={MIN_SETS}
              max={MAX_SETS}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>REST BETWEEN SETS</Text>
          <View style={styles.card}>
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
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>APPS TO BLOCK</Text>
          <Text style={styles.help}>
            Tap the apps you want locked while you lift.
          </Text>
          <View style={styles.apps}>
            {allBlockableApps(defaults.customApps).map(app => (
              <AppPill
                key={app.id}
                brand={app.brand}
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

        <View style={styles.cta}>
          <BigButton
            label="Start workout"
            onPress={startWorkout}
            disabled={!canStart}
          />
          {!canStart ? (
            <Text style={styles.hint}>Enter an exercise name to start.</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Springs when you toggle it, so picking your apps has some snap to it. */
function AppPill({
  brand,
  name,
  tint,
  checked,
  onPress,
}: {
  brand?: BrandId;
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
        aria-checked={checked}
        accessibilityLabel={name}
        onPress={onPress}
        style={({ pressed }) => [
          styles.app,
          checked && styles.appOn,
          pressed && styles.pressed,
        ]}>
        {brand ? (
          <BrandIcon
            id={brand}
            // Full brand colour when it's going to be blocked, drained when not.
            color={checked ? tint : colors.faintOnDark}
            hole={checked ? colors.raised : colors.surface}
          />
        ) : (
          // Apps added by hand have no logo to draw.
          <View
            style={[
              styles.monogram,
              { borderColor: checked ? tint : colors.hairline },
            ]}>
            <Text
              style={[
                styles.monogramText,
                { color: checked ? tint : colors.faintOnDark },
              ]}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.appName, checked && styles.appNameOn]}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    // The main breathing room between sections.
    gap: spacing.xxl,
  },
  eyebrow: { ...type.tag, color: colors.accent, marginBottom: spacing.sm },
  masthead: { ...type.display, fontSize: 46, color: colors.white },
  /** The full stop picks up the accent — a small bit of colour up top. */
  stop: { color: colors.accent },
  steps: { gap: spacing.md, marginTop: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNumber: { ...type.tag, color: colors.accent, width: 14, lineHeight: 23 },
  stepText: { ...type.helper, flex: 1, color: colors.mutedOnDark, lineHeight: 23 },

  block: { gap: spacing.md },
  label: { ...type.tag, color: colors.faintOnDark },
  help: { ...type.helper, color: colors.mutedOnDark, marginTop: -spacing.sm },

  /** Inputs and cards sit one step above the screen. */
  input: {
    ...type.title,
    fontSize: 28,
    color: colors.white,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },

  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  app: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
  },
  appOn: {
    backgroundColor: colors.raised,
    borderColor: colors.accent,
  },
  appName: { ...type.body, fontWeight: '600', color: colors.faintOnDark },
  appNameOn: { color: colors.white },
  monogram: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: 11, fontWeight: '800' },
  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark },
  pressed: { opacity: 0.85 },

  cta: { gap: spacing.md },
  hint: {
    ...type.helper,
    fontSize: 13,
    color: colors.faintOnDark,
    textAlign: 'center',
  },
});
