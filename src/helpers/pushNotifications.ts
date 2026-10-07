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

export async function registerFcmToken(user: any): Promise<() => void> {
  const messaging = getMessaging()
  const saveToken = (token: string) =>
    stelace.users.update(user.id, {
      platformData: { ...user.platformData, _fcmToken: token },
    })

  const token = await getToken(messaging)
  console.log('FCM token:', token) // copy this to send a test push
  await saveToken(token)

  return onTokenRefresh(messaging, saveToken) // returns a function to stop listening
}