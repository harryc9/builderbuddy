/**
 * Live transcript display — shows real-time conversation bubbles during demo calls.
 * Uses in-place updates for partials→finals to avoid layout jumps.
 */
'use client'

import type { TranscriptEntry } from '@/hooks/use-vapi-demo'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useEffect, useRef } from 'react'

type LiveTranscriptProps = {
  transcript: TranscriptEntry[]
  isAgentSpeaking?: boolean
}

export function LiveTranscript({ transcript, isAgentSpeaking }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [transcript])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-2 pr-1"
    >
      {transcript.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-gray-300">Waiting for conversation...</p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {transcript.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`flex items-start gap-2 ${entry.role === 'user' ? 'justify-end' : ''}`}
          >
            {entry.role === 'agent' && (
              <Bot size={14} className="text-primary mt-1.5 flex-shrink-0" />
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed transition-opacity duration-200 ${
                entry.role === 'agent'
                  ? 'bg-gray-50 text-gray-700'
                  : 'bg-gray-900 text-white'
              } ${!entry.isFinal ? 'opacity-50' : 'opacity-100'}`}
            >
              {entry.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isAgentSpeaking && (
        <div className="flex items-start gap-2">
          <Bot size={14} className="text-primary mt-1.5 flex-shrink-0" />
          <div className="bg-gray-50 rounded-2xl px-3.5 py-2.5">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              <div
                className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
