/**
 * Call controls — mute, end call, timer, and volume indicator.
 */
'use client'

import { Button } from '@/components/ui/button'
import { Mic, MicOff, PhoneOff } from 'lucide-react'

type CallControlsProps = {
  isMuted: boolean
  callDuration: number
  onToggleMute: () => void
  onEndCall: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CallControls({
  isMuted,
  callDuration,
  onToggleMute,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-mono text-gray-400">
          {formatDuration(callDuration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMute}
          className={`h-8 w-8 p-0 rounded-full ${
            isMuted
              ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {isMuted ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEndCall}
          className="h-8 w-8 p-0 rounded-full bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
        >
          <PhoneOff className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
