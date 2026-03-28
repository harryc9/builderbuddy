/**
 * Demo scrape endpoint — accepts a business URL, scrapes it via Firecrawl,
 * and returns structured business info for the Vapi demo assistant.
 */
import { createRateLimiter } from '@/lib/rate-limit'
import { openai } from '@ai-sdk/openai'
import Firecrawl from '@mendable/firecrawl-js'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

const FIRECRAWL_TIMEOUT_MS = 15_000

async function generatePronunciation(name: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-5.2-mini'),
      maxOutputTokens: 30,
      temperature: 0,
      system:
        'Given a company name, return ONLY the phonetic pronunciation that a text-to-speech system would read correctly. If the name is already pronounceable as-is, return it unchanged. No quotes, no explanation.',
      prompt: name,
    })
    return text.trim() || name
  } catch {
    return name
  }
}

const isRateLimited = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
})

function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname.endsWith('.local')) return true

  // IPv6 loopback — raw or bracketed
  const bare = hostname.replace(/^\[|\]$/g, '')
  if (bare === '::1' || bare === '0:0:0:0:0:0:0:1') return true

  // IPv4 private/reserved ranges
  if (hostname.startsWith('127.') || hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true
  if (hostname.startsWith('169.254.')) return true
  if (hostname.startsWith('172.')) {
    const second = parseInt(hostname.split('.')[1], 10)
    if (second >= 16 && second <= 31) return true
  }

  return false
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    return !isPrivateHostname(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const url = body?.url

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: 'Please enter a valid business website URL' },
      { status: 400 }
    )
  }

  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Scraping service not configured' },
      { status: 500 }
    )
  }

  try {
    const firecrawl = new Firecrawl({
      apiKey,
      maxRetries: 2,
      timeoutMs: FIRECRAWL_TIMEOUT_MS,
    })

    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    })

    const markdown = result.markdown ?? ''
    const metadata = result.metadata as Record<string, unknown> | undefined
    const businessName =
      (metadata?.ogSiteName as string) ??
      (metadata?.title as string) ??
      new URL(url).hostname.replace('www.', '')

    const truncatedContent = markdown.slice(0, 6000)
    const pronunciation = await generatePronunciation(businessName)

    return NextResponse.json({
      business_name: businessName,
      business_name_pronunciation: pronunciation,
      url,
      scraped_content: truncatedContent,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
    })
  } catch (err) {
    console.error('Scrape failed:', err)
    return NextResponse.json(
      { error: 'Failed to scrape website. Please try a different URL.' },
      { status: 502 }
    )
  }
}
