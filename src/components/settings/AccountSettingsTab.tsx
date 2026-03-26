'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type AddressSuggestion, geoapifyService } from '@/lib/geoapify'
import { sbc } from '@/lib/supabase.client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDebouncedCallback } from 'use-debounce'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
})

type FormValues = z.infer<typeof formSchema>

type AccountSettingsTabProps = {
  userId: string
  initialValues: {
    email: string
    address: string
    coordinates: { lat: number; lng: number }
  }
  onSuccess: () => void
  onSignOut: () => void
}

export function AccountSettingsTab({
  userId,
  initialValues,
  onSuccess,
  onSignOut,
}: AccountSettingsTabProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const results = await geoapifyService.autocomplete(query)
      setSuggestions(results)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    }
  }, [])

  const debouncedSearch = useDebouncedCallback(searchAddress, 300)

  const handleAddressSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      form.setValue('address', suggestion.description)
      form.setValue('coordinates', {
        lat: suggestion.coordinates.lat,
        lng: suggestion.coordinates.lng,
      })
      setShowSuggestions(false)
      setSuggestions([])
    },
    [form],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault()
        handleAddressSelect(suggestions[activeSuggestionIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
    },
    [showSuggestions, suggestions, activeSuggestionIndex, handleAddressSelect],
  )

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      // Update user profile
      const { error } = await sbc.from('users').upsert({
        id: userId,
        email: data.email,
        address: data.address,
        address_lat: data.coordinates.lat,
        address_lng: data.coordinates.lng,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Invalidate the user profile cache
      await queryClient.invalidateQueries({
        queryKey: ['user', userId],
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error updating account:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Area Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="Enter your service area address"
                    autoComplete="off"
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      debouncedSearch(e.target.value)
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
                    <div className="absolute z-[60] bg-white border rounded shadow-lg w-full mt-1 text-sm max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          className={`w-full text-left cursor-pointer p-2 hover:bg-gray-100 ${
                            index === activeSuggestionIndex ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => {
                            field.onChange(suggestion.description)
                            handleAddressSelect(suggestion)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              field.onChange(suggestion.description)
                              handleAddressSelect(suggestion)
                            }
                          }}
                        >
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 pt-4">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        </div>
      </form>
    </Form>
  )
}
