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
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, UserPlus } from 'lucide-react';

type Recruiter = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  stats: {
    testsCreated: number;
    linksCreated: number;
    submissions: number;
    completedSubmissions: number;
  };
};

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [newRecruiterName, setNewRecruiterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const response = await fetch('/api/admin/recruiters');
      const data = await response.json();
      
      if (response.ok) {
        setRecruiters(data.recruiters || []);
      }
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newRecruiterEmail,
          name: newRecruiterName
        })
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewRecruiterEmail('');
        setNewRecruiterName('');
        fetchRecruiters();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create recruiter');
      }
    } catch (error) {
      console.error('Error creating recruiter:', error);
      alert('Failed to create recruiter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecruiter = async (recruiterId: string) => {
    if (!confirm('Are you sure you want to delete this recruiter? This action cannot be undone.')) {
      return;
    }

    setDeletingId(recruiterId);
    try {
      const response = await fetch(`/api/admin/recruiters?id=${recruiterId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRecruiters();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete recruiter');
      }
    } catch (error) {
      console.error('Error deleting recruiter:', error);
      alert('Failed to delete recruiter');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRecruiters = recruiters.filter(recruiter => 
    recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recruiter.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recruiters</h1>
          <p className="text-gray-500 mt-1">Manage all recruiters</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-500">Loading recruiters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Recruiters</h1>
          <p className="text-gray-500 mt-1">Manage all recruiters and their activities</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Recruiter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddRecruiter}>
              <DialogHeader>
                <DialogTitle>Add New Recruiter</DialogTitle>
                <DialogDescription>
                  Create a new recruiter account. They will receive login credentials via email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newRecruiterName}
                    onChange={(e) => setNewRecruiterName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newRecruiterEmail}
                    onChange={(e) => setNewRecruiterEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Recruiter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tests Created</TableHead>
              <TableHead>Links Created</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecruiters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No recruiters found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecruiters.map((recruiter) => (
                <TableRow key={recruiter.id}>
                  <TableCell>
                    <div className="font-medium">{recruiter.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{recruiter.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{recruiter.stats.testsCreated}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{recruiter.stats.linksCreated}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{recruiter.stats.submissions}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{recruiter.stats.completedSubmissions}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(recruiter.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecruiter(recruiter.id)}
                      disabled={deletingId === recruiter.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          Showing {filteredRecruiters.length} of {recruiters.length} recruiters
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600">Total Recruiters</div>
            <div className="text-2xl font-bold text-blue-900">{recruiters.length}</div>
          </div>
          <div>
            <div className="text-blue-600">Total Tests</div>
            <div className="text-2xl font-bold text-blue-900">
              {recruiters.reduce((sum, r) => sum + r.stats.testsCreated, 0)}
            </div>
          </div>
          <div>
            <div className="text-blue-600">Total Links</div>
            <div className="text-2xl font-bold text-blue-900">
              {recruiters.reduce((sum, r) => sum + r.stats.linksCreated, 0)}
            </div>
          </div>
          <div>
            <div className="text-blue-600">Total Submissions</div>
            <div className="text-2xl font-bold text-blue-900">
              {recruiters.reduce((sum, r) => sum + r.stats.submissions, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
