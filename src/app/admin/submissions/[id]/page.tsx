'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

type Submission = {
  id: string;
  status: string;
  disqualified: boolean;
  disqualification_reason: string | null;
  started_at: string;
  submitted_at: string | null;
  ai_scored: boolean;
  exported: boolean;
  current_phase: string | null;
  writing_part_1_text: string | null;
  writing_part_2_text: string | null;
  writing_part_3_text: string | null;
  writing_part_4_text: string | null;
  writing_part_5_text: string | null;
  verbal_question_1_url: string | null;
  verbal_question_2_url: string | null;
  verbal_question_3_url: string | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  test: {
    id: string;
    title: string;
    type: string;
  };
  scores: {
    intelligence_score: number;
    personality_score: number;
    audio_score_by_ai: number | null;
    written_test_score_by_ai: number | null;
    audio_score_by_human: number | null;
    written_test_score_by_human: number | null;
  } | null;
  notes: {
    audio_notes_by_ai: string | null;
    written_test_review_notes_by_ai: string | null;
    audio_review_notes_by_human: string | null;
    written_test_review_notes_by_human: string | null;
  } | null;
  answers: Array<{
    id: string;
    selected_option: string;
    is_correct: boolean | null;
    score_awarded: number;
    answered_at: string;
    question: {
      id: string;
      category: string;
      prompt: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: string | null;
      difficulty: string | null;
    };
  }>;
  violations: Array<{
    id: string;
    violation_type: string;
    detected_at: string;
    metadata: any;
  }>;
};

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [presignedUrls, setPresignedUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSubmission();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (submission) {
      loadPresignedUrls();
    }
  }, [submission]);

  const loadPresignedUrls = async () => {
    if (!submission) return;
    
    const urls: { [key: string]: string } = {};
    
    // Load presigned URLs for verbal questions
    for (let i = 1; i <= 3; i++) {
      const s3Url = submission[`verbal_question_${i}_url` as keyof Submission] as string | null;
      if (s3Url) {
        try {
          const response = await fetch('/api/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3Url })
          });
          
          if (response.ok) {
            const data = await response.json();
            urls[`verbal_${i}`] = data.presignedUrl;
          }
        } catch (error) {
          console.error(`Failed to get presigned URL for verbal question ${i}:`, error);
        }
      }
    }
    
    setPresignedUrls(urls);
  };

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${resolvedParams.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubmission(data.submission);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (submission: Submission) => {
    if (submission.disqualified) {
      return <Badge variant="destructive">Disqualified</Badge>;
    }
    
    switch (submission.status) {
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'passed':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{submission.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-500">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-500">Submission not found</p>
        </div>
      </div>
    );
  }

  const intelligenceAnswers = submission.answers.filter(a => a.question.category === 'intelligence');
  const personalityAnswers = submission.answers.filter(a => a.question.category === 'personality');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Submission Details</h1>
            <p className="text-gray-500 mt-1">{submission.candidate.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(submission)}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Candidate Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{submission.candidate.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{submission.candidate.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Test Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Test</div>
                <div className="font-medium">{submission.test.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium capitalize">{submission.test.type}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Started</div>
                <div className="font-medium">
                  {new Date(submission.started_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Submitted</div>
                <div className="font-medium">
                  {submission.submitted_at 
                    ? new Date(submission.submitted_at).toLocaleString()
                    : 'Not submitted'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {submission.violations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Violations Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submission.violations.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium capitalize">
                      {violation.violation_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(violation.detected_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="destructive">Violation</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Intelligence</div>
              <div className="text-2xl font-bold text-blue-900">
                {submission.scores?.intelligence_score || 0}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600">Personality</div>
              <div className="text-2xl font-bold text-purple-900">
                {submission.scores?.personality_score || 0}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600">Audio (AI)</div>
              <div className="text-2xl font-bold text-green-900">
                {submission.scores?.audio_score_by_ai || '-'}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600">Writing (AI)</div>
              <div className="text-2xl font-bold text-orange-900">
                {submission.scores?.written_test_score_by_ai || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="intelligence" className="space-y-4">
        <TabsList>
          <TabsTrigger value="intelligence">
            Intelligence ({intelligenceAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="personality">
            Personality ({personalityAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="writing">
            Writing Assessment
          </TabsTrigger>
          <TabsTrigger value="verbal">
            Verbal Assessment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="space-y-4">
          {intelligenceAnswers.map((answer, index) => (
            <Card key={answer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Question {index + 1}</div>
                    <div className="font-medium mt-1">{answer.question.prompt}</div>
                  </div>
                  {answer.is_correct !== null && (
                    answer.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['a', 'b', 'c', 'd'].map((option) => {
                    const optionText = answer.question[`option_${option}` as keyof typeof answer.question] as string;
                    const isSelected = answer.selected_option === option;
                    const isCorrect = answer.question.correct_option === option;
                    
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded border ${
                          isSelected && isCorrect
                            ? 'bg-green-50 border-green-500'
                            : isSelected && !isCorrect
                            ? 'bg-red-50 border-red-500'
                            : isCorrect
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium uppercase">{option}.</span>
                          <span>{optionText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Score awarded: {answer.score_awarded}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          {personalityAnswers.map((answer, index) => (
            <Card key={answer.id}>
              <CardHeader>
                <div className="text-sm text-gray-500">Question {index + 1}</div>
                <div className="font-medium">{answer.question.prompt}</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['a', 'b', 'c', 'd'].map((option) => {
                    const optionText = answer.question[`option_${option}` as keyof typeof answer.question] as string;
                    const isSelected = answer.selected_option === option;
                    
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded border ${
                          isSelected ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium uppercase">{option}.</span>
                          <span>{optionText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Score awarded: {answer.score_awarded}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="writing" className="space-y-4">
          {[1, 2, 3, 4, 5].map((partNum) => {
            const text = submission[`writing_part_${partNum}_text` as keyof Submission] as string | null;
            if (!text) return null;
            
            return (
              <Card key={partNum}>
                <CardHeader>
                  <CardTitle className="text-lg">Part {partNum}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                    {text}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {submission.notes?.written_test_review_notes_by_ai && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">AI Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">
                  {submission.notes.written_test_review_notes_by_ai}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verbal" className="space-y-4">
          {[1, 2, 3].map((questionNum) => {
            const url = submission[`verbal_question_${questionNum}_url` as keyof Submission] as string | null;
            const presignedUrl = presignedUrls[`verbal_${questionNum}`];
            
            if (!url) return null;
            
            return (
              <Card key={questionNum}>
                <CardHeader>
                  <CardTitle className="text-lg">Question {questionNum}</CardTitle>
                </CardHeader>
                <CardContent>
                  {presignedUrl ? (
                    <audio controls className="w-full">
                      <source src={presignedUrl} type="audio/webm" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="text-sm text-gray-500">Loading audio...</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {submission.notes?.audio_notes_by_ai && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">AI Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">
                  {submission.notes.audio_notes_by_ai}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
