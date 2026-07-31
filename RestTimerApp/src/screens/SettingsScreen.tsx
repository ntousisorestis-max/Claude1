import React from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BrandIcon, type BrandId } from '../components/BrandIcon';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import {
  BLOCKABLE_APPS,
  MAX_REST_SECONDS,
  MAX_SETS,
  MIN_REST_SECONDS,
  MIN_SETS,
  REST_PRESETS,
} from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, type } from '../theme';

/**
 * Defaults for the next workout.
 *
 * Deliberately the same controls as the setup screen, wired to `defaults`
 * instead of `config` — a settings screen that looked different from the thing
 * it configures would just be a second thing to learn.
 */
export function SettingsScreen() {
  const {
    state: { defaults },
    setDefaultSets,
    setDefaultRest,
    toggleDefaultApp,
  } = useWorkout();

  const enter = useEnter();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={enter}>
        <Text style={styles.eyebrow}>DEFAULTS</Text>
        <Text style={styles.masthead}>
          Settings<Text style={styles.stop}>.</Text>
        </Text>
        <Text style={styles.intro}>
          Every new workout starts from these.
        </Text>
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
        <Text style={styles.label}>APPS TO BLOCK</Text>
        <Text style={styles.help}>
          These start selected on every new workout.
        </Text>
        <View style={styles.apps}>
          {BLOCKABLE_APPS.map(app => {
            const checked = defaults.selectedAppIds.includes(app.id);
            return (
              <Pressable
                key={app.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${app.name} by default`}
                onPress={() => toggleDefaultApp(app.id)}
                style={({ pressed }) => [
                  styles.app,
                  checked && styles.appOn,
                  pressed && styles.pressed,
                ]}>
                <BrandIcon
                  id={app.id as BrandId}
                  color={checked ? app.tint : colors.faintOnDark}
                  hole={checked ? colors.raised : colors.surface}
                />
                <Text style={[styles.appName, checked && styles.appNameOn]}>
                  {app.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.note}>
        Nothing is saved between launches yet — defaults reset when the app
        restarts.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  pressed: { opacity: 0.85 },
  note: { ...type.helper, fontSize: 13, color: colors.faintOnDark },
});
