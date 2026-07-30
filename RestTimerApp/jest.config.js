module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The first run after switching platform resolution (npm run test:android)
  // pays a cold Babel transform cost that can exceed the 5s default.
  testTimeout: 30000,
};
