// App.tsx
import React, { useCallback, useEffect, useRef } from 'react'
import {
  getInitialNotification,
  getMessaging,
  onNotificationOpenedApp,
  RemoteMessage,
} from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'
import { createNavigationContainerRef, createStaticNavigation, ParamListBase, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider, useAuth } from './src/components/Authentification'
import { NotificationsProvider } from './src/components/Notifications'
import TabBar, { tabIcon } from './src/components/TabBar'
import { pushTarget } from './src/helpers/pushNotifications'

import AuthForm from './src/screens/authForm'
import signupApplicantComplete from './src/screens/signupApplicantComplete'
import ApplicationsScreen from './src/screens/applications'
import OfferScreen from './src/screens/offer'
import MessagesScreen from './src/screens/messages'
import ConversationScreen from './src/screens/conversation'
import NotificationsScreen from './src/screens/notifications'

const homeTabs = createBottomTabNavigator({
  tabBar: props => <TabBar {...props} />,
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Applications: {
      screen: ApplicationsScreen,
      options: { title: 'Candidatures', tabBarIcon: tabIcon('briefcase-outline') },
    },
    Messages: {
      screen: MessagesScreen,
      options: { title: 'Messages', tabBarIcon: tabIcon('message-text-outline') },
    },
    Notifications: {
      screen: NotificationsScreen,
      options: { title: 'Notifications', tabBarIcon: tabIcon('bell-outline') },
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
    Conversation: { screen: ConversationScreen },
  },
})

const Navigation = createStaticNavigation(rootStack)
const navigationRef = createNavigationContainerRef<ParamListBase>()

type RootStackParamList = StaticParamList<typeof rootStack>
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function RootNavigation() {
  const { currentUser, loading } = useAuth()
  const wasLoggedIn = useRef(false)

  // Back to the login screen when the session ends (logout or expired refresh token)
  useEffect(() => {
    if (wasLoggedIn.current && !currentUser && navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] })
    }
    wasLoggedIn.current = !!currentUser
  }, [currentUser])

  const openPush = useCallback((data?: Parameters<typeof pushTarget>[0]) => {
    const target = pushTarget(data)
    if (target && navigationRef.isReady()) navigationRef.navigate(target.name, target.params)
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const unsubscribeFcm = onNotificationOpenedApp(getMessaging(), message => openPush(message.data))
    // Push the app displayed itself, while in the foreground, then tapped
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) openPush(detail.notification?.data)
    })
    return () => {
      unsubscribeFcm()
      unsubscribeNotifee()
    }
  }, [currentUser, openPush])

  const openInitialPush = useCallback(async () => {
    if (!currentUser) return
    try {
      const fcmMessage: RemoteMessage | null = await getInitialNotification(getMessaging())
      if (fcmMessage) return openPush(fcmMessage.data)
      const notifeeInitial = await notifee.getInitialNotification()
      if (notifeeInitial) openPush(notifeeInitial.notification.data)
    } catch (e) {
      console.warn(e)
    }
  }, [currentUser, openPush])

  if (loading) return null

  return (
    <Navigation
      ref={navigationRef}
      initialState={currentUser ? { routes: [{ name: 'Home' }] } : undefined}
      onReady={openInitialPush}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <RootNavigation />
      </NotificationsProvider>
    </AuthProvider>
  )
}
