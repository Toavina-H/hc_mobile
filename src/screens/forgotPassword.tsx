import React, { useState } from 'react'
import stelace from '../api/stelace'
import { theme } from '../theme'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import HcButton from '../components/HcButton'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!email) {
      setError('Merci de renseigner votre email')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await stelace.password.resetRequest({ username: email.toLowerCase() })
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer l'email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Icon name="arrow-left" size={20} color={theme.colors.grey7} />
      </TouchableOpacity>

      {sent ? (
        <Text style={styles.info}>
          Un email vous a été envoyé à {email} pour changer votre mot de passe.
        </Text>
      ) : (
        <>
          <Text style={styles.info}>
            Renseignez votre adresse email pour recevoir un lien de réinitialisation.
          </Text>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Icon name="email" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <HcButton title="Envoyer" onPress={handleSubmit} loading={loading} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  backButton: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.colors.grey7 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14 },
  info: { textAlign: 'center', marginBottom: 16, color: theme.colors.grey7 },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
})