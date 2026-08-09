import React, { useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthSheet } from '../components/AuthSheet';
import { FocusChart } from '../components/FocusChart';
import { Icon, type IconName } from '../components/Icon';
import { Pop } from '../components/Pop';
import { TAB_BAR_CLEARANCE } from '../components/TabBar';
import { useAccount } from '../cloud/AccountContext';
import { recentDays } from '../cloud/days';
import {
  DATA_UNREACHABLE,
  EMPTY_CHART,
  EMPTY_RECORDS,
  extraSetsLine,
  SAVE_PROGRESS,
} from '../copy';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import {
  describeSpan,
  HAIRLINE,
  washOnAccent,
  radius,
  sized,
  spacing,
  tabular,
  themed,
  type,
  useColors,
} from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** 24pt between sections, as specified. `spacing.lg` is 22, so this is its own. */
const SECTION_GAP = 24;
/** 16pt inside every card. */
const CARD_PAD = 16;

/**
 * The numbers, once they stop resetting.
 *
 * Everything here is the persisted twin of something the app already counted
 * and then threw away. Four sections, in the order you'd ask the questions:
 * what have I done, what did this week look like, what is that worth, and what
 * is the best I've managed.
 *
 * ## Nothing here is invented
 *
 * Two things this screen deliberately does not show, because it cannot know
 * them. There is no per-app breakdown — iOS Screen Time hands back an opaque
 * selection token and never tells the app which apps are in it, so "TikTok, 12
 * minutes" is a number no version of this app can ever have. And there is no
 * estimate of scrolling avoided, which would require knowing what someone would
 * have done with time they didn't spend.
 *
 * ## And nothing here is filler
 *
 * Every section has a real empty state rather than a demo number. A zero that
 * means zero is honest; a placeholder that looks like data is a lie the user
 * finds out about the moment they finish their first workout.
 */
