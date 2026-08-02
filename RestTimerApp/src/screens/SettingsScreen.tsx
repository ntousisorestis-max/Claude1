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
import { AccountCard } from '../components/AccountCard';
import { AppPill } from '../components/AppPill';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HeroDumbbell } from '../components/HeroDumbbell';
import { Icon } from '../components/Icon';
import { SettingsSection } from '../components/SettingsSection';
import { Toggle } from '../components/Toggle';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_APP_NAME_LENGTH,
  MAX_CUSTOM_APPS,
} from '../state/workoutReducer';
import { APP_NAME, APP_VERSION } from '../appInfo';
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * App-wide preferences — and only those.
 *
 * Sets and rest belong to each exercise, so this screen holds what's genuinely
 * global: how the rest-over alert behaves, the pool of blockable apps and
 * which of them a new exercise starts with, and the one destructive action.
 */
export function SettingsScreen() {
  const {
    state: { defaults, exercises },
    toggleDefaultApp,
    setSoundEnabled,
    addCustomApp,
    removeCustomApp,
    deleteAllExercises,
  } = useWorkout();

  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const enter = useEnter();
  const enterBody = useEnter(80);

  const apps = allBlockableApps(defaults.customApps);
  const atAppLimit = defaults.customApps.length >= MAX_CUSTOM_APPS;
  const trimmed = draft.trim();
  const duplicate =
    trimmed.length > 0 &&
    apps.some(app => app.name.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !duplicate && !atAppLimit;

  const submitApp = () => {
    if (!canAdd) {
      return;
    }
    addCustomApp(trimmed);
    setDraft('');
    setAdding(false);
  };

  const count = exercises.length;
  const silent = !defaults.soundEnabled;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.hero, enter]}>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <Text style={styles.masthead}>
              Settings<Text style={styles.stop}>.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Customise your rest. Stay locked in.
            </Text>
          </View>

          <HeroDumbbell size={118} />
        </Animated.View>

        <Animated.View style={[styles.sections, enterBody]}>
          {/* First, because it's the only thing here that decides whether
              anything you do in this app outlives the app being closed. */}
          <AccountCard />

          <SettingsSection
            icon="bell"
            title="Alerts"
            description="Get notified when your rest is over.">
            <View style={styles.rows}>
              <View style={styles.row}>
                <RowTile icon="speaker" on={!silent} />
                <Toggle
                  label="Sound"
                  help="Play a sound when rest is over."
                  value={defaults.soundEnabled}
                  onChange={setSoundEnabled}
                />
              </View>

              {/* The same setting from the other side, not a second one. Two
                  independent switches over one behaviour can disagree, and
                  then neither of them is the truth. */}
              <SilentModeRow on={silent} onPress={() => setSoundEnabled(silent)} />
            </View>
          </SettingsSection>

          <SettingsSection
            icon="phone"
            title="Apps to Block"
            description="These start ticked on a new exercise. Changing them here leaves the exercises you already have alone.">
            <View style={styles.apps}>
              {apps.map(app => (
                <AppPill
                  key={app.id}
                  app={app}
                  checked={defaults.selectedAppIds.includes(app.id)}
                  label={`${app.name} on new exercises`}
                  onPress={() => toggleDefaultApp(app.id)}
                  onRemove={app.brand ? undefined : () => removeCustomApp(app.id)}
                />
              ))}
            </View>

            {adding ? (
              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={submitApp}
                  placeholder="App name"
                  placeholderTextColor={colors.faintOnDark}
                  style={styles.input}
                  maxLength={MAX_APP_NAME_LENGTH}
                  returnKeyType="done"
                  autoCapitalize="words"
                  accessibilityLabel="New app name"
                />
                {duplicate ? (
                  <Text style={styles.warn}>{trimmed} is already in the list.</Text>
                ) : null}
                <View style={styles.composerRow}>
                  <PillButton
                    label="Add app"
                    disabled={!canAdd}
                    onPress={submitApp}
                    solid
                  />
                  <PillButton
                    label="Cancel"
                    onPress={() => {
                      setDraft('');
                      setAdding(false);
                    }}
                  />
                </View>
              </View>
            ) : (
              <AddAnotherApp
                disabled={atAppLimit}
                onPress={() => setAdding(true)}
              />
            )}

            <Text style={styles.note}>
              {atAppLimit
                ? `That's the limit of ${MAX_CUSTOM_APPS} apps you can add.`
                : 'Names are a stand-in for now — nothing is actually blocked until Phase 2.'}
            </Text>
          </SettingsSection>

          <SettingsSection
            icon="dumbbell"
            mark={
              <Image
                source={require('../../assets/logo.png')}
                style={styles.tileLogo}
                resizeMode="contain"
              />
            }
            title="Exercises"
            description="Manage your saved exercises.">
            <DangerRow
              label="Delete all exercises"
              disabled={count === 0}
              onPress={() => setConfirming(true)}
            />
            <Text style={styles.note}>
              {count === 0
                ? 'Nothing saved yet.'
                : `You have ${count} exercise${count === 1 ? '' : 's'} saved.`}
            </Text>
          </SettingsSection>

          <View style={styles.about}>
            <View style={styles.aboutTile}>
              <Icon name="lock" color={colors.accentText} size={20} />
            </View>
            <View style={styles.aboutText}>
              <View style={styles.aboutTitleRow}>
                <Text style={styles.aboutName}>{APP_NAME}</Text>
                <View style={styles.versionPill}>
                  <Text style={styles.versionText}>v{APP_VERSION}</Text>
                </View>
              </View>
              <Text style={styles.aboutSub}>Built to keep you focused.</Text>
            </View>
          </View>

          <Text style={styles.note}>
            Exercises and settings still reset when the app restarts — only your
            focus totals are saved, and only while you’re signed in.
          </Text>
        </Animated.View>

        <ConfirmDialog
          visible={confirming}
          title={
            count === 1 ? 'Delete your exercise?' : `Delete all ${count} exercises?`
          }
          message="Every exercise and everything set on it goes. This can’t be undone."
          confirmLabel="Delete them all"
          onConfirm={() => {
            setConfirming(false);
            deleteAllExercises();
          }}
          onCancel={() => setConfirming(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Silent mode: the alert still arrives, it just doesn't make a sound.
 *
 * Deliberately the *same* stored setting as the Sound toggle rather than a
 * second flag. They're inverses of one another, so two independent switches
 * could be set to contradict — sound on and silent on — and there'd be no
 * honest answer for what the app should then do.
 *
 * The behaviour underneath already existed: `notifications.ts` keeps two
 * Android channels because a channel's sound can't be changed after it's
 * created, and the silent one still posts the notification at DEFAULT
 * importance. This surfaces it and gives it a name.
 */
function SilentModeRow({ on, onPress }: { on: boolean; onPress: () => void }) {
  const press = usePressScale({ depth: 0.99, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      // react-native-web doesn't derive aria-checked from accessibilityState.
      aria-checked={on}
      accessibilityLabel="Silent mode"
      onPress={onPress}
      style={[styles.row, styles.rowTop, press.style]}>
      <RowTile icon="bellOff" on={on} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, on && styles.rowTitleOn]}>Silent mode</Text>
        <Text style={styles.rowHelp}>
          {on
            ? 'On. Alerts still pop up — they just stay quiet.'
            : 'Mute the alert without losing it.'}
        </Text>
      </View>
      <View style={[styles.mark, on && styles.markOn]}>
        {on ? <Icon name="check" color={colors.white} size={12} strokeWidth={2.6} /> : null}
      </View>
    </AnimatedPressable>
  );
}

/** The small square glyph that starts each row in the Alerts card. */
function RowTile({ icon, on }: { icon: 'speaker' | 'bellOff'; on: boolean }) {
  return (
    <View style={[styles.rowTile, on && styles.rowTileOn]}>
      <Icon
        name={icon}
        color={on ? colors.accentText : colors.faintOnDark}
        size={18}
      />
    </View>
  );
}

function AddAnotherApp({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const press = usePressScale({ depth: 0.98, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel="Add another app"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.add, disabled && styles.addOff, press.style]}>
      <Icon
        name="plus"
        color={disabled ? colors.faintOnDark : colors.accentText}
        size={18}
      />
      <Text style={[styles.addText, disabled && styles.addTextOff]}>
        Add another app
      </Text>
    </AnimatedPressable>
  );
}

function PillButton({
  label,
  disabled = false,
  solid = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  solid?: boolean;
  onPress: () => void;
}) {
  const press = usePressScale({ depth: 0.95, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pill,
        solid && styles.pillSolid,
        disabled && styles.pillOff,
        press.style,
      ]}>
      <Text
        style={[
          styles.pillText,
          solid && styles.pillTextSolid,
          disabled && styles.pillTextOff,
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** The one destructive action, styled so it can't be mistaken for a setting. */
function DangerRow({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const press = usePressScale({ depth: 0.98, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.danger, disabled && styles.dangerOff, press.style]}>
      <Icon
        name="trash"
        color={disabled ? colors.faintOnDark : colors.danger}
        size={19}
      />
      <Text style={[styles.dangerText, disabled && styles.dangerTextOff]}>
        {label}
      </Text>
      <Icon
        name="chevron"
        color={disabled ? colors.faintOnDark : colors.danger}
        size={16}
      />
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

  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroText: { flex: 1, gap: 2 },
  eyebrow: { ...type.tag, color: colors.accentText, marginBottom: spacing.xs },
  masthead: { ...sized(type.display, 42), color: colors.white },
  stop: { color: colors.accent },
  heroSub: {
    ...type.helper,
    fontSize: 14,
    color: colors.mutedOnDark,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  sections: { gap: spacing.lg },
  /** Wide-and-short mark in a square tile, so it's sized for what it paints. */
  tileLogo: { width: 30, height: 30 },

  /** One step darker than the card, so a row reads as sunk into it. */
  rows: { backgroundColor: colors.ink, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowTop: { borderTopWidth: HAIRLINE, borderTopColor: colors.hairline },
  rowTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTileOn: { backgroundColor: colors.accentWash, borderColor: colors.accent },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...type.body, fontWeight: '600', color: colors.white },
  rowTitleOn: { color: colors.accentText },
  rowHelp: { ...type.helper, fontSize: 13, color: colors.mutedOnDark, lineHeight: 18 },
  mark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { backgroundColor: colors.accent, borderColor: colors.accent },

  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  addOff: { opacity: 0.45 },
  addText: { ...type.body, fontWeight: '600', color: colors.accentText },
  addTextOff: { color: colors.faintOnDark },

  composer: { gap: spacing.sm },
  input: {
    ...type.body,
    color: colors.white,
    backgroundColor: colors.ink,
    borderWidth: HAIRLINE,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  composerRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSolid: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillOff: { backgroundColor: colors.ink, borderColor: colors.hairline },
  pillText: { ...type.body, fontWeight: '700', color: colors.mutedOnDark },
  pillTextSolid: { color: colors.white },
  pillTextOff: { color: colors.faintOnDark },
  warn: { ...type.helper, fontSize: 13, color: colors.danger },

  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: HAIRLINE,
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 107, 129, 0.07)',
  },
  dangerOff: { borderColor: colors.hairline, backgroundColor: colors.ink },
  dangerText: { ...type.body, fontWeight: '700', color: colors.danger, flex: 1 },
  dangerTextOff: { color: colors.faintOnDark },

  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  aboutTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: { flex: 1, gap: 3 },
  aboutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aboutName: { ...sized(type.title, 20), color: colors.white },
  versionPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.accent,
  },
  versionText: { ...sized(type.tag, 10), color: colors.accentText },
  aboutSub: { ...type.helper, fontSize: 13, color: colors.mutedOnDark },

  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark, lineHeight: 18 },
});
