import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Appearance,
  Easing,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { palettes, type Palette, type ThemeName } from './palettes';

/**
 * Which palette is on, and how a component gets at it.
 *
 * ## Why this exists at all
 *
 * Every stylesheet in this app was `StyleSheet.create({ … colors.ink … })` at
 * module scope. That code runs *once*, when the module is first imported, so
 * the colours were baked into strings before anybody could choose a theme.
 * There is no way to reach back in: not a mutable palette object, not
 * re-keying the tree, not a Proxy — the property read has already happened.
 *
 * So a stylesheet has to become a *function* of the palette, evaluated during
 * render. `themed` below is that, and it is the only thing 38 files needed to
 * change to.
 */

/** What the user picked. There is no `system` option any more — see
 * `ProviderChoice` for the one place a value that follows the OS still
 * exists. */
export type ThemeChoice = 'light' | 'dark';

/**
 * `ThemeProvider`'s own prop type, not the user's saved choice.
 *
 * `'system'` survives here for exactly one caller: `App.tsx` passes it for
 * the ~10ms before the saved choice has loaded from disk, so the very first
 * paint follows the phone rather than guessing. Nobody can pick it — the
 * Settings screen only ever offers `ThemeChoice`.
 */
type ProviderChoice = ThemeChoice | 'system';

type ThemeValue = {
  /** The palette actually in force, after `system` has been resolved. */
  name: ThemeName;
  colors: Palette;
};

/**
 * Dark until told otherwise.
 *
 * Only reached by a component rendered outside the provider, which in practice
 * means a test rendering one component on its own. The app itself always has
 * the provider at the root.
 */
const FALLBACK: ThemeValue = { name: 'dark', colors: palettes.dark };

const ThemeContext = createContext<ThemeValue>(FALLBACK);

export function ThemeProvider({
  choice,
  children,
}: {
  choice: ProviderChoice;
  children: ReactNode;
}) {
  // Follows the OS live: flipping the system setting while the app is open
  // re-renders straight into the other palette, no relaunch.
  const system = useColorScheme();
  const reduceMotion = useReduceMotion();

  const resolved: ThemeName =
    choice === 'system' ? (system === 'light' ? 'light' : 'dark') : choice;

  // What's actually rendered. Lags one step behind `resolved` while the veil
  // below is covering the screen, so the instant colour swap happens while
  // nobody can see it rather than in the open.
  const [shown, setShown] = useState(resolved);
  const veil = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (resolved === shown) {
      return;
    }
    if (reduceMotion) {
      setShown(resolved);
      return;
    }
    // Fade to a solid cover in the *old* ground, swap the palette underneath
    // while nothing is visible, then fade the cover back out over the new
    // one. A straight colour swap on every pixel at once is the "instant
    // jump" this replaces — this is a light switch with a dimmer on it.
    Animated.timing(veil, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShown(resolved);
      Animated.timing(veil, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [resolved, shown, reduceMotion, veil]);

  const value = useMemo<ThemeValue>(
    () => ({ name: shown, colors: palettes[shown] }),
    [shown],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: palettes[shown].ink, opacity: veil },
        ]}
      />
    </ThemeContext.Provider>
  );
}

/**
 * A one-off read of what the phone is set to right now.
 *
 * For resolving a *stored* choice at load time — a legacy `'system'` value,
 * or no saved value at all — into a concrete one, once. Not for rendering:
 * `ThemeProvider` above uses the live `useColorScheme` hook for that, so an
 * in-app OS change is picked up immediately rather than waiting for the next
 * launch.
 */
export function resolveDeviceTheme(): ThemeChoice {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

/** The palette and its name. Most components want `useColors` instead. */
export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/** The palette, for colours passed as props — SVG fills, icon tints. */
export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}

/**
 * Turns a stylesheet into a hook.
 *
 * ```ts
 * const useStyles = themed(colors => StyleSheet.create({ … }));
 *
 * function Card() {
 *   const styles = useStyles();
 * }
 * ```
 *
 * The result is cached per theme, so `StyleSheet.create` runs at most twice per
 * file for the life of the process however many times the component renders —
 * which is what keeps this from being a per-render cost. The cache is keyed on
 * the theme's *name* rather than the palette object, so it survives the
 * provider re-rendering.
 */
export function themed<T>(build: (colors: Palette) => T): () => T {
  const cache = new Map<ThemeName, T>();

  return function useStyles(): T {
    const { name, colors } = useTheme();
    let sheet = cache.get(name);
    if (sheet === undefined) {
      sheet = build(colors);
      cache.set(name, sheet);
    }
    return sheet;
  };
}
