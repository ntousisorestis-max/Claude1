import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
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

/** What the user picked. `system` follows the OS. */
export type ThemeChoice = 'system' | 'light' | 'dark';

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
  choice: ThemeChoice;
  children: ReactNode;
}) {
  // Follows the OS live: flipping the system setting while the app is open
  // re-renders straight into the other palette, no relaunch.
  const system = useColorScheme();

  const value = useMemo<ThemeValue>(() => {
    const name: ThemeName =
      choice === 'system' ? (system === 'light' ? 'light' : 'dark') : choice;
    return { name, colors: palettes[name] };
  }, [choice, system]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
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
