import React, { useId } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GlowBackground } from '../components/GlowBackground';
import { GradientButton } from '../components/GradientButton';
import { Icon, type IconName } from '../components/Icon';
import { WELCOME } from '../copy';
import { useEnter } from '../hooks/useEnter';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  themed,
  type,
  useColors,
  useTheme,
} from '../theme';

/**
 * The first thing anybody sees, and the only time they see it.
 *
 * One screen, top to bottom: the mark, what the app is called, what it does,
 * three rows of how, and the button. No carousel — there is a single idea here
 * and paging through it three times would make it look bigger than it is.
 *
 * ## Why it's near-black like everywhere else
 *
 * An earlier version flooded the top half violet. It looked good and it lied:
 * everywhere else in this app a violet flood means *your apps are unlocked*,
 * which is the one load-bearing colour rule and the thing this screen is about
 * to teach. Introducing the rule on the same screen that breaks it was a bad
 * trade for a nice gradient. The violet is now where it belongs — the mark's
 * halo, half the wordmark, the icon tiles, the button.
 *
 * ## Why it scrolls
 *
 * Six stacked blocks don't fit a small phone, and the button is the point. It
 * is pinned to the bottom by `marginTop: 'auto'` when there's room and scrolled
 * to when there isn't, rather than the whole screen being shrunk to fit the
 * worst case.
 *
 * ## No mascot
 *
 * The app's own logo, which is already the splash and already the header of the
 * exercise list. A character would have to be introduced here and then never
 * appear again.
 */
export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const { name } = useTheme();
  const enterHero = useEnter();
  const enterHead = useEnter(90);
  const enterSub = useEnter(160);
  const enterAction = useEnter(430);
  const enterFoot = useEnter(490);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={name === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.ink}
      />

      {/* Its own copy: this is overlaid on top of the app rather than living
          inside it, so the root glow is behind this screen's ground. */}
      <GlowBackground />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.hero, enterHero]}>
            <Halo />
            {/* Decorative: the wordmark directly underneath says the same
                thing, and hearing "Liftlock" twice in a row is noise. */}
            <Image
              accessible={false}
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={[styles.words, enterHead]}>
            <Text style={styles.eyebrow}>{WELCOME.eyebrow}</Text>
            {/* One Text, so the two halves stay on one line and share a
                baseline — two siblings in a row would break apart when the
                system font scale is turned up. */}
            <Text style={styles.name}>
              {WELCOME.name.lead}
              <Text style={styles.nameAccent}>{WELCOME.name.accent}</Text>
            </Text>
          </Animated.View>

          <Animated.View style={enterSub}>
            <Text style={styles.subheadline}>
              {WELCOME.subheadline.lead}
              <Text style={styles.subAccent}>{WELCOME.subheadline.accent}</Text>
              {WELCOME.subheadline.tail}
            </Text>
          </Animated.View>

          <View style={styles.features}>
            {WELCOME.features.map((feature, i) => (
              <Feature key={feature.title} {...feature} delay={220 + i * 60} />
            ))}
          </View>

          <Animated.View style={[styles.action, enterAction]}>
            <GradientButton
              label={WELCOME.action}
              icon="chevron"
              onPress={onDone}
            />
          </Animated.View>

          <Animated.View style={[styles.foot, enterFoot]}>
            <Icon name="shield" color={colors.faint} size={14} />
            <Text style={styles.footText}>{WELCOME.reassurance}</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** One of the three rows: violet tile, bold title, a line explaining it. */
function Feature({
  icon,
  title,
  body,
  delay,
}: {
  icon: IconName;
  title: string;
  body: string;
  delay: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const enter = useEnter(delay);

  return (
    <Animated.View style={[styles.feature, enter]}>
      <View style={styles.tile}>
        <Icon name={icon} color={colors.textOnAccent} size={21} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </Animated.View>
  );
}

/** Diameter of the halo box. The rings are laid out as fractions of it. */
const HALO = 244;
/** Ring radii and how strongly each is drawn, outermost last. */
const RINGS = [
  { r: 0.305, opacity: 0.22 },
  { r: 0.395, opacity: 0.13 },
  { r: 0.483, opacity: 0.07 },
] as const;

/**
 * The bloom and rings behind the mark.
 *
 * Concentric circles rather than a single ring because one is a border and
 * three are a signal — the same widening-rings shorthand the lock animation
 * uses when apps let go. They are drawn under the bloom's own falloff, so the
 * outermost is barely there, which is the intent: it should be noticed on the
 * second look, not the first.
 */
function Halo() {
  const styles = useStyles();
  const colors = useColors();
  // SVG gradient ids share one global namespace on the web. See GlowBackground.
  const id = `halo-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = HALO / 2;

  return (
    <View style={styles.halo} pointerEvents="none">
      <Svg width={HALO} height={HALO}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.34} />
            <Stop offset="0.45" stopColor={colors.accent} stopOpacity={0.14} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={c} cy={c} r={c} fill={`url(#${id})`} />

        {RINGS.map(ring => (
          <Circle
            key={ring.r}
            cx={c}
            cy={c}
            r={HALO * ring.r}
            stroke={colors.accent}
            strokeOpacity={ring.opacity}
            strokeWidth={1}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    screen: {
      // An overlay, not a sibling that shares the space: it covers the app that
      // is already laid out underneath, exactly as the splash does. RN 0.86's
      // types don't expose absoluteFillObject, so it is spelled out.
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.ink,
    },
    safe: { flex: 1 },
    body: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },

    hero: { height: HALO, alignItems: 'center', justifyContent: 'center' },
    halo: { position: 'absolute' },
    logo: { width: 124, height: 124 },

    words: { alignItems: 'center', gap: 2 },
    eyebrow: { ...type.body, fontWeight: '600', color: colors.muted },
    /** 40px, not the display's 44: "Liftlock." wrapped on a 360px screen. */
    name: { ...sized(type.display, 40), color: colors.white },
    /**
     * `accent` rather than `accentText`. It is a fill everywhere small, but at
     * 40px black it is well past WCAG's large-text line and this is the one place
     * the brand violet should be at full strength — same call the giant set
     * numeral makes.
     */
    nameAccent: { color: colors.accent },

    subheadline: {
      ...type.helper,
      fontSize: 16,
      lineHeight: 24,
      color: colors.muted,
      textAlign: 'center',
    },
    subAccent: { color: colors.accentText, fontWeight: '700' },

    features: { gap: spacing.sm },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
    },
    tile: {
      width: 44,
      height: 44,
      borderRadius: radius.sm + 2,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: { flex: 1, gap: 3 },
    featureTitle: {
      ...type.body,
      fontSize: 17,
      fontWeight: '800',
      color: colors.white,
    },
    featureBody: {
      ...type.helper,
      fontSize: 14,
      lineHeight: 19,
      color: colors.muted,
    },

    /** `auto` takes whatever vertical space the blocks above didn't. */
    action: { marginTop: 'auto', paddingTop: spacing.xs },

    foot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },
    footText: { ...type.helper, fontSize: 13, color: colors.faint },
  }),
);
