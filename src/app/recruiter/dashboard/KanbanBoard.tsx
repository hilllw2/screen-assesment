'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  status: string;
  disqualified: boolean;
  created_at: string;
  submitted_at: string | null;
  candidates: {
    name: string;
    email: string;
  };
  tests: {
    title: string | null;
    type: string;
  };
  submission_scores: Array<{
    intelligence_score: number | null;
    personality_score: number | null;
    written_test_score_by_human: number | null;
    audio_score_by_human: number | null;
  }> | null;
}

interface KanbanColumnProps {
  title: string;
  submissions: Submission[];
  count: number;
  color: string;
}

function KanbanColumn({ title, submissions, count, color }: KanbanColumnProps) {
  const router = useRouter();

  const getStatusColor = (status: string, disqualified: boolean) => {
    if (disqualified) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`${color} rounded-t-lg p-3 mb-2`}>
        <h3 className="font-semibold text-white flex justify-between items-center">
          <span>{title}</span>
          <span className="bg-white bg-opacity-30 px-2 py-1 rounded text-sm">
            {count}
          </span>
        </h3>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {submissions.map((submission) => {
          const scores = submission.submission_scores?.[0];
          return (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Candidate Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {submission.candidates?.name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {submission.candidates?.email || 'No email'}
                    </p>
                  </div>

                  {/* Test Info */}
                  <p className="text-sm text-gray-500">
                    {submission.tests?.title || `${submission.tests?.type} Test`}
                  </p>

                  {/* Submitted Date */}
                  {submission.submitted_at && (
                    <p className="text-xs text-gray-500">
                      Submitted{' '}
                      {formatDistanceToNow(new Date(submission.submitted_at), {
                        addSuffix: true,
                      })}
                    </p>
                  )}

                  {/* Scores */}
                  {scores && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {scores.intelligence_score !== null && (
                        <div>
                          <span className="text-gray-600">Intelligence:</span>{' '}
                          <span className="font-semibold">
                            {scores.intelligence_score}%
                          </span>
                        </div>
                      )}
                      {scores.personality_score !== null && (
                        <div>
                          <span className="text-gray-600">Personality:</span>{' '}
                          <span className="font-semibold">
                            {scores.personality_score} pts
                          </span>
                        </div>
                      )}
                      {scores.written_test_score_by_human !== null && (
                        <div>
                          <span className="text-gray-600">Written:</span>{' '}
                          <span className="font-semibold">
                            {scores.written_test_score_by_human}/10
                          </span>
                        </div>
                      )}
                      {scores.audio_score_by_human !== null && (
                        <div>
                          <span className="text-gray-600">Audio:</span>{' '}
                          <span className="font-semibold">
                            {scores.audio_score_by_human}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge
                      className={getStatusColor(
                        submission.status,
                        submission.disqualified
                      )}
                    >
                      {submission.disqualified
                        ? 'Disqualified'
                        : submission.status.replace('_', ' ').toUpperCase()}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/recruiter/submissions/${submission.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {submissions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No submissions
          </p>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  submissions: Submission[];
}

export function KanbanBoard({ submissions }: KanbanBoardProps) {
  const inProgress = submissions.filter((s) => s.status === 'in_progress');
  const submitted = submissions.filter((s) => s.status === 'submitted');
  const passed = submissions.filter((s) => s.status === 'passed');
  const failed = submissions.filter((s) => s.status === 'failed');
  const disqualified = submissions.filter((s) => s.disqualified === true);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumn
        title="In Progress"
        submissions={inProgress}
        count={inProgress.length}
        color="bg-blue-600"
      />
      <KanbanColumn
        title="Submitted"
        submissions={submitted}
        count={submitted.length}
        color="bg-yellow-600"
      />
      <KanbanColumn
        title="Passed"
        submissions={passed}
        count={passed.length}
        color="bg-green-600"
      />
      <KanbanColumn
        title="Failed"
        submissions={failed}
        count={failed.length}
        color="bg-gray-600"
      />
      <KanbanColumn
        title="Disqualified"
        submissions={disqualified}
        count={disqualified.length}
        color="bg-red-600"
      />
    </div>
  );
}
