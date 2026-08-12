import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AddFriendSheet } from '../components/AddFriendSheet';
import { Bloom } from '../components/Bloom';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { NeedsAccount } from '../components/NeedsAccount';
import { Pop } from '../components/Pop';
import { Segmented } from '../components/Segmented';
import { TAB_BAR_CLEARANCE } from '../components/TabBar';
import { useAccount } from '../cloud/AccountContext';
import { streakToday } from '../cloud/days';
import { EMPTY_LEADERBOARD, LEADERBOARD } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { usePressScale } from '../hooks/usePressScale';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  tabular,
  themed,
  type,
  useColors,
} from '../theme';
import type { LeaderboardEntry } from '../cloud/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Scope = 'global' | 'friends';
const SCOPES: readonly Scope[] = ['global', 'friends'];

/** How many rows a global fetch pulls. Ranking beyond this is unknown rather
 * than guessed — see HeroRank. */
const GLOBAL_LIMIT = 50;

type Ranked = LeaderboardEntry & { rank: number; currentStreak: number };

/**
 * Turns raw rows into a rank.
 *
 * The stored `currentStreak` a row was fetched with can be stale — it only
 * updates when *that* account trains, not when the calendar turns over for
 * whoever's looking at the list. So every row is decayed through
 * `streakToday`, exactly the same function `AccountContext` runs on the
 * signed-in user's own streak, before the list is sorted. Ties keep the
 * order they arrived in, which is stable enough for a list this size.
 */
