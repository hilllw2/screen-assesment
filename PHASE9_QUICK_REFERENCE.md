# Phase 9 Quick Reference Card

## 🎨 Colors

```tsx
// Semantic Badges
<Badge className="bg-success text-success-foreground">Passed</Badge>
<Badge className="bg-error text-error-foreground">Failed</Badge>
<Badge className="bg-warning text-warning-foreground">Pending</Badge>
<Badge className="bg-info text-info-foreground">In Progress</Badge>
```

## 🔄 Loading

```tsx
// Spinners
<Spinner size="sm|md|lg|xl" />

// Progress
<Progress value={60} showValue />

// Skeletons
<TableSkeleton rows={5} />
<CardSkeleton />
<DashboardSkeleton />
<KanbanSkeleton />
```

## 📭 Empty States

```tsx
<NoTestsCreated onCreateTest={() => {}} />
<NoSubmissions />
<NoPassedCandidates />
<NoTestLinks onCreateLink={() => {}} />
```

## 🔔 Toasts

```tsx
import { toast } from "@/hooks/use-toast"

toast({ title: "Success!", variant: "success" })
toast({ title: "Warning", variant: "warning" })
toast({ title: "Error", variant: "destructive" })
toast({ title: "Info", variant: "info" })
```

## 💬 Tooltips

```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Info here</TooltipContent>
</Tooltip>
```

## 🎭 Animations

```tsx
className="animate-fade-in"
className="animate-slide-in-from-top"
className="animate-slide-in-from-bottom"
className="animate-slide-in-from-left"
className="animate-slide-in-from-right"
```

## 📱 Responsive

```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
className="text-2xl md:text-4xl"
className="hidden md:block"  // Desktop only
className="block md:hidden"  // Mobile only
```

## ♿ Accessibility

```tsx
// Focus ring
className="focus-ring"

// Screen reader only
className="sr-only"

// ARIA
aria-label="Close"
role="status"
aria-live="polite"
```

## 🎯 Common Patterns

```tsx
// Loading → Empty → Content
{isLoading ? <TableSkeleton /> : data.length === 0 ? <NoData /> : <Table />}

// Action with feedback
const handleAction = async () => {
  try {
    await action()
    toast({ title: "Success!", variant: "success" })
  } catch (e) {
    toast({ title: "Error", description: e.message, variant: "destructive" })
  }
}

// Upload with progress
<Progress value={uploadProgress} showValue />
```

## 📚 Import Paths

```tsx
// UI Components
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Loading States
import { TableSkeleton, CardSkeleton, DashboardSkeleton } from "@/components/ui/loading-skeletons"

// Empty States
import { NoTestsCreated, NoSubmissions } from "@/components/empty-states"

// Hooks
import { toast } from "@/hooks/use-toast"
import { useFocusTrap, useScreenReaderAnnounce } from "@/hooks/use-accessibility"

// Onboarding
import { OnboardingModal } from "@/components/onboarding-modal"
```
