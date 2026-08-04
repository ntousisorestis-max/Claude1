import React from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/BigButton';
import { HeroHourglass } from '../components/HeroHourglass';
import { WELCOME } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { colors, sized, spacing, type } from '../theme';

/**
 * The first thing anybody sees, and the only time they see it.
 *
 * Two bands: the hourglass on a violet flood, and a near-black panel curving up
 * over it holding everything you have to read. That split does the work a
 * carousel usually does badly — there is one screen, one idea, and one button,
 * so nothing has to be paged through before the app can be used.
 *
 * ## The violet
 *
 * Everywhere else in this app a violet flood means "your apps are unlocked" —
 * it is the one colour rule, and it is load-bearing during a workout. Here it
 * means nothing of the sort, and that is deliberate rather than careless: this
 * screen is outside the workout loop entirely, it is the app introducing
 * itself, and introducing itself in a colour it never otherwise uses would be
 * the stranger choice. Nobody sees this screen and a rest period in the same
 * session twice, so the two can't be confused.
 *
 * ## No mascot
 *
 * The hourglass already exists, already sits at the top of the Workout tab, and
 * is about the only thing this app is about. A character would have to be
 * introduced here and then never appear again.
 */
export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const enterArt = useEnter();
  const enterHead = useEnter(120);
  const enterBody = useEnter(200);
  const enterAction = useEnter(280);

  return (
    <View style={styles.screen}>
      {/* Light content on both bands, so the bar never has to flip. */}
      <StatusBar barStyle="light-content" backgroundColor={colors.accentDeep} />

      <View style={styles.art}>
        <Animated.View style={enterArt}>
          <HeroHourglass size={208} />
        </Animated.View>
      </View>

      {/* Only the top corners are rounded: the panel is a sheet that has been
          pulled up over the art, not a card floating on it. */}
      <View style={styles.panel}>
        <SafeAreaView edges={['bottom']} style={styles.panelInner}>
          <View style={styles.copy}>
            <Animated.View style={[styles.words, enterHead]}>
              <Text style={styles.headline}>{WELCOME.headline}</Text>
              <Text style={styles.subheadline}>{WELCOME.subheadline}</Text>
            </Animated.View>

            <Animated.View style={enterBody}>
              <Text style={styles.body}>{WELCOME.body}</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.action, enterAction]}>
            <BigButton label={WELCOME.action} onPress={onDone} />
          </Animated.View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    // An overlay, not a sibling that shares the space: it covers the app that
    // is already laid out underneath, exactly as the splash does. RN 0.86's
    // types don't expose absoluteFillObject, so it is spelled out.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accentDeep,
  },

  // The art takes the space the panel doesn't. Given as a ratio rather than a
  // fixed height so a short phone gives the words priority and a tall one
  // spends the extra on the illustration.
  art: { flex: 6, alignItems: 'center', justifyContent: 'center' },

  panel: {
    flex: 6,
    backgroundColor: colors.ink,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
  },
  panelInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  /**
   * The words sit together at the top of the panel and the button is pushed to
   * the bottom by the space that's left.
   *
   * `space-between` on the panel was the first attempt and read as three
   * unrelated blocks adrift in a dark rectangle — a headline, a sentence and a
   * button that happened to share a screen. The headline and the sentence
   * explaining it belong to each other.
   */
  copy: { gap: spacing.lg },

  words: { gap: spacing.sm },
  headline: { ...sized(type.display, 34), color: colors.white, textAlign: 'center' },
  subheadline: {
    ...type.body,
    fontWeight: '600',
    color: colors.accentText,
    textAlign: 'center',
  },
  body: {
    ...type.helper,
    fontSize: 16,
    lineHeight: 25,
    color: colors.mutedOnDark,
    textAlign: 'center',
  },
  /** `auto` takes whatever vertical space the copy didn't. */
  action: { marginTop: 'auto', paddingTop: spacing.lg },
});
