import Config from 'react-native-config'
import stelace from './stelace'

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdDate: string
}

export type ChatReply = { conversationId: string; reply: string }

export class AssistantError extends Error {
  constructor(public code: 'unauthorized' | 'timeout' | 'server') { super(code) }
}

export async function askAssistant(message: string, conversationId?: string): Promise<ChatReply> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    // authFetch adds the Stelace token and refreshes it once on 401
    const r = await stelace.authFetch(`${Config.CHAT_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationId }),
      signal: controller.signal,
    })
    if (r.status === 401) throw new AssistantError('unauthorized')
    if (!r.ok) throw new AssistantError('server')
    return await r.json()
  } catch (e: any) {
    if (e instanceof AssistantError) throw e
    throw new AssistantError(e?.name === 'AbortError' ? 'timeout' : 'server')
  } finally {
    clearTimeout(timer)
  }
}
