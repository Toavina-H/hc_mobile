import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// TODO: replace with data fetched from the API
// Expected shape once wired up: { id, type, title, description, time, date, read }
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'course',
    title: 'New Course Material Available',
    description: 'Check out the latest lecture slides and reading list.',
    time: '2 mins ago',
    date: 'Today',
    read: false,
  },
  {
    id: '2',
    type: 'assignment',
    title: 'Upcoming Assignment Deadline',
    description: "Don't forget to submit your Biology and Physics homework.",
    time: '30 mins ago',
    date: 'Today',
    read: false,
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Important Announcement',
    description: 'Learnly is hosting a webinar on The dangers of...',
    time: '1 day ago',
    date: 'Yesterday',
    read: false,
  },
  {
    id: '4',
    type: 'reading',
    title: 'Recommended Reading Material',
    description: 'Check out the latest lecture slides and reading list.',
    time: '1 day ago',
    date: 'Yesterday',
    read: true,
  },
  {
    id: '5',
    type: 'milestone',
    title: "You've Achieved a Milestone!",
    description: 'You\u2019ve completed 80% of the "Web Development" course.',
    time: '1 day ago',
    date: 'Yesterday',
    read: true,
  },
  {
    id: '6',
    type: 'reading',
    title: 'Recommended Reading Material',
    description: 'Check out the latest lecture slides and reading list.',
    time: '2 days ago',
    date: 'Monday, October 11, 2024',
    read: false,
  },
];

// derive Notification type from mock data
type Notification = typeof MOCK_NOTIFICATIONS[number];

const ICON_BY_TYPE: Record<string, { name: string; bg: string; color: string }> = {
  course: { name: 'book-outline', bg: '#D9ECFF', color: '#2F7FE0' },
  assignment: { name: 'document-text-outline', bg: '#E3DCFB', color: '#6C4DE0' },
  announcement: { name: 'megaphone-outline', bg: '#FDEECB', color: '#D99A1F' },
  reading: { name: 'library-outline', bg: '#D9ECFF', color: '#2F7FE0' },
  milestone: { name: 'trophy-outline', bg: '#FBDFE4', color: '#D9536F' },
};

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    let list = notifications;
    if (filter === 'unread') list = list.filter((n) => !n.read);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, filter, search]);

  const sections = useMemo(() => {
    const groups: { label: string; items: Notification[] }[] = [];
    filtered.forEach((item) => {
      let group = groups.find((g) => g.label === item.date);
      if (!group) {
        group = { label: item.date, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
  }, [filtered]);

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // TODO: call API to persist read state, e.g. PATCH /notifications/read-all
  }

  function openNotification(item: Notification) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    // TODO: navigate to the notification's target / call API to mark as read
  }

  function renderItem(item: Notification) {
    const icon = ICON_BY_TYPE[item.type] || ICON_BY_TYPE.reading;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => openNotification(item)}
      >
        <View style={[styles.avatar, { backgroundColor: icon.bg }]}>
          <Icon name={icon.name} size={20} color={icon.color} />
        </View>

        <View style={styles.itemBody}>
          <Text
            style={[styles.itemTitle, item.read && styles.itemTitleRead]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.itemDesc, item.read && styles.itemDescRead]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>

        <View style={styles.itemMeta}>
          {!item.read && <View style={styles.unreadDot} />}
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={10}>
          <Icon name="chevron-back" size={24} color="#2B2440" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color="#a8a3ba" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#a8a3ba"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, filter === 'all' && styles.chipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={styles.chipText}>All</Text>
            <View style={styles.chipBadge}>
              <Text style={styles.chipBadgeText}>{notifications.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filter === 'unread' && styles.chipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={styles.chipText}>Non lu</Text>
            <View style={styles.chipBadge}>
              <Text style={styles.chipBadgeText}>{unreadCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Marquer tout comme lu</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={sections}
        keyExtractor={(s) => s.label}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.items.map(renderItem)}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyState}>Pas encore de notification.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6FB',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2440',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2B2440',
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8F5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6280',
  },
  chipBadge: {
    backgroundColor: '#4D3FD6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  chipBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4D3FD6',
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2440',
    marginVertical: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFC',
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
    fontWeight: '600',
    color: '#2B2440',
    marginBottom: 2,
  },
  itemTitleRead: {
    color: '#A8A3BA',
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 13,
    color: '#6B6280',
  },
  itemDescRead: {
    color: '#B8B4C4',
  },
  itemMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4D6BFF',
  },
  itemTime: {
    fontSize: 11,
    color: '#A8A3BA',
  },
  emptyState: {
    textAlign: 'center',
    color: '#A8A3BA',
    paddingVertical: 40,
    fontSize: 14,
  },
});