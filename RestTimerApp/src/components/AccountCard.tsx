import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthSheet } from './AuthSheet';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon, type IconName } from './Icon';
import { SettingsSection } from './SettingsSection';
import { usePressScale } from '../hooks/usePressScale';
import { useAccount } from '../cloud/AccountContext';
import {
  describeDuration,
  HAIRLINE,
  radius,
  sized,
  spacing,
  themed,
  type,
  useColors,
} from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The account section on Settings.
 *
 * Signing in lives here rather than behind its own tab because, right now, an
 * account does exactly one thing: it makes your focus time survive the app
 * closing. That is a preference, not a destination. It moves to the Focusboard
 * tab when there is a Focusboard to sign into.
 */
export function AccountCard() {
  const styles = useStyles();
  const colors = useColors();
  const { status, user, totals, sync, pendingCount, signOut } = useAccount();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmingOut, setConfirmingOut] = useState(false);

  return (
    <>
      <SettingsSection icon="user" title="Account">
        {status === 'unconfigured' ? <NotConfigured /> : null}

        {status === 'loading' ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentText} />
            <Text style={styles.note}>Checking if you’re signed in…</Text>
          </View>
        ) : null}

        {status === 'signed-out' ? (
          <>
            <PrimaryRow
              icon="user"
              label="Sign in or create an account"
              onPress={() => setSheetOpen(true)}
            />
            <Text style={styles.note}>
              Not signed in. Your workouts still work exactly as they do now —
              they just aren’t saved anywhere.
            </Text>
          </>
        ) : null}

        {status === 'signed-in' && user ? (
          <>
            <View style={styles.who}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {user.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.whoText}>
                <Text style={styles.name}>{user.displayName}</Text>
                <SyncLine sync={sync} pendingCount={pendingCount} />
              </View>
            </View>

            <View style={styles.totals}>
              <Total
                value={String(describeDuration(totals.focusSeconds).value)}
                unit={describeDuration(totals.focusSeconds).unit}
                label="Reclaimed"
              />
              <View style={styles.divider} />
              <Total
                value={String(totals.setsCompleted)}
                unit={totals.setsCompleted === 1 ? 'set' : 'sets'}
                label="Completed"
              />
              <View style={styles.divider} />
              <Total
                value={String(totals.workoutsFinished)}
                unit={totals.workoutsFinished === 1 ? 'workout' : 'workouts'}
                label="Finished"
              />
            </View>

            <QuietRow
              icon="signOut"
              label="Sign out"
              onPress={() => setConfirmingOut(true)}
            />
          </>
        ) : null}
      </SettingsSection>

      <AuthSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />

      <ConfirmDialog
        visible={confirmingOut}
        title="Sign out?"
        message={
          pendingCount > 0
            ? 'One of your workouts hasn’t been saved to the server yet, and signing out now will lose it. Your saved totals are safe.'
            : 'Your totals stay on your account. Sign back in any time to pick them up.'
        }
        // Deliberately not "Sign out" — that is the row that opened this, and
        // two controls on screen announcing the same name is a real ambiguity
        // for anyone navigating by label, not just an awkward sentence.
        confirmLabel="Sign me out"
        onConfirm={() => {
          setConfirmingOut(false);
          signOut().catch(err =>
            console.warn('[focusboard] sign out failed', err),
          );
        }}
        onCancel={() => setConfirmingOut(false)}
      />
    </>
  );
}

/**
 * What the section says before anyone has made a Firebase project.
 *
 * Written as a next step rather than an error, because nothing is broken: this
 * is the app's normal state until someone follows the setup guide.
 */
function NotConfigured() {
  const styles = useStyles();
  const colors = useColors();
  return (
    <>
      <View style={styles.setup}>
        <Icon name="lock" color={colors.faint} size={18} />
        <Text style={styles.setupText}>Accounts aren’t switched on yet.</Text>
      </View>
      <Text style={styles.note}>
        Follow FIREBASE_SETUP.md in the project folder — it walks through making
        a free Firebase project and pasting six values into
        src/cloud/firebaseConfig.ts. Everything else here already works.
      </Text>
    </>
  );
}

/** One line of "is my data actually up there". */
function SyncLine({
  sync,
  pendingCount,
}: {
  sync: string;
  pendingCount: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  if (pendingCount > 0) {
    return (
      <View style={styles.syncRow}>
        <Icon name="clock" color={colors.faint} size={13} />
        <Text style={styles.syncText}>
          {pendingCount === 1
            ? 'A workout is waiting to be saved'
            : `${pendingCount} workouts waiting to be saved`}
        </Text>
      </View>
    );
  }
  if (sync === 'syncing') {
    return (
      <View style={styles.syncRow}>
        <ActivityIndicator size="small" color={colors.faint} />
        <Text style={styles.syncText}>Saving…</Text>
      </View>
    );
  }
  return (
    <View style={styles.syncRow}>
      <Icon name="check" color={colors.accentText} size={13} />
      <Text style={[styles.syncText, styles.syncOn]}>Everything saved</Text>
    </View>
  );
}

function Total({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.total}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalUnit}>{unit}</Text>
      <Text style={styles.totalLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

/** The card's call to action. */
function PrimaryRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.98, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.primary, press.style]}
    >
      <Icon name={icon} color={colors.textOnAccent} size={19} />
      <Text style={styles.primaryText}>{label}</Text>
      <Icon name="chevron" color={colors.textOnAccent} size={16} />
    </AnimatedPressable>
  );
}

/** Present but not inviting — leaving shouldn't be the brightest thing here. */
function QuietRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.98, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.quiet, press.style]}
    >
      <Icon name={icon} color={colors.muted} size={18} />
      <Text style={styles.quietText}>{label}</Text>
      <Icon name="chevron" color={colors.faint} size={15} />
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

    who: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.ink,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: { ...sized(type.title, 20), color: colors.textOnAccent },
    whoText: { flex: 1, gap: 4 },
    name: { ...sized(type.title, 20), color: colors.white },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    syncText: { ...type.helper, fontSize: 13, color: colors.faint },
    syncOn: { color: colors.accentText },

    totals: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.ink,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    total: { flex: 1, alignItems: 'center', gap: 1 },
    totalValue: { ...sized(type.display, 26), color: colors.white },
    totalUnit: { ...type.helper, fontSize: 12, color: colors.muted },
    totalLabel: { ...sized(type.tag, 9), color: colors.faint, marginTop: 4 },
    divider: {
      width: HAIRLINE,
      backgroundColor: colors.hairline,
      marginVertical: 2,
    },

    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
    },
    /**
     * 19px bold, not 16.
     *
     * White on `accent` measures 4.22:1. That clears AA's 3.0 bar for large text
     * and misses the 4.5 for body text, and WCAG puts the line at 18.66px bold —
     * so the label is sized past it rather than the button being recoloured. The
     * same fix `GradientButton` and the Insights account button carry.
     */
    primaryText: {
      ...sized(type.action, 19),
      color: colors.textOnAccent,
      flex: 1,
    },

    quiet: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
    },
    quietText: {
      ...type.body,
      fontWeight: '600',
      color: colors.muted,
      flex: 1,
    },

    setup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    setupText: { ...type.body, fontWeight: '600', color: colors.muted },

    note: { ...type.helper, fontSize: 13, color: colors.faint, lineHeight: 18 },
  }),
);
