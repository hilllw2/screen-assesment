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
  audio_recording_url: string | null;
  screen_recording_url: string | string[] | null;
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

// Helper function to normalize intelligence/personality scores to out of 5
const normalizeScore = (score: number, maxScore: number): number => {
  return Math.round((score / maxScore) * 5 * 10) / 10; // Round to 1 decimal
};

// Calculate total score out of 20
const calculateTotalScore = (scores: Submission['scores']): number => {
  if (!scores) return 0;
  
  const intelligence = normalizeScore(scores.intelligence_score || 0, 30); // out of 5 (30 questions)
  const personality = normalizeScore(scores.personality_score || 0, 180); // out of 5 (max 180 points)
  const audio = scores.audio_score_by_ai || scores.audio_score_by_human || 0; // already out of 5
  const writing = scores.written_test_score_by_ai || scores.written_test_score_by_human || 0; // already out of 5
  
  return Math.round((intelligence + personality + audio + writing) * 10) / 10; // Round to 1 decimal
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
    
    // Load presigned URL for combined audio recording
    if (submission.audio_recording_url) {
      console.log('🔊 Loading presigned URL for audio:', submission.audio_recording_url);
      try {
        const response = await fetch('/api/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Url: submission.audio_recording_url })
        });
        
        console.log('📡 Presigned URL response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Got presigned URL:', data.presignedUrl?.substring(0, 100) + '...');
          urls['combined_audio'] = data.presignedUrl;
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to get presigned URL:', errorData);
        }
      } catch (error) {
        console.error('❌ Failed to get presigned URL for combined audio:', error);
      }
    } else {
      console.log('⚠️ No audio_recording_url found in submission');
    }
    
    // Load presigned URL for screen recording
    if (submission.screen_recording_url) {
      if (Array.isArray(submission.screen_recording_url)) {
        // Handle multiple chunks
        console.log(`🖥️ Loading presigned URLs for ${submission.screen_recording_url.length} screen recording chunks`);
        
        for (let i = 0; i < submission.screen_recording_url.length; i++) {
          const s3Url = submission.screen_recording_url[i];
          try {
            const response = await fetch('/api/presigned-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ s3Url })
            });
            
            if (response.ok) {
              const data = await response.json();
              urls[`screen_recording_${i}`] = data.presignedUrl;
              console.log(`✅ Got presigned URL for screen recording chunk ${i + 1}`);
            } else {
              console.error(`❌ Failed to get presigned URL for chunk ${i + 1}`);
            }
          } catch (error) {
            console.error(`❌ Failed to get presigned URL for screen recording chunk ${i + 1}:`, error);
          }
        }
      } else {
        // Handle single URL (legacy)
        console.log('🖥️ Loading presigned URL for screen recording:', submission.screen_recording_url);
        try {
          const response = await fetch('/api/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3Url: submission.screen_recording_url })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Got presigned URL for screen recording');
            urls['screen_recording'] = data.presignedUrl;
          } else {
            console.error('❌ Failed to get presigned URL for screen recording');
          }
        } catch (error) {
          console.error('❌ Failed to get presigned URL for screen recording:', error);
        }
      }
    }
    
    // Load presigned URLs for individual verbal questions (if they exist)
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
    
    console.log('🎯 Final presigned URLs:', urls);
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
          <CardTitle>Assessment Scores</CardTitle>
          <p className="text-sm text-gray-500 mt-1">All scores are out of 5. Total score is out of 20.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Intelligence</div>
              <div className="text-2xl font-bold text-blue-900">
                {normalizeScore(submission.scores?.intelligence_score || 0, 30).toFixed(1)}
                <span className="text-sm text-blue-600 font-normal"> / 5</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({submission.scores?.intelligence_score || 0} / 30 questions)
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Personality</div>
              <div className="text-2xl font-bold text-purple-900">
                {normalizeScore(submission.scores?.personality_score || 0, 180).toFixed(1)}
                <span className="text-sm text-purple-600 font-normal"> / 5</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({submission.scores?.personality_score || 0} / 180 max points)
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1 font-semibold">Writing</div>
              <div className="text-2xl font-bold text-orange-900">
                {submission.scores?.written_test_score_by_ai !== null && submission.scores?.written_test_score_by_ai !== undefined
                  ? submission.scores.written_test_score_by_ai.toFixed(1)
                  : submission.scores?.written_test_score_by_human !== null && submission.scores?.written_test_score_by_human !== undefined
                  ? submission.scores.written_test_score_by_human.toFixed(1)
                  : '-'}
                {((submission.scores?.written_test_score_by_ai !== null && submission.scores?.written_test_score_by_ai !== undefined) ||
                  (submission.scores?.written_test_score_by_human !== null && submission.scores?.written_test_score_by_human !== undefined)) && 
                  <span className="text-sm text-orange-600 font-normal"> / 5</span>
                }
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {submission.scores?.written_test_score_by_ai !== null && submission.scores?.written_test_score_by_ai !== undefined
                  ? '🤖 AI Scored' 
                  : submission.scores?.written_test_score_by_human !== null && submission.scores?.written_test_score_by_human !== undefined
                  ? '👤 Human Scored' 
                  : '⏳ Not scored'}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1 font-semibold">Verbal</div>
              <div className="text-2xl font-bold text-green-900">
                {submission.scores?.audio_score_by_ai !== null && submission.scores?.audio_score_by_ai !== undefined
                  ? submission.scores.audio_score_by_ai.toFixed(1)
                  : submission.scores?.audio_score_by_human !== null && submission.scores?.audio_score_by_human !== undefined
                  ? submission.scores.audio_score_by_human.toFixed(1)
                  : '-'}
                {((submission.scores?.audio_score_by_ai !== null && submission.scores?.audio_score_by_ai !== undefined) ||
                  (submission.scores?.audio_score_by_human !== null && submission.scores?.audio_score_by_human !== undefined)) && 
                  <span className="text-sm text-green-600 font-normal"> / 5</span>
                }
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {submission.scores?.audio_score_by_ai !== null && submission.scores?.audio_score_by_ai !== undefined
                  ? '🤖 AI Scored' 
                  : submission.scores?.audio_score_by_human !== null && submission.scores?.audio_score_by_human !== undefined
                  ? '👤 Human Scored' 
                  : '⏳ Not scored'}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
              <div className="text-sm text-indigo-600 mb-1 font-semibold">Total Score</div>
              <div className="text-3xl font-bold text-indigo-900">
                {calculateTotalScore(submission.scores).toFixed(1)}
                <span className="text-lg text-indigo-600 font-normal"> / 20</span>
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">
                {((calculateTotalScore(submission.scores) / 20) * 100).toFixed(0)}% Overall
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
          <TabsTrigger value="screen-recording">
            Screen Recording
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
          {/* Show combined audio recording if available */}
          {submission.audio_recording_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verbal Assessment Recording (All 3 Questions)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  This is a combined recording of all 3 verbal questions answered by the candidate.
                </p>
              </CardHeader>
              <CardContent>
                {presignedUrls['combined_audio'] ? (
                  <div className="space-y-2">
                    <audio controls className="w-full" preload="metadata">
                      <source src={presignedUrls['combined_audio']} type="audio/webm" />
                      <source src={presignedUrls['combined_audio']} type="audio/webm;codecs=opus" />
                      <source src={presignedUrls['combined_audio']} type="audio/ogg" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <a 
                          href={presignedUrls['combined_audio']} 
                          download="verbal-recording.webm"
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Recording
                        </a>
                        {' · '}
                        <a 
                          href={presignedUrls['combined_audio']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open in New Tab
                        </a>
                      </div>
                      <div className="text-xs text-gray-400">
                        Original URL: {submission.audio_recording_url}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Loading presigned URL...</div>
                    <div className="text-xs text-gray-400">
                      S3 URL: {submission.audio_recording_url}
                    </div>
                    <div className="text-xs text-red-500 mt-2">
                      If this persists, check browser console for errors.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Show individual question recordings if available */}
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
          
          {/* Show message if no audio recordings found */}
          {!submission.audio_recording_url && 
           !submission.verbal_question_1_url && 
           !submission.verbal_question_2_url && 
           !submission.verbal_question_3_url && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  No verbal assessment recordings found for this submission.
                </div>
              </CardContent>
            </Card>
          )}
          
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

        <TabsContent value="screen-recording" className="space-y-4">
          {submission.screen_recording_url ? (
            <>
              {Array.isArray(submission.screen_recording_url) ? (
                // Multiple chunks
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📦 This recording was uploaded in <strong>{submission.screen_recording_url.length} chunks</strong> (streamed during test to avoid large upload at end)
                    </p>
                  </div>
                  {submission.screen_recording_url.map((url, index) => {
                    const chunkKey = `screen_recording_${index}`;
                    return (
                      <Card key={chunkKey}>
                        <CardHeader>
                          <CardTitle className="text-lg">Screen Recording - Chunk {index + 1}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Part {index + 1} of {submission.screen_recording_url.length} - Recorded in ~2 minute segments
                          </p>
                        </CardHeader>
                        <CardContent>
                          {presignedUrls[chunkKey] ? (
                            <div className="space-y-2">
                              <video controls className="w-full max-h-[600px] bg-black rounded">
                                <source src={presignedUrls[chunkKey]} type="video/webm" />
                                Your browser does not support the video element.
                              </video>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>
                                  <a 
                                    href={presignedUrls[chunkKey]} 
                                    download={`screen-recording-chunk-${index + 1}.webm`}
                                    className="text-blue-600 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Download Chunk {index + 1}
                                  </a>
                                  {' · '}
                                  <a 
                                    href={presignedUrls[chunkKey]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Open in New Tab
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-500">Loading presigned URL for chunk {index + 1}...</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              ) : (
                // Single URL (legacy or short recording)
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Screen Recording</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Full screen recording of the candidate's assessment session for proctoring purposes.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {presignedUrls['screen_recording'] ? (
                      <div className="space-y-2">
                        <video controls className="w-full max-h-[600px] bg-black rounded">
                          <source src={presignedUrls['screen_recording']} type="video/webm" />
                          Your browser does not support the video element.
                        </video>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>
                            <a 
                              href={presignedUrls['screen_recording']} 
                              download="screen-recording.webm"
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download Recording
                            </a>
                            {' · '}
                            <a 
                              href={presignedUrls['screen_recording']}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Open in New Tab
                            </a>
                          </div>
                          <div className="text-xs text-gray-400">
                            Original URL: {submission.screen_recording_url}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Loading presigned URL...</div>
                        <div className="text-xs text-gray-400">
                          S3 URL: {submission.screen_recording_url}
                        </div>
                        <div className="text-xs text-red-500 mt-2">
                          If this persists, check browser console for errors.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  No screen recording found for this submission.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
