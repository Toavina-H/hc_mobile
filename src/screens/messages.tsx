// src/screens/messages.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import { MOCK_CONVERSATIONS, Conversation } from '../mocks/messages'

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
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')
}

export default function MessagesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>()
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length

  useEffect(() => {
    navigation.setOptions({ tabBarBadge: unreadCount > 0 ? unreadCount : undefined })
  }, [navigation, unreadCount])

  const filtered = useMemo(() => {
    let list = conversations
    if (filter === 'unread') list = list.filter(c => c.unreadCount > 0)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.offerTitle.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      )
    }
    return list
  }, [conversations, filter, search])

  function markAllAsRead() {
    setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })))
    // TODO: call API to persist read state
  }

  function openConversation(item: Conversation) {
    setConversations(prev => prev.map(c => (c.id === item.id ? { ...c, unreadCount: 0 } : c)))
    // TODO: navigate to the conversation thread once it exists
  }

  function renderItem({ item }: { item: Conversation }) {
    const avatar = AVATAR_COLORS[Number(item.id) % AVATAR_COLORS.length]
    const unread = item.unreadCount > 0

    return (
      <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => openConversation(item)}>
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.color }]}>{initials(item.name)}</Text>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <Text style={[styles.itemName, unread && styles.itemNameUnread]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemTime, unread && styles.itemTimeUnread]}>{item.time}</Text>
          </View>

          <Text style={styles.itemContext} numberOfLines={1}>
            {item.company} · {item.offerTitle}
          </Text>

          <View style={styles.itemBottomRow}>
            <Text style={[styles.itemMessage, unread && styles.itemMessageUnread]} numberOfLines={1}>
              {item.fromMe ? 'Vous : ' : ''}
              {item.lastMessage}
            </Text>
            {unread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Vos échanges avec les cabinets</Text>
      </View>

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

      <View style={styles.filtersRow}>
        <View style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, filter === 'all' && styles.chipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>Tous</Text>
            <View style={[styles.chipBadge, filter === 'all' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, filter === 'all' && styles.chipBadgeTextActive]}>
                {conversations.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filter === 'unread' && styles.chipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.chipText, filter === 'unread' && styles.chipTextActive]}>Non lus</Text>
            <View style={[styles.chipBadge, filter === 'unread' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, filter === 'unread' && styles.chipBadgeTextActive]}>
                {unreadCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={markAllAsRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllDisabled]}>
            Tout marquer comme lu
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="message-text-outline" size={40} color={theme.colors.grey3} />
            <Text style={styles.emptyText}>
              {conversations.length === 0 ? 'Pas encore de message.' : 'Aucune conversation ne correspond.'}
            </Text>
          </View>
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
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.grey7,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.grey5,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.grey2,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.grey7,
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.purple2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.grey6,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  chipBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  chipBadgeActive: {
    backgroundColor: theme.colors.white,
  },
  chipBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  chipBadgeTextActive: {
    color: theme.colors.primary,
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
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey2,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
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
  itemTime: {
    fontSize: 11,
    color: theme.colors.grey4,
  },
  itemTimeUnread: {
    color: theme.colors.primary,
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
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
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
