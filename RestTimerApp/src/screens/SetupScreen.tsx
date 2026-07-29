import React from 'react';
import {
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
import { Stepper } from '../components/Stepper';
import { useWorkout } from '../state/WorkoutContext';
import {
  BLOCKABLE_APPS,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, radius, spacing, TAP_TARGET } from '../theme';

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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New workout</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Exercise</Text>
          <TextInput
            value={config.exerciseName}
            onChangeText={setExerciseName}
            placeholder="Bench press"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Stepper
            label="Sets"
            value={config.totalSets}
            onChange={setTotalSets}
            min={MIN_SETS}
            max={MAX_SETS}
            unit="sets"
          />
        </View>

        <View style={styles.field}>
          <Stepper
            label="Rest between sets"
            value={config.restSeconds}
            onChange={setRestSeconds}
            step={5}
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            unit="sec"
          />
          <View style={styles.presets}>
            {REST_PRESETS.map(seconds => {
              const active = config.restSeconds === seconds;
              return (
                <Pressable
                  key={seconds}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setRestSeconds(seconds)}
                  style={({ pressed }) => [
                    styles.preset,
                    active && styles.presetActive,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[styles.presetText, active && styles.presetTextActive]}>
                    {seconds}s
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Block during sets</Text>
          {BLOCKABLE_APPS.map(app => {
            const checked = config.selectedAppIds.includes(app.id);
            return (
              <Pressable
                key={app.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={app.name}
                onPress={() => toggleApp(app.id)}
                style={({ pressed }) => [styles.appRow, pressed && styles.pressed]}>
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <Text style={styles.appName}>
                  {app.emoji}  {app.name}
                </Text>
              </Pressable>
            );
          })}
          <Text style={styles.note}>
            Phase 1: this list is a placeholder — nothing is really blocked yet.
          </Text>
        </View>

        <BigButton
          label="Start Workout"
          onPress={startWorkout}
          disabled={!canStart}
          style={styles.start}
        />
        {!canStart ? (
          <Text style={styles.hint}>Name the exercise to start.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  field: { gap: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: TAP_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  presets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  preset: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetActive: { backgroundColor: colors.accentDark, borderColor: colors.accent },
  presetText: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  presetTextActive: { color: colors.text },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: TAP_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.bg, fontSize: 17, fontWeight: '900' },
  appName: { color: colors.text, fontSize: 18, fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  pressed: { opacity: 0.7 },
  start: { marginTop: spacing.sm },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
});
