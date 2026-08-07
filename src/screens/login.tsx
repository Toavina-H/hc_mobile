// src/screens/login.tsx
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import stelace from '../api/stelace'
import { theme } from '../theme'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import HcButton from '../components/HcButton'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

export default function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const navigation = useNavigation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Email et mot de passe requis')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await stelace.auth.login({ username, password })
      navigation.navigate('Notifications')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordlessLogin = async () => {
    if (!username) {
      setError('Merci de renseigner votre email')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await stelace.auth.sendPasswordlessLink({ username })
      navigation.navigate('CheckYourEmail', { email: username })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer le lien")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputWrapper}>
        <Icon name="email" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <Text style={styles.label}>Mot de passe</Text>
      <View style={styles.inputWrapper}>
        <Icon name="lock" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.colors.grey4} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onForgotPassword}>
        <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <HcButton title="Connexion" onPress={handleLogin} loading={loading} style={{ width: '45%' }} />

      <View style={styles.divider} />

      <Text style={styles.passwordlessTitle}>Connexion rapide sans mot de passe</Text>
      <Text style={styles.passwordlessSubtitle}>
        Si vous ne souhaitez pas vous authentifier avec un mot de passe, utilisez cette option.
      </Text>

      <TouchableOpacity style={styles.emailIconButton} onPress={handlePasswordlessLogin} disabled={loading}>
        <Icon name="email" size={18} color={theme.colors.grey7} />
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
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
  forgotPassword: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    width: '44%',
  },
  divider: { height: 1, backgroundColor: theme.colors.grey3, marginVertical: 24 },
  passwordlessTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.grey7,
  },
  passwordlessSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: theme.colors.grey6,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emailIconButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.grey7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
})