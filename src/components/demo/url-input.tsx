/**
 * URL input for the demo panel — visitor pastes their business website URL.
 */
'use client'

import { Button } from '@/components/ui/button'
import { Globe, Loader2 } from 'lucide-react'
import { useState } from 'react'

type UrlInputProps = {
  onSubmit: (url: string) => void
  isLoading: boolean
  error: string | null
}

export function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    let normalized = trimmed
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`
    }
    onSubmit(normalized)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-gray-400 transition-colors">
        <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="yourcompany.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!url.trim() || isLoading}
          className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-8 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Try Demo'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
      <p className="text-[11px] text-gray-300 px-1">
        We&apos;ll scan your site and build a custom agent in seconds
      </p>
    </form>
  )
}
