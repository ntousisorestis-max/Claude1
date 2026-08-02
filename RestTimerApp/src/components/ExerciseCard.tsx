import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppPill } from './AppPill';
import { ConfirmDialog } from './ConfirmDialog';
import { GradientButton } from './GradientButton';
import { Icon, type IconName } from './Icon';
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

/** The three things a card can open. Each keeps its own open/closed state. */
type Section = 'sets' | 'rest' | 'apps';

const ALL_CLOSED: Record<Section, boolean> = {
  sets: false,
  rest: false,
  apps: false,
};

/**
 * One saved lift.
 *
 * Collapsed it's a name, its three settings as labelled rows, and one gradient
 * action — the state you want when you're standing at the rack.
 *
 * **Each row opens on its own.** The three sections are independent booleans,
 * not one card-wide flag, so opening Rest time leaves Sets exactly as you left
 * it. They also don't reach across cards: one card's rows can't close another's.
 * Anything else makes a tap on one arrow move controls the user wasn't looking
 * at.
 */
export function ExerciseCard({
  exercise,
  apps,
  onStart,
  onSets,
  onRest,
  onToggleApp,
  onDelete,
}: {
  exercise: Exercise;
  /** The full blockable list, presets plus custom. */
  apps: BlockableApp[];
  onStart: () => void;
  onSets: (sets: number) => void;
  onRest: (seconds: number) => void;
  onToggleApp: (appId: string) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState<Record<Section, boolean>>(ALL_CLOSED);
  const [confirming, setConfirming] = useState(false);

  // Only the named key moves; the other two are carried through untouched.
  const toggle = (section: Section) =>
    setOpen(current => ({ ...current, [section]: !current[section] }));

  const blocked = apps.filter(app => exercise.selectedAppIds.includes(app.id));
  const anyOpen = open.sets || open.rest || open.apps;

  return (
    <View style={[styles.card, anyOpen && styles.cardOpen]}>
      <View style={styles.head}>
        <View style={styles.eyebrowRow}>
          <Icon name="dumbbell" color={colors.accentText} size={15} />
          <Text style={styles.eyebrow}>EXERCISE</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>
      </View>

      <View style={styles.rows}>
        <Section divided>
          <SettingRow
            icon="reps"
            label="Sets"
            exercise={exercise.name}
            value={String(exercise.totalSets)}
            open={open.sets}
            onPress={() => toggle('sets')}
          />
          {open.sets ? (
            <Panel>
              <Stepper
                label={`sets for ${exercise.name}`}
                value={exercise.totalSets}
                onChange={onSets}
                min={MIN_SETS}
                max={MAX_SETS}
              />
            </Panel>
          ) : null}
        </Section>

        <Section divided>
          <SettingRow
            icon="timer"
            label="Rest time"
            exercise={exercise.name}
            value={`${exercise.restSeconds}s`}
            open={open.rest}
            onPress={() => toggle('rest')}
          />
          {open.rest ? (
            <Panel>
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
            </Panel>
          ) : null}
        </Section>

        <Section>
          <SettingRow
            icon="lock"
            label="Blocked apps"
            exercise={exercise.name}
            value={
              blocked.length ? blocked.map(app => app.name).join(', ') : 'None'
            }
            open={open.apps}
            onPress={() => toggle('apps')}
          />
          {open.apps ? (
            <Panel>
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
            </Panel>
          ) : null}
        </Section>
      </View>

      {/* Shown whenever anything is open, rather than living inside one of the
          three sections — deleting the exercise belongs to none of them. */}
      {anyOpen ? (
        <View style={styles.footer}>
          <Text style={styles.estimate}>
            {estimate(exercise.totalSets, exercise.restSeconds)}
          </Text>
          <DeleteLink name={exercise.name} onPress={() => setConfirming(true)} />
        </View>
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

/** A row and whatever it opens, hairlined off from the next one. */
function Section({
  divided = false,
  children,
}: {
  divided?: boolean;
  children: React.ReactNode;
}) {
  return <View style={divided ? styles.divided : undefined}>{children}</View>;
}

/** The controls one row reveals, tucked under it. */
function Panel({ children }: { children: React.ReactNode }) {
  const enter = useEnter();

  return <Animated.View style={[styles.panel, enter]}>{children}</Animated.View>;
}

/** One labelled value, and the way in to changing it. */
function SettingRow({
  icon,
  label,
  exercise,
  value,
  open,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** Named in the announcement: a list of cards otherwise reads as three
   * identical "Sets, 3. Edit" buttons. */
  exercise: string;
  value: string;
  open: boolean;
  onPress: () => void;
}) {
  const press = usePressScale({ depth: 0.99, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`${label} for ${exercise}, ${value}. ${
        open ? 'Close' : 'Edit'
      }`}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={[styles.row, press.style]}>
      <Icon name={icon} color={colors.accentText} size={17} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={open ? styles.chevronOpen : undefined}>
        <Icon name="chevron" color={colors.faintOnDark} size={16} />
      </View>
    </AnimatedPressable>
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
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardOpen: { borderColor: colors.accent },

  head: { gap: spacing.xs },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { ...type.tag, color: colors.accentText },
  name: { ...sized(type.title, 28), color: colors.white },

  /** One step darker than the card, so the rows read as sunk into it. */
  rows: { backgroundColor: colors.ink, borderRadius: radius.md, overflow: 'hidden' },
  /** On the section, not the row: the hairline belongs under the panel too. */
  divided: { borderBottomWidth: HAIRLINE, borderBottomColor: colors.hairline },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  rowLabel: { ...type.helper, color: colors.mutedOnDark },
  rowValue: {
    ...type.body,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
    textAlign: 'right',
  },
  chevronOpen: { transform: [{ rotate: '90deg' }] },

  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
