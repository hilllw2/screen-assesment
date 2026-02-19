// Phase 9 UI/UX Components - Usage Guide
// This file demonstrates all the new components created for Phase 9

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  NoTestsCreated, 
  NoSubmissions, 
  NoPassedCandidates 
} from "@/components/empty-states"
import { 
  TableSkeleton, 
  CardSkeleton, 
  KanbanSkeleton, 
  DashboardSkeleton 
} from "@/components/ui/loading-skeletons"
import { OnboardingModal } from "@/components/onboarding-modal"
import { FileText, Info } from "lucide-react"

/**
 * DESIGN SYSTEM USAGE
 * 
 * 1. Color Palette
 * - Primary: Brand blue (--primary)
 * - Secondary: Light gray (--secondary)
 * - Success: Green (--success)
 * - Warning: Orange (--warning)
 * - Error/Destructive: Red (--error)
 * - Info: Blue (--info)
 * 
 * Usage: className="bg-primary text-primary-foreground"
 */

/**
 * 2. Typography Scale
 * 
 * <h1>Heading 1</h1>  // text-4xl font-bold (auto-styled)
 * <h2>Heading 2</h2>  // text-3xl font-semibold
 * <h3>Heading 3</h3>  // text-2xl font-semibold
 * <h4>Heading 4</h4>  // text-xl font-semibold
 * <h5>Heading 5</h5>  // text-lg font-semibold
 * <h6>Heading 6</h6>  // text-base font-semibold
 */

/**
 * 3. Spacing System
 * Use Tailwind spacing: p-4 (16px), m-6 (24px), gap-8 (32px)
 * Custom: spacing-18 (4.5rem), spacing-88 (22rem), spacing-128 (32rem)
 */

/**
 * 4. Button Variants
 */
export function ButtonExamples() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="destructive">Danger Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="link">Link Button</Button>
    </div>
  )
}

/**
 * 5. Loading States
 */
export function LoadingExamples() {
  return (
    <div className="space-y-6">
      {/* Spinners */}
      <div className="flex gap-4 items-center">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <Spinner size="xl" />
      </div>

      {/* Progress Bar */}
      <Progress value={60} showValue />

      {/* Skeleton Loaders */}
      <TableSkeleton rows={3} />
      <CardSkeleton />
    </div>
  )
}

/**
 * 6. Empty States
 */
export function EmptyStateExamples() {
  return (
    <div className="space-y-6">
      <NoTestsCreated onCreateTest={() => console.log("Create test")} />
      <NoSubmissions />
      <NoPassedCandidates />
      
      {/* Custom Empty State */}
      <EmptyState
        icon={FileText}
        title="Custom Empty State"
        description="This is a reusable empty state component"
        action={{
          label: "Take Action",
          onClick: () => console.log("Action clicked"),
        }}
      />
    </div>
  )
}

/**
 * 7. Toast Notifications
 */
export function ToastExamples() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button 
        onClick={() => toast({
          title: "Success!",
          description: "Your changes have been saved.",
          variant: "success"
        })}
      >
        Success Toast
      </Button>
      
      <Button 
        onClick={() => toast({
          title: "Warning",
          description: "Please review your input.",
          variant: "warning"
        })}
      >
        Warning Toast
      </Button>
      
      <Button 
        onClick={() => toast({
          title: "Error",
          description: "Something went wrong.",
          variant: "destructive"
        })}
      >
        Error Toast
      </Button>
      
      <Button 
        onClick={() => toast({
          title: "Information",
          description: "This is an informational message.",
          variant: "info"
        })}
      >
        Info Toast
      </Button>
    </div>
  )
}

/**
 * 8. Tooltips
 */
export function TooltipExamples() {
  return (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">
            <Info className="h-4 w-4 mr-2" />
            Hover for tooltip
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a helpful tooltip!</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

/**
 * 9. Semantic Color Badges
 */
export function BadgeExamples() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge className="bg-success text-success-foreground">Success</Badge>
      <Badge className="bg-warning text-warning-foreground">Warning</Badge>
      <Badge className="bg-error text-error-foreground">Error</Badge>
      <Badge className="bg-info text-info-foreground">Info</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="secondary">Secondary</Badge>
    </div>
  )
}

/**
 * 10. Animations
 * 
 * Available animation classes:
 * - animate-fade-in
 * - animate-slide-in-from-top
 * - animate-slide-in-from-bottom
 * - animate-slide-in-from-left
 * - animate-slide-in-from-right
 * 
 * Apply to any element:
 * <div className="animate-fade-in">Content</div>
 */

/**
 * 11. Responsive Design Utilities
 * 
 * Use Tailwind responsive prefixes:
 * - sm: (640px+)
 * - md: (768px+)
 * - lg: (1024px+)
 * - xl: (1280px+)
 * - 2xl: (1400px+)
 * 
 * Example: className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
 */

/**
 * 12. Accessibility Features
 * 
 * - Skip to Content link (already in layout)
 * - Focus rings: className="focus-ring"
 * - ARIA labels: aria-label="Description"
 * - Screen reader only: className="sr-only"
 * - Keyboard navigation hooks available in use-accessibility.tsx
 */

/**
 * COMPLETE EXAMPLE: Dashboard Card with all features
 */
export function DashboardCardExample() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Total Submissions</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              All candidate submissions across your tests
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">142</span>
            <Badge className="bg-success text-success-foreground">
              +12% from last month
            </Badge>
          </div>
          <Progress value={75} showValue />
        </div>
      </CardContent>
    </Card>
  )
}
