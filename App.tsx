// App.tsx
import { createStaticNavigation, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar, useColorScheme } from 'react-native'
import AuthForm from './src/screens/authForm'
// TODO: create these screens
// import ForgotPasswordScreen from './src/screens/forgotPassword'
// import CheckYourEmailScreen from './src/screens/checkYourEmail'
// import HelpCenterScreen from './src/screens/helpCenter'
// import ContactScreen from './src/screens/contact'
// import NotificationsScreen from './src/screens/notifications'

const rootStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Auth: { screen: AuthForm }

    // ForgotPassword: { screen: ForgotPasswordScreen },
    // CheckYourEmail: { screen: CheckYourEmailScreen },
    // HelpCenter: { screen: HelpCenterScreen },
    // Contact: { screen: ContactScreen },
    // Notifications: { screen: NotificationsScreen },
  },
})

const Navigation = createStaticNavigation(rootStack)

type RootStackParamList = StaticParamList<typeof rootStack>
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation />
    </>
  )
}