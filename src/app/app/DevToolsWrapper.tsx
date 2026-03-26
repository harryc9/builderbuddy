'use client'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useQueryState } from 'nuqs'

export function DevToolsWrapper() {
  const [showDevtools] = useQueryState('devtools')

  if (showDevtools === 'true') {
    return <ReactQueryDevtools initialIsOpen={false} />
  }

  return null
}
