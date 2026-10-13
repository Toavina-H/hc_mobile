// src/components/ApplicationStatusBadge.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import { APPLICATION_STATUSES, ApplicationStatus } from '../helpers/applications'

export const STATUS_ORDER: ApplicationStatus[] = APPLICATION_STATUSES.map(s => s.key)

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; icon: string; color: string; bg: string; hint: string }
> = {
  received: {
    label: 'Reçue',
    icon: 'plus-circle-outline',
    color: theme.colors.blue5,
    bg: theme.colors.blue2,
    hint: 'Le cabinet a bien reçu votre candidature.',
  },
  pending: {
    label: 'En cours',
    icon: 'progress-clock',
    color: theme.colors.gold5,
    bg: theme.colors.gold2,
    hint: 'Votre candidature est en cours d’examen par le cabinet.',
  },
  meeting: {
    label: 'Entretien',
    icon: 'account-voice',
    color: theme.colors.purple4,
    bg: theme.colors.purple2,
    hint: 'Le cabinet souhaite vous rencontrer pour un entretien.',
  },
  recruited: {
    label: 'Embauché',
    icon: 'check-decagram',
    color: theme.colors.green5,
    bg: theme.colors.green2,
    hint: 'Félicitations, vous avez été retenu(e) pour ce poste !',
  },
  refused: {
    label: 'Refusé',
    icon: 'close-circle-outline',
    color: theme.colors.red5,
    bg: theme.colors.red2,
    hint: 'Le cabinet n’a pas donné suite à votre candidature.',
  },
  cancelled: {
    label: 'Annulée',
    icon: 'cancel',
    color: theme.colors.grey5,
    bg: theme.colors.grey2,
    hint: 'Cette candidature a été annulée.',
  },
}

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Icon name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
