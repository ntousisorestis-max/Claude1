import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { usePressScale } from '../hooks/usePressScale';
import { useAccount } from '../cloud/AccountContext';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  TAP_TARGET,
  themed,
  type,
  useColors,
} from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Firebase's own floor. Enforced here too, so the error arrives before the trip. */
const MIN_PASSWORD = 6;
const MAX_NAME = 24;

type Mode = 'signIn' | 'signUp';

/**
 * Email and password, in a sheet.
 *
 * Drawn rather than pulled from a UI kit for the same reason `ConfirmDialog` is:
 * one behaviour on all three targets, and it looks like the rest of the app.
 *
 * Deliberately the smallest thing that works — no password reset, no social
 * providers, no email verification gate. Those are all real and all worth
 * having, and every one of them is a screen; this step is the foundation the
 * Focusboard sits on, not the account system's final form.
 */
export function AuthSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const { signIn, signUp, error, clearError, busy } = useAccount();

  const [mode, setMode] = useState<Mode>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // A stale error from the last attempt sitting above a freshly opened form
  // reads as though the form is already broken.
  useEffect(() => {
    if (visible) {
      clearError();
    }
  }, [visible, clearError]);

  const signingUp = mode === 'signUp';
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordOk = password.length >= MIN_PASSWORD;
  const nameOk = !signingUp || name.trim().length > 0;
  const ready = emailOk && passwordOk && nameOk && !busy;

  const submit = async () => {
    if (!ready) {
      return;
    }
    const ok = signingUp
      ? await signUp(email, password, name)
      : await signIn(email, password);
    if (ok) {
      setPassword('');
      onClose();
    }
  };

  const swap = () => {
    setMode(signingUp ? 'signIn' : 'signUp');
    clearError();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Not in the accessibility tree — it would announce as a second
            button named the same as Close. See ConfirmDialog. */}
        <Pressable accessible={false} onPress={onClose} style={styles.backdrop}>
          <Pressable
            accessibilityViewIsModal
            onPress={() => {}}
            style={styles.card}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
            >
              <View style={styles.head}>
                <View style={styles.tile}>
                  <Icon name="user" color={colors.accentText} size={20} />
                </View>
                <View style={styles.headText}>
                  <Text style={styles.title}>
                    {signingUp ? 'Create account' : 'Welcome back'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {signingUp
                      ? 'So your focus time follows you between phones.'
                      : 'Sign in to pick your totals back up.'}
                  </Text>
                </View>
              </View>

              {signingUp ? (
                <Field
                  label="Display name"
                  hint="What other people will see on the Focusboard."
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex"
                  autoCapitalize="words"
                  maxLength={MAX_NAME}
                  textContentType="nickname"
                />
              ) : null}

              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              <Field
                label="Password"
                hint={
                  signingUp ? `At least ${MIN_PASSWORD} characters.` : undefined
                }
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                textContentType={signingUp ? 'newPassword' : 'password'}
                onSubmitEditing={submit}
                returnKeyType="go"
              />

              {error ? (
                <View style={styles.error} accessibilityLiveRegion="polite">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Submit
                label={signingUp ? 'Create account' : 'Sign in'}
                busy={busy}
                disabled={!ready}
                onPress={submit}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  signingUp
                    ? 'Sign in to an existing account'
                    : 'Create a new account'
                }
                onPress={swap}
                style={styles.swap}
              >
                <Text style={styles.swapText}>
                  {signingUp
                    ? 'Already have an account? Sign in'
                    : 'New here? Create an account'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.close}
              >
                <Text style={styles.closeText}>Not now</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A labelled input. The label is real text, not a placeholder that vanishes. */
function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.ComponentProps<typeof TextInput>) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={colors.faint}
        style={styles.input}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function Submit({
  label,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.97, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.submit, disabled && styles.submitOff, press.style]}
    >
      {/* The spinner replaces the label rather than sitting beside it, so the
          button doesn't change width the instant it's pressed. */}
      {busy ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Text style={[styles.submitText, disabled && styles.submitTextOff]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    flex: { flex: 1 },
    backdrop: {
      flex: 1,
      backgroundColor: colors.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '92%',
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
    },
    body: { padding: spacing.lg, gap: spacing.md },

    head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    tile: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentWash,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headText: { flex: 1, gap: 3, paddingTop: 2 },
    title: { ...sized(type.title, 24), color: colors.white },
    subtitle: {
      ...type.helper,
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },

    field: { gap: 6 },
    label: { ...sized(type.tag, 11), color: colors.accentText },
    input: {
      ...type.body,
      color: colors.white,
      backgroundColor: colors.ink,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    hint: { ...type.helper, fontSize: 13, color: colors.faint },

    error: {
      backgroundColor: colors.dangerWash,
      borderWidth: HAIRLINE,
      borderColor: colors.danger,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: {
      ...type.helper,
      fontSize: 14,
      color: colors.danger,
      lineHeight: 20,
    },

    submit: {
      minHeight: TAP_TARGET,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    submitOff: { backgroundColor: colors.raised },
    /**
     * 19px bold. White on `accent` is 4.22:1 — over AA's 3.0 for large text,
     * under the 4.5 for body text — and WCAG's line is 18.66px bold.
     */
    submitText: { ...sized(type.action, 19), color: colors.textOnAccent },
    submitTextOff: { color: colors.faint },

    swap: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    swapText: { ...type.body, fontWeight: '600', color: colors.accentText },
    close: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    closeText: { ...type.helper, fontSize: 14, color: colors.faint },
  }),
);
