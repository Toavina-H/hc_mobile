// src/screens/assistant.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import ScreenHeader from '../components/ScreenHeader'
import { useTabBarSpace } from '../components/TabBar'
import { AssistantMessage, askAssistant } from '../helpers/assistant'

const SUGGESTIONS = [
  'Comment préparer mon entretien ?',
  'Où en sont mes candidatures ?',
  'Aide-moi à rédiger une relance',
]

function newMessage(role: AssistantMessage['role'], content: string): AssistantMessage {
  const now = new Date()
  return { id: `${role}-${now.getTime()}-${Math.random()}`, role, content, createdDate: now.toISOString() }
}

export default function AssistantScreen() {
  // Newest first, for the inverted list
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const tabBarSpace = useTabBarSpace()

  async function send(text = draft) {
    const content = text.trim()
    if (!content || thinking) return
    const question = newMessage('user', content)
    const history = [...messages].reverse().concat(question)
    setMessages(prev => [question, ...prev])
    setDraft('')
    setThinking(true)
    try {
      const answer = await askAssistant(history)
      setMessages(prev => [newMessage('assistant', answer), ...prev])
    } catch (e) {
      console.warn(e)
      setMessages(prev => [newMessage('assistant', 'Une erreur est survenue, veuillez réessayer.'), ...prev])
    } finally {
      setThinking(false)
    }
  }

  function renderItem({ item }: { item: AssistantMessage }) {
    const mine = item.role === 'user'
    return (
      <View style={[styles.row, mine && styles.rowMine]}>
        {!mine && (
          <View style={styles.botAvatar}>
            <Icon name="robot-happy-outline" size={16} color={theme.colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
        </View>
      </View>
    )
  }

  const welcome = (
    <View style={styles.welcome}>
      <LinearGradient
        colors={[theme.colors.purple3, theme.colors.purple4]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEyebrow}>Votre assistant</Text>
        <Text style={styles.heroTitle}>Comment puis-je vous aider ?</Text>
        <Text style={styles.heroText}>Posez vos questions sur vos candidatures, vos entretiens ou les offres.</Text>
        <Icon name="robot-happy-outline" size={64} color="rgba(255, 255, 255, 0.25)" style={styles.heroIcon} />
      </LinearGradient>

      <Text style={styles.sectionTitle}>Suggestions</Text>
      {SUGGESTIONS.map(suggestion => (
        <TouchableOpacity key={suggestion} style={styles.suggestion} onPress={() => send(suggestion)}>
          <Text style={styles.suggestionText}>{suggestion}</Text>
          <Icon name="arrow-top-right" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.padded}>
        <ScreenHeader title="Assistant" />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.length === 0 ? (
          <View style={[styles.flex, styles.padded]}>{welcome}</View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              thinking ? (
                <View style={styles.row}>
                  <View style={styles.botAvatar}>
                    <Icon name="robot-happy-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleTheirs]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View style={[styles.composer, { marginBottom: tabBarSpace || 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Écrire votre question..."
            placeholderTextColor={theme.colors.grey4}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || thinking) && styles.sendButtonDisabled]}
            onPress={() => send()}
            disabled={!draft.trim() || thinking}
          >
            <Icon name="send" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  padded: {
    paddingHorizontal: 20,
  },
  welcome: {
    gap: 10,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroEyebrow: {
    fontSize: 13,
    color: theme.colors.purple1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.white,
    marginTop: 6,
    marginRight: 56,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.purple1,
    marginTop: 8,
    marginRight: 56,
  },
  heroIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.grey7,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.grey7,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 4,
  },
  rowMine: {
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.purple2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.grey7,
  },
  bubbleTextMine: {
    color: theme.colors.white,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 6,
    gap: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 26,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: theme.colors.grey7,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.grey3,
  },
})