function rankEntries(entries: LeaderboardEntry[], today: string): Ranked[] {
  return entries
    .map(entry => ({
      ...entry,
      currentStreak: streakToday(entry.streak, today),
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/**
 * Who's training, ranked by current streak.
 *
 * ## Why "current streak" and not "best streak"
 *
 * A board that ranked on the record you set once would reward a single good
 * month forever. Current streak is the only number here that says something
 * about *right now* — the same reason the app puts it front and centre
 * everywhere else it appears.
 *
 * ## Global vs Friends
 *
 * Both are the same list machinery pointed at a different fetch. Global pulls
 * the top accounts by stored streak; Friends pulls the signed-in user plus
 * whoever they've added — always including themselves, so "where do I stand"
 * has an answer even with an empty friends list.
 */
export function LeaderboardScreen() {
  const styles = useStyles();
  const colors = useColors();
  const {
    status,
    user,
    today,
    currentStreak,
    getGlobalLeaderboard,
    getFriendsLeaderboard,
  } = useAccount();
  const signedIn = status === 'signed-in';

  const [scope, setScope] = useState<Scope>('global');
  const [entries, setEntries] = useState<Ranked[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const enterHero = useEnter();
  const enterRank = useEnter(70);
  const enterToggle = useEnter(130);
  const enterList = useEnter(180);

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let cancelled = false;
    setEntries(null);
    setFailed(false);
    const fetch =
      scope === 'global'
        ? getGlobalLeaderboard(GLOBAL_LIMIT)
        : getFriendsLeaderboard();
    fetch
      .then(raw => {
        if (!cancelled) {
          setEntries(rankEntries(raw, today));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, scope, today, refreshKey, getGlobalLeaderboard, getFriendsLeaderboard]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const mine = entries?.find(e => e.uid === user?.uid) ?? null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={[styles.hero, enterHero]}>
        <Text style={styles.masthead}>
          Leaderboard<Text style={styles.stop}>.</Text>
        </Text>
      </Animated.View>

      {signedIn ? (
        <>
          <Animated.View style={enterRank}>
            <HeroRank rank={mine?.rank ?? null} streakDays={currentStreak} />
          </Animated.View>

          <Animated.View style={[styles.toggleRow, enterToggle]}>
            <Segmented
              options={SCOPES}
              value={scope}
              onChange={setScope}
              format={s => LEADERBOARD.scope[s]}
              label="Leaderboard"
            />
          </Animated.View>

          {scope === 'friends' ? (
            <Animated.View style={enterToggle}>
              <AddFriendRow onPress={() => setSheetOpen(true)} />
            </Animated.View>
          ) : null}

          <Animated.View style={enterList}>
            {failed ? (
              <Card style={styles.card}>
                <Text style={styles.note}>{LEADERBOARD.unreachable}</Text>
              </Card>
            ) : entries == null ? (
              <Card style={[styles.card, styles.loading]}>
                <ActivityIndicator color={colors.accentText} />
              </Card>
            ) : (
              <Card style={styles.list}>
                {entries.length === 0 ? (
                  <Text style={styles.note}>{LEADERBOARD.emptyGlobal}</Text>
                ) : (
                  entries.map((entry, i) => (
                    <Row
                      key={entry.uid}
                      entry={entry}
                      mine={entry.uid === user?.uid}
                      last={i === entries.length - 1}
                    />
                  ))
                )}
              </Card>
            )}
          </Animated.View>

          {scope === 'friends' && entries != null && entries.length <= 1 ? (
            <Text style={styles.note}>{LEADERBOARD.emptyFriends}</Text>
          ) : null}

          <AddFriendSheet
            visible={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onAdded={refresh}
            existingFriendUids={entries?.map(e => e.uid) ?? []}
          />
        </>
      ) : (
        <Animated.View style={enterRank}>
          <NeedsAccount empty={EMPTY_LEADERBOARD} />
        </Animated.View>
      )}
    </ScrollView>
  );
}

/**
 * The one visual anchor: where the signed-in user stands, right now.
 *
 * `rank` is only known for whoever the current fetch actually returned — the
 * top 50 globally, or the whole friends list. Outside that, it's honestly
 * unknown rather than guessed, and shows the same em-dash the rest of the app
 * uses for "nothing here yet". The streak underneath doesn't share that
 * limit: it's the account's own number, known the moment they're signed in.
 */
function HeroRank({
  rank,
  streakDays,
}: {
  rank: number | null;
  streakDays: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const shown = rank != null ? `#${rank}` : '—';

  return (
    <View
      style={styles.heroRank}
      accessibilityRole="text"
      accessibilityLabel={
        rank != null
          ? `Your rank: ${rank}. ${LEADERBOARD.streak(streakDays)} streak.`
          : `Your rank: not in this list. ${LEADERBOARD.streak(streakDays)} streak.`
      }
    >
      <View style={styles.heroGlow} pointerEvents="none">
        <Bloom size={220} color={colors.accent} peak={0.32} mid={0.15} />
      </View>
      <Text style={styles.heroLabel}>YOUR RANK</Text>
      <Pop value={shown} depth={1.06} style={styles.heroPop}>
        <Text style={[styles.heroValue, rank == null && styles.heroValueEmpty]}>
          {shown}
        </Text>
      </Pop>
      <Text style={styles.heroCaption}>
        {LEADERBOARD.streak(streakDays)} streak
      </Text>
    </View>
  );
}

/** One row: rank, name, and the streak it's sorted by. */
function Row({
  entry,
  mine,
  last,
}: {
  entry: Ranked;
  mine: boolean;
  last: boolean;
}) {
  const styles = useStyles();
  return (
    <View
      style={[styles.row, mine && styles.rowMine, !last && styles.rowDivided]}
      accessibilityRole="text"
      accessibilityLabel={`${mine ? 'You. ' : ''}Rank ${entry.rank}, ${
        entry.displayName
      }, ${LEADERBOARD.streak(entry.currentStreak)}`}
    >
      <Text style={[styles.rank, mine && styles.rankMine]}>{entry.rank}</Text>
      <Text style={[styles.name, mine && styles.nameMine]} numberOfLines={1}>
        {entry.displayName}
      </Text>
      {mine ? <Text style={styles.youTag}>{LEADERBOARD.you}</Text> : null}
      <Pop value={entry.currentStreak} depth={1.05}>
        <Text style={[styles.streak, mine && styles.streakMine]}>
          {LEADERBOARD.streak(entry.currentStreak)}
        </Text>
      </Pop>
    </View>
  );
}

/** Opens the sheet. Only shown in Friends — Global has nobody to add. */
function AddFriendRow({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.98, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel="Add a friend"
      onPress={onPress}
      style={[styles.addFriend, press.style]}
    >
      <Icon name="plus" color={colors.accentText} size={16} />
      <Text style={styles.addFriendText}>Add a friend</Text>
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      // Clears the floating tab pill, which this content scrolls under.
      paddingBottom: TAB_BAR_CLEARANCE,
      gap: spacing.lg,
    },

    hero: { gap: 2 },
    masthead: { ...sized(type.display, 36), color: colors.white },
    stop: { color: colors.accent },

    heroRank: { alignItems: 'flex-start', paddingVertical: spacing.sm },
    heroGlow: { position: 'absolute', top: -60, left: -50 },
    heroLabel: { ...sized(type.tag, 11), color: colors.accentText },
    heroPop: { alignSelf: 'flex-start' },
    heroValue: {
      ...sized(type.mega, 64),
      ...tabular,
      color: colors.white,
      marginTop: 4,
    },
    heroValueEmpty: { color: colors.faint },
    heroCaption: {
      ...type.helper,
      fontSize: 14,
      color: colors.muted,
      marginTop: 2,
    },

    toggleRow: { flexDirection: 'row' },

    addFriend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    addFriendText: { ...type.body, fontWeight: '600', color: colors.accentText },

    card: { padding: spacing.lg },
    loading: { alignItems: 'center' },
    list: { paddingHorizontal: spacing.md },
    note: {
      ...type.helper,
      color: colors.muted,
      lineHeight: 20,
      textAlign: 'center',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
    },
    rowMine: { backgroundColor: colors.accentWash },
    rowDivided: { borderBottomWidth: HAIRLINE, borderBottomColor: colors.hairline },

    rank: {
      ...sized(type.body, 15),
      ...tabular,
      fontWeight: '700',
      color: colors.faint,
      width: 26,
    },
    rankMine: { color: colors.accentText },
    name: { ...type.body, fontWeight: '600', color: colors.white, flex: 1 },
    nameMine: { color: colors.accentText },
    youTag: {
      ...sized(type.tag, 9),
      color: colors.accentText,
      backgroundColor: colors.accentWash,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    streak: {
      ...type.body,
      ...tabular,
      fontWeight: '700',
      color: colors.muted,
    },
    streakMine: { color: colors.white },
  }),
);
