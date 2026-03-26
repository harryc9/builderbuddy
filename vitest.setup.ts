import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Set test environment variables
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

  // Suppress console logs during tests
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }
})

// Clean up after tests
afterEach(() => {
  // Reset mocks
})

afterAll(() => {
  // Global cleanup
  vi.unstubAllEnvs()
})
