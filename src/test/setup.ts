/**
 * Vitest global setup. Loads env files so tests can access
 * OPENAI_API_KEY and other secrets needed for LLM-based evals.
 */
import { config } from 'dotenv'

config({ path: '.env' })
config({ path: '.env.local', override: true })
