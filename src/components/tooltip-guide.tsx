"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TooltipGuideProps {
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
  onClose?: () => void
  onNext?: () => void
  step?: number
  totalSteps?: number
}

export function TooltipGuide({
  title,
  description,
  position = "bottom",
  onClose,
  onNext,
  step,
  totalSteps,
}: TooltipGuideProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-popover",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-popover",
    left: "left-full top-1/2 -translate-y-1/2 border-l-popover",
    right: "right-full top-1/2 -translate-y-1/2 border-r-popover",
  }

  return (
    <div
      className={cn(
        "absolute z-50 w-80 rounded-lg border bg-popover p-4 shadow-lg animate-fade-in",
        positionClasses[position]
      )}
    >
      <div
        className={cn(
          "absolute h-0 w-0 border-8 border-transparent",
          arrowClasses[position]
        )}
      />
      
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      
      <div className="flex items-center justify-between">
        {step && totalSteps && (
          <span className="text-xs text-muted-foreground">
            {step} of {totalSteps}
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
          )}
          {onNext && (
            <Button size="sm" onClick={onNext}>
              {step === totalSteps ? "Done" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for managing tooltip guide tours
export function useTooltipGuide(steps: Omit<TooltipGuideProps, "step" | "totalSteps">[]) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const start = () => {
    setCurrentStep(0)
    setIsActive(true)
  }

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsActive(false)
    }
  }

  const skip = () => {
    setIsActive(false)
  }

  return {
    currentStep,
    isActive,
    start,
    next,
    skip,
    currentGuide: isActive ? steps[currentStep] : null,
    totalSteps: steps.length,
  }
}
