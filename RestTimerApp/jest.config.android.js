/**
 * Runs the same suite with Android module resolution — Platform.OS is
 * 'android' and `.android.js` files win — so platform-specific branches get
 * exercised without a device. Use: npm run test:android
 */
const base = require('./jest.config');

module.exports = {
  ...base,
  haste: { defaultPlatform: 'android', platforms: ['android', 'native'] },
};
