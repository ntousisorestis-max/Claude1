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
import { useAccount } from '../cloud/AccountContext';
import { isValidFriendCode, normalizeFriendCode } from '../cloud/friendCode';
import { LEADERBOARD } from '../copy';
import { usePresence } from '../hooks/usePresence';
import { usePressScale } from '../hooks/usePressScale';
import {
  radius,
  sized,
  spacing,
  TAP_TARGET,
  themed,
  type,
  useColors,
} from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Your code, and the way to use somebody else's.
 *
 * Same shape as `AuthSheet` for the same reason: a sheet drawn by the app
 * behaves identically on all three targets, which `Alert.prompt` cannot.
 *
 * Adding is one-directional — entering a code adds *them* to *your* list, and
 * doesn't require anything from them. There's no request to accept, because
 * knowing someone's code is already them choosing to share it.
 */
export function AddFriendSheet({
  visible,
  onClose,
  onAdded,
  existingFriendUids,
}: {
  visible: boolean;
  onClose: () => void;
  /** Fired after a friend is actually added, so the list behind this sheet
   * can refetch. */
  onAdded: () => void;
  /** So re-entering a code already on the list fails softly, without a
   * doomed write — the rules only allow *creating* a friend doc, not editing
   * one that's already there. */
  existingFriendUids: string[];
}) {
  const styles = useStyles();
  const colors = useColors();
  const { user, findByFriendCode, addFriend, myFriendCode } = useAccount();

  const [code, setCode] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: 'error' | 'done';
  } | null>(null);

  const presence = usePresence(visible);
  const addPress = usePressScale({ depth: 0.97, haptic: true });
  const closePress = usePressScale({ depth: 0.97, haptic: true });

  // Fetched once per opening, not kept live — a code doesn't change under
  // someone while they're looking at it.
  useEffect(() => {
    if (!visible || !user) {
      return;
    }
    setDraft('');
    setMessage(null);
    myFriendCode()
      .then(setCode)
      .catch(() => setCode(null));
  }, [visible, user, myFriendCode]);

  const submit = async () => {
    const entered = normalizeFriendCode(draft);
    if (!isValidFriendCode(entered)) {
      setMessage({ text: 'Codes are six letters and numbers.', tone: 'error' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const match = await findByFriendCode(entered);
      if (!match) {
        setMessage({ text: LEADERBOARD.addFriend.notFound, tone: 'error' });
        return;
      }
      if (match.uid === user?.uid) {
        setMessage({ text: LEADERBOARD.addFriend.isSelf, tone: 'error' });
        return;
      }
      if (existingFriendUids.includes(match.uid)) {
        setMessage({ text: LEADERBOARD.addFriend.alreadyAdded, tone: 'error' });
        return;
      }
      await addFriend(match.uid);
      setDraft('');
      setMessage({ text: `Added ${match.displayName}.`, tone: 'done' });
      onAdded();
    } catch {
      setMessage({
        text: 'Something went wrong. Try again in a moment.',
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={presence.mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AnimatedPressable
          accessible={false}
          onPress={onClose}
          style={[styles.backdrop, { opacity: presence.opacity }]}
        >
          <Animated.View style={[styles.card, presence.style]}>
            <Pressable
              accessibilityViewIsModal
              onPress={() => {}}
              style={styles.cardTouchable}
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
                    <Text style={styles.title}>Add a friend</Text>
                    <Text style={styles.subtitle}>
                      Share your code, or enter theirs.
                    </Text>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{LEADERBOARD.myCode.label}</Text>
                  <View style={styles.codeBox}>
                    {code ? (
                      <Text style={styles.codeText} selectable>
                        {code}
                      </Text>
                    ) : (
                      <ActivityIndicator color={colors.accentText} />
                    )}
                  </View>
                  <Text style={styles.hint}>{LEADERBOARD.myCode.hint}</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{LEADERBOARD.addFriend.label}</Text>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submit}
                    placeholder={LEADERBOARD.addFriend.placeholder}
                    placeholderTextColor={colors.faint}
                    style={styles.input}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    accessibilityLabel="Friend's code"
                  />
                </View>

                {message ? (
                  <View
                    style={
                      message.tone === 'error' ? styles.error : styles.done
                    }
                    accessibilityLiveRegion="polite"
                  >
                    <Text
                      style={
                        message.tone === 'error'
                          ? styles.errorText
                          : styles.doneText
                      }
                    >
                      {message.text}
                    </Text>
                  </View>
                ) : null}

                <AnimatedPressable
                  {...addPress.handlers}
                  accessibilityRole="button"
                  accessibilityLabel={LEADERBOARD.addFriend.action}
                  accessibilityState={{ disabled: busy }}
                  onPress={submit}
                  disabled={busy}
                  style={[
                    styles.submit,
                    busy && styles.submitOff,
                    addPress.style,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.textOnAccent} />
                  ) : (
                    <Text style={styles.submitText}>
                      {LEADERBOARD.addFriend.action}
                    </Text>
                  )}
                </AnimatedPressable>

                <AnimatedPressable
                  {...closePress.handlers}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  onPress={onClose}
                  style={[styles.close, closePress.style]}
                >
                  <Text style={styles.closeText}>Done</Text>
                </AnimatedPressable>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </AnimatedPressable>
      </KeyboardAvoidingView>
    </Modal>
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
      borderRadius: radius.lg,
      shadowColor: colors.dropShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 8,
    },
    cardTouchable: { flex: 1 },
    body: { padding: spacing.lg, gap: spacing.md },

    head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    tile: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentWash,
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
    codeBox: {
      minHeight: 56,
      borderRadius: radius.md,
      backgroundColor: colors.accentWash,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeText: {
      ...sized(type.title, 28),
      color: colors.white,
      letterSpacing: 6,
    },
    hint: { ...type.helper, fontSize: 13, color: colors.faint },

    input: {
      ...sized(type.title, 22),
      color: colors.white,
      backgroundColor: colors.ink,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 52,
      letterSpacing: 3,
    },

    error: {
      backgroundColor: colors.dangerWash,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: {
      ...type.helper,
      fontSize: 14,
      color: colors.danger,
      lineHeight: 20,
    },
    done: {
      backgroundColor: colors.accentWash,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    doneText: {
      ...type.helper,
      fontSize: 14,
      color: colors.accentText,
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

    close: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    closeText: { ...type.helper, fontSize: 14, color: colors.faint },
  }),
);
