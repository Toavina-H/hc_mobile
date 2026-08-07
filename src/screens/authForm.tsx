// src/screens/auth/AuthForm.tsx
import React, { useState, useRef } from 'react'
import { theme } from '../theme'
import HcButton from '../components/HcButton'
import { useNavigation } from '@react-navigation/native'
import LoginForm from './login'
import RegisterForm from './register'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Animated,
} from 'react-native'

type AuthTab = 'connexion' | 'inscription'

const TITLES: Record<AuthTab, string> = {
  connexion: 'Heureux de vous revoir !',
  inscription: 'Bienvenue sur HappyCab !',
}

export default function AuthForm() {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<AuthTab>('connexion')
  const loginOpacity = useRef(new Animated.Value(1)).current
  const registerOpacity = useRef(new Animated.Value(0)).current

  const scroll = activeTab === 'inscription'

  const switchTab = (nextTab: AuthTab) => {
    if (nextTab === activeTab) return
    setActiveTab(nextTab)
    Animated.parallel([
      Animated.timing(loginOpacity, {
        toValue: nextTab === 'connexion' ? 1 : 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(registerOpacity, {
        toValue: nextTab === 'inscription' ? 1 : 0,
        duration: 50,
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'connexion' && styles.tabActive]}
            onPress={() => switchTab('connexion')}
          >
            <Text style={[styles.tabText, activeTab === 'connexion' && styles.tabTextActive]}>
              Connexion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inscription' && styles.tabActive]}
            onPress={() => switchTab('inscription')}
          >
            <Text style={[styles.tabText, activeTab === 'inscription' && styles.tabTextActive]}>
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{TITLES[activeTab]}</Text>

        <View>
          <Animated.View
            style={{ opacity: loginOpacity, display: activeTab === 'connexion' ? 'flex' : 'none' }}
          >
            <LoginForm />
          </Animated.View>
          <Animated.View
            style={{ opacity: registerOpacity, display: activeTab === 'inscription' ? 'flex' : 'none' }}
          >
            <RegisterForm />
          </Animated.View>
        </View>
      </View>

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
    </>
  )

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.grey3 },
  scrollContent: { flexGrow: 1 },
  container: { backgroundColor: theme.colors.purple1, padding: 24, margin: 24, borderRadius: 15 },
  logoContainer: { width: '100%', backgroundColor: theme.colors.purple1, alignItems: 'center' },
  logo: { width: 120, height: 80, alignSelf: 'center', marginTop: 16 },
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
  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16, marginBottom: 16 },
  bottomButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
})