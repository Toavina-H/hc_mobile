import { useCallback, useEffect, useRef, useState } from 'react'
import { PermissionsAndroid, Platform } from 'react-native'
import { mediaDevices, MediaStream, RTCPeerConnection } from 'react-native-webrtc'
import {
  getInterviewReport,
  InterviewError,
  InterviewReport,
  startVoiceInterview,
} from '../api/interviews'

export type CallStatus = 'idle' | 'connecting' | 'live' | 'evaluating' | 'done' | 'error'
export type Speaker = 'recruiter' | 'candidate' | null

const END_FALLBACK_MS = 15_000 // goodbye never reported as played: hang up anyway
const REPORT_RETRY_MS = 2_000  // the server is still saving the last transcripts
const REPORT_ATTEMPTS = 5

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms))

async function micAllowed() {
  if (Platform.OS !== 'android') return true // iOS asks by itself on getUserMedia
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
  return result === PermissionsAndroid.RESULTS.GRANTED
}

// Live voice interview over WebRTC: the recruiter's voice plays on its own, events from OpenAI arrive on
// the data channel. The server holds the instructions and saves the transcript; the app only shows who speaks
export function useVoiceInterview(offerId: string) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [speaker, setSpeaker] = useState<Speaker>(null)
  const [caption, setCaption] = useState('') // what the recruiter is saying, as it's said
  const [muted, setMuted] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pc = useRef<RTCPeerConnection | null>(null)
  const mic = useRef<MediaStream | null>(null)
  const sessionId = useRef<string | null>(null)
  const ending = useRef(false)
  const endTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const closeCall = useCallback(() => {
    clearTimeout(endTimer.current)
    mic.current?.getTracks().forEach(t => t.stop())
    pc.current?.close()
    mic.current = null
    pc.current = null
    setSpeaker(null)
  }, [])

  const fetchReport = useCallback(async () => {
    if (!sessionId.current) return
    setStatus('evaluating')
    setError(null)
    for (let attempt = 1; ; attempt++) {
      try {
        setReport(await getInterviewReport(sessionId.current))
        setStatus('done')
        return
      } catch (e) {
        const code = e instanceof InterviewError ? e.code : 'server'
        if (code === 'report_not_ready' && attempt < REPORT_ATTEMPTS) {
          await wait(REPORT_RETRY_MS)
          continue
        }
        console.warn(e)
        setError(code)
        setStatus('error')
        return
      }
    }
  }, [])

  const hangUp = useCallback(() => {
    if (!pc.current) return
    closeCall()
    fetchReport()
  }, [closeCall, fetchReport])

  const onEvent = useCallback((raw: string) => {
    let event: any
    try { event = JSON.parse(raw) } catch { return }
    switch (event.type) {
      case 'response.created':
        setCaption('')
        break
      case 'response.output_audio_transcript.delta':
        setCaption(c => c + event.delta)
        break
      case 'output_audio_buffer.started':
        setSpeaker('recruiter')
        break
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared': // the candidate spoke over the recruiter
        setSpeaker(null)
        if (ending.current) hangUp() // the goodbye has been heard
        break
      case 'input_audio_buffer.speech_started':
        setSpeaker('candidate')
        break
      case 'input_audio_buffer.speech_stopped':
        setSpeaker(null)
        break
      case 'response.function_call_arguments.done':
        if (event.name === 'end_interview') {
          ending.current = true
          endTimer.current = setTimeout(hangUp, END_FALLBACK_MS)
        }
        break
    }
  }, [hangUp])

  const start = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setCaption('')
    setMuted(false) // the new mic track starts enabled
    ending.current = false
    try {
      if (!(await micAllowed())) throw new InterviewError('mic_denied')

      const connection = new RTCPeerConnection()
      pc.current = connection
      mic.current = await mediaDevices.getUserMedia({ audio: true, video: false })
      mic.current.getAudioTracks().forEach(track => connection.addTrack(track, mic.current!))

      const channel = connection.createDataChannel('oai-events')
      channel.addEventListener('message', e => onEvent(String(e.data)))
      connection.addEventListener('connectionstatechange', () => {
        // network lost mid-call: whatever was said is saved, evaluate it
        if (connection.connectionState === 'failed') hangUp()
      })

      const offer = await connection.createOffer({})
      await connection.setLocalDescription(offer)
      const call = await startVoiceInterview(offerId, offer.sdp)
      sessionId.current = call.sessionId
      await connection.setRemoteDescription({ type: 'answer', sdp: call.sdp })

      setStartedAt(Date.now())
      setStatus('live')
    } catch (e) {
      console.warn(e)
      closeCall()
      setError(e instanceof InterviewError ? e.code : 'server')
      setStatus('error')
    }
  }, [offerId, onEvent, hangUp, closeCall])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      mic.current?.getAudioTracks().forEach(t => { t.enabled = m })
      return !m
    })
  }, [])

  useEffect(() => closeCall, [closeCall]) // leaving the screen ends the call

  return {
    status, speaker, caption, muted, startedAt, report, error,
    // an error after the call started is about the report: retry the report, not a new interview
    callStarted: sessionId.current !== null,
    start, hangUp, toggleMute, retryReport: fetchReport,
  }
}
