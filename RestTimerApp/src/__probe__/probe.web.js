import { AppRegistry } from 'react-native';
import React from 'react';
import App from '../../App';
import { NO_TOTALS, NO_RECORDS } from '../cloud/types';
import { NO_STREAK } from '../cloud/days';
const backend = {
  observeUser(cb) { cb(null); return () => {}; },
  observeAccount(u, cb) { cb({ totals: NO_TOTALS, streak: NO_STREAK, records: NO_RECORDS }); return () => {}; },
  observeDays(u, n, cb) { cb([]); return () => {}; },
  async signUp() {}, async signIn() {}, async signOut() {}, async recordWorkout() {},
};
const Root = () => React.createElement(App, { backend });
AppRegistry.registerComponent('RestTimerApp', () => Root);
AppRegistry.runApplication('RestTimerApp', { rootTag: document.getElementById('root') || document.body });
