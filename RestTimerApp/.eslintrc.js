module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['dist/', 'node_modules/'],
  overrides: [
    {
      files: ['jest.setup.js', '__tests__/**'],
      env: { jest: true },
    },
  ],
};
