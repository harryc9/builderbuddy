/**
 * Main demo panel — orchestrates the URL scrape → Vapi call → live UI flow.
 * Renders different states: idle (URL input), scraping, ready, calling, ended.
 */
'use client'

import { ActionCards } from '@/components/demo/action-cards'
import { CallControls } from '@/components/demo/call-controls'
import { LiveTranscript } from '@/components/demo/live-transcript'
import { UrlInput } from '@/components/demo/url-input'
import { Button } from '@/components/ui/button'
import { useVapiDemo } from '@/hooks/use-vapi-demo'
import {
  ArrowRight,
  Check,
  Loader2,
  Phone,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useState } from 'react'

type ScrapedBusiness = {
  business_name: string
  business_name_pronunciation: string
  scraped_content: string
  url: string
  favicon: string
}

type PanelState = 'idle' | 'scraping' | 'ready' | 'calling' | 'ended'

export function DemoPanel() {
  const [panelState, setPanelState] = useState<PanelState>('idle')
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [business, setBusiness] = useState<ScrapedBusiness | null>(null)

  const {
    callState,
    transcript,
    actionCards,
    isMuted,
    callDuration,
    error: callError,
    startCall,
    endCall,
    toggleMute,
    resetDemo,
  } = useVapiDemo()

  const derivedState: PanelState =
    callState === 'connecting' || callState === 'active'
      ? 'calling'
      : callState === 'ended'
        ? 'ended'
        : panelState

  const handleScrape = useCallback(async (url: string) => {
    setPanelState('scraping')
    setScrapeError(null)

    try {
      const res = await fetch('/api/demo/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScrapeError(data.error ?? 'Failed to scrape website')
        setPanelState('idle')
        return
      }

      setBusiness(data)
      setPanelState('ready')
    } catch {
      setScrapeError('Network error. Please try again.')
      setPanelState('idle')
    }
  }, [])

  const handleStartCall = useCallback(() => {
    if (!business) return
    startCall({
      business_name: business.business_name,
      business_name_pronunciation: business.business_name_pronunciation,
      scraped_content: business.scraped_content,
      url: business.url,
    })
  }, [business, startCall])

  const handleReset = useCallback(() => {
    resetDemo()
    setBusiness(null)
    setPanelState('idle')
    setScrapeError(null)
  }, [resetDemo])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {derivedState === 'calling' && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            {derivedState === 'idle' && 'Try it live'}
            {derivedState === 'scraping' && 'Scanning website...'}
            {derivedState === 'ready' && 'Ready to demo'}
            {derivedState === 'calling' && 'Live demo call'}
            {derivedState === 'ended' && 'Demo complete'}
          </span>
        </div>
        {(derivedState === 'ready' || derivedState === 'ended') && (
          <button
            onClick={handleReset}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Idle — URL input */}
        {derivedState === 'idle' && (
          <div className="space-y-4">
            <div className="text-center space-y-2 py-4">
              <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">
                Paste your business website to try a personalized AI agent demo
              </p>
            </div>
            <UrlInput
              onSubmit={handleScrape}
              isLoading={false}
              error={scrapeError}
            />
          </div>
        )}

        {/* Scraping — loading state */}
        {derivedState === 'scraping' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-sm text-gray-400">
              Scanning your website...
            </p>
          </div>
        )}

        {/* Ready — business card + start button */}
        {derivedState === 'ready' && business && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.favicon}
                alt=""
                className="h-8 w-8 rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {business.business_name}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {business.url}
                </p>
              </div>
              <Check size={16} className="text-emerald-500 flex-shrink-0" />
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-gray-400">
                Your AI agent is ready. Click below and speak as if you&apos;re a customer calling.
              </p>
              <Button
                size="lg"
                onClick={handleStartCall}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 gap-2"
              >
                <Phone className="h-4 w-4" />
                Start Demo Call
              </Button>
              <p className="text-[11px] text-gray-300">
                Requires microphone access &middot; 3 min max
              </p>
            </div>
          </div>
        )}

        {/* Calling — transcript + action cards */}
        {derivedState === 'calling' && (
          <div className="space-y-3">
            {callError && (
              <p className="text-xs text-red-500 text-center">{callError}</p>
            )}

            <div className="h-[260px] flex flex-col">
              <LiveTranscript
                transcript={transcript}
                isAgentSpeaking={callState === 'connecting'}
              />
            </div>

            <ActionCards cards={actionCards} />

            <CallControls
              isMuted={isMuted}
              callDuration={callDuration}
              onToggleMute={toggleMute}
              onEndCall={endCall}
            />
          </div>
        )}

        {/* Ended — summary */}
        {derivedState === 'ended' && (
          <div className="space-y-5 py-2">
            {callError && (
              <p className="text-xs text-red-500 text-center">{callError}</p>
            )}

            <DemoSummary
              duration={callDuration}
              actionCount={actionCards.length}
              actionCards={actionCards}
            />

            <ActionCards cards={actionCards} />

            <div className="text-center space-y-3 pt-2">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 gap-2"
                onClick={() =>
                  document
                    .getElementById('pricing')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Get This For Your Business
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={handleReset}
                className="block mx-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Try another website
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DemoSummary({
  duration,
  actionCount,
  actionCards,
}: {
  duration: number
  actionCount: number
  actionCards: { type: string }[]
}) {
  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  const leads = actionCards.filter((c) => c.type === 'create_lead').length
  const appointments = actionCards.filter((c) => c.type === 'book_appointment').length

  const parts: string[] = []
  if (leads > 0) parts.push(`${leads} lead${leads > 1 ? 's' : ''} captured`)
  if (appointments > 0) parts.push(`${appointments} appointment${appointments > 1 ? 's' : ''} booked`)

  return (
    <div className="text-center space-y-1">
      <p className="text-sm font-medium text-gray-900">
        Demo complete
      </p>
      <p className="text-xs text-gray-400">
        In {durationStr}, Grout{' '}
        {actionCount > 0
          ? parts.join(', ')
          : 'handled the conversation'}
        .
      </p>
    </div>
  )
}
