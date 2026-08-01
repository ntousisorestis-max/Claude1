/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { registerBackgroundNotificationHandler } from './src/notifications';
import { name as appName } from './app.json';

// Before React mounts, deliberately. Tapping "Time's up!" can wake the app into
// a headless JS context where there is no component tree to hang a listener on,
// and notifee requires the background handler to be registered by then.
registerBackgroundNotificationHandler();

AppRegistry.registerComponent(appName, () => App);
