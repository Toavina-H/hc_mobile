/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { createStaticNavigation, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import NotificationsScreen from './src/screens/notifications'
import LoginScreen from './src/screens/login'

const rootStack = createNativeStackNavigator({
  screens: {
    Login: { screen: LoginScreen },
    Notifications: { screen: NotificationsScreen }
  }
})

const Navigation = createStaticNavigation(rootStack)

type RootStackParamList = StaticParamList<typeof rootStack>

// Allow autocomplete and type checking for navigation params in screens
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default function App() {
  return <Navigation />
}
