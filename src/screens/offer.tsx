// src/screens/offer.tsx
import React, { useEffect, useState } from 'react'
import { useNavigation, StaticScreenProps } from '@react-navigation/native'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import ApplicationStatusBadge, { STATUS_CONFIG } from '../components/ApplicationStatusBadge'
import { Application, fetchApplication } from '../helpers/applications'

// `application` is passed when opened from the list, so the screen renders right away
type Props = StaticScreenProps<{ applicationId: string; application?: Application }>

export default function OfferScreen({ route }: Props) {
  const navigation = useNavigation()
  const { applicationId, application: initialApplication } = route.params
  const [application, setApplication] = useState<Application | null>(initialApplication ?? null)
  const [loading, setLoading] = useState(!initialApplication)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(false)
    fetchApplication(applicationId)
      .then(result => !cancelled && setApplication(result))
      .catch(e => {
        console.warn(e)
        if (!cancelled) setError(true)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [applicationId, attempt])

  function retry() {
    setLoading(true)
    setAttempt(n => n + 1)
  }

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
        <Icon name="chevron-left" size={28} color={theme.colors.grey7} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Détail de l'offre</Text>
      <View style={styles.headerSpacer} />
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </SafeAreaView>
    )
  }

  // Keep showing the data from the list if only the background refresh failed
  if (error && !application) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.errorState}>
          <Text style={styles.emptyState}>Impossible de charger cette candidature.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <Text style={styles.emptyState}>Cette offre est introuvable.</Text>
      </SafeAreaView>
    )
  }

  const { offer, status } = application
  const statusConfig = STATUS_CONFIG[status]
  const details = [
    { icon: 'map-marker-outline', label: offer.location },
    { icon: 'file-document-outline', label: offer.contractType },
    { icon: 'cash', label: offer.salary },
    { icon: 'laptop', label: offer.workMode },
  ].filter((d): d is { icon: string; label: string } => !!d.label)

  return (
    <SafeAreaView style={styles.container}>
      {header}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <Icon name="office-building-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.company}>{offer.company}</Text>
              {!!offer.publishedAt && <Text style={styles.publishedAt}>Publiée le {offer.publishedAt}</Text>}
            </View>
          </View>

          <Text style={styles.title}>{offer.title}</Text>

          {details.length > 0 && (
            <View style={styles.details}>
              {details.map(d => (
                <View key={d.icon} style={styles.detail}>
                  <Icon name={d.icon} size={16} color={theme.colors.grey5} />
                  <Text style={styles.detailText}>{d.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Votre candidature</Text>
            <ApplicationStatusBadge status={status} />
          </View>
          <Text style={styles.appliedAt}>Postulé le {application.appliedAt}</Text>
          <View style={[styles.statusHint, { backgroundColor: statusConfig.bg }]}>
            <Icon name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[styles.statusHintText, { color: statusConfig.color }]}>{statusConfig.hint}</Text>
          </View>
        </View>

        {!!offer.description && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {application.spontaneous ? 'À propos du cabinet' : 'Description du poste'}
            </Text>
            <Text style={styles.paragraph}>{offer.description}</Text>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.grey7,
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.purple2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grey6,
  },
  publishedAt: {
    fontSize: 12,
    color: theme.colors.grey4,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.grey7,
    marginTop: 16,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.grey6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedAt: {
    fontSize: 12,
    color: theme.colors.grey4,
    marginTop: 4,
  },
  statusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  statusHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.grey7,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.grey6,
    marginTop: 8,
  },
  loader: {
    paddingVertical: 40,
  },
  errorState: {
    alignItems: 'center',
  },
  retryButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    textAlign: 'center',
    color: theme.colors.grey4,
    paddingVertical: 40,
    fontSize: 14,
  },
})
