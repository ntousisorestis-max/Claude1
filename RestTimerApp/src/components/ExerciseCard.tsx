import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppPill } from './AppPill';
import { Card } from './Card';
import { Collapsible } from './Collapsible';
import { ConfirmDialog } from './ConfirmDialog';
import { GradientButton } from './GradientButton';
import { Icon, type IconName } from './Icon';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';
import { usePressScale } from '../hooks/usePressScale';
import {
  MAX_EXERCISE_NAME_LENGTH,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  themed,
  type,
  useColors,
} from '../theme';
import type { BlockableApp, Exercise } from '../state/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** The four things a card can open. Each keeps its own open/closed state. */
type Section = 'name' | 'sets' | 'rest' | 'apps';

const ALL_CLOSED: Record<Section, boolean> = {
  name: false,
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
  onRename,
  onSets,
  onRest,
  onToggleApp,
  onDelete,
  nameTaken,
}: {
  exercise: Exercise;
  /** The full blockable list, presets plus custom. */
  apps: BlockableApp[];
  onStart: () => void;
  onRename: (name: string) => void;
  onSets: (sets: number) => void;
  onRest: (seconds: number) => void;
  onToggleApp: (appId: string) => void;
  onDelete: () => void;
  /**
   * Whether another exercise already answers to this name.
   *
   * Passed in rather than worked out here: a card only knows about itself, and
   * the reducer that owns the list refuses a clashing rename silently. Without
   * this the field would accept a duplicate, close, and quietly show the old
   * name again with no explanation.
   */
  nameTaken: (name: string) => boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState<Record<Section, boolean>>(ALL_CLOSED);
  const [confirming, setConfirming] = useState(false);

  // Only the named key moves; the other two are carried through untouched.
  const toggle = (section: Section) =>
    setOpen(current => ({ ...current, [section]: !current[section] }));

  const blocked = apps.filter(app => exercise.selectedAppIds.includes(app.id));
  const anyOpen = open.name || open.sets || open.rest || open.apps;

  return (
    <Card style={[styles.card, anyOpen && styles.cardOpen]}>
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

        {/* Top-right, and reachable without opening anything. Deleting used to
            live behind an expanded section, which meant the way to remove an
            exercise was to first go and edit it. */}
        <DeleteButton
          name={exercise.name}
          onPress={() => setConfirming(true)}
        />
      </View>

      <View>
        <Section divided>
          <SettingRow
            icon="pencil"
            label="Name"
            exercise={exercise.name}
            announceAs={`Rename ${exercise.name}`}
            value={exercise.name}
            open={open.name}
            onPress={() => toggle('name')}
          />
          <Collapsible open={open.name}>
            <Panel>
              <NameEditor
                name={exercise.name}
                open={open.name}
                nameTaken={nameTaken}
                onRename={onRename}
                onDone={() => toggle('name')}
              />
            </Panel>
          </Collapsible>
        </Section>

        <Section divided>
          <SettingRow
            icon="reps"
            label="Sets"
            exercise={exercise.name}
            value={String(exercise.totalSets)}
            open={open.sets}
            onPress={() => toggle('sets')}
          />
          <Collapsible open={open.sets}>
            <Panel>
              <Stepper
                label={`sets for ${exercise.name}`}
                value={exercise.totalSets}
                onChange={onSets}
                min={MIN_SETS}
                max={MAX_SETS}
              />
            </Panel>
          </Collapsible>
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
          <Collapsible open={open.rest}>
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
          </Collapsible>
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
          <Collapsible open={open.apps}>
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
          </Collapsible>
        </Section>
      </View>

      {/* Just the estimate now. Delete moved to the card header, where it does
          not require opening a section first. */}
      {anyOpen ? (
        <View style={styles.footer}>
          <Text style={styles.estimate}>
            {estimate(exercise.totalSets, exercise.restSeconds)}
          </Text>
        </View>
      ) : null}

      <GradientButton
        label={`Start ${exercise.name}`}
        text="Start rest timer"
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
    </Card>
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
  const styles = useStyles();
  return <View style={divided ? styles.divided : undefined}>{children}</View>;
}

/**
 * The controls one row reveals, tucked under it.
 *
 * No entry animation of its own any more: `Collapsible` fades the whole reveal
 * in as it grows, and two fades stacked on one gesture read as a stutter rather
 * than as one movement.
 */
function Panel({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  return <View style={styles.panel}>{children}</View>;
}

/** One labelled value, and the way in to changing it. */
function SettingRow({
  icon,
  label,
  exercise,
  announceAs,
  value,
  open,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** Named in the announcement: a list of cards otherwise reads as three
   * identical "Sets, 3. Edit" buttons. */
  exercise: string;
  /**
   * Replaces the "<label> for <exercise>, <value>" announcement.
   *
   * The Name row needs it: its label and its value are the same word, so the
   * default reads "Name for Squat, Squat".
   */
  announceAs?: string;
  value: string;
  open: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.99, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`${
        announceAs ?? `${label} for ${exercise}, ${value}`
      }. ${open ? 'Close' : 'Edit'}`}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={[styles.row, press.style]}
    >
      <Icon name={icon} color={colors.accentText} size={17} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      <View style={open ? styles.chevronOpen : undefined}>
        <Icon name="chevron" color={colors.faint} size={16} />
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

/**
 * The card's one destructive control, top-right.
 *
 * Icon-only, and quiet: it sits on every card in the list, permanently, so
 * anything louder would make a screen of saved exercises look like a screen of
 * warnings. `hitSlop` buys it a proper tap target without a 44pt box crowding
 * the exercise name.
 */
function DeleteButton({
  name,
  onPress,
}: {
  name: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.9, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${name}`}
      onPress={onPress}
      hitSlop={12}
      style={[styles.delete, press.style]}
    >
      <Icon name="trash" color={colors.faint} size={18} />
    </AnimatedPressable>
  );
}

/**
 * Renaming, in the same shape as every other row on the card.
 *
 * A draft rather than writing straight through on each keystroke, unlike the
 * steppers: a half-typed name is a blank or a duplicate for most of the time
 * you are typing it, and a field that silently refused every intermediate
 * keystroke would be unusable.
 */
function NameEditor({
  name,
  open,
  nameTaken,
  onRename,
  onDone,
}: {
  name: string;
  open: boolean;
  nameTaken: (name: string) => boolean;
  onRename: (name: string) => void;
  onDone: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const [draft, setDraft] = useState(name);

  // Reopening starts from whatever the name is now, so an abandoned edit does
  // not sit in the field waiting to be saved by mistake.
  useEffect(() => {
    if (open) {
      setDraft(name);
    }
  }, [open, name]);

  const trimmed = draft.trim();
  const duplicate = trimmed.length > 0 && nameTaken(trimmed);
  const unchanged = trimmed === name;
  const canSave = trimmed.length > 0 && !duplicate && !unchanged;

  const save = () => {
    if (!canSave) {
      return;
    }
    onRename(trimmed);
    onDone();
  };

  return (
    <View style={styles.rename}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={save}
        placeholder="Exercise name"
        placeholderTextColor={colors.faint}
        style={styles.renameInput}
        maxLength={MAX_EXERCISE_NAME_LENGTH}
        returnKeyType="done"
        autoCapitalize="words"
        accessibilityLabel={`Rename ${name}`}
      />
      {duplicate ? (
        <Text style={styles.renameWarn}>
          You already have an exercise called {trimmed}.
        </Text>
      ) : null}
      <SavePill disabled={!canSave} onPress={save} />
    </View>
  );
}

function SavePill({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const press = usePressScale({ depth: 0.95, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel="Save name"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.savePill, disabled && styles.savePillOff, press.style]}
    >
      <Text style={[styles.savePillText, disabled && styles.savePillTextOff]}>
        Save name
      </Text>
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      gap: spacing.md,
    },
    /** A thin accent ring while open, laid on top of the shadow-elevated
     * card rather than swapping its border — the card has none to swap. */
    cardOpen: {
      borderWidth: HAIRLINE * 1.5,
      borderColor: colors.accent,
    },

    head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    headText: { flex: 1, gap: spacing.xs },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    eyebrow: { ...type.tag, color: colors.accentText },
    name: { ...sized(type.title, 28), color: colors.white },

    /** On the section, not the row: the hairline belongs under the panel too. */
    divided: {
      borderBottomWidth: HAIRLINE,
      borderBottomColor: colors.hairline,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 15,
    },
    rowLabel: { ...type.helper, color: colors.muted },
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
    estimate: { ...type.helper, fontSize: 13, color: colors.faint },
    /**
     * Quiet by default. It carries `faintOnDark` rather than `danger` because it
     * is on screen permanently on every card — a column of red buttons down a
     * list of saved exercises reads as a list of problems. The confirmation
     * dialog it opens is where the red belongs.
     */
    delete: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
    },

    rename: { gap: spacing.sm },
    renameInput: {
      ...type.body,
      color: colors.white,
      backgroundColor: colors.ink,
      borderWidth: HAIRLINE,
      borderColor: colors.accent,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    renameWarn: { ...type.helper, fontSize: 13, color: colors.danger },
    savePill: {
      minHeight: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savePillOff: { backgroundColor: colors.raised },
    /**
     * 19px bold. White on `accent` is 4.22:1 — over AA's 3.0 for large text,
     * under the 4.5 for body text — and WCAG's line is 18.66px bold.
     */
    savePillText: { ...sized(type.action, 19), color: colors.textOnAccent },
    savePillTextOff: { color: colors.faint },
  }),
);
