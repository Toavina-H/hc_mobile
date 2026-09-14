// src/screens/notifications.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import { MOCK_NOTIFICATIONS, Notification, NotificationType } from '../mocks/notifications'

const ICON_BY_TYPE: Record<NotificationType, { name: string; bg: string; color: string }> = {
  application: { name: 'briefcase-check-outline', bg: theme.colors.purple2, color: theme.colors.purple4 },
  interview: { name: 'calendar-account-outline', bg: theme.colors.blue2, color: theme.colors.blue5 },
  message: { name: 'message-text-outline', bg: theme.colors.green2, color: theme.colors.green5 },
  offer: { name: 'briefcase-search-outline', bg: theme.colors.gold2, color: theme.colors.gold5 },
  profile: { name: 'account-edit-outline', bg: theme.colors.red2, color: theme.colors.red5 },
}

export default function NotificationsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>()
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    navigation.setOptions({ tabBarBadge: unreadCount > 0 ? unreadCount : undefined })
  }, [navigation, unreadCount])

  const sections = useMemo(() => {
    let list = notifications
    if (filter === 'unread') list = list.filter(n => !n.read)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
    }

    const groups: { label: string; items: Notification[] }[] = []
    list.forEach(item => {
      let group = groups.find(g => g.label === item.date)
      if (!group) {
        group = { label: item.date, items: [] }
        groups.push(group)
      }
      group.items.push(item)
    })
    return groups
  }, [notifications, filter, search])

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    // TODO: call API to persist read state
  }

  function openNotification(item: Notification) {
    setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)))
    // TODO: call API to mark as read
    if (item.applicationId) {
      navigation.navigate('Offer', { applicationId: item.applicationId })
    } else if (item.type === 'message') {
      navigation.navigate('Messages')
    }
  }

  function renderItem(item: Notification) {
    const icon = ICON_BY_TYPE[item.type]

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => openNotification(item)}
      >
        <View style={[styles.avatar, { backgroundColor: icon.bg }]}>
          <Icon name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, item.read && styles.itemTitleRead]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemDesc, item.read && styles.itemDescRead]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.itemMeta}>
          <Text style={styles.itemTime}>{item.time}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>Le suivi de vos candidatures et offres</Text>
      </View>

      <View style={styles.searchBar}>
        <Icon name="magnify" size={18} color={theme.colors.grey4} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une notification..."
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
            <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>Toutes</Text>
            <View style={[styles.chipBadge, filter === 'all' && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, filter === 'all' && styles.chipBadgeTextActive]}>
                {notifications.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filter === 'unread' && styles.chipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.chipText, filter === 'unread' && styles.chipTextActive]}>Non lues</Text>
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
        data={sections}
        keyExtractor={section => section.label}
        style={styles.listView}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.items.map(renderItem)}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="bell-outline" size={40} color={theme.colors.grey3} />
            <Text style={styles.emptyText}>
              {notifications.length === 0 ? 'Pas encore de notification.' : 'Aucune notification ne correspond.'}
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
    marginBottom: 4,
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
  listView: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grey6,
    marginTop: 16,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey2,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.grey7,
    marginBottom: 2,
  },
  itemTitleRead: {
    fontWeight: '500',
    color: theme.colors.grey5,
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.grey6,
  },
  itemDescRead: {
    color: theme.colors.grey4,
  },
  itemMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemTime: {
    fontSize: 11,
    color: theme.colors.grey4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
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
