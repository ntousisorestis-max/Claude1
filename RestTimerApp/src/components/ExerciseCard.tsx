import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppPill } from './AppPill';
import { ConfirmDialog } from './ConfirmDialog';
import { GradientButton } from './GradientButton';
import { Icon, type IconName } from './Icon';
import { SectionLabel } from './SectionLabel';
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
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';
import type { BlockableApp, Exercise } from '../state/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * One saved lift.
 *
 * Collapsed it's a name, its three settings as labelled rows, and one gradient
 * action — the state you want when you're standing at the rack. Tapping any
 * row opens the controls in place, and every number they edit belongs to this
 * exercise alone.
 *
 * The rows are readable at a glance *and* are the way in to editing, which is
 * why the values sit on the right with a chevron: it's the same affordance the
 * rest of the phone uses for "there's more behind this".
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
  const [confirming, setConfirming] = useState(false);
  const blocked = apps.filter(app => exercise.selectedAppIds.includes(app.id));

  return (
    <View style={[styles.card, expanded && styles.cardOpen]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <View style={styles.eyebrowRow}>
            <Icon name="dumbbell" color={colors.accentText} size={15} />
            <Text style={styles.eyebrow}>EXERCISE</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {exercise.name}
          </Text>
        </View>

        <ExerciseTile />
      </View>

      <View style={styles.rows}>
        <SettingRow
          icon="reps"
          label="Sets"
          exercise={exercise.name}
          value={String(exercise.totalSets)}
          expanded={expanded}
          onPress={onToggleExpanded}
        />
        <SettingRow
          icon="timer"
          label="Rest time"
          exercise={exercise.name}
          value={`${exercise.restSeconds}s`}
          expanded={expanded}
          onPress={onToggleExpanded}
        />
        <SettingRow
          icon="lock"
          label="Blocked apps"
          exercise={exercise.name}
          value={
            blocked.length ? blocked.map(app => app.name).join(', ') : 'None'
          }
          expanded={expanded}
          onPress={onToggleExpanded}
          last
        />
      </View>

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

      <GradientButton
        label={`Start ${exercise.name}`}
        text="Start Rest Timer"
        icon="play"
        onPress={onStart}
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
    </View>
  );
}

/**
 * The card's little illustration.
 *
 * A gradient tile with the app's own mark on it, rather than a picture of the
 * muscle group — the app has no idea which lift this is, and guessing from a
 * free-text name would be wrong as often as right.
 */
function ExerciseTile() {
  return (
    <View style={styles.tile}>
      <Svg style={styles.tileFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.34} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.06} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={radius.md} fill="url(#tile)" />
      </Svg>
      <Icon name="dumbbell" color={colors.white} size={30} strokeWidth={1.7} />
    </View>
  );
}

/** One labelled value, and the way in to changing it. */
function SettingRow({
  icon,
  label,
  exercise,
  value,
  expanded,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  /** Named in the announcement: a list of cards otherwise reads as three
   * identical "Sets, 3. Edit" buttons. */
  exercise: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  const press = usePressScale({ depth: 0.99, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`${label} for ${exercise}, ${value}. ${
        expanded ? 'Done editing' : 'Edit'
      }`}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={[styles.row, !last && styles.rowDivided, press.style]}>
      <Icon name={icon} color={colors.accentText} size={17} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={expanded ? styles.chevronOpen : undefined}>
        <Icon name="chevron" color={colors.faintOnDark} size={16} />
      </View>
    </AnimatedPressable>
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
        <SectionLabel icon="reps">SETS</SectionLabel>
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
        <SectionLabel icon="timer">REST BETWEEN SETS</SectionLabel>
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
        <SectionLabel icon="lock">APPS TO BLOCK</SectionLabel>
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

const TILE = 68;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardOpen: { borderColor: colors.accent },

  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1, gap: spacing.xs },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { ...type.tag, color: colors.accentText },
  name: { ...sized(type.title, 28), color: colors.white },

  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  /** One step darker than the card, so the rows read as sunk into it. */
  rows: { backgroundColor: colors.ink, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  rowDivided: { borderBottomWidth: HAIRLINE, borderBottomColor: colors.hairline },
  rowLabel: { ...type.helper, color: colors.mutedOnDark },
  rowValue: {
    ...type.body,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
    textAlign: 'right',
  },
  chevronOpen: { transform: [{ rotate: '90deg' }] },

  controls: {
    gap: spacing.lg,
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  block: { gap: spacing.sm },
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
});
