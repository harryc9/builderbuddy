/**
 * Public API route for waitlist signups.
 * No authentication required — collects email + optional notes.
 * IP-based rate limiting to prevent spam (in-memory, resets on cold start).
 */
import { createRateLimiter } from '@/lib/rate-limit'
import { sb } from '@lib/supabase'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email('Invalid email').transform((e) => e.toLowerCase().trim()),
  notes: z.string().max(2000).optional(),
})

const isRateLimited = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
})

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = waitlistSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { email, notes } = parsed.data

  const { error } = await sb
    .from('waitlist')
    .insert({ email, notes: notes || null })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ duplicate: true })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
