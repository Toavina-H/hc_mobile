// src/screens/messages.tsx
import React, { useCallback, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation, ParamListBase } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import ScreenHeader from '../components/ScreenHeader'
import SegmentedControl from '../components/SegmentedControl'
import UnreadDot from '../components/UnreadDot'
import { useTabBarSpace } from '../components/TabBar'
import { useAuth } from '../components/Authentification'
import { useInbox } from '../components/Inbox'
import ConversationAvatar from '../components/ConversationAvatar'
import { avatarUrl, getMyIds, interlocutorName, InboxConversation } from '../helpers/inbox'
import { htmlToText } from '../helpers/html'

type Conversation = {
  id: string
  name: string
  avatar: string | null
  subtitle: string
  lastMessage: string
  fromMe: boolean
  yourTurn: boolean
  time: string
  unreadCount: number
}

const WEEKDAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)
  if (daysAgo <= 0) return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (daysAgo === 1) return 'Hier'
  if (daysAgo < 7) return WEEKDAYS[date.getDay()]
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

function toConversation(conv: InboxConversation, myIds: string[]): Conversation {
  const lastMessage = conv.messages[0]
  const role = conv.interlocutor?.metadata?._public?.role

  return {
    id: conv.interlocutorId,
    name: interlocutorName(conv.interlocutor) || 'Interlocuteur inconnu',
    avatar: avatarUrl(conv.interlocutor),
    subtitle: role ?? '',
    lastMessage: htmlToText(lastMessage?.content ?? ''),
    fromMe: !!lastMessage && myIds.includes(lastMessage.senderId),
    yourTurn: !!lastMessage && !myIds.includes(lastMessage.senderId),
    time: formatTime(lastMessage?.createdDate),
    unreadCount: conv.nbUnread,
  }
}

export default function MessagesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>()
  const { currentUser } = useAuth()
  const inbox = useInbox()
  const { loading, error, refresh, unreadCount } = inbox
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [pulling, setPulling] = useState(false)
  const tabBarSpace = useTabBarSpace()

  const myIds = useMemo(() => getMyIds(currentUser), [currentUser])
  const conversations = useMemo(
    () => inbox.conversations.map(conv => toConversation(conv, myIds)),
    [inbox.conversations, myIds],
  )

  // Already loaded at login: refetched in the background to stay fresh
  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  async function pullToRefresh() {
    setPulling(true)
    await refresh()
    setPulling(false)
  }

  const filtered = useMemo(() => {
    let list = conversations
    if (filter === 'unread') list = list.filter(c => c.unreadCount > 0)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      )
    }
    return list
  }, [conversations, filter, search])

  function markAllAsRead() {
    inbox.markAsRead()
  }

  function openConversation(item: Conversation) {
    navigation.navigate('Conversation', {
      interlocutorId: item.id,
      name: item.name,
      subtitle: item.subtitle,
      avatar: item.avatar,
    })
  }

  function renderItem({ item }: { item: Conversation }) {
    const unread = item.unreadCount > 0

    return (
      <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => openConversation(item)}>
        <ConversationAvatar id={item.id} name={item.name} uri={item.avatar} />

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <Text style={[styles.itemName, unread && styles.itemNameUnread]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.yourTurn && (
              <View style={styles.yourTurnChip}>
                <Text style={styles.yourTurnText}>À vous</Text>
              </View>
            )}
            <Text style={[styles.itemTime, unread && styles.itemTimeUnread]}>{item.time}</Text>
          </View>

          {!!item.subtitle && (
            <Text style={styles.itemContext} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}

          <View style={styles.itemBottomRow}>
            <Text style={[styles.itemMessage, unread && styles.itemMessageUnread]} numberOfLines={1}>
              {item.fromMe ? 'Vous : ' : ''}
              {item.lastMessage}
            </Text>
            {unread && <UnreadDot />}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Messages" />

      <View style={styles.searchBar}>
        <Icon name="magnify" size={18} color={theme.colors.grey4} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={theme.colors.grey4}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <SegmentedControl
        options={[
          { key: 'all', label: 'Tous' },
          { key: 'unread', label: 'Non lus', dot: unreadCount > 0 },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <TouchableOpacity style={styles.markAll} onPress={markAllAsRead} disabled={unreadCount === 0}>
        <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllDisabled]}>Tout marquer comme lu</Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarSpace + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          // Refetches on focus stay silent while data is already displayed
          <RefreshControl
            refreshing={pulling || (loading && conversations.length === 0)}
            onRefresh={pullToRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Icon name="message-text-outline" size={40} color={theme.colors.grey3} />
              <Text style={styles.emptyText}>
                {error ?? (conversations.length === 0 ? 'Pas encore de message.' : 'Aucune conversation ne correspond.')}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.grey1,
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.grey7,
    padding: 0,
  },
  markAll: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  markAllDisabled: {
    color: theme.colors.grey4,
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.grey6,
  },
  itemNameUnread: {
    fontWeight: '700',
    color: theme.colors.grey7,
  },
  yourTurnChip: {
    backgroundColor: theme.colors.green2,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  yourTurnText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.green5,
  },
  itemTime: {
    fontSize: 11,
    color: theme.colors.grey4,
  },
  itemTimeUnread: {
    color: theme.colors.grey7,
    fontWeight: '600',
  },
  itemContext: {
    fontSize: 12,
    color: theme.colors.grey4,
    marginTop: 1,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  itemMessage: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.grey5,
  },
  itemMessageUnread: {
    color: theme.colors.grey7,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: theme.colors.grey4,
    fontSize: 14,
  },
})
