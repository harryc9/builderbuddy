'use client'

import { CostRangeSlider } from '@/components/CostRangeSlider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { sbc } from '@/lib/supabase.client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Parent categories (12 categories)
const PARENT_CATEGORIES = [
  { slug: 'electrical', name: 'Electrical', color: '#F59E0B' },
  { slug: 'plumbing', name: 'Plumbing', color: '#3B82F6' },
  { slug: 'hvac-mechanical', name: 'HVAC & Mechanical', color: '#10B981' },
  { slug: 'interior-finishing', name: 'Interior Finishing', color: '#8B5CF6' },
  { slug: 'carpentry-framing', name: 'Carpentry & Framing', color: '#D97706' },
  { slug: 'masonry-concrete', name: 'Masonry & Concrete', color: '#6B7280' },
  { slug: 'roofing-exteriors', name: 'Roofing & Exteriors', color: '#DC2626' },
  {
    slug: 'insulation-envelope',
    name: 'Insulation & Envelope',
    color: '#06B6D4',
  },
  { slug: 'site-work', name: 'Site Work & Excavation', color: '#84CC16' },
  { slug: 'demolition-labour', name: 'Demolition & Labour', color: '#EF4444' },
  { slug: 'specialty-trades', name: 'Specialty Trades', color: '#F97316' },
  {
    slug: 'management-professional',
    name: 'Management & Professional',
    color: '#1F2937',
  },
]

const formSchema = z.object({
  categories: z.array(z.string()).default([]),
  dailyEmailEnabled: z.boolean().default(true),
  costRange: z.tuple([z.number(), z.number()]).default([1000, 5000000]),
})

type FormValues = z.infer<typeof formSchema>

type EmailsTabProps = {
  userId: string
  initialValues: {
    categories: string[]
    dailyEmailEnabled: boolean
    costRange: [number, number]
  }
  onSuccess: () => void
}

export function EmailsTab({
  userId,
  initialValues,
  onSuccess,
}: EmailsTabProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      // Update user profile
      const { error } = await sbc.from('users').upsert({
        id: userId,
        subscribed_categories: data.categories,
        daily_email_enabled: data.dailyEmailEnabled,
        cost_min: data.costRange[0],
        cost_max: data.costRange[1],
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Invalidate the user profile cache
      await queryClient.invalidateQueries({
        queryKey: ['user', userId],
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error updating email preferences:', error)
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
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade Categories</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between h-10 font-normal"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {field.value.length > 0
                            ? `${field.value.length} selected`
                            : 'Select categories'}
                        </span>
                        {field.value.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5">
                            {field.value.length}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-3 max-h-[300px] overflow-y-auto"
                    align="start"
                    style={{
                      width: 'var(--radix-popover-trigger-width)',
                    }}
                  >
                    <div className="space-y-2.5">
                      {PARENT_CATEGORIES.map((category) => (
                        <div
                          key={category.slug}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`category-${category.slug}`}
                            checked={field.value.includes(category.slug)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, category.slug])
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (s) => s !== category.slug,
                                  ),
                                )
                              }
                            }}
                          />
                          <label
                            htmlFor={`category-${category.slug}`}
                            className="text-xs leading-none cursor-pointer flex items-center gap-2"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: category.color,
                              }}
                            />
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormDescription>
                Select the trade categories you want to receive permit
                notifications for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dailyEmailEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Daily Email Digest</FormLabel>
                <FormDescription>
                  Receive daily email notifications with matching permits
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="costRange"
          render={({ field }) => (
            <FormItem>
              <CostRangeSlider value={field.value} onChange={field.onChange} />
              <FormDescription>
                Only receive notifications for permits within this cost range
              </FormDescription>
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
        </div>
      </form>
    </Form>
  )
}
