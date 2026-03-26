'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/context/auth-provider'
import { ArrowDown, Clock, DollarSign, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function AnimatedCounter({
  value,
  duration = 2000,
}: {
  value: string
  duration?: number
}) {
  // Parse value once and memoize
  const parsed = useMemo(() => {
    const match = value.match(/^(\$?)(\d+(?:,\d+)?)([KMB]?)(\+?)(.*)$/)
    if (!match) return null
    return {
      prefix: match[1] || '',
      numStr: match[2] || '0',
      suffix: match[3] || '',
      plus: match[4] || '',
      rest: match[5] || '',
      targetNum: Number.parseInt(match[2].replace(/,/g, ''), 10),
    }
  }, [value])

  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!parsed) return

    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth deceleration
      const easeOut = 1 - (1 - progress) ** 3
      const current = Math.floor(easeOut * parsed.targetNum)

      setCount(current)

      if (progress === 1) {
        clearInterval(timer)
      }
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [parsed, duration])

  if (!parsed) return <span>{value}</span>

  return (
    <span>
      {parsed.prefix}
      {count.toLocaleString()}
      {parsed.suffix}
      {parsed.plus}
      {parsed.rest}
    </span>
  )
}

function StatItem({
  icon: Icon,
  value,
  label,
  animate = false,
}: {
  icon: React.ElementType
  value: string
  label: string
  animate?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-blue-100 p-2 rounded-lg">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums">
          {animate ? <AnimatedCounter value={value} /> : value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

export function Landing() {
  const { user, isAuthenticated, signOut } = useAuth()
  const isEmailConfirmed = user?.email_confirmed_at
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section')
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      {/* Left Side - Marketing Content (Scrollable) */}
      <div className="w-full lg:flex-1 lg:overflow-y-auto relative">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/90 to-white z-10" />
          <Image
            src="/construction-workers.jpg"
            alt=""
            fill
            className="object-cover"
            style={{ filter: 'grayscale(0%) brightness()' }}
            priority
          />
        </div>

        {/* Content Layer - Scrollable */}
        <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 lg:px-16 py-8 lg:py-12 space-y-12 relative z-20">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Every GTA building permit <br />
              <span className="text-blue-600">searchable and delivered</span>
            </h1>
            <p className="text-base sm:text-lg font-medium">
              Search 300,000+ Toronto-area permits by trade, address, and cost.
              Get new and updated permits delivered every morning.
            </p>

            {!isAuthenticated && (
              <Button
                onClick={scrollToAuth}
                size="lg"
                className="lg:hidden gap-2"
              >
                Get Started
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isAuthenticated && isEmailConfirmed && (
            <div className="flex items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/app">See All Permits</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          )}

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatItem
              icon={Clock}
              value="255K+"
              label="permits tracked"
              animate
            />
            <StatItem
              icon={DollarSign}
              value="$285K"
              label="avg. project value"
              animate
            />
            <StatItem icon={Zap} value="5 AM" label="daily delivery" />
          </div>

          <div className="pt-6">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        Address
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        Categories
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        Est. Cost
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        Issued Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        131 West Deane Park Dr
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 items-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#F59E0B' }}
                            />
                            Elec
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#3B82F6' }}
                            />
                            Plumb
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#10B981' }}
                            />
                            HVAC
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            +2
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                        $900,000
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="default">Permit Issued</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        Nov 4, 2025
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        203 Glenforest Rd
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 items-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#8B5CF6' }}
                            />
                            Carp
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#EC4899' }}
                            />
                            Roofing
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#F97316' }}
                            />
                            Masonry
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            +1
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                        $900,000
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="default">Permit Issued</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        Nov 3, 2025
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        844 Don Mills Rd
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 items-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#F59E0B' }}
                            />
                            Elec
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#6B7280' }}
                            />
                            Interior
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#EF4444' }}
                            />
                            Site
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            +5
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                        $250,812
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="default">Permit Issued</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        Oct 31, 2025
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        1485 Yonge St
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 items-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#8B5CF6' }}
                            />
                            Carp
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#059669' }}
                            />
                            Struct
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#EF4444' }}
                            />
                            Site
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            +3
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                        $1,500,000
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Application Received
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        Nov 18, 2025
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-muted/50 border-t py-3 px-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Sign up to search 300,000+ permits
                </p>
              </div>
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="space-y-6">
            {/* Use Case Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sub Card - Primary ICP */}
              <Card className="bg-white/95 h-fit shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">For Subcontractors</CardTitle>
                  <div className="flex gap-1 flex-wrap pt-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#10B981' }}
                      />
                      HVAC
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#F59E0B' }}
                      />
                      Elec
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#3B82F6' }}
                      />
                      Plumb
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#EC4899' }}
                      />
                      Roofing
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#6366F1' }}
                      />
                      Concrete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>
                        <strong>Same-day alerts</strong> when permits are issued
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>
                        Filter by your trade, postal codes, and project size
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>
                        <strong>10-30 qualified leads per week</strong>{' '}
                        delivered daily at 5 AM
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Save 4-6 hours/week on manual permit searches</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* GC Card - Secondary */}
              <Card className="bg-white/95 h-fit shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    For General Contractors
                  </CardTitle>
                  <CardDescription>
                    Competitive intelligence & market research
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>
                        Get new leads on permits that have just opened
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Track competitor projects and strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>
                        Identify active developers for business development
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Market intelligence for strategic planning</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Footer */}
          <div className="pt-4 text-center lg:text-left">
            <p className="text-sm text-muted-foreground">
              Contact us at{' '}
              <a
                href="mailto:gary@416permits.com"
                target="_blank"
                rel="noopener"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                gary@416permits.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form (Fixed) */}
      {!isAuthenticated && (
        <div
          id="auth-section"
          className="w-full lg:w-[440px] lg:h-screen bg-white lg:border-l px-6 sm:px-8 lg:px-10 flex justify-center items-center lg:sticky lg:top-0"
        >
          <div className="w-full max-w-md py-8 lg:py-12">
            <AuthForm mode="inline" defaultTab="signup" />
          </div>
        </div>
      )}
    </div>
  )
}
