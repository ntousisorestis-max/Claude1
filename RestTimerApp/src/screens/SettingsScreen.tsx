import React, { useState } from 'react';
import {
  Alert,
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
import { BrandIcon } from '../components/BrandIcon';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { Toggle } from '../components/Toggle';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import {
  allBlockableApps,
  MAX_APP_NAME_LENGTH,
  MAX_CUSTOM_APPS,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { APP_NAME, APP_VERSION } from '../appInfo';
import { colors, HAIRLINE, radius, spacing, type } from '../theme';

/**
 * Defaults for the next workout, plus the app-level switches.
 *
 * The sets/rest/apps controls are deliberately the same components the setup
 * screen uses, wired to `defaults` instead of `config` — a settings screen
 * that looked different from the thing it configures would be a second thing
 * to learn.
 */
export function SettingsScreen() {
  const {
    state: { defaults },
    setDefaultSets,
    setDefaultRest,
    toggleDefaultApp,
    setSoundEnabled,
    addCustomApp,
    removeCustomApp,
    resetDefaults,
  } = useWorkout();

  const [draft, setDraft] = useState('');
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

  const confirmReset = () =>
    Alert.alert(
      'Reset to defaults?',
      `Back to ${MIN_DESCRIPTION}. Apps you added will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetDefaults },
      ],
    );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={enter}>
          <Text style={styles.eyebrow}>DEFAULTS</Text>
          <Text style={styles.masthead}>
            Settings<Text style={styles.stop}>.</Text>
          </Text>
          <Text style={styles.intro}>Every new workout starts from these.</Text>
        </Animated.View>

        <View style={styles.block}>
          <Text style={styles.label}>SETS</Text>
          <View style={styles.card}>
            <Stepper
              label="Default sets"
              value={defaults.totalSets}
              onChange={setDefaultSets}
              min={MIN_SETS}
              max={MAX_SETS}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>REST BETWEEN SETS</Text>
          <View style={styles.card}>
            <Stepper
              label="Default rest"
              value={defaults.restSeconds}
              onChange={setDefaultRest}
              step={5}
              min={MIN_REST_SECONDS}
              max={MAX_REST_SECONDS}
              unit="SECONDS"
            />
            <Segmented
              label="Default rest"
              options={REST_PRESETS}
              value={defaults.restSeconds}
              onChange={setDefaultRest}
              format={n => `${n}s`}
            />
          </View>
        </View>

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
            These start selected on every new workout.
          </Text>

          <View style={styles.apps}>
            {apps.map(app => {
              const checked = defaults.selectedAppIds.includes(app.id);
              const custom = !app.brand;
              return (
                <Pressable
                  key={app.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  aria-checked={checked}
                  accessibilityLabel={`${app.name} by default`}
                  onPress={() => toggleDefaultApp(app.id)}
                  style={({ pressed }) => [
                    styles.app,
                    checked && styles.appOn,
                    pressed && styles.pressed,
                  ]}>
                  {app.brand ? (
                    <BrandIcon
                      id={app.brand}
                      color={checked ? app.tint : colors.faintOnDark}
                      hole={checked ? colors.raised : colors.surface}
                    />
                  ) : (
                    <View
                      style={[
                        styles.monogram,
                        { borderColor: checked ? app.tint : colors.hairline },
                      ]}>
                      <Text
                        style={[
                          styles.monogramText,
                          { color: checked ? app.tint : colors.faintOnDark },
                        ]}>
                        {app.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.appName, checked && styles.appNameOn]}>
                    {app.name}
                  </Text>

                  {custom ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${app.name}`}
                      onPress={() => removeCustomApp(app.id)}
                      hitSlop={8}
                      style={styles.remove}>
                      <Text style={styles.removeMark}>×</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add app"
              accessibilityState={{ disabled: !canAdd }}
              onPress={submitApp}
              disabled={!canAdd}
              style={({ pressed }) => [
                styles.addButton,
                !canAdd && styles.addButtonOff,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.addMark, !canAdd && styles.addMarkOff]}>+</Text>
            </Pressable>
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
          <Text style={styles.label}>RESET</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset to defaults"
            onPress={confirmReset}
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
            <Text style={styles.resetText}>Reset to defaults</Text>
          </Pressable>
          <Text style={styles.note}>Back to {MIN_DESCRIPTION}.</Text>
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
          Nothing is saved between launches yet — settings reset when the app
          restarts.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Spelled once, used by both the confirm dialog and the caption under it. */
const MIN_DESCRIPTION = '3 sets, 60 seconds rest, TikTok and Instagram';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  eyebrow: { ...type.tag, color: colors.accent, marginBottom: spacing.sm },
  masthead: { ...type.display, fontSize: 46, color: colors.white },
  stop: { color: colors.accent },
  intro: { ...type.helper, color: colors.mutedOnDark, marginTop: spacing.md },

  block: { gap: spacing.md },
  label: { ...type.tag, color: colors.faintOnDark },
  help: { ...type.helper, color: colors.mutedOnDark, marginTop: -spacing.sm },
  card: {
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
  appOn: { backgroundColor: colors.raised, borderColor: colors.accent },
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
  remove: { paddingLeft: spacing.xs },
  removeMark: { fontSize: 20, lineHeight: 22, color: colors.faintOnDark },

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
  addButtonOff: { backgroundColor: colors.surface, borderWidth: HAIRLINE, borderColor: colors.hairline },
  addMark: { fontSize: 26, lineHeight: 30, fontWeight: '600', color: colors.white },
  addMarkOff: { color: colors.faintOnDark },
  warn: { ...type.helper, fontSize: 13, color: colors.danger },

  reset: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: HAIRLINE,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { ...type.action, fontSize: 17, color: colors.danger },

  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    paddingTop: spacing.lg,
  },
  aboutLogo: { width: 44, height: 44, borderRadius: radius.sm },
  aboutText: { gap: 2 },
  aboutName: { ...type.body, fontWeight: '700', color: colors.white },
  aboutVersion: { ...type.helper, fontSize: 13, color: colors.faintOnDark },

  pressed: { opacity: 0.85 },
  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark },
});
