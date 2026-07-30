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
import { Segmented } from '../components/Segmented';
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
import { colors, HAIRLINE, radius, spacing, type } from '../theme';

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
        <Text style={styles.masthead}>New workout</Text>

        {/* Sections are separated by hairlines, not stacked boxes. */}
        <View style={styles.section}>
          <Text style={styles.label}>EXERCISE</Text>
          <TextInput
            value={config.exerciseName}
            onChangeText={setExerciseName}
            placeholder="Bench press"
            placeholderTextColor={colors.faint}
            style={styles.input}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>SETS</Text>
          <Stepper
            label="Sets"
            value={config.totalSets}
            onChange={setTotalSets}
            min={MIN_SETS}
            max={MAX_SETS}
          />
        </View>

        <View style={styles.section}>
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

        <View style={styles.section}>
          <Text style={styles.label}>BLOCK DURING SETS</Text>
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
                  style={({ pressed }) => [styles.app, pressed && styles.pressed]}>
                  <View style={[styles.monogram, { borderColor: app.tint }]}>
                    <Text style={[styles.monogramText, { color: app.tint }]}>
                      {app.name.slice(0, 1)}
                    </Text>
                  </View>
                  <Text style={[styles.appName, !checked && styles.appNameOff]}>
                    {app.name}
                  </Text>
                  <View style={[styles.mark, checked && styles.markOn]}>
                    {checked ? <Text style={styles.tick}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.note}>
            Placeholder for now — nothing is really blocked until Phase 2.
          </Text>
        </View>

        <BigButton
          label="Start Workout"
          onPress={startWorkout}
          disabled={!canStart}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  masthead: {
    ...type.title,
    color: colors.chalk,
    marginBottom: spacing.lg,
  },
  section: {
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  label: { ...type.label, color: colors.faint },
  input: {
    ...type.title,
    fontSize: 26,
    color: colors.chalk,
    paddingVertical: spacing.sm,
  },
  apps: { marginTop: spacing.xs },
  app: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 54,
  },
  monogram: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: 15, fontWeight: '700' },
  appName: { ...type.body, flex: 1, color: colors.chalk },
  appNameOff: { color: colors.faint },
  mark: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { backgroundColor: colors.chalk, borderColor: colors.chalk },
  tick: { color: colors.bg, fontSize: 14, fontWeight: '700' },
  note: { ...type.body, fontSize: 13, color: colors.faint },
  pressed: { opacity: 0.55 },
  hint: {
    ...type.body,
    fontSize: 13,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
