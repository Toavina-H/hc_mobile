import Config from 'react-native-config'
import stelace from './stelace'


export type InterviewQuota = {
  limit: number
  used: number
  remaining: number
  nextAvailableAt: string | null
}

export type InterviewScores = {
  communication: number
  motivation: number
  adequation: number
  coherenceCv: number | null // null: the candidate has no CV
  clarte: number
}

export type InterviewReport = {
  id: string
  sessionId: string
  scores: InterviewScores // each 1 to 5
  strengths: string[]
  improvements: string[]
  perQuestion: { question: string; feedback: string; betterAnswer?: string }[] | null
  createdAt: string
}

export type InterviewQuestion = { question: string; index: number; total: number }

export type InterviewStart = InterviewQuestion & { sessionId: string; resumeUsed: boolean }

export type VoiceInterviewStart = { sessionId: string; sdp: string; total: number; maxMinutes: number; resumeUsed: boolean }

export type InterviewAnswer =
  | ({ done: false } & InterviewQuestion)
  | { done: true; report: InterviewReport }

export type InterviewSummary = {
  id: string
  offerId: string
  offerTitle: string | null
  phase: 'intro' | 'questions' | 'feedback' | 'done'
  startedAt: string
  scores: InterviewScores | null // null until the report exists
}

export class InterviewError extends Error {
  constructor(public code: string, public status = 0, public data: Record<string, any> = {}) { super(code) }
}

// A question takes a few seconds, the evaluation (last answer, report) much longer
const QUESTION_TIMEOUT = 30_000
const EVALUATION_TIMEOUT = 90_000

async function request<T>(path: string, { body, timeout = QUESTION_TIMEOUT }: { body?: object; timeout?: number } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const r = await stelace.authFetch(`${Config.CHAT_API_URL}/interviews${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (r.status === 401) throw new InterviewError('unauthorized', 401)
    const json = await r.json().catch(() => ({}))
    if (!r.ok) {
      const { error, ...data } = json
      throw new InterviewError(error ?? 'server', r.status, data)
    }
    return json
  } catch (e: any) {
    if (e instanceof InterviewError) throw e
    throw new InterviewError(e?.name === 'AbortError' ? 'timeout' : 'server')
  } finally {
    clearTimeout(timer)
  }
}

export const getInterviewQuota = () => request<InterviewQuota>('/quota')

// 429 weekly_limit_reached, 404 offer_not_available
export const startInterview = (offerId: string) =>
  request<InterviewStart>('', { body: { offerId } })


// Live voice interview: `sdp` is the phone's WebRTC offer, the response carries OpenAI's answer.
// Same errors as startInterview
export const startVoiceInterview = (offerId: string, sdp: string) =>
  request<VoiceInterviewStart>('/voice', { body: { offerId, sdp } })

export const answerInterview = (sessionId: string, answer: string, index: number, total: number) =>
  request<InterviewAnswer>(`/${sessionId}/answer`, {
    body: { answer, index },
    timeout: index >= total ? EVALUATION_TIMEOUT : QUESTION_TIMEOUT,
  })

// Retries the evaluation if it failed
export const getInterviewReport = (sessionId: string) =>
  request<InterviewReport>(`/${sessionId}/report`, { timeout: EVALUATION_TIMEOUT })

export const listInterviews = () => request<InterviewSummary[]>('')
