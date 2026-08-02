// // src/api/stelace.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'

const BASE_URL = Config.STELACE_API_URL
const API_KEY = Config.STELACE_PUBLISHABLE_API_KEY

const ACCESS_TOKEN_KEY = 'stelace_access_token'
const REFRESH_TOKEN_KEY = 'stelace_refresh_token'


async function login({ username, password }) {
  console.log('fetching:', `${Config.STELACE_API_URL}/auth/login`)
  const res = await fetch(`${Config.STELACE_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      username: username.toLowerCase(),
      password
    }),
  })
  if (!res.ok) throw new Error('Invalid username or password')

  const tokens = await res.json()
  console.log('AsyncStorage:', AsyncStorage)
  console.log('multiSet type:', typeof AsyncStorage.multiSet)
  console.log('tokens:', tokens)
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  console.log('eto1')
  return tokens
}

async function logout() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function getAccessToken() {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

const stelace = { auth: {login, logout}, getAccessToken }
export default stelace