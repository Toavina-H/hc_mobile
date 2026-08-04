// src/pages/login/login.tsx
import React, { useState } from 'react'
import stelace from '../api/stelace'
import { theme } from '../theme'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import HcButton from '../components/HcButton'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native'

type AuthTab = 'connexion' | 'inscription'

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<AuthTab>('connexion')
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
      navigation.navigate('Applications')
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
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.webp')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'connexion' && styles.tabActive]}
            onPress={() => setActiveTab('connexion')}
          >
            <Text style={[styles.tabText, activeTab === 'connexion' && styles.tabTextActive]}>
              Connexion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inscription' && styles.tabActive]}
            onPress={() => {
              setActiveTab('inscription')
              navigation.navigate('Register')
            }}
          >
            <Text style={[styles.tabText, activeTab === 'inscription' && styles.tabTextActive]}>
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Heureux de vous revoir !</Text>

        {/* Email */}
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

        {/* Password */}
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

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <HcButton
          title="Connexion"
          onPress={handleLogin}
          loading={loading}
          style={{ width: '45%' }}
        />

        <View style={styles.divider} />

        {/* Passwordless section */}
        <Text style={styles.passwordlessTitle}>
          Connexion rapide sans mot de passe
        </Text>
        <Text style={styles.passwordlessSubtitle}>
          Si vous ne souhaitez pas vous authentifier avec un mot de passe,
          utilisez cette option.
        </Text>

        <TouchableOpacity
          style={styles.emailIconButton}
          onPress={handlePasswordlessLogin}
          disabled={loading}
        >
          <Icon name="email" size={18} color={theme.colors.grey7} />
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <HcButton
          title="Centre d'aide"
          onPress={() => navigation.navigate('HelpCenter')}
          fullWidth={false}
          style={styles.bottomButton}
        />
        <HcButton
          title="Nous contacter"
          onPress={() => navigation.navigate('Contact')}
          fullWidth={false}
          style={styles.bottomButton}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.grey3
  },
  container: {
    backgroundColor: theme.colors.purple1,
    padding: 24,
    margin: 24,
    borderRadius: 15,
  },
  logoContainer: {
    width: '100%',
    backgroundColor: theme.colors.purple1,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 80,
    alignSelf: 'center',
    marginTop: 16,
  },
  tabSwitch: {  
    flexDirection: 'row',
    backgroundColor: theme.colors.grey3,
    borderRadius: 15,
    padding: 5,
    marginBottom: 24,
    alignSelf: 'center',   
    width: '75%', 
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.purple1,
    borderRadius: 5,
  },
  tabText: {
    color: theme.colors.grey5,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.grey7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: theme.colors.grey7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  forgotPassword: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    width: '44%'
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grey3,
    marginVertical: 24,
  },
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
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bottomButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  bottomButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
})