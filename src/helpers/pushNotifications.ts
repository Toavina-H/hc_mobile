import { PermissionsAndroid, Platform } from 'react-native'
import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging'
import stelace from '../api/stelace'

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