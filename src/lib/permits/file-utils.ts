import * as fs from 'node:fs'
import * as path from 'node:path'
import type { TorontoPermitRaw } from './toronto-api'

export function saveToFile(data: TorontoPermitRaw[], filename: string): string {
  const filePath = path.join(process.cwd(), 'data', filename)

  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  return filePath
}
