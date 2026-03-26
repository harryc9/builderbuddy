'use client'

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-provider'
import { useUserProfile } from '@/hooks/useUserProfile'
import { type AddressSuggestion, geoapifyService } from '@/lib/geoapify'
import { sbc } from '@/lib/supabase.client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

export default function OnboardingAddressPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const results = await geoapifyService.autocomplete(query)
      setSuggestions(results)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Address search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const debouncedSearch = useDebouncedCallback(searchAddresses, 300)

  // Pre-fill address from profile
  useEffect(() => {
    if (profile?.address && profile?.address_lat && profile?.address_lng) {
      setAddress(profile.address)
      setCoordinates({
        lat: profile.address_lat,
        lng: profile.address_lng,
      })
    }
  }, [profile])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.description)
    setCoordinates(suggestion.coordinates)
    setSuggestions([])
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0) {
          handleAddressSelect(suggestions[activeSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  const handleContinue = async () => {
    if (!address || !coordinates) {
      toast.error('Please select your service area')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await sbc
        .from('users')
        .update({
          address,
          address_lat: coordinates.lat,
          address_lng: coordinates.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (error) throw error

      router.push('/onboarding/categories')
    } catch (error: any) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <OnboardingLayout
      currentStep={1}
      centerContent
      actions={
        <Button
          onClick={handleContinue}
          disabled={!address || !coordinates || isSaving}
          size="lg"
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Address input */}
        <div className="space-y-3">
          <Label htmlFor="address">Service Area Address</Label>
          <div className="relative">
            <Input
              id="address"
              placeholder="Enter your address or postal code"
              value={address}
              autoComplete="off"
              onChange={(e) => {
                setAddress(e.target.value)
                debouncedSearch(e.target.value)
                if (!e.target.value) {
                  setCoordinates(null)
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150)
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 bg-background border rounded-md shadow-lg w-full mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    className={cn(
                      'w-full text-left p-3 text-sm hover:bg-muted transition-colors',
                      index === activeSuggestionIndex && 'bg-muted',
                    )}
                    onClick={() => handleAddressSelect(suggestion)}
                  >
                    {suggestion.description}
                  </button>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Map display when address is selected */}
        {coordinates && (
          <div className="rounded-lg overflow-hidden relative">
            <iframe
              width="100%"
              height="300"
              frameBorder="0"
              style={{ border: 0, pointerEvents: 'none' }}
              src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title="Location map"
            />
            <div className="absolute inset-0 pointer-events-none" />
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}
