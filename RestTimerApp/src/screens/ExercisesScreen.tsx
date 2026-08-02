import React, { useState } from 'react';
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
import { ExerciseCard } from '../components/ExerciseCard';
import { SectionLabel } from '../components/SectionLabel';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_EXERCISE_NAME_LENGTH,
  MAX_EXERCISES,
} from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, type, sized } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The Workout tab: everything you've saved, ready to run.
 *
 * There is no single "current exercise" any more. Each card owns its own sets,
 * rest and blocked apps, and starting one snapshots that card into the workout
 * — so bench press resting 90s and pulldowns resting 45s coexist without
 * either overwriting the other.
 */
export function ExercisesScreen() {
  const {
    state: { exercises, defaults },
    addExercise,
    removeExercise,
    setExerciseSets,
    setExerciseRest,
    toggleExerciseApp,
    startWorkout,
  } = useWorkout();

  // One card open at a time: two sets of steppers on screen at once is how you
  // end up editing the wrong exercise.
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const enter = useEnter();

  const apps = allBlockableApps(defaults.customApps);
  const full = exercises.length >= MAX_EXERCISES;
  const empty = exercises.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.head, enter]}>
          <Text style={styles.eyebrow}>READY TO TRAIN</Text>
          <Text style={styles.masthead}>
            Your lifts<Text style={styles.stop}>.</Text>
          </Text>
        </Animated.View>

        {empty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing saved yet.</Text>
            <Text style={styles.emptyBody}>
              Add the lifts you actually do. Each one keeps its own sets, rest
              and blocked apps, so you set it up once.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                apps={apps}
                expanded={openId === exercise.id}
                onToggleExpanded={() =>
                  setOpenId(id => (id === exercise.id ? null : exercise.id))
                }
                onStart={() => startWorkout(exercise.id)}
                onSets={sets => setExerciseSets(exercise.id, sets)}
                onRest={seconds => setExerciseRest(exercise.id, seconds)}
                onToggleApp={appId => toggleExerciseApp(exercise.id, appId)}
                onDelete={() => removeExercise(exercise.id)}
              />
            ))}
          </View>
        )}

        {/* Open by default when there's nothing in the list, since adding one
            is the only thing there is to do. */}
        {adding || empty ? (
          <AddExercise
            existingNames={exercises.map(e => e.name)}
            onCancel={empty ? null : () => setAdding(false)}
            onAdd={name => {
              addExercise(name);
              setAdding(false);
            }}
          />
        ) : (
          <AddButton disabled={full} onPress={() => setAdding(true)} />
        )}

        {full ? (
          <Text style={styles.note}>
            That's the limit of {MAX_EXERCISES} exercises. Delete one to add
            another.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * The name prompt.
 *
 * Inline rather than `Alert.prompt`, which exists only on iOS — this is the
 * one path to creating an exercise, so it has to work on every target the app
 * runs on.
 */
function AddExercise({
  existingNames,
  onAdd,
  onCancel,
}: {
  existingNames: string[];
  onAdd: (name: string) => void;
  /** Null while the list is empty: there's nothing to go back to. */
  onCancel: (() => void) | null;
}) {
  const [draft, setDraft] = useState('');
  const enter = useEnter();
  const savePress = usePressScale({ depth: 0.94 });
  const cancelPress = usePressScale({ depth: 0.94, haptic: true });

  const trimmed = draft.trim();
  const duplicate = existingNames.some(
    name => name.toLowerCase() === trimmed.toLowerCase(),
  );
  // A name is required — there's nothing to call the card otherwise.
  const canSave = trimmed.length > 0 && !duplicate;

  const submit = () => {
    if (!canSave) {
      return;
    }
    onAdd(trimmed);
    setDraft('');
  };

  return (
    <Animated.View style={[styles.composer, enter]}>
      <SectionLabel icon="dumbbell">NEW EXERCISE</SectionLabel>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={submit}
        placeholder="Bench press"
        placeholderTextColor={colors.faintOnDark}
        style={styles.input}
        maxLength={MAX_EXERCISE_NAME_LENGTH}
        returnKeyType="done"
        autoCapitalize="words"
        accessibilityLabel="Exercise name"
      />

      {duplicate ? (
        <Text style={styles.warn}>You already have a {trimmed}.</Text>
      ) : null}

      <View style={styles.composerRow}>
        <AnimatedPressable
          {...savePress.handlers}
          accessibilityRole="button"
          accessibilityLabel="Save exercise"
          accessibilityState={{ disabled: !canSave }}
          onPress={submit}
          disabled={!canSave}
          style={[styles.save, !canSave && styles.saveOff, savePress.style]}>
          <Text style={[styles.saveText, !canSave && styles.saveTextOff]}>
            Save exercise
          </Text>
        </AnimatedPressable>

        {onCancel ? (
          <AnimatedPressable
            {...cancelPress.handlers}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onCancel}
            style={[styles.cancel, cancelPress.style]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      <Text style={styles.note}>
        Starts from your Settings apps. Sets and rest are yours to set per
        exercise.
      </Text>
    </Animated.View>
  );
}

function AddButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const press = usePressScale({ depth: 0.97, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel="Add exercise"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.add, disabled && styles.addOff, press.style]}>
      <Text style={[styles.addText, disabled && styles.addTextOff]}>
        + Add exercise
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  head: { gap: spacing.sm },
  eyebrow: { ...type.tag, color: colors.accentText },
  masthead: { ...sized(type.display, 42), color: colors.white },
  stop: { color: colors.accent },

  list: { gap: spacing.md },

  emptyState: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyTitle: { ...sized(type.title, 24), color: colors.white },
  emptyBody: { ...type.helper, color: colors.mutedOnDark, lineHeight: 22 },

  composer: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  label: { ...type.tag, color: colors.faintOnDark },
  input: {
    ...type.title,
    fontSize: 24,
    color: colors.white,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  warn: { ...type.helper, fontSize: 13, color: colors.danger },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  save: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOff: {
    backgroundColor: colors.ink,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
  },
  saveText: { ...sized(type.action, 17), color: colors.white },
  saveTextOff: { color: colors.faintOnDark },
  cancel: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...type.tag, color: colors.mutedOnDark },

  add: {
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOff: { opacity: 0.4 },
  addText: { ...sized(type.action, 17), color: colors.accentText },
  addTextOff: { color: colors.faintOnDark },

  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark, lineHeight: 18 },
});
