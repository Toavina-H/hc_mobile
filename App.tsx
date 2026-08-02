/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import LoginScreen from './src/screens/login';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <LoginScreen />
    </SafeAreaProvider>
  );
}

export default App;