/**
 * Best-effort in-memory IP rate limiter for public API routes.
 * Resets on serverless cold starts — for production, replace with Redis or edge-based limiter.
 */

import { DateTime } from 'luxon'

type RateLimitEntry = { count: number; resetAt: number }

type RateLimiterOptions = {
  maxRequests: number
  windowMs: number
  pruneIntervalMs?: number
}

export function createRateLimiter({
  maxRequests,
  windowMs,
  pruneIntervalMs = 5 * 60 * 1000,
}: RateLimiterOptions) {
  const map = new Map<string, RateLimitEntry>()
  let lastPruneAt = 0

  function prune() {
    const now = DateTime.now().toMillis()
    if (now - lastPruneAt < pruneIntervalMs) return
    lastPruneAt = now
    for (const [key, entry] of map) {
      if (now > entry.resetAt) map.delete(key)
    }
  }

  return function isRateLimited(ip: string): boolean {
    prune()
    const now = DateTime.now().toMillis()
    const entry = map.get(ip)

    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs })
      return false
    }

    entry.count++
    return entry.count > maxRequests
  }
}
