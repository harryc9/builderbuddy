/**
 * Action cards that animate in when tool calls fire during a demo call.
 * Shows lead captured and appointment booked with relevant details.
 */
'use client'

import type { ActionCard } from '@/hooks/use-vapi-demo'
import { CalendarCheck, Check, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ActionCardsProps = {
  cards: ActionCard[]
}

const cardConfig = {
  create_lead: {
    icon: UserPlus,
    label: 'Lead Captured',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
  book_appointment: {
    icon: CalendarCheck,
    label: 'Appointment Booked',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
} as const

export function ActionCards({ cards }: ActionCardsProps) {
  if (cards.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-0.5">
        Actions taken
      </p>
      <AnimatePresence mode="popLayout">
        {cards.map((card) => {
          const config = cardConfig[card.type] ?? cardConfig.create_lead
          const Icon = config.icon

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`rounded-xl border ${config.border} ${config.bg} p-3`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={config.color} />
                <span className="text-xs font-semibold text-gray-900 flex-1 min-w-0">
                  {config.label}
                </span>
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
              </div>
              <CardDetails type={card.type} data={card.data} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function s(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function CardDetails({
  type,
  data,
}: {
  type: ActionCard['type']
  data: Record<string, unknown>
}) {
  switch (type) {
    case 'create_lead': {
      const details = [s(data.full_name), s(data.service_type), s(data.phone)].filter(Boolean)
      if (details.length === 0) return null
      return (
        <p className="mt-1 pl-[26px] text-[11px] text-gray-400 truncate">
          {details.join(' · ')}
        </p>
      )
    }

    case 'book_appointment': {
      const time = [s(data.preferred_date), s(data.preferred_time)].filter(Boolean).join(' at ')
      const details = [time, s(data.service_type), s(data.address)].filter(Boolean)
      if (details.length === 0) return null
      return (
        <p className="mt-1 pl-[26px] text-[11px] text-gray-400 truncate">
          {details.join(' · ')}
        </p>
      )
    }

    default:
      return null
  }
}
