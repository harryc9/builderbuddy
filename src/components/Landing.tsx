'use client'

import { DemoPanel } from '@/components/demo/demo-panel'
import { Logo } from '@/components/icons/logo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRight,
  Check,
} from 'lucide-react'
import { DateTime } from 'luxon'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

function WaitlistDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notes: notes || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        return
      }

      if (data.duplicate) {
        toast("You're already on the list!")
      } else {
        toast.success("You're on the list!")
      }

      setEmail('')
      setNotes('')
      onOpenChange(false)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#fafafa] font-sans">
        <DialogHeader>
          <DialogTitle className="font-semibold text-xl text-gray-900">
            Join the waitlist
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Be the first to know when Grout launches.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="waitlist-email" className="text-gray-600">
              Email
            </Label>
            <Input
              id="waitlist-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waitlist-notes" className="text-gray-600">
              What would you want most from a product like this?{' '}
              <span className="text-gray-300 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="waitlist-notes"
              placeholder="e.g. integration with my CRM, Spanish-speaking agent, appointment scheduling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg resize-none"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join waitlist'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PricingCard({ onJoinWaitlist }: { onJoinWaitlist: () => void }) {
  const rates = [
    { label: 'Call minutes', rate: '$0.25/min' },
    { label: 'Local phone number', rate: '$5/mo' },
    { label: 'SMS notifications', rate: '$0.02/msg' },
  ]

  const features = [
    '5 free minutes to start',
    'Real Twilio-powered phone number',
    'Quote collection & SMS alerts',
    'Call transcripts & dashboard',
    'No contracts — cancel anytime',
  ]

  return (
    <Card className="border-gray-900 border-2 max-w-md mx-auto w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-base font-medium text-gray-500">Pay as you go</CardTitle>
        <div className="pt-2">
          <span className="font-serif text-5xl text-gray-900">$0</span>
          <span className="text-gray-400 text-sm ml-1">to start</span>
        </div>
        <p className="text-sm text-gray-400 pt-1">
          5 free minutes included &middot; then pay only for what you use
        </p>
      </CardHeader>
      <CardContent>
        <Separator className="mb-5" />
        <div className="space-y-2.5 mb-6">
          {rates.map(({ label, rate }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="text-gray-900 font-medium">{rate}</span>
            </div>
          ))}
        </div>
        <Separator className="mb-5" />
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check size={16} className="text-gray-300 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={onJoinWaitlist}
          className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          Join waitlist
        </Button>
        <p className="text-xs text-center text-gray-400 mt-3">
          No credit card required
        </p>
      </CardContent>
    </Card>
  )
}

export function Landing() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      {/* Nav */}
      <nav className="bg-[#fafafa]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-auto text-primary" />
            <span className="font-semibold text-lg text-gray-900 tracking-tight">
              Grout
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#pricing"
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Pricing
            </a>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5"
              onClick={() => setWaitlistOpen(true)}
            >
              Join waitlist
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 lg:pt-40 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <h1 className="font-serif font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-gray-900">
                  Never miss
                  <br />
                  a call again
                </h1>
                <p className="text-xl text-gray-400 max-w-md leading-relaxed">
                  AI phone agent on a real Twilio number that answers
                  like your office admin. Collects quotes, books
                  appointments, and notifies you instantly&mdash;24/7.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-base rounded-lg px-8 gap-2"
                  onClick={() => setWaitlistOpen(true)}
                >
                  Join waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-gray-300">
                Get a real phone number in minutes &middot; Powered by
                Twilio &middot; Cancel anytime
              </p>
            </div>

            <div className="hidden lg:block">
              <DemoPanel />
            </div>
          </div>

          <div id="demo" className="mt-16 lg:hidden">
            <DemoPanel />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-14">
          <div className="text-center space-y-4">
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-gray-900">
              Simple pricing
            </h2>
            <p className="text-gray-400 text-lg">
              Free to start. Only pay for minutes you use.
            </p>
          </div>

          <PricingCard onJoinWaitlist={() => setWaitlistOpen(true)} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-4 w-auto text-gray-400" />
            <span className="font-medium text-sm text-gray-400">Grout</span>
          </div>
          <p className="text-sm text-gray-300">
            &copy; {DateTime.now().year} Grout
          </p>
        </div>
      </footer>

      <WaitlistDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </div>
  )
}
