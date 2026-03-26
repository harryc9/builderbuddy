'use client'

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { useUserProfile } from '@/hooks/useUserProfile'
import { sbc } from '@/lib/supabase.client'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type ParentCategory = {
  slug: string
  name: string
  description: string | null
  icon_name: string | null
  color_hex: string | null
}

export default function OnboardingCategoriesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const router = useRouter()
  const [categories, setCategories] = useState<ParentCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await sbc
          .from('parent_categories')
          .select('slug, name, description, icon_name, color_hex')
          .eq('is_active', true)
          .order('display_order')

        if (error) throw error

        setCategories(data || [])
      } catch (error) {
        console.error('Error loading categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (isAuthenticated) {
      loadCategories()
    }
  }, [isAuthenticated])

  // Load user's saved categories
  useEffect(() => {
    if (profile?.subscribed_categories) {
      setSelectedCategories(profile.subscribed_categories)
    }
  }, [profile])

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await sbc
        .from('users')
        .update({
          subscribed_categories: selectedCategories,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (error) throw error

      router.push('/onboarding/payment')
    } catch (error: any) {
      console.error('Error saving categories:', error)
      toast.error('Failed to save categories')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/address')
  }

  if (authLoading || profileLoading || isLoadingCategories) {
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
      currentStep={2}
      actions={
        <div className="flex gap-3">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedCategories.length === 0 || isSaving}
            size="lg"
            className="flex-1"
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
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            What interests you?
          </h2>
          <p className="text-muted-foreground text-sm">
            Select one or more categories to track. You can always change these
            later.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.slug)
            return (
              <button
                key={category.slug}
                onClick={() => toggleCategory(category.slug)}
                type="button"
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all relative',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0',
                      isSelected ? 'bg-primary/10' : 'bg-muted',
                    )}
                  >
                    <span>{category.icon_name || '📋'}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-medium text-foreground text-sm leading-tight">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected count */}
        {selectedCategories.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {selectedCategories.length}{' '}
            {selectedCategories.length === 1 ? 'category' : 'categories'}{' '}
            selected
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}
