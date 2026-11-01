// src/screens/interview.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigation, StaticScreenProps } from '@react-navigation/native'
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import HcButton from '../components/HcButton'
import HcSpinner from '../components/HcSpinner'
import { InterviewScores } from '../api/interviews'
import { Speaker, useVoiceInterview } from '../helpers/useVoiceInterview'

type Props = StaticScreenProps<{ offerId: string; offerTitle?: string }>

const ERRORS: Record<string, string> = {
  mic_denied: 'Autorisez l’accès au micro pour passer l’entretien à voix haute.',
  weekly_limit_reached: 'Vous avez utilisé vos entretiens de la semaine. Réessayez dans quelques jours.',
  offer_not_available: 'Cette offre n’est plus disponible.',
  interview_not_finished: 'L’entretien s’est arrêté avant votre première réponse : aucun compte rendu à générer.',
  timeout: 'La connexion est trop lente. Vérifiez votre réseau et réessayez.',
}

const SCORE_LABELS: Record<keyof InterviewScores, string> = {
  communication: 'Communication',
  motivation: 'Motivation',
  adequation: 'Adéquation au poste',
  coherenceCv: 'Cohérence avec le CV',
  clarte: 'Clarté des réponses',
}

const SPEAKER_LABELS: Record<NonNullable<Speaker>, string> = {
  recruiter: 'Le recruteur parle…',
  candidate: 'Vous parlez…',
}

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!startedAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startedAt])
  const seconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Ring around the recruiter's avatar, breathing while they speak
function SpeakingRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!active) {
      scale.setValue(1)
      return
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [active, scale])
  return <Animated.View style={[styles.ring, !active && styles.ringIdle, { transform: [{ scale }] }]} />
}

export default function InterviewScreen({ route }: Props) {
  const navigation = useNavigation()
  const { offerId, offerTitle } = route.params
  const call = useVoiceInterview(offerId)
  const elapsed = useElapsed(call.status === 'live' ? call.startedAt : null)

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
        <Icon name="chevron-left" size={28} color={theme.colors.white} />
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>Entretien d'entraînement</Text>
        {offerTitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{offerTitle}</Text> : null}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  )

  let body: React.ReactNode
  switch (call.status) {
    case 'idle':
      body = (
        <View style={styles.center}>
          <View style={styles.avatar}>
            <Icon name="account-tie-voice" size={56} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Prêt pour votre entretien ?</Text>
          <Text style={styles.text}>
            Un recruteur vous pose 6 questions sur cette offre, à voix haute. Répondez naturellement et prenez le
            temps de réfléchir : il vous laisse finir. Installez-vous dans un endroit calme.
          </Text>
          <HcButton title="Commencer l'entretien" onPress={call.start} style={styles.action} />
        </View>
      )
      break
    case 'connecting':
      body = (
        <View style={styles.center}>
          <HcSpinner />
          <Text style={styles.text}>Connexion au recruteur…</Text>
        </View>
      )
      break
    case 'live':
      body = (
        <>
          <View style={styles.center}>
            <Text style={styles.timer}>{elapsed}</Text>
            <View style={styles.avatarWrap}>
              <SpeakingRing active={call.speaker === 'recruiter'} />
              <View style={styles.avatar}>
                <Icon name="account-tie-voice" size={56} color={theme.colors.white} />
              </View>
            </View>
            <Text style={styles.speaker}>
              {call.speaker ? SPEAKER_LABELS[call.speaker] : call.muted ? 'Micro coupé' : 'À vous'}
            </Text>
            <Text style={styles.caption} numberOfLines={6}>{call.caption}</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.control, call.muted && styles.controlOn]} onPress={call.toggleMute}>
              <Icon name={call.muted ? 'microphone-off' : 'microphone'} size={28} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.control, styles.hangUp]} onPress={call.hangUp}>
              <Icon name="phone-hangup" size={28} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )
      break
    case 'evaluating':
      body = (
        <View style={styles.center}>
          <HcSpinner />
          <Text style={styles.title}>Analyse de votre entretien…</Text>
          <Text style={styles.text}>Votre compte rendu arrive dans quelques secondes.</Text>
        </View>
      )
      break
    case 'done':
      body = (
        <ScrollView contentContainerStyle={styles.report}>
          <Text style={styles.title}>Votre compte rendu</Text>
          {(Object.keys(SCORE_LABELS) as (keyof InterviewScores)[]).map(key => (
            <View key={key} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{SCORE_LABELS[key]}</Text>
              <Text style={styles.scoreValue}>{call.report!.scores[key]}/5</Text>
            </View>
          ))}
          <Text style={styles.sectionTitle}>Points forts</Text>
          {call.report!.strengths.map(s => <Text key={s} style={styles.text}>• {s}</Text>)}
          <Text style={styles.sectionTitle}>À travailler</Text>
          {call.report!.improvements.map(s => <Text key={s} style={styles.text}>• {s}</Text>)}
        </ScrollView>
      )
      break
    case 'error':
      body = (
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={56} color={theme.colors.white} />
          <Text style={styles.text}>{ERRORS[call.error ?? ''] ?? 'Une erreur est survenue, veuillez réessayer.'}</Text>
          {call.error !== 'weekly_limit_reached' && call.error !== 'interview_not_finished' && (
            <HcButton
              title="Réessayer"
              onPress={call.callStarted ? call.retryReport : call.start}
              style={styles.action}
            />
          )}
        </View>
      )
      break
  }

  return (
    <LinearGradient colors={[theme.colors.purple5, theme.colors.purple4]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {header}
        {body}
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.purple2,
    marginTop: 2,
  },
  headerSpacer: {
    width: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  avatarWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: theme.colors.purple3,
  },
  ringIdle: {
    opacity: 0.4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.white,
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.purple1,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  timer: {
    fontSize: 15,
    color: theme.colors.purple2,
    fontVariant: ['tabular-nums'],
  },
  speaker: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  caption: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.purple1,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 32,
  },
  control: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  hangUp: {
    backgroundColor: theme.colors.red4,
  },
  report: {
    padding: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.white,
    marginTop: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: theme.colors.white,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
})
