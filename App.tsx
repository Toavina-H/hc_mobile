// App.tsx
import React from 'react'
import { createStaticNavigation, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { AuthProvider } from './src/components/Authentification'
import { theme } from './src/theme'

import AuthForm from './src/screens/authForm'
import signupApplicantComplete from './src/screens/signupApplicantComplete'
import ApplicationsScreen from './src/screens/applications'
import OfferScreen from './src/screens/offer'
import MessagesScreen from './src/screens/messages'
import { MOCK_CONVERSATIONS } from './src/mocks/messages'
import NotificationsScreen from './src/screens/notifications'
import { MOCK_NOTIFICATIONS } from './src/mocks/notifications'

const tabIcon =
  (name: string) =>
  ({ color, size }: { color: string; size: number }) =>
    <Icon name={name} size={size} color={color} />

const homeTabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.grey4,
  },
  screens: {
    Applications: {
      screen: ApplicationsScreen,
      options: { title: 'Candidatures', tabBarIcon: tabIcon('briefcase-outline') },
    },
    Messages: {
      screen: MessagesScreen,
      options: {
        title: 'Messages',
        tabBarIcon: tabIcon('message-text-outline'),
        // TODO: use the unread count from the API; MessagesScreen keeps it in sync once mounted
        tabBarBadge: MOCK_CONVERSATIONS.filter(c => c.unreadCount > 0).length || undefined,
      },
    },
    Notifications: {
      screen: NotificationsScreen,
      options: {
        title: 'Notifications',
        tabBarIcon: tabIcon('bell-outline'),
        // TODO: use the unread count from the API; NotificationsScreen keeps it in sync once mounted
        tabBarBadge: MOCK_NOTIFICATIONS.filter(n => !n.read).length || undefined,
      },
    },
  },
})

const rootStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Auth: { screen: AuthForm },
    SignupApplicantComplete: { screen: signupApplicantComplete },
    Home: { screen: homeTabs },
    Offer: { screen: OfferScreen },
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
