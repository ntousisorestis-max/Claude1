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
import { AppPill } from '../components/AppPill';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
import { colors, HAIRLINE, radius, spacing, type } from '../theme';

/**
 * App-wide preferences — and only those.
 *
 * Sets and rest used to live here as one shared pair of numbers. They now
 * belong to each exercise, so this screen holds what's genuinely global: the
 * sound switch, the pool of blockable apps, and which of them a newly created
 * exercise starts with ticked.
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
  const [confirming, setConfirming] = useState(false);
  const enter = useEnter();

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
  };

  const count = exercises.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={enter}>
          <Text style={styles.eyebrow}>PREFERENCES</Text>
          <Text style={styles.masthead}>
            Settings<Text style={styles.stop}>.</Text>
          </Text>
          <Text style={styles.intro}>
            Sets and rest live on each exercise now. This is everything else.
          </Text>
        </Animated.View>

        <View style={styles.block}>
          <Text style={styles.label}>ALERTS</Text>
          <View style={styles.card}>
            <Toggle
              label="Sound"
              help="Play a sound when rest is over."
              value={defaults.soundEnabled}
              onChange={setSoundEnabled}
            />
          </View>
          <Text style={styles.note}>
            The alert still appears silently when this is off.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>APPS TO BLOCK</Text>
          <Text style={styles.help}>
            These start ticked on a new exercise. Changing them here leaves the
            exercises you already have alone.
          </Text>

          <View style={styles.apps}>
            {apps.map(app => (
              <AppPill
                key={app.id}
                app={app}
                checked={defaults.selectedAppIds.includes(app.id)}
                label={`${app.name} on new exercises`}
                onPress={() => toggleDefaultApp(app.id)}
                onRemove={
                  app.brand ? undefined : () => removeCustomApp(app.id)
                }
              />
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submitApp}
              placeholder={atAppLimit ? 'App limit reached' : 'Add another app'}
              placeholderTextColor={colors.faintOnDark}
              style={styles.addInput}
              maxLength={MAX_APP_NAME_LENGTH}
              editable={!atAppLimit}
              returnKeyType="done"
              autoCapitalize="words"
              accessibilityLabel="New app name"
            />
            <AddButton canAdd={canAdd} onPress={submitApp} />
          </View>

          {duplicate ? (
            <Text style={styles.warn}>{trimmed} is already in the list.</Text>
          ) : null}

          <Text style={styles.note}>
            Names are a stand-in for now — nothing is actually blocked until
            Phase 2.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>EXERCISES</Text>
          <DangerButton
            label="Delete all exercises"
            disabled={count === 0}
            onPress={() => setConfirming(true)}
          />
          <Text style={styles.note}>
            {count === 0
              ? 'Nothing saved yet.'
              : `You have ${count} exercise${count === 1 ? '' : 's'} saved.`}
          </Text>
        </View>

        <View style={styles.about}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.aboutLogo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={`${APP_NAME} logo`}
          />
          <View style={styles.aboutText}>
            <Text style={styles.aboutName}>{APP_NAME}</Text>
            <Text style={styles.aboutVersion}>Version {APP_VERSION}</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Nothing is saved between launches yet — exercises and settings reset
          when the app restarts.
        </Text>

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

function AddButton({ canAdd, onPress }: { canAdd: boolean; onPress: () => void }) {
  const pressScale = usePressScale({ depth: 0.9, haptic: canAdd });

  return (
    <Animated.View style={pressScale.style}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="button"
        accessibilityLabel="Add app"
        accessibilityState={{ disabled: !canAdd }}
        onPress={onPress}
        disabled={!canAdd}
        style={[styles.addButton, !canAdd && styles.addButtonOff]}>
        <Text style={[styles.addMark, !canAdd && styles.addMarkOff]}>+</Text>
      </Pressable>
    </Animated.View>
  );
}

function DangerButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const pressScale = usePressScale({ depth: 0.97, haptic: !disabled });

  return (
    <Animated.View style={pressScale.style}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
        style={[styles.danger, disabled && styles.dangerOff]}>
        <Text style={[styles.dangerText, disabled && styles.dangerTextOff]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  eyebrow: { ...type.tag, color: colors.accentText, marginBottom: spacing.sm },
  masthead: { ...type.display, fontSize: 46, color: colors.white },
  stop: { color: colors.accent },
  intro: {
    ...type.helper,
    color: colors.mutedOnDark,
    marginTop: spacing.md,
    lineHeight: 22,
  },

  block: { gap: spacing.md },
  label: { ...type.tag, color: colors.faintOnDark },
  help: {
    ...type.helper,
    color: colors.mutedOnDark,
    marginTop: -spacing.sm,
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },

  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addInput: {
    ...type.body,
    flex: 1,
    color: colors.white,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonOff: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
  },
  addMark: { fontSize: 26, lineHeight: 30, fontWeight: '600', color: colors.white },
  addMarkOff: { color: colors.faintOnDark },
  warn: { ...type.helper, fontSize: 13, color: colors.danger },

  danger: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: HAIRLINE,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerOff: { borderColor: colors.hairline },
  dangerText: { ...type.action, fontSize: 17, color: colors.danger },
  dangerTextOff: { color: colors.faintOnDark },

  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.lg,
  },
  aboutLogo: { width: 44, height: 44 },
  aboutText: { gap: 2 },
  aboutName: { ...type.body, fontWeight: '700', color: colors.white },
  aboutVersion: { ...type.helper, fontSize: 13, color: colors.faintOnDark },

  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark, lineHeight: 18 },
});
