# Phase 9 Integration Guide

This guide shows how to integrate Phase 9 UI/UX components into your existing pages.

## Quick Integration Checklist

### 1. Add to Recruiter Dashboard (`/recruiter/dashboard/page.tsx`)

```tsx
"use client"

import { useState, useEffect } from "react"
import { OnboardingModal } from "@/components/onboarding-modal"
import { DashboardSkeleton } from "@/components/ui/loading-skeletons"
import { NoTestsCreated } from "@/components/empty-states"
import { toast } from "@/hooks/use-toast"

export default function RecruiterDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [tests, setTests] = useState([])

  useEffect(() => {
    // Fetch tests
    fetchTests().then(data => {
      setTests(data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <DashboardSkeleton />
  
  if (tests.length === 0) {
    return <NoTestsCreated onCreateTest={() => router.push("/recruiter/tests/new")} />
  }

  return (
    <div>
      <OnboardingModal />
      {/* Your dashboard content */}
    </div>
  )
}
```

### 2. Add to Test Creation Page (`/recruiter/tests/new/page.tsx`)

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"

export default function CreateTestPage() {
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (data) => {
    setIsCreating(true)
    try {
      await createTest(data)
      toast({
        title: "Test created!",
        description: "Your test is ready to share.",
        variant: "success"
      })
      router.push("/recruiter/tests")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isCreating}>
        {isCreating && <Spinner size="sm" className="mr-2" />}
        Create Test
      </Button>
    </form>
  )
}
```

### 3. Add to Submissions Table

```tsx
"use client"

import { useState } from "react"
import { TableSkeleton } from "@/components/ui/loading-skeletons"
import { NoSubmissions } from "@/components/empty-states"
import { Badge } from "@/components/ui/badge"

export function SubmissionsTable() {
  const { data: submissions, isLoading } = useSubmissions()

  if (isLoading) return <TableSkeleton rows={8} />
  if (!submissions?.length) return <NoSubmissions />

  return (
    <Table>
      <TableBody>
        {submissions.map(sub => (
          <TableRow key={sub.id}>
            <TableCell>{sub.candidateName}</TableCell>
            <TableCell>
              <Badge 
                className={
                  sub.status === 'passed' 
                    ? 'bg-success text-success-foreground'
                    : sub.status === 'failed'
                    ? 'bg-error text-error-foreground'
                    : 'bg-warning text-warning-foreground'
                }
              >
                {sub.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### 4. Add to File Upload

```tsx
"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

export function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        }
      })

      toast({
        title: "Upload complete!",
        description: "File uploaded successfully.",
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} showValue className="mt-2" />
      )}
    </div>
  )
}
```

### 5. Add Tooltips to Complex Features

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

<div className="flex items-center gap-2">
  <label>Intelligence Score Weight</label>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      This determines how much the intelligence test contributes to the final score
    </TooltipContent>
  </Tooltip>
</div>
```

### 6. Status Badges with Semantic Colors

```tsx
function getStatusBadge(status: string) {
  const variants = {
    passed: "bg-success text-success-foreground",
    failed: "bg-error text-error-foreground",
    pending: "bg-warning text-warning-foreground",
    in_progress: "bg-info text-info-foreground",
    disqualified: "bg-destructive text-destructive-foreground"
  }

  return (
    <Badge className={variants[status]}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}
```

### 7. Modal Dialogs

```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the test.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Common Patterns

### Loading → Empty → Content

```tsx
if (isLoading) return <ComponentSkeleton />
if (!data?.length) return <EmptyState />
return <YourComponent data={data} />
```

### Action with Toast Feedback

```tsx
const handleAction = async () => {
  try {
    await performAction()
    toast({ title: "Success!", variant: "success" })
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" })
  }
}
```

### Animated Page Transitions

```tsx
<div className="animate-fade-in">
  <h1 className="animate-slide-in-from-top">Page Title</h1>
  <div className="animate-slide-in-from-bottom" style={{ animationDelay: "0.1s" }}>
    Content
  </div>
</div>
```

## Responsive Patterns

### Mobile-First Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Hide/Show Based on Screen Size

```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Responsive Typography

```tsx
<h1 className="text-2xl md:text-4xl lg:text-5xl">Responsive Heading</h1>
```

## Accessibility Patterns

### Focus Management

```tsx
import { useFocusTrap } from "@/hooks/use-accessibility"

function Modal({ isOpen }) {
  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)
  
  return <div ref={modalRef}>...</div>
}
```

### Screen Reader Announcements

```tsx
import { useScreenReaderAnnounce } from "@/hooks/use-accessibility"

function Component() {
  const { announce } = useScreenReaderAnnounce()
  
  const handleUpdate = () => {
    updateData()
    announce("Data updated successfully", "polite")
  }
}
```

### ARIA Labels

```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

<div role="status" aria-live="polite">
  Loading...
</div>
```

## Performance Tips

1. **Lazy load heavy components**
```tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />
})
```

2. **Debounce search inputs**
```tsx
const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 300),
  []
)
```

3. **Optimize images**
```tsx
import Image from "next/image"

<Image 
  src={url} 
  width={400} 
  height={300} 
  alt="Description"
  loading="lazy"
/>
```

## Testing Your Integration

### Visual Regression
- Test each page at 375px, 768px, 1024px, 1920px
- Check dark mode if implemented
- Verify animations are smooth (60fps)

### Accessibility
- Tab through all interactive elements
- Test with VoiceOver/NVDA screen reader
- Verify focus indicators are visible
- Check color contrast (WCAG AA minimum)

### Functionality
- All toasts appear and dismiss correctly
- Loading states show while fetching
- Empty states appear when no data
- Animations don't interfere with usability
- Keyboard shortcuts work (Escape to close, etc.)

## Next Steps

1. Go through each page in your app
2. Replace generic loading with appropriate skeletons
3. Add empty states where needed
4. Add toast notifications for all user actions
5. Add tooltips to explain complex features
6. Test on different screen sizes
7. Run accessibility audit
8. Get user feedback

---

Need help with a specific integration? Check PHASE9_USAGE_GUIDE.tsx for more examples!
