// src/screens/offer.tsx
import React from 'react'
import { useNavigation, StaticScreenProps } from '@react-navigation/native'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import ApplicationStatusBadge, { STATUS_CONFIG } from '../components/ApplicationStatusBadge'
import { MOCK_APPLICATIONS } from '../mocks/applications'

type Props = StaticScreenProps<{ applicationId: string }>

export default function OfferScreen({ route }: Props) {
  const navigation = useNavigation()
  // TODO: fetch the application and its offer from the API
  const application = MOCK_APPLICATIONS.find(a => a.id === route.params.applicationId)

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
        <Icon name="chevron-left" size={28} color={theme.colors.grey7} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Détail de l'offre</Text>
      <View style={styles.headerSpacer} />
    </View>
  )

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
  ]

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
              <Text style={styles.publishedAt}>Publiée le {offer.publishedAt}</Text>
            </View>
          </View>

          <Text style={styles.title}>{offer.title}</Text>

          <View style={styles.details}>
            {details.map(d => (
              <View key={d.icon} style={styles.detail}>
                <Icon name={d.icon} size={16} color={theme.colors.grey5} />
                <Text style={styles.detailText}>{d.label}</Text>
              </View>
            ))}
          </View>
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description du poste</Text>
          <Text style={styles.paragraph}>{offer.description}</Text>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Vos missions</Text>
          {offer.missions.map(mission => (
            <View key={mission} style={styles.bullet}>
              <Icon name="check" size={16} color={theme.colors.primary} />
              <Text style={styles.bulletText}>{mission}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Profil recherché</Text>
          {offer.profile.map(item => (
            <View key={item} style={styles.bullet}>
              <Icon name="check" size={16} color={theme.colors.primary} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
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
  sectionSpacing: {
    marginTop: 18,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.grey6,
    marginTop: 8,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.grey6,
  },
  emptyState: {
    textAlign: 'center',
    color: theme.colors.grey4,
    paddingVertical: 40,
    fontSize: 14,
  },
})
