export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdDate: string
}

// TODO: call the chatbot backend here; `_history` is oldest first and ends with the user's new message
export async function askAssistant(_history: AssistantMessage[]): Promise<string> {
  return "L'assistant n'est pas encore disponible."
}
