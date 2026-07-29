/* SafeAreaProvider renders nothing until it measures a real layout. */
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, edges, ...props }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    SafeAreaInsetsContext: React.createContext(insets),
  };
});

/* Notifee is native-only; its shipped jest mock is ESM, so stub it here. */
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => 'rest-timer'),
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createTriggerNotification: jest.fn(async () => undefined),
    cancelTriggerNotification: jest.fn(async () => undefined),
  },
  AndroidImportance: { HIGH: 4 },
  AuthorizationStatus: { AUTHORIZED: 1 },
  TriggerType: { TIMESTAMP: 0 },
}));
