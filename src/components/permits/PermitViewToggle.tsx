'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { parseAsStringLiteral, useQueryState } from 'nuqs'

const viewOptions = ['all', 'saved', 'ignored'] as const

type Props = {
  savedCount?: number
  ignoredCount?: number
}

export function PermitViewToggle({ savedCount, ignoredCount }: Props) {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(viewOptions).withDefault('all'),
  )

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === 'all' ? 'default' : 'outline'}
        size="sm"
        className="h-9"
        onClick={() => setView('all')}
      >
        All
      </Button>

      <Button
        variant={view === 'saved' ? 'default' : 'outline'}
        size="sm"
        className="h-9"
        onClick={() => setView('saved')}
      >
        Saved
        {savedCount !== undefined && savedCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5">
            {savedCount}
          </Badge>
        )}
      </Button>

      <Button
        variant={view === 'ignored' ? 'default' : 'outline'}
        size="sm"
        className="h-9"
        onClick={() => setView('ignored')}
      >
        Ignored
        {ignoredCount !== undefined && ignoredCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5">
            {ignoredCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
