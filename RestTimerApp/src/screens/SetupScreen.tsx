import React from 'react';
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
        <Animated.Text style={[styles.masthead, enter]}>
          lock in<Text style={styles.dot}>.</Text>
        </Animated.Text>

        <View style={styles.block}>
          <Text style={styles.label}>WHAT ARE WE DOING</Text>
          <TextInput
            value={config.exerciseName}
            onChangeText={setExerciseName}
            placeholder="bench press"
            placeholderTextColor={colors.faintOnDark}
            style={styles.input}
            returnKeyType="done"
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
          <Text style={styles.label}>SCROLL TIME BETWEEN SETS</Text>
          <Stepper
            label="Rest"
            value={config.restSeconds}
            onChange={setRestSeconds}
            step={5}
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            unit="SEC"
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
          <Text style={styles.label}>KILL THESE WHILE I LIFT</Text>
          <View style={styles.apps}>
            {BLOCKABLE_APPS.map(app => {
              const checked = config.selectedAppIds.includes(app.id);
              return (
                <Pressable
                  key={app.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={app.name}
                  onPress={() => toggleApp(app.id)}
                  style={({ pressed }) => [
                    styles.app,
                    checked && styles.appOn,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.dotMark, { backgroundColor: app.tint }]} />
                  <Text style={[styles.appName, checked && styles.appNameOn]}>
                    {app.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.note}>
            placeholder for now — nothing actually gets blocked until Phase 2
          </Text>
        </View>

        <BigButton
          label="LOCK IN"
          a11yLabel="Start Workout"
          onPress={startWorkout}
          disabled={!canStart}
        />
        {!canStart ? (
          <Text style={styles.hint}>name the exercise first</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  masthead: { ...type.display, fontSize: 52, color: colors.white },
  dot: { color: colors.lime },
  block: { gap: spacing.sm },
  label: { ...type.tag, color: colors.faintOnDark },
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
