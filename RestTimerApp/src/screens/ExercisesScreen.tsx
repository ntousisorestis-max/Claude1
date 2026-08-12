import React, { useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { DashedAddButton } from '../components/DashedAddButton';
import { ExerciseCard } from '../components/ExerciseCard';
import { HeroHourglass } from '../components/HeroHourglass';
import { Icon } from '../components/Icon';
import { PillAction } from '../components/PillAction';
import { SectionLabel } from '../components/SectionLabel';
import { SessionStats } from '../components/SessionStats';
import { TAB_BAR_CLEARANCE } from '../components/TabBar';
import { EMPTY_EXERCISES } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_EXERCISE_NAME_LENGTH,
  MAX_EXERCISES,
} from '../state/workoutReducer';
import { APP_NAME } from '../appInfo';
import {
  radius,
  sized,
  spacing,
  themed,
  type,
  useColors,
} from '../theme';

/**
 * The Workout tab: everything you've saved, ready to run.
 *
 * There is no single "current exercise" any more. Each card owns its own sets,
 * rest and blocked apps, and starting one snapshots that card into the workout
 * — so bench press resting 90s and pulldowns resting 45s coexist without
 * either overwriting the other.
 */
export function ExercisesScreen() {
  const styles = useStyles();
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
              <Text style={styles.masthead} numberOfLines={1}>
                Focus up.{' '}
                <Text style={styles.mastheadAccent}>Lift more.</Text>
              </Text>
            </View>

            {/* Still 132, and it has to stay there. The art carries a
                transparent margin for its glow, so the hourglass is 86% of the
                box and 150 was tried to win that back, which crowded the
                headline on a 360pt phone. The glow buys back the presence
                instead. */}
            <HeroHourglass size={132} />
          </View>
        </Animated.View>

        {empty ? (
          // The first-run message and the way to act on it, folded into one
          // card instead of a block of text sitting above a separate form —
          // there's only one thing to do here, so it reads as one moment.
          <AddExercise
            existingNames={[]}
            onCancel={null}
            onAdd={name => {
              addExercise(name);
              setAdding(false);
            }}
            intro={EMPTY_EXERCISES}
          />
        ) : (
          <>
            <View style={styles.list}>
              {exercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  apps={apps}
                  onStart={() => startWorkout(exercise.id)}
                  onRename={name => renameExercise(exercise.id, name)}
                  // Compared against every *other* exercise, so re-saving a
                  // name unchanged is not reported as a clash with itself.
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

            {adding ? (
              <AddExercise
                existingNames={exercises.map(e => e.name)}
                onCancel={() => setAdding(false)}
                onAdd={name => {
                  addExercise(name);
                  setAdding(false);
                }}
              />
            ) : (
              <DashedAddButton
                label="Add exercise"
                disabled={full}
                onPress={() => setAdding(true)}
              />
            )}
          </>
        )}

        {full ? (
          <Text style={styles.note}>
            That's the limit of {MAX_EXERCISES} exercises. Delete one to add
            another.
          </Text>
        ) : null}

        <SessionStats session={session} />
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
  intro,
}: {
  existingNames: string[];
  onAdd: (name: string) => void;
  /** Null while the list is empty: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Shown above the field only for the empty-list case — the "here's what
   * to do" message folded into the same card as the way to do it, instead of
   * sitting above it as a separate, disconnected block. */
  intro?: { title: string; body: string };
}) {
  const styles = useStyles();
  const colors = useColors();
  const [draft, setDraft] = useState('');
  const enter = useEnter();

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
    <Animated.View style={enter}>
      <Card style={styles.composer}>
        {intro ? (
          <View style={styles.intro}>
            <View style={styles.introTile}>
              {/* Not the "dumbbell" glyph — it reads as a capital H at this
                  size (see HeroDumbbell / SettingsSection's own note). */}
              <Icon name="plus" color={colors.accentText} size={20} />
            </View>
            <Text style={styles.emptyTitle}>{intro.title}</Text>
            <Text style={styles.emptyBody}>{intro.body}</Text>
          </View>
        ) : (
          <SectionLabel icon="dumbbell">NEW EXERCISE</SectionLabel>
        )}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="Bench press"
          placeholderTextColor={colors.faint}
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
          <PillAction
            label="Save exercise"
            disabled={!canSave}
            onPress={submit}
            style={styles.composerPill}
          />

          {onCancel ? (
            <PillAction label="Cancel" variant="outline" onPress={onCancel} />
          ) : null}
        </View>

        <Text style={styles.note}>
          Starts from your Settings apps. Sets and rest are yours to set per
          exercise.
        </Text>
      </Card>
    </Animated.View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      // Clears the floating tab pill, which this content scrolls under.
      paddingBottom: TAB_BAR_CLEARANCE,
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
    /** One line, tight, one white and one violet — the header's whole idea. */
    masthead: { ...sized(type.title, 22), color: colors.white },
    mastheadAccent: { color: colors.accentText },

    list: { gap: spacing.md },

    /** The first-run message, folded into the top of the composer card
     * instead of standing alone above it. */
    intro: { gap: spacing.xs, marginBottom: spacing.xs },
    introTile: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentWash,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...sized(type.title, 24), color: colors.white },
    emptyBody: { ...type.helper, color: colors.muted, lineHeight: 22 },

    /** Tinted rather than bordered — the accent wash is what used to mark
     * this card as "active"; the floating shadow now carries the rest. */
    composer: {
      backgroundColor: colors.accentWash,
      padding: spacing.md,
      gap: spacing.md,
    },
    label: { ...type.tag, color: colors.faint },
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
    composerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    composerPill: { flex: 1 },

    note: { ...type.helper, fontSize: 13, color: colors.faint, lineHeight: 18 },
  }),
);
