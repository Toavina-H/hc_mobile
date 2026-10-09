// src/screens/conversation.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigation, StaticScreenProps } from '@react-navigation/native'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import stelace from '../api/stelace'
import { useAuth } from '../components/Authentification'
import ConversationAvatar from '../components/ConversationAvatar'
import { avatarUrl, getMyIds } from '../helpers/inbox'
import { htmlToText, textToHtml } from '../helpers/html'

type Props = StaticScreenProps<{ interlocutorId: string; name: string; subtitle?: string; avatar?: string | null }>

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatHour(iso: string) {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function dayKey(iso: string) {
  return new Date(iso).toDateString()
}

function formatDay(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  const year = date.getFullYear() !== today.getFullYear() ? ` ${date.getFullYear()}` : ''
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year}`
}

export default function ConversationScreen({ route }: Props) {
  const { interlocutorId, name, subtitle, avatar } = route.params
  const navigation = useNavigation()
  const { currentUser } = useAuth()
  const myIds = useMemo(() => getMyIds(currentUser), [currentUser])
  // Newest first, rendered by an inverted list so the latest message sits at the bottom
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)

  // Own avatar: applicants keep their photo on their profile asset (hc-core's $uElements('profileAsset'))
  useEffect(() => {
    setMyAvatar(avatarUrl(currentUser))
    const profileAssetId = currentUser?.metadata?._resume?.profileAssetId
    if (!profileAssetId) return
    let cancelled = false
    stelace.assets
      .read(profileAssetId)
      .then((asset: any) => {
        if (!cancelled) setMyAvatar(avatarUrl({ ...currentUser, profileAsset: asset }))
      })
      .catch(console.warn)
    return () => {
      cancelled = true
    }
  }, [currentUser])

  const fetchMessages = useCallback(async () => {
    if (!currentUser?.id) return
    setError(null)
    try {
      const all = await stelace.messages.listAll({ userId: currentUser.id })
      const thread = all
        .filter((m: any) => m.senderId === interlocutorId || m.receiverId === interlocutorId)
        .filter((m: any) => !m.metadata?.scheduledToSend)
        .sort((a: any, b: any) => (a.createdDate < b.createdDate ? 1 : -1))
      setMessages(thread)

      // Optimistic: errors are only logged, the inbox refetch shows the real state
      thread
        .filter((m: any) => !m.read && myIds.includes(m.receiverId))
        .forEach((m: any) => stelace.messages.markAsRead(m.id).catch(console.warn))
    } catch (e) {
      console.warn(e)
      setError('Impossible de charger la conversation.')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, interlocutorId, myIds])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  async function send() {
    const content = draft.trim()
    if (!content || sending) return
    // Reply in the latest conversation with this interlocutor, like the web app
    const latest = messages[0]
    setSending(true)
    try {
      const message = await stelace.messages.create({
        topicId: latest?.topicId,
        conversationId: latest?.conversationId,
        receiverId: interlocutorId,
        content: textToHtml(content),
      })
      setMessages(prev => [message, ...prev])
      setDraft('')
    } catch (e) {
      console.warn(e)
      setError("Le message n'a pas pu être envoyé.")
    } finally {
      setSending(false)
    }
  }

  function renderItem({ item, index }: { item: any; index: number }) {
    const fromMe = myIds.includes(item.senderId)
    const myName = [currentUser?.firstname, currentUser?.lastname].filter(Boolean).join(' ') || 'Moi'
    // Inverted list: the next item is the previous message in time
    const previous = messages[index + 1]
    const showDay = !previous || dayKey(previous.createdDate) !== dayKey(item.createdDate)

    return (
      <View>
        {showDay && <Text style={styles.day}>{formatDay(item.createdDate)}</Text>}
        <View style={[styles.row, fromMe && styles.rowMine]}>
          <ConversationAvatar
            id={item.senderId}
            name={fromMe ? myName : name}
            uri={fromMe ? myAvatar : avatar}
            size={28}
          />
          <View style={[styles.bubble, fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, fromMe && styles.bubbleTextMine]}>
              {htmlToText(item.content ?? '', { keepLineBreaks: true })}
            </Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, fromMe && styles.bubbleTimeMine]}>{formatHour(item.createdDate)}</Text>
              {/* Seen marker on my messages, like hc-core's done_all icon */}
              {fromMe && (
                <Icon
                  name={item.read ? 'check-all' : 'check'}
                  size={14}
                  color={item.read ? theme.colors.white : theme.colors.purple2}
                  accessibilityLabel={item.read ? 'Vu' : 'Envoyé'}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon name="chevron-left" size={28} color={theme.colors.grey7} />
        </TouchableOpacity>
        <ConversationAvatar id={interlocutorId} name={name} uri={avatar} size={38} />
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name}
          </Text>
          {!!subtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator style={styles.flex} color={theme.colors.primary} />
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>Pas encore de message.</Text>}
          />
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor={theme.colors.grey4}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
            onPress={send}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Icon name="send" size={20} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.grey1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey2,
  },
  headerBody: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.grey7,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.grey5,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  day: {
    alignSelf: 'center',
    fontSize: 12,
    color: theme.colors.grey5,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 3,
  },
  rowMine: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.grey7,
  },
  bubbleTextMine: {
    color: theme.colors.white,
  },
  bubbleTime: {
    fontSize: 10,
    color: theme.colors.grey4,
  },
  bubbleTimeMine: {
    color: theme.colors.purple2,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.grey4,
    fontSize: 14,
    paddingVertical: 40,
    // The list is inverted, flip the empty state back
    transform: [{ scaleY: -1 }],
  },
  error: {
    color: theme.colors.red5,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey2,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: theme.colors.grey1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: theme.colors.grey7,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.grey3,
  },
})
