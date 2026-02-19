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
import { Download, Search, Filter, Eye, FileText } from 'lucide-react';
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

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);

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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.candidate?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.test?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
    const total = 
      (scores.intelligence_score || 0) + 
      (scores.personality_score || 0);
    return total.toFixed(0);
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
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
                  <TableCell>{getTotalScore(submission.scores)}</TableCell>
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
                    <div className="flex gap-2 justify-end">
                      <Link 
                        href={`/admin/submissions/${submission.id}`}
                        target="_blank"
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExport(submission.id)}
                        disabled={exportingId === submission.id || submission.exported}
                      >
                        <Download className="h-4 w-4" />
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