export function InsightsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { status, totals, records, days, today, dataError } = useAccount();
  const [signingIn, setSigningIn] = useState(false);

  const enterHero = useEnter();
  const enterGrid = useEnter(80);
  const enterChart = useEnter(140);
  const enterInsight = useEnter(200);
  const enterRecords = useEnter(260);
  const enterAccount = useEnter(320);

  const signedIn = status === 'signed-in';

  // The same rolling seven days the chart and the Streaks strip use, so no two
  // parts of the app can disagree about what a week is.
  const week = new Set(recentDays(today, 7));
  const weekFocusSeconds = days
    .filter(day => week.has(day.day))
    .reduce((sum, day) => sum + day.focusSeconds, 0);

  const focus = describeSpan(totals.focusSeconds);
  const longest = describeSpan(records.longestFocusSeconds);
  const weekSpan = describeSpan(weekFocusSeconds);
  // Guarded, because the first thing every account divides by is zero.
  const perWorkout = describeSpan(
    totals.workoutsFinished > 0
      ? totals.focusSeconds / totals.workoutsFinished
      : 0,
  );

  // Lifetime seconds per set, used to price this week's focus in sets. See
  // extraSetsLine in copy.ts for why the two spans have to differ.
  const secondsPerSet =
    totals.setsCompleted > 0 ? totals.focusSeconds / totals.setsCompleted : 0;
  const extraSets =
    secondsPerSet > 0 ? Math.round(weekFocusSeconds / secondsPerSet) : 0;
  const showsInsight = signedIn && extraSets >= 1;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={[styles.hero, enterHero]}>
        <Text style={styles.masthead}>
          Insights<Text style={styles.stop}>.</Text>
        </Text>
      </Animated.View>

      {/* 1 — the four headline numbers */}
      <Animated.View style={[styles.grid, enterGrid]}>
        <View style={styles.gridRow}>
          <Tile
            icon="flame"
            label="Time saved"
            value={signedIn ? focus.value : null}
            unit={focus.unit}
          />
          <Tile
            icon="check"
            label="Sets finished"
            value={signedIn ? String(totals.setsCompleted) : null}
            unit={totals.setsCompleted === 1 ? 'set' : 'sets'}
          />
        </View>
        <View style={styles.gridRow}>
          <Tile
            icon="trophy"
            label="Workouts"
            value={signedIn ? String(totals.workoutsFinished) : null}
            unit={totals.workoutsFinished === 1 ? 'done' : 'done'}
          />
          {/* Was the current streak, until the Streaks tab grew a hero ring
              around that same number. An average is this screen's character
              anyway — Insights is arithmetic, Streaks is the calendar — and it
              needs no field the account doesn't already have. */}
          <Tile
            icon="timer"
            label="Avg. per workout"
            value={
              signedIn && totals.workoutsFinished > 0 ? perWorkout.value : null
            }
            unit={perWorkout.unit}
          />
        </View>
      </Animated.View>

      {/* 2 — the week */}
      <Animated.View style={[styles.card, enterChart]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>THIS WEEK</Text>
          {signedIn && weekFocusSeconds > 0 ? (
            <Text style={styles.cardAside}>
              {weekSpan.value}
              {weekSpan.unit ? ` ${weekSpan.unit}` : ''}
            </Text>
          ) : null}
        </View>

        <FocusChart today={today} days={signedIn ? days : []} />

        {/* Three states, not two. An account with nothing in it and a
            listener that has fallen over both draw a flat line, and telling
            somebody their week "fills in as they train" when it already has
            is the failure this whole screen was reported for. */}
        {signedIn && dataError ? (
          <View style={styles.unreachable}>
            <Icon name="bellOff" color={colors.danger} size={15} />
            <Text style={styles.unreachableText}>{DATA_UNREACHABLE}</Text>
          </View>
        ) : signedIn && weekFocusSeconds > 0 ? null : (
          <Text style={styles.note}>{EMPTY_CHART}</Text>
        )}
      </Animated.View>

      {/* 3 — what the time is worth, priced in the user's own sets */}
      {showsInsight ? (
        <Animated.View style={[styles.insight, enterInsight]}>
          <View style={styles.insightTile}>
            <Icon name="reps" color={colors.textOnAccent} size={20} />
          </View>
          <View style={styles.insightText}>
            <Text style={styles.insightLead}>
              This week you kept your phone down for {weekSpan.value}
              {weekSpan.unit ? ` ${weekSpan.unit}` : ''}.
            </Text>
            <Text style={styles.insightLine}>{extraSetsLine(extraSets)}</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* 4 — the best single workout, ever */}
      <Animated.View style={[styles.card, enterRecords]}>
        <Text style={styles.cardTitle}>PERSONAL RECORDS</Text>

        {signedIn && records.longestFocusSeconds > 0 ? (
          <View style={styles.records}>
            <RecordRow
              icon="clock"
              label="Longest focused workout"
              value={`${longest.value}${
                longest.unit ? ` ${longest.unit}` : ''
              }`}
            />
            <RecordRow
              icon="reps"
              label="Most sets in one workout"
              value={String(records.mostSetsInWorkout)}
            />
          </View>
        ) : (
          <Text style={styles.note}>{EMPTY_RECORDS}</Text>
        )}
      </Animated.View>

      {/* 5 — the account, which is what makes any of the above survive */}
      {signedIn ? null : (
        <Animated.View style={enterAccount}>
          <SaveProgress
            configured={status !== 'unconfigured'}
            onPress={() => setSigningIn(true)}
          />
        </Animated.View>
      )}

      <AuthSheet visible={signingIn} onClose={() => setSigningIn(false)} />
    </ScrollView>
  );
}

/**
 * One cell of the 2×2 grid.
 *
 * A null value is the empty state, and it draws an em-dash rather than a zero.
 * "0 sets finished" reads as a judgement; "—" reads as a number that hasn't
 * arrived yet, which is what it is.
 */
function Tile({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: string | null;
  unit: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const shown = value ?? '—';

  return (
    <View
      style={styles.tile}
      accessibilityRole="text"
      accessibilityLabel={
        value ? `${label}: ${value} ${unit}` : `${label}: nothing yet`
      }
    >
      <View style={styles.tileTop}>
        <Icon name={icon} color={colors.accentText} size={17} />
        <Text style={styles.tileLabel}>{label.toUpperCase()}</Text>
      </View>

      <Pop value={shown} depth={1.09} style={styles.tilePop}>
        <View style={styles.tileFigure}>
          <Text style={[styles.tileValue, !value && styles.tileValueEmpty]}>
            {shown}
          </Text>
          {value ? <Text style={styles.tileUnit}>{unit}</Text> : null}
        </View>
      </Pop>
    </View>
  );
}

function RecordRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View
      style={styles.recordRow}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.recordTile}>
        <Icon name={icon} color={colors.accentText} size={17} />
      </View>
      <Text style={styles.recordLabel}>{label}</Text>
      <Pop value={value}>
        <Text style={styles.recordValue}>{value}</Text>
      </Pop>
    </View>
  );
}

