"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSkeleton, TableSkeleton, CardSkeleton } from "@/components/ui/loading-skeletons"
import { NoTestsCreated, NoSubmissions } from "@/components/empty-states"
import { OnboardingModal } from "@/components/onboarding-modal"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Info,
  Plus,
  Download
} from "lucide-react"

/**
 * Example: Enhanced Recruiter Dashboard
 * This demonstrates all Phase 9 UI/UX improvements in a real page
 */
export default function ExampleDashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasTests, setHasTests] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Simulate creating a test
  const handleCreateTest = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setHasTests(true)
      toast({
        title: "Test created successfully!",
        description: "Your screening test is ready to share.",
        variant: "success"
      })
    }, 1500)
  }

  // Simulate export
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your CSV file will download shortly.",
      variant: "info"
    })
    
    // Simulate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        toast({
          title: "Export complete!",
          description: "Downloaded 15 candidates to CSV.",
          variant: "success"
        })
      }
    }, 200)
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1>Recruiter Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your tests and review candidate submissions
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Export passed candidates to CSV
              </TooltipContent>
            </Tooltip>
            
            <Button onClick={handleCreateTest} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Card className="animate-slide-in-from-top">
            <CardHeader>
              <CardTitle className="text-base">Exporting candidates...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={uploadProgress} showValue />
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : !hasTests ? (
          /* Empty State */
          <NoTestsCreated onCreateTest={handleCreateTest} />
        ) : (
          /* Actual Content */
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Submissions
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">142</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Badge className="bg-success text-success-foreground text-xs">
                      +12% from last month
                    </Badge>
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Passed Candidates
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    62.7% pass rate
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Badge className="bg-warning text-warning-foreground text-xs">
                      Needs attention
                    </Badge>
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Disqualified
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-error" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">30</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anti-cheat violations
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Submissions</TabsTrigger>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="passed">Passed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Submissions</CardTitle>
                        <CardDescription>
                          Review and score candidate assessments
                        </CardDescription>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Click any row to view full submission details
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Would show actual table here */}
                    <div className="text-center py-8 text-muted-foreground">
                      Table component would go here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <NoSubmissions />
              </TabsContent>

              <TabsContent value="passed">
                <Card>
                  <CardHeader>
                    <CardTitle>Passed Candidates</CardTitle>
                    <CardDescription>
                      Ready to export and contact
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableSkeleton rows={3} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
