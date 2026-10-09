// src/components/ConversationAvatar.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { theme } from '../theme'

const AVATAR_COLORS = [
  { bg: theme.colors.purple2, color: theme.colors.purple4 },
  { bg: theme.colors.blue2, color: theme.colors.blue5 },
  { bg: theme.colors.green2, color: theme.colors.green5 },
  { bg: theme.colors.gold2, color: theme.colors.gold5 },
  { bg: theme.colors.red2, color: theme.colors.red5 },
]

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')
}

// Stable color per interlocutor id
function avatarColor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

export default function ConversationAvatar({
  id,
  name,
  uri,
  size = 48,
}: {
  id: string
  name: string
  uri?: string | null
  size?: number
}) {
  const { bg, color } = avatarColor(id)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [uri])

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.text, { color, fontSize: size / 3 }]}>{initials(name)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
})
