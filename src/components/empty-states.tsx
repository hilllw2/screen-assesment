import { EmptyState } from "@/components/ui/empty-state"
import { 
  FileText, 
  Users, 
  Link as LinkIcon, 
  ClipboardCheck,
  AlertTriangle,
  Inbox
} from "lucide-react"

export function NoTestsCreated({ onCreateTest }: { onCreateTest: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No tests created yet"
      description="Create your first assessment to start evaluating candidates. You can create screening tests or Upwork video tests."
      action={{
        label: "Create Your First Test",
        onClick: onCreateTest,
      }}
    />
  )
}

export function NoSubmissions() {
  return (
    <EmptyState
      icon={Inbox}
      title="No submissions yet"
      description="Once candidates complete your tests, their submissions will appear here. Share your test links to get started."
    />
  )
}

export function NoPassedCandidates() {
  return (
    <EmptyState
      icon={Users}
      title="No passed candidates yet"
      description="Review and score candidate submissions to move them to the passed column. Passed candidates can be exported for further processing."
    />
  )
}

export function NoTestLinks({ onCreateLink }: { onCreateLink: () => void }) {
  return (
    <EmptyState
      icon={LinkIcon}
      title="No test links generated"
      description="Generate shareable links for this test. Each link can be tracked separately to monitor candidate progress."
      action={{
        label: "Generate Test Link",
        onClick: onCreateLink,
      }}
    />
  )
}

export function NoQuestionsFound() {
  return (
    <EmptyState
      icon={ClipboardCheck}
      title="No questions found"
      description="No questions match your current filters. Try adjusting your search criteria or create a new question."
    />
  )
}

export function NoViolations() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No violations recorded"
      description="This submission has no anti-cheat violations. The candidate followed all test-taking guidelines."
      className="border-success/50 bg-success/5"
    />
  )
}

export function NoSearchResults({ searchQuery }: { searchQuery: string }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No results found"
      description={`No results match "${searchQuery}". Try a different search term or clear your filters.`}
    />
  )
}