/**
 * The account card.
 *
 * The button is swapped for the setup line when there is no Firebase project,
 * rather than left there to open a form that cannot succeed. Same card, same
 * shape, one substituted control — a dead button is worse than an explanation.
 */
function SaveProgress({
  configured,
  onPress,
}: {
  configured: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.98, haptic: true });

  return (
    <View style={styles.account}>
      <View style={styles.accountHead}>
        <View style={styles.accountTile}>
          <Icon name="user" color={colors.accentText} size={20} />
        </View>
        <Text style={styles.accountTitle}>{SAVE_PROGRESS.title}</Text>
      </View>

      <Text style={styles.accountBody}>{SAVE_PROGRESS.body}</Text>

      {configured ? (
        <AnimatedPressable
          {...press.handlers}
          accessibilityRole="button"
          accessibilityLabel={SAVE_PROGRESS.action}
          onPress={onPress}
          style={[styles.accountAction, press.style]}
        >
          <Text style={styles.accountActionText}>{SAVE_PROGRESS.action}</Text>
          <Icon name="chevron" color={colors.textOnAccent} size={16} />
        </AnimatedPressable>
      ) : (
        <Text style={styles.note}>{SAVE_PROGRESS.setup}</Text>
      )}
    </View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      // Clears the floating tab pill, which this content scrolls under.
      paddingBottom: TAB_BAR_CLEARANCE,
      gap: SECTION_GAP,
    },

    hero: { gap: 2 },
    masthead: { ...sized(type.display, 42), color: colors.white },
    stop: { color: colors.accent },

    grid: { gap: spacing.md },
    gridRow: { flexDirection: 'row', gap: spacing.md },
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: CARD_PAD,
      gap: spacing.md,
    },
    tileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    tileLabel: {
      ...sized(type.tag, 9),
      color: colors.accentText,
      flexShrink: 1,
    },
    tilePop: { alignSelf: 'flex-start' },
    tileFigure: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    tileValue: { ...sized(type.display, 30), ...tabular, color: colors.white },
    /** The em-dash is a placeholder, so it sits at the muted tier, not white. */
    tileValueEmpty: { color: colors.faint },
    tileUnit: { ...type.helper, fontSize: 12, color: colors.muted },

    card: {
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: CARD_PAD,
      gap: spacing.md,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: { ...sized(type.tag, 10), color: colors.accentText },
    cardAside: {
      ...type.body,
      fontWeight: '700',
      ...tabular,
      color: colors.white,
    },

    /**
     * The one filled card on the screen.
     *
     * It is the only section that says something rather than reporting something,
     * so it gets the accent ground — a screen where everything is emphasised has
     * nothing emphasised.
     */
    insight: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: colors.accentDeep,
      borderRadius: radius.lg,
      padding: CARD_PAD,
    },
    insightTile: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: washOnAccent(0.18),
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightText: { flex: 1, gap: 4 },
    insightLead: {
      ...type.helper,
      fontSize: 14,
      color: colors.mutedOnAccent,
      lineHeight: 19,
    },
    insightLine: {
      ...sized(type.title, 19),
      color: colors.white,
      lineHeight: 25,
    },

    records: { gap: spacing.sm },
    recordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    recordTile: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.accentWash,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordLabel: { ...type.helper, fontSize: 14, color: colors.muted, flex: 1 },
    recordValue: { ...sized(type.title, 19), ...tabular, color: colors.white },

    account: {
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: CARD_PAD,
      gap: spacing.md,
    },
    accountHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    accountTile: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentWash,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountTitle: { ...sized(type.title, 21), color: colors.white, flex: 1 },
    accountBody: {
      ...type.helper,
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    accountAction: {
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
     * White on `accent` is 4.23:1, which clears AA's 3.0 bar for *large* text and
     * misses the 4.5 for body text. 18.66px bold is where WCAG draws that line,
     * so the label is sized past it rather than the button being recoloured —
     * the same fix `GradientButton` already carries, for the same reason.
     */
    accountActionText: {
      ...sized(type.action, 19),
      color: colors.white,
      flex: 1,
    },

    note: {
      ...type.helper,
      fontSize: 13,
      color: colors.faint,
      lineHeight: 18,
    },
    /** Quiet, not alarming — nothing is broken on the user's side. */
    unreachable: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.dangerWash,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    unreachableText: {
      ...type.helper,
      fontSize: 13,
      color: colors.danger,
      lineHeight: 18,
      flex: 1,
    },
  }),
);
