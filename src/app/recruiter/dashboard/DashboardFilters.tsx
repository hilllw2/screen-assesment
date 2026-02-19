'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KanbanBoard } from './KanbanBoard';
import { Search, Filter } from 'lucide-react';

interface DashboardFiltersProps {
  tests: any[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  testId: string;
  status: string;
  search: string;
  startDate: string;
  endDate: string;
}

export function DashboardFilters({ tests, onFilterChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    testId: 'all',
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterUpdate = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by candidate name or email..."
            value={filters.search}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Test Selector */}
        <Select
          value={filters.testId}
          onValueChange={(value) => handleFilterUpdate('testId', value)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select Test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {tests.map((test) => (
              <SelectItem key={test.id} value={test.id}>
                {test.title || `${test.type} Test`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterUpdate('status', value)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterUpdate('startDate', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-600 mb-1 block">End Date</label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterUpdate('endDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
