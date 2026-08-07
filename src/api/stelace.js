// // src/api/stelace.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'

const BASE_URL = Config.STELACE_API_URL
const API_KEY = Config.STELACE_PUBLISHABLE_API_KEY

const ACCESS_TOKEN_KEY = 'stelace_access_token'
const REFRESH_TOKEN_KEY = 'stelace_refresh_token'


async function login({ username, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
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

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)

  return tokens
}

async function logout() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function getAccessToken() {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

async function sendResetPasswordRequest({ username}) {
  const res = await fetch(`${BASE_URL}/password/reset/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ username: username.toLowerCase() }),
  })
  if (!res.ok) throw new Error('Impossible d\'envoyer le code')
  return res.json().catch(() => ({}))
}

const stelace = { 
  auth: {login, logout},
  getAccessToken,
  password: { resetRequest: sendResetPasswordRequest },
}

export default stelace