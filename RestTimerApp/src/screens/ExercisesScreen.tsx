import React, { useState } from 'react';
import {
  Animated,
  Image,
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
import { HeroHourglass } from '../components/HeroHourglass';
import { SectionLabel } from '../components/SectionLabel';
import { SessionStats } from '../components/SessionStats';
import { EMPTY_EXERCISES } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_EXERCISE_NAME_LENGTH,
  MAX_EXERCISES,
} from '../state/workoutReducer';
import { APP_NAME } from '../appInfo';
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
    state: { exercises, defaults, session },
    addExercise,
    removeExercise,
    renameExercise,
    setExerciseSets,
    setExerciseRest,
    toggleExerciseApp,
    startWorkout,
  } = useWorkout();

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
        <Animated.View style={[styles.hero, enter]}>
          <View style={styles.brandRow}>
            {/* The real mark, not the line-icon dumbbell — that one is drawn
                for 15px next to a label and reads as a capital H at this size.
                Same file the app icon and splash use, so replacing
                assets/logo.png updates all three. */}
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel={`${APP_NAME} logo`}
            />
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroText}>
              <Text style={styles.eyebrow}>READY TO TRAIN</Text>
              <Text style={styles.masthead}>
                Focus up<Text style={styles.stop}>.</Text>
              </Text>
              <Text style={[styles.masthead, styles.mastheadAccent]}>
                Lift more<Text style={styles.stop}>.</Text>
              </Text>
              <Text style={styles.heroSub}>
                Block the noise. Stay in the set. Your phone can wait.
              </Text>
            </View>

            {/* Still 132, and it has to stay there. The art carries a
                transparent margin for its glow, so the hourglass is 86% of the
                box and 150 was tried to win that back — at which point the
                headline no longer fits beside it on a 360pt phone and "Focus
                up." breaks across two lines, turning a two-line masthead into
                three. The glow buys back the presence instead. */}
            <HeroHourglass size={132} />
          </View>
        </Animated.View>

        <SessionStats session={session} />

        {empty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{EMPTY_EXERCISES.title}</Text>
            <Text style={styles.emptyBody}>{EMPTY_EXERCISES.body}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                apps={apps}
                onStart={() => startWorkout(exercise.id)}
                onRename={name => renameExercise(exercise.id, name)}
                // Compared against every *other* exercise, so re-saving a name
                // unchanged is not reported as a clash with itself.
                nameTaken={name =>
                  exercises.some(
                    other =>
                      other.id !== exercise.id &&
                      other.name.toLowerCase() === name.toLowerCase(),
                  )
                }
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

  hero: { gap: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  /** The mark is wide and short inside a square canvas, so the box is sized
   * for the height it actually paints rather than for the file. */
  brandLogo: { width: 40, height: 40 },
  /** Text and illustration share the row; the text takes what's left. */
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroText: { flex: 1, gap: 2 },
  eyebrow: { ...type.tag, color: colors.accentText, marginBottom: spacing.xs },
  /** Two lines, tight, one white and one violet — the header's whole idea. */
  masthead: { ...sized(type.display, 38), color: colors.white },
  mastheadAccent: { color: colors.accentText },
  stop: { color: colors.accent },
  heroSub: {
    ...type.helper,
    color: colors.mutedOnDark,
    lineHeight: 21,
    marginTop: spacing.sm,
  },

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
