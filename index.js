/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import 'react-native-url-polyfill/auto'
import notifee from '@notifee/react-native'

// Notifee warns without one. Taps that open the app are handled in App.tsx
notifee.onBackgroundEvent(async () => {})

AppRegistry.registerComponent(appName, () => App);
