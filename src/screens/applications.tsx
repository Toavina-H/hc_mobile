// src/screens/applications.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import HeaderMenu from '../components/HeaderMenu'
import ConversationAvatar from '../components/ConversationAvatar'
import ApplicationStatusBadge, { STATUS_CONFIG, STATUS_ORDER } from '../components/ApplicationStatusBadge'
import { useAuth } from '../components/Authentification'
import { Application, ApplicationStatus, fetchApplications } from '../helpers/applications'
import { interlocutorName } from '../helpers/inbox'
import { useTabBarSpace } from '../components/TabBar'

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

function today() {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// The application worth highlighting: an upcoming interview first, then one still being reviewed
function highlighted(applications: Application[]) {
  return (
    applications.find(a => a.status === 'meeting') ??
    applications.find(a => a.status === 'pending') ??
    applications.find(a => a.status === 'received')
  )
}

export default function ApplicationsScreen() {
  const navigation = useNavigation()
  const { currentUser } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [pulling, setPulling] = useState(false)
  const requestId = useRef(0)
  const tabBarSpace = useTabBarSpace()

  const refresh = useCallback(async () => {
    if (!currentUser?.id) return
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const results = await fetchApplications(currentUser.id)
      if (id === requestId.current) setApplications(results)
    } catch (e) {
      if (id !== requestId.current) return
      console.warn(e)
      setError('Impossible de charger vos candidatures.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [currentUser?.id])

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

  const filters = useMemo(
    () => [
      { key: 'all' as Filter, label: 'Toutes', count: applications.length },
      ...STATUS_ORDER.map(status => ({
        key: status as Filter,
        label: STATUS_CONFIG[status].label,
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
          (a.offer.location ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [applications, filter, search])

  const hero = highlighted(applications)
  const meetingCount = applications.filter(a => a.status === 'meeting').length
  const firstName = currentUser?.firstname || interlocutorName(currentUser) || ''

  function openApplication(application: Application) {
    navigation.navigate('Offer', { applicationId: application.id, application })
  }

  function renderItem({ item }: { item: Application }) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openApplication(item)}>
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

        {(!!item.offer.location || !!item.offer.contractType) && (
          <View style={styles.metaRow}>
            {!!item.offer.location && (
              <>
                <Icon name="map-marker-outline" size={14} color={theme.colors.grey5} />
                <Text style={styles.metaText}>{item.offer.location}</Text>
              </>
            )}
            {!!item.offer.contractType && (
              <>
                <Icon
                  name="file-document-outline"
                  size={14}
                  color={theme.colors.grey5}
                  style={!!item.offer.location && styles.metaIcon}
                />
                <Text style={styles.metaText}>{item.offer.contractType}</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.cardBottom}>
          <ApplicationStatusBadge status={item.status} />
          <Text style={styles.appliedAt}>Postulé le {item.appliedAt}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const listHeader = (
    <View>
      <View style={styles.greeting}>
        {!!currentUser && <ConversationAvatar id={currentUser.id} name={firstName || '?'} size={48} />}
        <View style={styles.greetingText}>
          <Text style={styles.greetingName} numberOfLines={1}>
            Bonjour{firstName ? ` ${firstName}` : ''}
          </Text>
          <Text style={styles.greetingDate}>{today()}</Text>
        </View>
        <View style={styles.menuButton}>
          <HeaderMenu />
        </View>
      </View>

      {!!hero && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => openApplication(hero)}>
          <LinearGradient
            colors={[theme.colors.purple3, theme.colors.purple4]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Icon name="briefcase-variant-outline" size={84} color="rgba(255, 255, 255, 0.18)" style={styles.heroIcon} />
            <Text style={styles.heroEyebrow}>
              {hero.status === 'meeting' ? 'Entretien en vue' : 'Candidature en cours'}
            </Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {hero.offer.title}
            </Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Icon name="office-building-outline" size={14} color={theme.colors.purple1} />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {hero.offer.company}
                </Text>
              </View>
              <Text style={styles.heroMetaText}>{STATUS_CONFIG[hero.status].label}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.stats}>
        <TouchableOpacity style={styles.statFlex} activeOpacity={0.85} onPress={() => setFilter('meeting')}>
          <LinearGradient colors={[theme.colors.red3, theme.colors.red4]} style={styles.stat}>
            <View style={styles.statTop}>
              <Text style={styles.statValue}>{meetingCount}</Text>
              <Icon name="chevron-double-right" size={18} color={theme.colors.white} />
            </View>
            <Text style={styles.statLabel}>Entretien{meetingCount > 1 ? 's' : ''}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statFlex} activeOpacity={0.85} onPress={() => setFilter('all')}>
          <LinearGradient colors={[theme.colors.blue4, theme.colors.blue5]} style={styles.stat}>
            <View style={styles.statTop}>
              <Text style={styles.statValue}>{applications.length}</Text>
              <Icon name="chevron-double-right" size={18} color={theme.colors.white} />
            </View>
            <Text style={styles.statLabel}>
              Candidature{applications.length > 1 ? 's' : ''} envoyée{applications.length > 1 ? 's' : ''}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mes candidatures</Text>

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
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>{f.count}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        style={styles.listView}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarSpace + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          // Refetches on focus stay silent while data is already displayed
          <RefreshControl
            refreshing={pulling || (loading && applications.length === 0)}
            onRefresh={pullToRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.emptyState}>
              {error ??
                (applications.length === 0
                  ? "Vous n'avez pas encore postulé à une offre."
                  : 'Aucune candidature ne correspond à votre recherche.')}
            </Text>
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
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  greetingText: {
    flex: 1,
  },
  greetingName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.grey7,
  },
  greetingDate: {
    fontSize: 13,
    color: theme.colors.grey5,
    marginTop: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  heroEyebrow: {
    fontSize: 13,
    color: theme.colors.purple1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white,
    marginTop: 6,
    marginRight: 64,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  heroMetaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 12,
    color: theme.colors.purple1,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statFlex: {
    flex: 1,
  },
  stat: {
    borderRadius: 20,
    padding: 16,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.grey7,
    marginBottom: 12,
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
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 14,
  },
  chips: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.grey6,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  chipCount: {
    fontSize: 12,
    color: theme.colors.grey4,
  },
  chipCountActive: {
    color: theme.colors.purple2,
  },
  listView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 16,
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
    borderTopColor: theme.colors.grey1,
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
