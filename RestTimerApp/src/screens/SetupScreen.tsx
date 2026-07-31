import React, { useEffect, useRef, useState } from 'react';
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
import { BrandIcon } from '../components/BrandIcon';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, type } from '../theme';
import type { BlockableApp, BrandId } from '../state/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The launch pad — deliberately *not* a form.
 *
 * Settings owns the numbers, so by the time you get here they're already
 * right: this screen's job is to show you what's about to happen in one line
 * and give you one button. The controls still exist, folded away behind Edit,
 * for the session where today's rest needs to be 90s instead of 60s.
 */
export function SetupScreen() {
  const {
    state: { config, defaults },
    setExerciseName,
    setTotalSets,
    setRestSeconds,
    toggleApp,
    startWorkout,
  } = useWorkout();

  const [editing, setEditing] = useState(false);
  const canStart = config.exerciseName.trim().length > 0;
  const enter = useEnter();
  const enterCard = useEnter(70);

  const apps = allBlockableApps(defaults.customApps);
  const blocked = apps.filter(a => config.selectedAppIds.includes(a.id));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Centred in whatever's left over, so a screen with one card on it
            doesn't read as a page that failed to load the rest of itself. */}
        <View style={styles.body}>
          <Animated.View style={[styles.head, enter]}>
            <Text style={styles.eyebrow}>READY TO TRAIN</Text>
            {/* The exercise is the headline. Borderless and headline-sized, so
                it reads as the name of the workout rather than a field. */}
            <TextInput
              value={config.exerciseName}
              onChangeText={setExerciseName}
              placeholder="Bench press"
              placeholderTextColor={colors.faintOnDark}
              style={styles.exercise}
              returnKeyType="done"
              autoCapitalize="words"
              accessibilityLabel="Exercise name"
            />
            <View style={styles.rule} />
          </Animated.View>

          <Animated.View style={[styles.card, enterCard]}>
            <View style={styles.summaryRow}>
              <View style={styles.summary}>
                <Text style={styles.plan}>
                  {config.totalSets} set{config.totalSets === 1 ? '' : 's'}
                  <Text style={styles.dot}> · </Text>
                  {config.restSeconds}s rest
                </Text>
                <Text style={styles.blocked} numberOfLines={2}>
                  {blocked.length
                    ? `${blocked.map(a => a.name).join(', ')} blocked`
                    : 'Nothing blocked — tap Edit to pick apps'}
                </Text>
              </View>

              <EditLink open={editing} onPress={() => setEditing(v => !v)} />
            </View>

            <View style={styles.estimate}>
              <Text style={styles.estimateLabel}>ESTIMATED TIME</Text>
              <Text style={styles.estimateValue}>
                {estimateWorkout(config.totalSets, config.restSeconds)}
              </Text>
            </View>
          </Animated.View>

          {editing ? (
            <Editor
              totalSets={config.totalSets}
              restSeconds={config.restSeconds}
              selectedAppIds={config.selectedAppIds}
              apps={apps}
              onSets={setTotalSets}
              onRest={setRestSeconds}
              onToggleApp={toggleApp}
            />
          ) : null}
        </View>

        <View style={styles.cta}>
          <BigButton
            label="Start workout"
            onPress={startWorkout}
            disabled={!canStart}
          />
          <Text style={styles.hint}>
            {canStart
              ? 'Your apps lock the moment you start, and unlock every time you rest.'
              : 'Enter an exercise name to start.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Roughly how long this will take, in plain minutes.
 *
 * One rest per set rather than the strictly correct one-per-gap: the last set
 * has no rest after it, but it does take time to perform, and counting a rest
 * for it is a closer guess than ignoring it. It says "about" for a reason.
 */
function estimateWorkout(totalSets: number, restSeconds: number): string {
  const minutes = Math.round((totalSets * restSeconds) / 60);
  return minutes < 1 ? 'About a minute' : `About ${minutes} min`;
}

/** The one thing standing between the summary and the full controls. */
function EditLink({ open, onPress }: { open: boolean; onPress: () => void }) {
  const press = usePressScale({ depth: 0.92, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={open ? 'Done editing' : 'Edit workout'}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={[styles.edit, press.style]}>
      <Text style={styles.editText}>{open ? 'Done' : 'Edit'}</Text>
    </AnimatedPressable>
  );
}

/**
 * The old setup form, now opt-in.
 *
 * Mounted only while open — hidden-but-present controls stay reachable by a
 * screen reader and by tab, which would make "collapsed" a lie.
 */
function Editor({
  totalSets,
  restSeconds,
  selectedAppIds,
  apps,
  onSets,
  onRest,
  onToggleApp,
}: {
  totalSets: number;
  restSeconds: number;
  selectedAppIds: string[];
  apps: BlockableApp[];
  onSets: (n: number) => void;
  onRest: (n: number) => void;
  onToggleApp: (id: string) => void;
}) {
  const enter = useEnter();

  return (
    <Animated.View style={[styles.editor, enter]}>
      <View style={styles.block}>
        <Text style={styles.label}>HOW MANY SETS</Text>
        <View style={styles.controls}>
          <Stepper
            label="Sets"
            value={totalSets}
            onChange={onSets}
            min={MIN_SETS}
            max={MAX_SETS}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>REST BETWEEN SETS</Text>
        <View style={styles.controls}>
          <Stepper
            label="Rest"
            value={restSeconds}
            onChange={onRest}
            step={5}
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            unit="SECONDS"
          />
          <Segmented
            label="Rest"
            options={REST_PRESETS}
            value={restSeconds}
            onChange={onRest}
            format={n => `${n}s`}
          />
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>APPS TO BLOCK</Text>
        <Text style={styles.help}>Tap the ones you want out of reach.</Text>
        <View style={styles.apps}>
          {apps.map(app => (
            <AppPill
              key={app.id}
              brand={app.brand}
              name={app.name}
              tint={app.tint}
              checked={selectedAppIds.includes(app.id)}
              onPress={() => onToggleApp(app.id)}
            />
          ))}
        </View>
        <Text style={styles.note}>
          Preview only for now — no apps are actually blocked yet.
        </Text>
      </View>

      <Text style={styles.note}>
        Changes here apply to this workout only. Settings holds your defaults.
      </Text>
    </Animated.View>
  );
}

/** Springs when you toggle it, so picking your apps has some snap to it. */
function AppPill({
  brand,
  name,
  tint,
  checked,
  onPress,
}: {
  brand?: BrandId;
  name: string;
  tint: string;
  checked: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const pressScale = usePressScale({ depth: 0.94, haptic: true });
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) {
      return;
    }
    pop.setValue(checked ? 0.88 : 1.06);
    const animation = Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 16,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [checked, pop, reduceMotion]);

  return (
    <Animated.View style={[{ transform: [{ scale: pop }] }, pressScale.style]}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
        accessibilityLabel={name}
        onPress={onPress}
        style={[styles.app, checked && styles.appOn]}>
        {brand ? (
          <BrandIcon
            id={brand}
            // Full brand colour when it's going to be blocked, drained when not.
            color={checked ? tint : colors.faintOnDark}
            hole={checked ? colors.raised : colors.surface}
          />
        ) : (
          // Apps added by hand have no logo to draw.
          <View
            style={[
              styles.monogram,
              { borderColor: checked ? tint : colors.hairline },
            ]}>
            <Text
              style={[
                styles.monogramText,
                { color: checked ? tint : colors.faintOnDark },
              ]}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.appName, checked && styles.appNameOn]}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    // Fills the screen so the button can sit at the bottom where a thumb is,
    // and still scrolls once the editor is open and the content outgrows it.
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },

  /**
   * `flexGrow` with no shrink: it takes the slack when the editor is closed
   * and centres what's there, and pushes past the screen — letting the
   * ScrollView do its job — when the editor opens.
   */
  body: { flexGrow: 1, justifyContent: 'center', gap: spacing.lg },
  head: { gap: spacing.sm },
  eyebrow: { ...type.tag, color: colors.accent },
  exercise: {
    ...type.display,
    fontSize: 42,
    color: colors.white,
    paddingVertical: spacing.xs,
    // No box: the rule underneath is the only thing saying "editable".
    backgroundColor: 'transparent',
  },
  rule: { height: 2, borderRadius: 2, backgroundColor: colors.hairline },

  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  summary: { flex: 1, gap: spacing.xs },
  plan: { ...type.title, fontSize: 24, color: colors.white },
  dot: { color: colors.faintOnDark },
  blocked: { ...type.helper, fontSize: 14, color: colors.mutedOnDark, lineHeight: 19 },
  edit: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.accent,
  },
  editText: { ...type.tag, color: colors.accent },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  estimateLabel: { ...type.tag, color: colors.faintOnDark },
  estimateValue: { ...type.body, fontWeight: '800', color: colors.accent },

  editor: { gap: spacing.xl },
  block: { gap: spacing.md },
  label: { ...type.tag, color: colors.faintOnDark },
  help: { ...type.helper, color: colors.mutedOnDark, marginTop: -spacing.sm },
  controls: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },

  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  app: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
  },
  appOn: {
    backgroundColor: colors.raised,
    borderColor: colors.accent,
  },
  appName: { ...type.body, fontWeight: '600', color: colors.faintOnDark },
  appNameOn: { color: colors.white },
  monogram: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: 11, fontWeight: '800' },
  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark, lineHeight: 18 },

  cta: { gap: spacing.md, paddingTop: spacing.lg },
  hint: {
    ...type.helper,
    fontSize: 13,
    color: colors.faintOnDark,
    textAlign: 'center',
    lineHeight: 18,
  },
});
