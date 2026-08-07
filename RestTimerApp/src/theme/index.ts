/**
 * One import for everything visual.
 *
 * A folder rather than the old `src/theme.ts`, so that `from '../theme'` keeps
 * resolving and not one of the 38 files that use it had to change its imports
 * when the palette became two palettes.
 */
export * from './tokens';
export * from './palettes';
export * from './ThemeContext';
