// src/screens/authForm.tsx
import React, { useState, useRef } from 'react'
import { theme } from '../theme'
import Ripple from '../components/ripple'
import LoginForm from './login'
import RegisterForm from './register'
import ForgotPasswordForm from './forgotPassword'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Animated,
} from 'react-native'

type AuthTab = 'connexion' | 'inscription' | 'mot-de-passe-oublie'

const TITLES: Record<AuthTab, string> = {
  connexion: 'Heureux de vous revoir !',
  inscription: 'Bienvenue sur HappyCab !',
  'mot-de-passe-oublie': 'Mot de passe oublié',
}

const TAB_LABELS: Record<AuthTab, string> = {
  connexion: 'Connexion',
  inscription: 'Inscription',
  'mot-de-passe-oublie': 'Mot de passe oublié',
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<AuthTab>('connexion')
  const loginOpacity = useRef(new Animated.Value(1)).current
  const registerOpacity = useRef(new Animated.Value(0)).current
  const forgotOpacity = useRef(new Animated.Value(0)).current
  const scroll = activeTab !== 'connexion'

  // Third tab only exists in the switcher while it's the active one —
  // switching away removes it on the next render, no extra state to sync.
  const visibleTabs: AuthTab[] =
    activeTab === 'mot-de-passe-oublie'
      ? ['connexion', 'inscription', 'mot-de-passe-oublie']
      : ['connexion', 'inscription']

  const switchTab = (nextTab: AuthTab) => {
    if (nextTab === activeTab) return
    setActiveTab(nextTab)
    Animated.parallel([
      Animated.timing(loginOpacity, {
        toValue: nextTab === 'connexion' ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(registerOpacity, {
        toValue: nextTab === 'inscription' ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(forgotOpacity, {
        toValue: nextTab === 'mot-de-passe-oublie' ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

const content = (
  <>
    <View style={styles.logoContainer}>
      <Image source={require('../assets/logo.webp')} style={styles.logo} resizeMode="contain" />
    </View>

    <View style={styles.container}>
      <View style={styles.tabSwitch}>
        <Ripple
          onPress={() => switchTab('connexion')}
          style={[styles.tab, activeTab === 'connexion' && styles.tabActive]}
          rippleColor={`${theme.colors.primary}33`}
        >
          <Text style={[styles.tabText, activeTab === 'connexion' && styles.tabTextActive]}>
            Connexion
          </Text>
        </Ripple>
        <Ripple
          onPress={() => switchTab('inscription')}
          style={[styles.tab, activeTab === 'inscription' && styles.tabActive]}
          rippleColor={`${theme.colors.primary}33`}
        >
          <Text style={[styles.tabText, activeTab === 'inscription' && styles.tabTextActive]}>
            Inscription
          </Text>
        </Ripple>
      </View>

      <Text style={styles.title}>{TITLES[activeTab]}</Text>

      <View>
        <Animated.View
          style={{
            opacity: loginOpacity,
            ...(activeTab === 'connexion'
              ? { position: 'relative' }
              : { position: 'absolute', top: 0, left: 0, right: 0 }),
          }}
          pointerEvents={activeTab === 'connexion' ? 'auto' : 'none'}
        >
          <LoginForm onForgotPassword={() => switchTab('mot-de-passe-oublie')} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: registerOpacity,
            ...(activeTab === 'inscription'
              ? { position: 'relative' }
              : { position: 'absolute', top: 0, left: 0, right: 0 }),
          }}
          pointerEvents={activeTab === 'inscription' ? 'auto' : 'none'}
        >
          <RegisterForm />
        </Animated.View>

        <Animated.View
          style={{
            opacity: forgotOpacity,
            ...(activeTab === 'mot-de-passe-oublie'
              ? { position: 'relative' }
              : { position: 'absolute', top: 0, left: 0, right: 0 }),
          }}
          pointerEvents={activeTab === 'mot-de-passe-oublie' ? 'auto' : 'none'}
        >
          <ForgotPasswordForm onBack={() => switchTab('connexion')} />
        </Animated.View>
      </View>
    </View>
  </>
)
  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.grey3 },
  scrollContent: { flexGrow: 1 },
  container: { backgroundColor: theme.colors.purple1, padding: 24, margin: 24, borderRadius: 15 },
  logoContainer: { width: '100%', backgroundColor: theme.colors.purple1, alignItems: 'center' },
  logo: { width: 120, height: 80, alignSelf: 'center' },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.colors.grey3,
    borderRadius: 15,
    padding: 5,
    marginBottom: 24,
    alignSelf: 'center',
    width: '75%',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  tabActive: { backgroundColor: theme.colors.purple1, borderRadius: 5 },
  tabText: { color: theme.colors.grey5, fontWeight: '500' },
  tabTextActive: { color: theme.colors.primary },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: theme.colors.grey7 },
})