'use client';

import { useEffect, useState } from 'react';
import { DashboardFilters, FilterState } from './DashboardFilters';
import { KanbanBoard } from './KanbanBoard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecruiterDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [tests, setTests] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    testId: 'all',
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTests();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, submissions]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/recruiter/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recruiter/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
        setFilteredSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Filter by test
    if (filters.testId && filters.testId !== 'all') {
      filtered = filtered.filter((s: any) => s.test_id === filters.testId);
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'disqualified') {
        filtered = filtered.filter((s: any) => s.disqualified === true);
      } else {
        filtered = filtered.filter((s: any) => s.status === filters.status);
      }
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((s: any) => {
        const name = s.candidates?.name?.toLowerCase() || '';
        const email = s.candidates?.email?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(
        (s: any) => new Date(s.created_at) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (s: any) => new Date(s.created_at) <= new Date(filters.endDate)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate stats
  const stats = [
    { title: 'My Tests', value: tests.length, description: 'Tests created' },
    { title: 'Total Submissions', value: submissions.length, description: 'All submissions' },
    { title: 'Awaiting Review', value: submissions.filter((s: any) => s.status === 'submitted').length, description: 'Submitted tests' },
    { title: 'Passed', value: submissions.filter((s: any) => s.status === 'passed').length, description: 'Successful candidates' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your tests and candidates</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/tests/new">Create New Test</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardFilters tests={tests} onFilterChange={handleFilterChange} />

      <div className="mt-6">
        <KanbanBoard submissions={filteredSubmissions} />
      </div>
    </div>
  );
}
