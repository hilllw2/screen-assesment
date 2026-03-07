'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Search, Filter, Eye, FileText, CheckCircle, XCircle, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import Link from 'next/link';

type Submission = {
  id: string;
  status: string;
  disqualified: boolean;
  disqualification_reason: string | null;
  started_at: string;
  submitted_at: string | null;
  disqualified_at: string | null;
  ai_scored: boolean;
  exported: boolean;
  current_phase: string | null;
  audio_recording_url: string | null;
  writing_part_1_text: string | null;
  writing_part_2_text: string | null;
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
  test_link: {
    id: string;
    token: string;
  };
  scores: {
    intelligence_score: number;
    personality_score: number;
    audio_score_by_ai: number | null;
    written_test_score_by_ai: number | null;
    audio_score_by_human: number | null;
    written_test_score_by_human: number | null;
  } | null;
};

// Helper function to normalize intelligence/personality scores to out of 5
// Intelligence: 20 questions, so divide by 4 to get out of 5
// Personality: 20 questions, so divide by 4 to get out of 5
const normalizeScore = (score: number, maxScore: number): number => {
  return Math.round((score / maxScore) * 5 * 10) / 10; // Round to 1 decimal
};

// Calculate total score out of 20
const calculateTotalScore = (scores: Submission['scores']): number => {
  if (!scores) return 0;
  
  const intelligence = normalizeScore(scores.intelligence_score || 0, 20); // out of 5
  const personality = normalizeScore(scores.personality_score || 0, 20); // out of 5
  const audio = scores.audio_score_by_ai || scores.audio_score_by_human || 0; // already out of 5
  const writing = scores.written_test_score_by_ai || scores.written_test_score_by_human || 0; // already out of 5
  
  return Math.round((intelligence + personality + audio + writing) * 10) / 10; // Round to 1 decimal
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportFilter, setExportFilter] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // convert an array of submissions to CSV string with detailed data
  const submissionsToCSV = (data: Submission[]) => {
    const header = [
      'Submission ID',
      'Candidate Name',
      'Candidate Email',
      'Test Title',
      'Test Type',
      'Status',
      'Disqualified',
      'Disqualification Reason',
      'Current Phase',
      'Intelligence Score (out of 5)',
      'Intelligence Raw Score (out of 20)',
      'Personality Score (out of 5)',
      'Personality Raw Score (out of 20)',
      'Verbal Score (out of 5)',
      'Writing Score (out of 5)',
      'Total Score (out of 20)',
      'Overall Percentage',
      'Audio Recording URL',
      'Writing Response 1',
      'Writing Response 2',
      'Started At',
      'Submitted At',
      'Disqualified At',
      'AI Scored',
      'Exported',
      'Test Link Token'
    ];

    const rows = data.map((s) => {
      const intelligenceNormalized = normalizeScore(s.scores?.intelligence_score || 0, 20);
      const personalityNormalized = normalizeScore(s.scores?.personality_score || 0, 20);
      const verbalScore = s.scores?.audio_score_by_ai || s.scores?.audio_score_by_human || 0;
      const writingScore = s.scores?.written_test_score_by_ai || s.scores?.written_test_score_by_human || 0;
      const total = calculateTotalScore(s.scores);
      const percentage = ((total / 20) * 100).toFixed(1);
      
      return [
        s.id,
        s.candidate?.name || '',
        s.candidate?.email || '',
        s.test?.title || '',
        s.test?.type || '',
        s.status,
        s.disqualified ? 'Yes' : 'No',
        s.disqualification_reason || '',
        s.current_phase || '',
        intelligenceNormalized.toFixed(1),
        s.scores?.intelligence_score?.toString() || '0',
        personalityNormalized.toFixed(1),
        s.scores?.personality_score?.toString() || '0',
        verbalScore.toString(),
        writingScore.toString(),
        total.toFixed(1),
        percentage + '%',
        s.audio_recording_url || '',
        s.writing_part_1_text || '',
        s.writing_part_2_text || '',
        new Date(s.started_at).toISOString(),
        s.submitted_at ? new Date(s.submitted_at).toISOString() : '',
        s.disqualified_at ? new Date(s.disqualified_at).toISOString() : '',
        s.ai_scored ? 'Yes' : 'No',
        s.exported ? 'Yes' : 'No',
        s.test_link?.token || ''
      ];
    });

    const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const csv = [header.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    return csv;
  };

  const downloadCSV = (csv: string, filename = 'submissions.csv') => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions');
      const data = await response.json();
      
      if (response.ok) {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (submissionId: string) => {
    setExportingId(submissionId);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action: 'export' })
      });

      if (response.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error exporting submission:', error);
    } finally {
      setExportingId(null);
    }
  };

  const handleExportAll = async () => {
    if (filteredSubmissions.length === 0) return;
    setExportingAll(true);

    // generate CSV and download immediately, we don't worry about prior exported flags
    const csv = submissionsToCSV(filteredSubmissions);
    downloadCSV(csv);

    // update the exported flag for every row we just included
    try {
      const ids = filteredSubmissions.map((s) => s.id);
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exportAll', ids })
      });
      if (response.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error exporting all submissions:', error);
    } finally {
      setExportingAll(false);
    }
  };

  const handleUpdateStatus = async (submissionId: string, newStatus: 'passed' | 'failed') => {
    setUpdatingStatus(submissionId);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId, 
          action: 'updateStatus',
          status: newStatus 
        })
      });

      if (response.ok) {
        fetchSubmissions();
      } else {
        alert('Failed to update submission status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update submission status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    setDeletingId(submissionId);
    
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        alert('Submission deleted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.candidate?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.test?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    const matchesExport = 
      exportFilter === 'all' ||
      (exportFilter === 'exported' && submission.exported) ||
      (exportFilter === 'not_exported' && !submission.exported);
    
    return matchesSearch && matchesStatus && matchesExport;
  });

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

  const getTotalScore = (scores: Submission['scores']) => {
    if (!scores) return '-';
    return calculateTotalScore(scores);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Submissions</h1>
          <p className="text-gray-500 mt-1">View submissions across all recruiters</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-500">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">All Submissions</h1>
          <p className="text-gray-500 mt-1">View and manage submissions across all recruiters</p>
          <div className="text-xs text-gray-400 mt-1">v2.0 - Updated with filters</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={exportingAll}
          >
            <Filter className="h-4 w-4 mr-2" />
            {exportingAll ? 'Exporting...' : 'Export All'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by candidate name, email, or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportFilter} onValueChange={setExportFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="exported">Exported</SelectItem>
              <SelectItem value="not_exported">Not Exported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>AI Scored</TableHead>
              <TableHead>Exported</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{submission.candidate?.name}</div>
                      <div className="text-sm text-gray-500">{submission.candidate?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{submission.test?.title}</div>
                      <div className="text-sm text-gray-500 capitalize">{submission.test?.type}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(submission)}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {getTotalScore(submission.scores)}
                      <span className="text-gray-500 text-sm"> / 20</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(submission.started_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {submission.submitted_at 
                        ? new Date(submission.submitted_at).toLocaleDateString()
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.ai_scored ? (
                      <Badge variant="secondary" className="text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.exported ? (
                      <Badge variant="secondary" className="text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {/* Pass/Fail buttons for submitted submissions */}
                      {submission.status === 'submitted' && !submission.disqualified && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateStatus(submission.id, 'passed')}
                            disabled={updatingStatus === submission.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Mark as Passed"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateStatus(submission.id, 'failed')}
                            disabled={updatingStatus === submission.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Mark as Failed"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Link 
                        href={`/admin/submissions/${submission.id}`}
                        target="_blank"
                      >
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExport(submission.id)}
                        disabled={exportingId === submission.id || submission.exported}
                        title={submission.exported ? 'Already Exported' : 'Mark as Exported'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(submission.id)}
                        disabled={deletingId === submission.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Submission"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>
    </div>
  );
}
