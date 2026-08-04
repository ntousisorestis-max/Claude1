module.exports = {
  root: true,
  extends: '@react-native',
  // `dist-probe/` is where the throwaway browser-verification builds land.
  ignorePatterns: ['dist/', 'dist-probe/', 'node_modules/'],
  overrides: [
    {
      files: ['jest.setup.js', '__tests__/**'],
      env: { jest: true },
    },
  ],
};
