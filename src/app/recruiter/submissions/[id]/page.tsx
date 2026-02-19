'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);

  const [writtenScore, setWrittenScore] = useState<number | ''>('');
  const [audioScore, setAudioScore] = useState<number | ''>('');
  const [writtenNotes, setWrittenNotes] = useState('');
  const [audioNotes, setAudioNotes] = useState('');

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recruiter/submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data.submission);
        setAnswers(data.answers || []);
        setViolations(data.violations || []);

        // Pre-fill scores and notes if they exist
        const scores = data.submission.submission_scores?.[0];
        const notes = data.submission.submission_notes?.[0];
        
        if (scores) {
          setWrittenScore(scores.written_test_score_by_human ?? '');
          setAudioScore(scores.audio_score_by_human ?? '');
        }
        
        if (notes) {
          setWrittenNotes(notes.written_test_review_notes_by_human || '');
          setAudioNotes(notes.audio_review_notes_by_human || '');
        }
      }
    } catch (error) {
      console.error('Error fetching submission details:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScores = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/recruiter/submissions/${submissionId}/scores`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            written_test_score_by_human: writtenScore === '' ? null : writtenScore,
            audio_score_by_human: audioScore === '' ? null : audioScore,
          }),
        }
      );

      if (response.ok) {
        alert('Scores saved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save scores');
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/recruiter/submissions/${submissionId}/notes`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            written_test_review_notes_by_human: writtenNotes,
            audio_review_notes_by_human: audioNotes,
          }),
        }
      );

      if (response.ok) {
        alert('Notes saved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/recruiter/submissions/${submissionId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert(`Submission marked as ${newStatus}!`);
        fetchSubmissionDetails(); // Refresh data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6">
        <p>Submission not found</p>
      </div>
    );
  }

  const candidate = submission.candidates;
  const test = submission.tests;
  const scores = submission.submission_scores?.[0];

  const intelligenceAnswers = answers.filter(
    (a) => a.questions?.category === 'intelligence'
  );
  const personalityAnswers = answers.filter(
    (a) => a.questions?.category === 'personality'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push('/recruiter/dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {candidate?.name || 'Unknown Candidate'}
          </h1>
          <p className="text-gray-600">{candidate?.email}</p>
        </div>
        <Badge
          className={getStatusColor(submission.status, submission.disqualified)}
        >
          {submission.disqualified
            ? 'Disqualified'
            : submission.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Info */}
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Test Title</p>
                  <p className="font-semibold">
                    {test?.title || `${test?.type} Test`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Type</p>
                  <p className="font-semibold">{test?.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted Date</p>
                  <p className="font-semibold">
                    {submission.submitted_at
                      ? format(new Date(submission.submitted_at), 'PPp')
                      : 'Not submitted'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="font-semibold">
                    {format(new Date(submission.created_at), 'PPp')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Intelligence Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {scores?.intelligence_score !== null &&
                    scores?.intelligence_score !== undefined
                      ? `${scores.intelligence_score}%`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Auto-calculated</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Personality Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {scores?.personality_score !== null &&
                    scores?.personality_score !== undefined
                      ? `${scores.personality_score} pts`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Auto-calculated</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Human Review Scores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Written Test Score (0-10)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={writtenScore}
                      onChange={(e) =>
                        setWrittenScore(
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                      placeholder="0-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">
                      Audio Score (0-10)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={audioScore}
                      onChange={(e) =>
                        setAudioScore(
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                      placeholder="0-10"
                    />
                  </div>
                </div>
                <Button onClick={saveScores} className="mt-4" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Scores
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Written Response */}
          {submission.written_test_submission_text && (
            <Card>
              <CardHeader>
                <CardTitle>Written Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">
                    {submission.written_test_submission_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Written Test Review Notes
                </label>
                <Textarea
                  value={writtenNotes}
                  onChange={(e) => setWrittenNotes(e.target.value)}
                  placeholder="Add notes about the written test..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Audio Review Notes
                </label>
                <Textarea
                  value={audioNotes}
                  onChange={(e) => setAudioNotes(e.target.value)}
                  placeholder="Add notes about the audio response..."
                  rows={4}
                />
              </div>
              <Button onClick={saveNotes} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* MCQ Answers */}
          {intelligenceAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Intelligence Test Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intelligenceAnswers.map((answer, idx) => (
                    <div
                      key={answer.id}
                      className="border-b pb-3 last:border-b-0"
                    >
                      <p className="font-semibold mb-2">
                        Q{idx + 1}: {answer.questions?.prompt}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const isCorrect =
                            answer.questions?.correct_option === option;
                          const isSelected = answer.selected_option === option;
                          return (
                            <div
                              key={option}
                              className={`p-2 rounded ${
                                isSelected && isCorrect
                                  ? 'bg-green-100 text-green-800'
                                  : isSelected && !isCorrect
                                  ? 'bg-red-100 text-red-800'
                                  : isCorrect
                                  ? 'bg-blue-50 text-blue-800'
                                  : ''
                              }`}
                            >
                              {option}:{' '}
                              {answer.questions?.[`option_${option.toLowerCase()}`]}
                              {isSelected && ' (Selected)'}
                              {isCorrect && ' ✓'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personality Answers */}
          {personalityAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personality Test Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {personalityAnswers.map((answer, idx) => (
                    <div
                      key={answer.id}
                      className="border-b pb-3 last:border-b-0"
                    >
                      <p className="font-semibold mb-2">
                        Q{idx + 1}: {answer.questions?.prompt}
                      </p>
                      <p className="text-sm">
                        Selected: {answer.selected_option} -{' '}
                        {answer.questions?.[`option_${answer.selected_option.toLowerCase()}`]}
                      </p>
                      <p className="text-sm text-gray-600">
                        Points awarded: {answer.points_awarded || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Violations */}
          {violations.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {violations.map((violation) => (
                    <div
                      key={violation.id}
                      className="bg-red-50 p-3 rounded-lg"
                    >
                      <p className="font-semibold text-red-800">
                        {violation.violation_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(violation.created_at), 'PPp')}
                      </p>
                      {violation.metadata && (
                        <p className="text-sm text-gray-700 mt-1">
                          {JSON.stringify(violation.metadata)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Media */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => updateStatus('passed')}
                disabled={saving || submission.status === 'passed'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Passed
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => updateStatus('failed')}
                disabled={saving || submission.status === 'failed'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Failed
              </Button>
            </CardContent>
          </Card>

          {/* Recordings */}
          <Card>
            <CardHeader>
              <CardTitle>Recordings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.screen_recording_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Screen Recording</p>
                  <video
                    controls
                    className="w-full rounded-lg border"
                    src={submission.screen_recording_url}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {submission.audio_recording_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Audio Recording</p>
                  <audio controls className="w-full">
                    <source src={submission.audio_recording_url} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {submission.video_recording_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Video Recording</p>
                  <video
                    controls
                    className="w-full rounded-lg border"
                    src={submission.video_recording_url}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {!submission.screen_recording_url &&
                !submission.audio_recording_url &&
                !submission.video_recording_url && (
                  <p className="text-sm text-gray-500">
                    No recordings available
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
