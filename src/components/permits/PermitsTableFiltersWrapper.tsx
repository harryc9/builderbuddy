'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Filter } from 'lucide-react'
import { useState } from 'react'
import { PermitsTableFilters } from './PermitsTableFilters'

export function PermitsTableFiltersWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="default">
          <Filter size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 flex flex-col overflow-hidden pt-6"
      >
        <div className="flex-1 overflow-y-auto">
          <PermitsTableFilters />
        </div>

        {/* Help Contact */}
        <div className="border-t pt-3 pb-4 text-center text-xs text-muted-foreground">
          Need help?{' '}
          <a
            href="mailto:gary@416permits.com"
            className="text-primary hover:underline"
          >
            gary@416permits.com
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
