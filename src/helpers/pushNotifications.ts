import { PermissionsAndroid, Platform } from 'react-native'
import { getMessaging, getToken, onTokenRefresh, RemoteMessage } from '@react-native-firebase/messaging'
import notifee, { AndroidImportance } from '@notifee/react-native'
import stelace from '../api/stelace'

// The `data` of a push, from FCM or from a notification displayed with notifee
type PushData = { [key: string]: string | object | number }

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
    return result === PermissionsAndroid.RESULTS.GRANTED
  }
  return true // TO DO: iOS is set up separately later
}

export async function registerFcmToken(userId: string): Promise<() => void> {
  const messaging = getMessaging()
  const saveToken = (token: string) =>
    stelace.users.update(userId, {
      metadata: {
        _private: {
          pushTokens: { [token]: { platform: Platform.OS, updatedDate: new Date().toISOString() } },
        },
      },
    })

  const token = await getToken(messaging)
  await saveToken(token)

  return onTokenRefresh(messaging, saveToken) // returns a function to stop listening
}

// FCM leaves pushes received in the foreground silent, so the app displays them itself
export async function displayForegroundPush(message: RemoteMessage) {
  if (!message.notification) return
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Notifications',
    importance: AndroidImportance.HIGH,
  })
  await notifee.displayNotification({
    title: message.notification.title,
    body: message.notification.body,
    data: message.data,
    android: { channelId, pressAction: { id: 'default' } },
  })
}

// Where tapping a push leads, from the `data` hc-api/src/util/push.js sends.
// Message pushes open the Messages tab: the Conversation screen needs the interlocutor's name and avatar,
// which the push does not carry.
export function pushTarget(data?: PushData): { name: string; params?: object } | null {
  if (!data) return null
  if (data.type === 'new_message_received') return { name: 'Home', params: { screen: 'Messages' } }
  if (typeof data.applicationId === 'string') return { name: 'Offer', params: { applicationId: data.applicationId } }
  return { name: 'Home', params: { screen: 'Notifications' } }
}