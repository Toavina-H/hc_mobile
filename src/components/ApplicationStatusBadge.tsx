// src/components/ApplicationStatusBadge.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import { ApplicationStatus } from '../mocks/applications'

export const STATUS_ORDER: ApplicationStatus[] = ['Traitement', 'Entretien', 'Embauché', 'Refusé']

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { icon: string; color: string; bg: string; hint: string }
> = {
  Traitement: {
    icon: 'progress-clock',
    color: theme.colors.gold5,
    bg: theme.colors.gold2,
    hint: 'Votre candidature est en cours d’examen par le cabinet.',
  },
  Entretien: {
    icon: 'account-voice',
    color: theme.colors.blue5,
    bg: theme.colors.blue2,
    hint: 'Le cabinet souhaite vous rencontrer pour un entretien.',
  },
  Embauché: {
    icon: 'check-decagram',
    color: theme.colors.green5,
    bg: theme.colors.green2,
    hint: 'Félicitations, vous avez été retenu(e) pour ce poste !',
  },
  Refusé: {
    icon: 'close-circle-outline',
    color: theme.colors.red5,
    bg: theme.colors.red2,
    hint: 'Le cabinet n’a pas donné suite à votre candidature.',
  },
}

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Icon name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{status}</Text>
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
