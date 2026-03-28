/**
 * React hook wrapping @vapi-ai/web for the interactive landing page demo.
 * Manages call lifecycle, transcript, action cards, and audio state.
 */
'use client'

import { buildTransientAssistant } from '@/lib/demo/build-assistant'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useRef, useState } from 'react'

export type DemoState = 'idle' | 'connecting' | 'active' | 'ended'

export type TranscriptEntry = {
  id: string
  role: 'agent' | 'user'
  text: string
  timestamp: number
  isFinal: boolean
}

export type ActionCard = {
  id: string
  type: 'create_lead' | 'book_appointment'
  status: 'success' | 'error'
  data: Record<string, unknown>
  timestamp: number
}

type ScrapedBusiness = {
  business_name: string
  business_name_pronunciation: string
  scraped_content: string
  url: string
}

export function useVapiDemo() {
  const vapiRef = useRef<InstanceType<typeof import('@vapi-ai/web').default> | null>(null)
  const [callState, setCallState] = useState<DemoState>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [actionCards, setActionCards] = useState<ActionCard[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const callStartTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopVapi = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop()
      vapiRef.current.removeAllListeners()
      vapiRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
      stopVapi()
    }
  }, [cleanup, stopVapi])

  const startCall = useCallback(async (business: ScrapedBusiness) => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      setError('Vapi is not configured. Please set NEXT_PUBLIC_VAPI_PUBLIC_KEY.')
      return
    }

    setCallState('connecting')
    setError(null)
    setTranscript([])
    setActionCards([])
    setCallDuration(0)

    try {
      stopVapi()

      const VapiSDK = (await import('@vapi-ai/web')).default
      const vapi = new VapiSDK(publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setCallState('active')
        callStartTimeRef.current = DateTime.now().toMillis()
        timerRef.current = setInterval(() => {
          setCallDuration(Math.floor((DateTime.now().toMillis() - callStartTimeRef.current) / 1000))
        }, 1000)
      })

      vapi.on('call-end', () => {
        setCallState('ended')
        cleanup()
      })

      vapi.on('volume-level', (volume: number) => {
        setVolumeLevel(volume)
      })

      vapi.on('error', (err: unknown) => {
        const errorMsg =
          (err as { errorMsg?: string })?.errorMsg ??
          (err as { error?: { msg?: string } })?.error?.msg ??
          ''

        if (errorMsg === 'Meeting has ended') return

        console.error('Vapi error:', err)
        setError('Call error occurred. Please try again.')
        setCallState('ended')
        cleanup()
      })

      vapi.on('message', (message: Record<string, unknown>) => {
        handleVapiMessage(message)
      })

      const assistant = buildTransientAssistant(business)
      await vapi.start(assistant as unknown as Parameters<typeof vapi.start>[0])
    } catch (err) {
      console.error('Failed to start call:', err)
      setError('Failed to start the demo call. Please check your microphone permissions.')
      setCallState('idle')
    }
  }, [cleanup, stopVapi])

  const handleVapiMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string

    if (type === 'transcript') {
      const role = message.role as string
      const text = message.transcript as string
      const transcriptType = message.transcriptType as string

      if (!text) return

      const entryRole = role === 'assistant' ? 'agent' : 'user'
      const isFinal = transcriptType === 'final'

      setTranscript((prev) => {
        const partialIdx = prev.findIndex(
          (e) => !e.isFinal && e.role === entryRole
        )

        if (!isFinal) {
          if (partialIdx !== -1) {
            const updated = [...prev]
            updated[partialIdx] = { ...updated[partialIdx], text }
            return updated
          }
          return [
            ...prev,
            {
              id: `t-${DateTime.now().toMillis()}-${Math.random().toString(36).slice(2, 6)}`,
              role: entryRole,
              text,
              timestamp: DateTime.now().toMillis(),
              isFinal: false,
            },
          ]
        }

        if (partialIdx !== -1) {
          const updated = [...prev]
          updated[partialIdx] = { ...updated[partialIdx], text, isFinal: true }
          return updated
        }
        return [
          ...prev,
          {
            id: `t-${DateTime.now().toMillis()}-${Math.random().toString(36).slice(2, 6)}`,
            role: entryRole,
            text,
            timestamp: DateTime.now().toMillis(),
            isFinal: true,
          },
        ]
      })
    }

    if (type === 'tool-calls') {
      const toolCalls = (message.toolCallList ?? message.toolCalls) as Array<{
        id: string
        function: { name: string; arguments: string }
      }> | undefined

      if (!toolCalls) return

      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments)
        } catch {
          args = {}
        }

        setActionCards((prev) => {
          const toolName = tc.function.name as ActionCard['type']
          const existingIdx = prev.findIndex((c) => c.type === toolName)
          if (existingIdx !== -1) {
            const updated = [...prev]
            updated[existingIdx] = { ...updated[existingIdx], data: args, timestamp: DateTime.now().toMillis() }
            return updated
          }
          return [
            ...prev,
            {
              id: tc.id,
              type: toolName,
              status: 'success',
              data: args,
              timestamp: DateTime.now().toMillis(),
            },
          ]
        })
      }
    }
  }, [])

  const endCall = useCallback(async () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted
      vapiRef.current.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  const resetDemo = useCallback(() => {
    cleanup()
    stopVapi()
    setCallState('idle')
    setTranscript([])
    setActionCards([])
    setError(null)
    setCallDuration(0)
    setVolumeLevel(0)
    setIsMuted(false)
  }, [cleanup, stopVapi])

  return {
    callState,
    transcript,
    actionCards,
    isMuted,
    volumeLevel,
    error,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    resetDemo,
  }
}
