// // src/api/stelace.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'

const BASE_URL = Config.STELACE_API_URL
const API_KEY = Config.STELACE_PUBLISHABLE_API_KEY

const ACCESS_TOKEN_KEY = 'stelace_access_token'
const REFRESH_TOKEN_KEY = 'stelace_refresh_token'
const USER_ID_KEY = 'stelace_user_id'

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

  fetch(`${BASE_URL}/events`, {
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
  await AsyncStorage.setItem(USER_ID_KEY, tokens.userId)

  return tokens
}

async function logout() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
  await AsyncStorage.removeItem(USER_ID_KEY)
}

async function getAccessToken() {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

let refreshPromise = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) return null
      const res = await fetch(`${BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ grantType: 'refreshToken', refreshToken }),
      })
      if (!res.ok) return null
      const { accessToken } = await res.json()
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      return accessToken
    })().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// The API silently ignores an expired access token and falls back to the publishable key's
// public role, so expiry surfaces as a 403 (not 401): refresh the token and retry once.
async function authFetch(url, { headers, ...options } = {}) {
  const send = (token) => fetch(url, {
    ...options,
    headers: { ...headers, 'x-api-key': API_KEY, Authorization: `Bearer ${token}` },
  })
  let res = await send(await getAccessToken())
  if (res.status === 401 || res.status === 403) {
    const token = await refreshAccessToken()
    if (token) res = await send(token)
  }
  return res
}

// User management
async function getCurrentUser(id) {
  const token = await getAccessToken()
  if (!token) return null

  // Without an id, fall back to the logged-in user (restores the session on app start)
  if (!id) id = await AsyncStorage.getItem(USER_ID_KEY)
  if (!id) {
    console.log('No user id')
    return
  }
  const res = await authFetch(`${BASE_URL}/users/${id}`)
  if (!res.ok) return null
  return res.json()
}

async function updateUser(id, data) {
  const res = await authFetch(`${BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`User update failed (${res.status}): ${await res.text()}`)
  return res.json()
}

async function listUsers(ids) {
  if (!ids.length) return []
  const params = new URLSearchParams({ id: ids.join(','), nbResultsPerPage: '100' })
  const res = await authFetch(`${BASE_URL}/users?${params.toString()}`)
  if (!res.ok) throw new Error(`Users fetch failed (${res.status})`)
  const { results } = await res.json()
  return results
}

// Asset management
async function readAsset(id) {
  const res = await authFetch(`${BASE_URL}/assets/${id}`)
  if (!res.ok) throw new Error('Asset fetch failed')
  return res.json()
}

async function listAssets(ids) {
  if (!ids.length) return []
  const params = new URLSearchParams({ id: ids.join(','), nbResultsPerPage: '50' })
  const res = await authFetch(`${BASE_URL}/assets?${params.toString()}`)
  if (!res.ok) throw new Error(`Assets fetch failed (${res.status})`)
  const { results } = await res.json()
  return results
}

// Message management
async function listMessages({ userId, page = 1, nbResultsPerPage = 100 } = {}) {
  const params = new URLSearchParams({
    userId,
    page: String(page),
    nbResultsPerPage: String(nbResultsPerPage),
    orderBy: 'createdDate',
    order: 'desc',
  })
  const res = await authFetch(`${BASE_URL}/messages?${params.toString()}`)
  if (!res.ok) throw new Error(`Messages fetch failed (${res.status})`)
  const { results } = await res.json()
  return results
}

async function listAllMessages({ userId }) {
  const nbResultsPerPage = 100
  let all = []
  for (let page = 1; ; page++) {
    const results = await listMessages({ userId, page, nbResultsPerPage })
    all = all.concat(results)
    if (results.length < nbResultsPerPage) return all
  }
}

async function createMessage({ topicId, conversationId, receiverId, content }) {
  const res = await authFetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topicId, conversationId, receiverId, content }),
  })
  if (!res.ok) throw new Error(`Message creation failed (${res.status})`)
  return res.json()
}

async function markMessageAsRead(id) {
  const res = await authFetch(`${BASE_URL}/messages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ read: true }),
  })
  if (!res.ok) throw new Error('Message update failed')
  return res.json()
}

// Others
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

const dataOptionsCache = {}
async function getDataLabelOptions({ label, query, key } = {}) {
  if (!label) return []
 
  const needsCache = !query && !key
  if (needsCache && dataOptionsCache[label]?.length) return dataOptionsCache[label]
 
  const params = new URLSearchParams()
  params.set('label', label)
  if (query) params.set('query', query)
  if (key) params.set('key', key)
 
  // ASSUMPTION: public referential data, so publishable key only — no bearer token.
  // Flag if your Stelace instance requires auth on /data/options.
  const res = await fetch(`${BASE_URL}/data/options?${params.toString()}`, {
    headers: { 'x-api-key': API_KEY ?? '' },
  })
  if (!res.ok) return []
 
  const opts = await res.json()
  if (needsCache) dataOptionsCache[label] = opts
  return opts
}

/**
 * @param {object} [options]
 * @param {string} [options.assetId]
 * @param {string} [options.userId]
 * @param {object} [options.payload]
 * @param {boolean} [options.standalone]
 * @param {string} [options.s3FullPath]
 * @param {boolean} [options.skipParse]
 */
async function affindaParseProcess({
  assetId = undefined,
  userId = undefined,
  payload = {},
  standalone = false,
  s3FullPath = undefined,
  skipParse = false,
} = {}) {
  const res = await authFetch(`${BASE_URL}/integrations/affinda/parseprocess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetId, userId, payload, standalone, s3FullPath, skipParse }),
  })
  if (!res.ok) throw new Error('Affinda parse process failed')
  return res.json()
}
 
const stelace = {
  auth: { login, logout, signup },
  getAccessToken,
  users: { getCurrent: getCurrentUser, update: updateUser, list: listUsers },
  assets: { read: readAsset, list: listAssets },
  messages: { listAll: listAllMessages, create: createMessage, markAsRead: markMessageAsRead },
  search: { affindaParseProcess },
  password: { resetRequest: sendResetPasswordRequest },
  data: { getDataLabelOptions },
}

export default stelace