// // src/api/stelace.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'

const BASE_URL = Config.STELACE_API_URL
const API_KEY = Config.STELACE_PUBLISHABLE_API_KEY

const ACCESS_TOKEN_KEY = 'stelace_access_token'
const REFRESH_TOKEN_KEY = 'stelace_refresh_token'

async function signup({ user, noLogin = false }) {
  const payload = { ...user }
  if (payload.email) {
    payload.email = payload.email.toLowerCase()
    payload.username = payload.email
  }
  if (payload.username) payload.username = payload.username.toLowerCase()
  if (payload.firstname && payload.lastname) {
    payload.displayName = `${payload.firstname} ${payload.lastname[0]}.`
  }

  const { metadata, platformData, ...createPayload } = payload

  const createRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(createPayload),
  })
  console.log(createRes.status, await createRes.clone().text())
  if (!createRes.ok) throw new Error('Signup failed')
  let stlUser = await createRes.json()

  // mirror the 2s delay for background ops on the new user in the Vue store
  await new Promise((resolve) => setTimeout(resolve, 1000))
  if (noLogin) return stlUser

  const tokens = await login({ username: payload.username, password: payload.password })

  if (metadata || platformData) {
    const updateRes = await fetch(`${BASE_URL}/users/${stlUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ metadata, platformData }),
    })
    if (updateRes.ok) stlUser = await updateRes.json()
  }

  await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    body: JSON.stringify({
      type: 'user_login',
      objectId: stlUser.id,
      emitterId: 'happycab-v3',
    }),
  }).catch(() => {}) // fire-and-forget

  return stlUser
}

// Session management
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
  auth: {login, logout, signup},
  getAccessToken,
  password: { resetRequest: sendResetPasswordRequest },
}

export default stelace