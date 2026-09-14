// src/screens/applications.tsx
import React, { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import ApplicationStatusBadge, { STATUS_ORDER } from '../components/ApplicationStatusBadge'
import { MOCK_APPLICATIONS, Application, ApplicationStatus } from '../mocks/applications'

type Filter = 'all' | ApplicationStatus

function initials(name: string) {
  return name
    .replace(/cabinet/i, '')
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')
}

export default function ApplicationsScreen() {
  const navigation = useNavigation()
  // TODO: replace with the current user's applications fetched from the API
  const [applications] = useState<Application[]>(MOCK_APPLICATIONS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filters = useMemo(
    () => [
      { key: 'all' as Filter, label: 'Toutes', count: applications.length },
      ...STATUS_ORDER.map(status => ({
        key: status as Filter,
        label: status,
        count: applications.filter(a => a.status === status).length,
      })),
    ],
    [applications],
  )

  const filtered = useMemo(() => {
    let list = applications
    if (filter !== 'all') list = list.filter(a => a.status === filter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        a =>
          a.offer.title.toLowerCase().includes(q) ||
          a.offer.company.toLowerCase().includes(q) ||
          a.offer.location.toLowerCase().includes(q),
      )
    }
    return list
  }, [applications, filter, search])

  function renderItem({ item }: { item: Application }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Offer', { applicationId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.offer.company)}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.offer.title}
            </Text>
            <Text style={styles.cardCompany} numberOfLines={1}>
              {item.offer.company}
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.colors.grey4} />
        </View>

        <View style={styles.metaRow}>
          <Icon name="map-marker-outline" size={14} color={theme.colors.grey5} />
          <Text style={styles.metaText}>{item.offer.location}</Text>
          <Icon name="file-document-outline" size={14} color={theme.colors.grey5} style={styles.metaIcon} />
          <Text style={styles.metaText}>{item.offer.contractType}</Text>
        </View>

        <View style={styles.cardBottom}>
          <ApplicationStatusBadge status={item.status} />
          <Text style={styles.appliedAt}>Postulé le {item.appliedAt}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes candidatures</Text>
        <Text style={styles.headerSubtitle}>
          {applications.length} candidature{applications.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Icon name="magnify" size={18} color={theme.colors.grey4} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un poste, un cabinet..."
          placeholderTextColor={theme.colors.grey4}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        {filters.map(f => {
          const active = filter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>{f.count}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        style={styles.listView}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyState}>
            {applications.length === 0
              ? "Vous n'avez pas encore postulé à une offre."
              : 'Aucune candidature ne correspond à votre recherche.'}
          </Text>
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
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  chips: {
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
  listView: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.purple2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.grey7,
  },
  cardCompany: {
    fontSize: 13,
    color: theme.colors.grey5,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  metaIcon: {
    marginLeft: 10,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.grey5,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey2,
  },
  appliedAt: {
    fontSize: 12,
    color: theme.colors.grey4,
  },
  emptyState: {
    textAlign: 'center',
    color: theme.colors.grey4,
    paddingVertical: 40,
    fontSize: 14,
  },
})
