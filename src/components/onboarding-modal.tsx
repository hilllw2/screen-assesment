"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Link as LinkIcon, 
  Users, 
  CheckCircle2,
  ArrowRight
} from "lucide-react"

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Screening Assessment Platform",
    description: "Let's get you started with creating and managing candidate assessments. This quick tour will show you the essential features.",
    icon: <Sparkles className="h-12 w-12 text-primary" />,
  },
  {
    title: "Create Your First Test",
    description: "Click the 'Create New Test' button to set up a screening or Upwork test. Choose the type that fits your needs and give it a descriptive title.",
    icon: <CheckCircle2 className="h-12 w-12 text-primary" />,
  },
  {
    title: "Generate & Share Test Links",
    description: "After creating a test, generate unique links to share with candidates. You can create multiple links per test and track each one separately.",
    icon: <LinkIcon className="h-12 w-12 text-primary" />,
  },
  {
    title: "Review Submissions",
    description: "View candidate submissions in the dashboard. Review their answers, watch recordings, and score their performance. Export passed candidates when ready.",
    icon: <Users className="h-12 w-12 text-primary" />,
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding) {
      setOpen(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setOpen(false)
  }

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setOpen(false)
    // Optionally navigate to create test page
    // router.push("/recruiter/tests/new")
  }

  const step = ONBOARDING_STEPS[currentStep]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">{step.icon}</div>
          <DialogTitle className="text-center text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-2 py-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-primary w-8"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleNext}>
            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
