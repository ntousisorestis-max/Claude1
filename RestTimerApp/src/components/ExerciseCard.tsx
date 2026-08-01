import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppPill } from './AppPill';
import { BigButton } from './BigButton';
import { ConfirmDialog } from './ConfirmDialog';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import {
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, type } from '../theme';
import type { BlockableApp, Exercise } from '../state/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * One saved lift.
 *
 * Collapsed it's a summary and a Start button — the state you want when you're
 * standing at the rack. Tapping the card opens its own controls in place, and
 * every number it edits belongs to this exercise alone.
 */
export function ExerciseCard({
  exercise,
  apps,
  expanded,
  onToggleExpanded,
  onStart,
  onSets,
  onRest,
  onToggleApp,
  onDelete,
}: {
  exercise: Exercise;
  /** The full blockable list, presets plus custom. */
  apps: BlockableApp[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onStart: () => void;
  onSets: (sets: number) => void;
  onRest: (seconds: number) => void;
  onToggleApp: (appId: string) => void;
  onDelete: () => void;
}) {
  const headPress = usePressScale({ depth: 0.985, haptic: true });
  const [confirming, setConfirming] = useState(false);

  const blocked = apps.filter(app => exercise.selectedAppIds.includes(app.id));

  return (
    <Animated.View style={[styles.card, expanded && styles.cardOpen]}>
      <AnimatedPressable
        {...headPress.handlers}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? `${exercise.name}, done editing`
            : `${exercise.name}, edit`
        }
        accessibilityState={{ expanded }}
        onPress={onToggleExpanded}
        style={[styles.head, headPress.style]}>
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={2}>
            {exercise.name}
          </Text>
          <Text style={styles.summary}>
            {exercise.totalSets} set{exercise.totalSets === 1 ? '' : 's'}
            <Text style={styles.dot}> · </Text>
            {exercise.restSeconds}s rest
          </Text>
          <Text style={styles.blocked} numberOfLines={2}>
            {blocked.length
              ? `${blocked.map(app => app.name).join(', ')} blocked`
              : 'Nothing blocked'}
          </Text>
        </View>

        {/* Rotates rather than swapping glyphs, so open and shut are the same
            control in two positions. */}
        <View style={[styles.chevron, expanded && styles.chevronOpen]}>
          <Text style={styles.chevronMark}>⌄</Text>
        </View>
      </AnimatedPressable>

      {expanded ? (
        <Controls
          exercise={exercise}
          apps={apps}
          onSets={onSets}
          onRest={onRest}
          onToggleApp={onToggleApp}
          onDelete={() => setConfirming(true)}
        />
      ) : null}

      <BigButton
        label={`Start ${exercise.name}`}
        text="Start"
        onPress={onStart}
        style={styles.start}
      />

      <ConfirmDialog
        visible={confirming}
        title={`Delete ${exercise.name}?`}
        message="The exercise and everything set on it go for good."
        confirmLabel="Delete it"
        cancelLabel="Keep it"
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
        onCancel={() => setConfirming(false)}
      />
    </Animated.View>
  );
}

/** The per-exercise editor. Mounted only while the card is open. */
function Controls({
  exercise,
  apps,
  onSets,
  onRest,
  onToggleApp,
  onDelete,
}: {
  exercise: Exercise;
  apps: BlockableApp[];
  onSets: (sets: number) => void;
  onRest: (seconds: number) => void;
  onToggleApp: (appId: string) => void;
  onDelete: () => void;
}) {
  const enter = useEnter();

  return (
    <Animated.View style={[styles.controls, enter]}>
      <View style={styles.block}>
        <Text style={styles.label}>SETS</Text>
        <View style={styles.well}>
          <Stepper
            label={`sets for ${exercise.name}`}
            value={exercise.totalSets}
            onChange={onSets}
            min={MIN_SETS}
            max={MAX_SETS}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>REST BETWEEN SETS</Text>
        <View style={styles.well}>
          <Stepper
            label={`rest for ${exercise.name}`}
            value={exercise.restSeconds}
            onChange={onRest}
            step={5}
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            unit="SECONDS"
          />
          <Segmented
            label={`rest for ${exercise.name}`}
            options={REST_PRESETS}
            value={exercise.restSeconds}
            onChange={onRest}
            format={n => `${n}s`}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>APPS TO BLOCK</Text>
        <View style={styles.apps}>
          {apps.map(app => (
            <AppPill
              key={app.id}
              app={app}
              checked={exercise.selectedAppIds.includes(app.id)}
              label={`${app.name} during ${exercise.name}`}
              onPress={() => onToggleApp(app.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.estimate}>
          {estimate(exercise.totalSets, exercise.restSeconds)}
        </Text>
        <DeleteLink name={exercise.name} onPress={onDelete} />
      </View>
    </Animated.View>
  );
}

/**
 * Roughly how long this will take.
 *
 * One rest per set rather than the strictly correct one-per-gap: the last set
 * has no rest after it, but it does take time to perform, and counting a rest
 * for it is a closer guess than ignoring it. It says "about" for a reason.
 */
function estimate(totalSets: number, restSeconds: number): string {
  const minutes = Math.round((totalSets * restSeconds) / 60);
  return minutes < 1 ? 'About a minute' : `About ${minutes} min`;
}

function DeleteLink({ name, onPress }: { name: string; onPress: () => void }) {
  const press = usePressScale({ depth: 0.94, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${name}`}
      onPress={onPress}
      hitSlop={8}
      style={[styles.delete, press.style]}>
      <Text style={styles.deleteText}>Delete</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardOpen: { borderColor: colors.accent },

  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headText: { flex: 1, gap: 2 },
  name: { ...type.title, fontSize: 26, color: colors.white },
  summary: { ...type.body, fontWeight: '700', color: colors.accentText },
  dot: { color: colors.faintOnDark },
  blocked: { ...type.helper, fontSize: 13, color: colors.mutedOnDark, lineHeight: 18 },

  chevron: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  chevronMark: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.accentText,
  },

  controls: {
    gap: spacing.lg,
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  block: { gap: spacing.sm },
  label: { ...type.tag, color: colors.faintOnDark },
  /** One step darker than the card, so the controls read as sunk into it. */
  well: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  estimate: { ...type.helper, fontSize: 13, color: colors.faintOnDark },
  delete: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: HAIRLINE,
    borderColor: colors.danger,
  },
  deleteText: { ...type.tag, color: colors.danger },

  /**
   * A pill, not a full-width bar. Every card carries one, and at full width a
   * list of three reads as a wall of violet with the names lost between them.
   */
  start: { alignSelf: 'flex-end', minWidth: 140 },
});
