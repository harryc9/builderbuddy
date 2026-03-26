'use client'

import { Check } from 'lucide-react'

type OnboardingLayoutProps = {
  children: React.ReactNode
  currentStep: 1 | 2 | 3
  title?: string
  description?: string
  actions?: React.ReactNode
  centerContent?: boolean
}

export function OnboardingLayout({
  children,
  currentStep,
  title,
  description,
  actions,
  centerContent = false,
}: OnboardingLayoutProps) {
  const steps = [
    { number: 1, label: 'Service Area' },
    { number: 2, label: 'Categories' },
    { number: 3, label: 'Payment' },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  {/* Circle indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                      step.number < currentStep
                        ? 'bg-primary text-primary-foreground border-primary'
                        : step.number === currentStep
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {/* Label - hidden on mobile */}
                  <span
                    className={`text-xs mt-1 hidden sm:block ${
                      step.number <= currentStep
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 h-0.5 mx-2 transition-colors ${
                      step.number < currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 px-4 py-6 sm:py-8 overflow-y-auto ${
          centerContent ? 'flex items-center' : ''
        }`}
      >
        <div className="max-w-2xl mx-auto pb-20 sm:pb-0 w-full">
          {(title || description) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-muted-foreground text-base sm:text-lg">
                  {description}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Actions - Fixed at bottom on mobile */}
      {actions && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t sm:relative sm:border-0 sm:p-0 sm:pb-6">
          <div className="max-w-2xl mx-auto">{actions}</div>
        </div>
      )}

      {/* Helper text - only show if no actions */}
      {!actions && (
        <div className="py-4 px-4">
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of 3
          </p>
        </div>
      )}
    </div>
  )
}
