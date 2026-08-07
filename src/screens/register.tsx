// src/screens/register.tsx
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { theme } from '../theme'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import HcButton from '../components/HcButton'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native'

type UserType = 'recruteur' | 'candidat'

const PHONE_MAX_LENGTH = 20
const CGU_URL = 'https://happycab.fr/cgu' // TODO: replace with real URL

export default function RegisterForm() {
  const navigation = useNavigation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [acceptedCgu, setAcceptedCgu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    password &&
    confirmPassword === password &&
    userType &&
    acceptedCgu

  const handleRegister = async () => {
    if (!isFormValid) {
      setError('Merci de compléter tous les champs et d\u2019accepter les CGU')
      return
    }
    setError(null)
    setLoading(true)
    try {
      // TODO: wire up to stelace / hc-api registration endpoint
      navigation.navigate('Notifications')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Text style={styles.label}>Prénom</Text>
      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      </View>

      <Text style={styles.label}>Nom</Text>
      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      </View>

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

      <Text style={styles.label}>Téléphone</Text>
      <View style={styles.inputWrapper}>
        <Icon name="phone" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={PHONE_MAX_LENGTH}
        />
      </View>
      <Text style={styles.charCount}>{phone.length} / {PHONE_MAX_LENGTH}</Text>

      <Text style={styles.label}>Mot de passe</Text>
      <View style={styles.inputWrapper}>
        <Icon name="lock" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
        <TextInput style={styles.input} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.colors.grey4} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Confirmation du mot de passe</Text>
      <View style={styles.inputWrapper}>
        <Icon name="lock" size={18} color={theme.colors.grey4} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={theme.colors.grey4} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cguRow} onPress={() => setAcceptedCgu(!acceptedCgu)}>
        <View style={[styles.checkbox, acceptedCgu && styles.checkboxChecked]} />
        <Text style={styles.cguText}>
          En créant mon compte, j'accepte les Conditions Générales d'Utilisation du service HappyCab{' '}
          <Text style={styles.cguLink} onPress={() => Linking.openURL(CGU_URL)}>
            <Icon name="open-in-new" size={13} color={theme.colors.primary} />
          </Text>
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <HcButton
        title="Inscription"
        onPress={handleRegister}
        loading={loading}
        disabled={!isFormValid}
        style={{ marginTop: 16 }}
      />
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
  charCount: { fontSize: 12, color: theme.colors.grey5, textAlign: 'right', marginTop: -12, marginBottom: 16 },
  userTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.grey7,
    alignItems: 'center',
  },
  userTypeButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.white },
  userTypeText: { color: theme.colors.grey7, fontWeight: '500' },
  userTypeTextActive: { color: theme.colors.primary },
  cguRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.grey6,
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cguText: { flex: 1, fontSize: 13, color: theme.colors.grey6, lineHeight: 18 },
  cguLink: { color: theme.colors.primary },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
})