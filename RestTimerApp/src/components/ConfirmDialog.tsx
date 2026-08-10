import React from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePresence } from '../hooks/usePresence';
import { usePressScale } from '../hooks/usePressScale';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  TAP_TARGET,
  themed,
  type,
} from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * "Are you sure?", drawn by the app rather than the OS.
 *
 * This replaces `Alert.alert`, which **does nothing at all on react-native-web**
 * — its implementation there is an empty function body, so every destructive
 * action that went through it was silently dead in the browser. Rather than
 * shim `window.confirm` in for web only, the dialog is drawn here: one
 * behaviour on all three targets, and it looks like the rest of the app instead
 * of like Chrome.
 *
 * `Modal` is used rather than an absolutely-positioned overlay because it is
 * the one thing that reliably sits above everything on all three platforms,
 * including the violet reveal disc at the root.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  /** Text on the destructive button. Keep it distinct from the button that
   * opened the dialog, so "which one did I just press" is never a question. */
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  const confirmPress = usePressScale({ haptic: true });
  const cancelPress = usePressScale({ haptic: true });
  const presence = usePresence(visible);

  return (
    <Modal
      visible={presence.mounted}
      transparent
      // Its own materialising animation runs below — see usePresence. Left as
      // "fade" here too would double it up.
      animationType="none"
      // Android's hardware back must dismiss it, not fall through to the screen.
      onRequestClose={onCancel}
    >
      {/* Tapping outside cancels — the safe half of a destructive choice.
          Deliberately not in the accessibility tree: it would announce as a
          second button with the same name as Cancel, which is worse than not
          having it. Anyone navigating by label uses the real button below. */}
      <AnimatedPressable
        accessible={false}
        onPress={onCancel}
        style={[styles.backdrop, { opacity: presence.opacity }]}
      >
        {/* Swallows taps so a press on the card itself doesn't dismiss it. */}
        <AnimatedPressable
          accessibilityViewIsModal
          onPress={() => {}}
          style={[styles.card, presence.style]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <AnimatedPressable
              {...confirmPress.handlers}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={[styles.confirm, confirmPress.style]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              {...cancelPress.handlers}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={[styles.cancel, cancelPress.style]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </AnimatedPressable>
          </View>
        </AnimatedPressable>
      </AnimatedPressable>
    </Modal>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: { ...sized(type.title, 26), color: colors.white },
    message: {
      ...type.helper,
      color: colors.muted,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    actions: { gap: spacing.sm },
    confirm: {
      minHeight: TAP_TARGET,
      borderRadius: radius.pill,
      borderWidth: HAIRLINE,
      borderColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /**
     * Bumped with `cancelText` purely so the two buttons match. Danger on the
     * dark ground is 6.5:1 and was never the problem.
     */
    confirmText: { ...sized(type.action, 19), color: colors.danger },
    cancel: {
      minHeight: TAP_TARGET,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** The safe choice is the solid one: destructive actions shouldn't be the
     * thing your thumb lands on by default. */
    /**
     * 19px bold. White on `accent` is 4.22:1 — over AA's 3.0 for large text,
     * under the 4.5 for body text — and WCAG's line is 18.66px bold.
     */
    cancelText: { ...sized(type.action, 19), color: colors.textOnAccent },
  }),
);
