// src/screens/notifications.tsx
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
import { useNotifications } from '../components/Notifications'
import { Notification, NotificationKind, formatDayLabel, formatRelativeTime } from '../helpers/notifications'

const ICON_BY_KIND: Record<NotificationKind, { name: string; bg: string; color: string }> = {
  application: { name: 'briefcase-check-outline', bg: theme.colors.purple2, color: theme.colors.purple4 },
  interview: { name: 'calendar-account-outline', bg: theme.colors.blue2, color: theme.colors.blue5 },
  offer: { name: 'briefcase-search-outline', bg: theme.colors.gold2, color: theme.colors.gold5 },
  profile: { name: 'account-edit-outline', bg: theme.colors.red2, color: theme.colors.red5 },
  other: { name: 'bell-outline', bg: theme.colors.green2, color: theme.colors.green5 },
}

export default function NotificationsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>()
  const { notifications, loading, error, unreadCount, refresh, markAsRead, markAllAsRead } = useNotifications()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [pulling, setPulling] = useState(false)
  const tabBarSpace = useTabBarSpace()

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

  const sections = useMemo(() => {
    let list = notifications
    if (filter === 'unread') list = list.filter(n => !n.read)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
    }

    const groups: { label: string; items: Notification[] }[] = []
    list.forEach(item => {
      const label = formatDayLabel(item.createdDate)
      let group = groups.find(g => g.label === label)
      if (!group) {
        group = { label, items: [] }
        groups.push(group)
      }
      group.items.push(item)
    })
    return groups
  }, [notifications, filter, search])

  function openNotification(item: Notification) {
    if (!item.read) markAsRead(item.id)
    if (item.applicationId) navigation.navigate('Offer', { applicationId: item.applicationId })
  }

  function renderItem(item: Notification) {
    const icon = ICON_BY_KIND[item.kind]

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
          <Text style={styles.itemTime}>{formatRelativeTime(item.createdDate)}</Text>
          {!item.read && <UnreadDot />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Notifications" />

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

      <SegmentedControl
        options={[
          { key: 'all', label: 'Toutes' },
          { key: 'unread', label: 'Non lues', dot: unreadCount > 0 },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <TouchableOpacity style={styles.markAll} onPress={markAllAsRead} disabled={unreadCount === 0}>
        <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllDisabled]}>Tout marquer comme lu</Text>
      </TouchableOpacity>

      <FlatList
        data={sections}
        keyExtractor={section => section.label}
        style={styles.listView}
        contentContainerStyle={{ paddingBottom: tabBarSpace + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pulling || (loading && notifications.length === 0)}
            onRefresh={pullToRefresh}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.items.map(renderItem)}
          </View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Icon name="bell-outline" size={40} color={theme.colors.grey3} />
              <Text style={styles.emptyText}>
                {error ??
                  (notifications.length === 0 ? 'Pas encore de notification.' : 'Aucune notification ne correspond.')}
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
    paddingTop: 10,
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
  groupLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.grey7,
    marginTop: 16,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
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
