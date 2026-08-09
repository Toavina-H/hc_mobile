// App.tsx
import { createStaticNavigation, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider } from './src/components/Authentification'

import AuthForm from './src/screens/authForm'
import signupApplicantComplete from './src/screens/signupApplicantComplete'
// TODO: create these screens
// import NotificationsScreen from './src/screens/notifications'

const rootStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Auth: { screen: AuthForm },
    SignupApplicantComplete: { screen: signupApplicantComplete }
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
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  )
}