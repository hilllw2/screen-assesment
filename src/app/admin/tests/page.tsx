'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

type Test = {
  id: string;
  title: string | null;
  type: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
  test_links?: Array<{ count: number }>;
  submissions?: Array<{ count: number }>;
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/admin/tests');
      const data = await response.json();
      if (response.ok) {
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from test titles
  const extractCategory = (title: string | null): string => {
    if (!title) return "Uncategorized";
    // Extract first word or phrase before dash/colon as category
    const match = title.match(/^([^-:]+)/);
    return match ? match[1].trim() : title.trim();
  };

  const categories = Array.from(
    new Set(tests.map(test => extractCategory(test.title)))
  ).sort();

  // Filter tests based on search and category
  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchQuery || 
      (test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       test.users?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       test.users?.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || 
      extractCategory(test.title) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">All Tests</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading tests...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Tests</h1>
          <p className="text-muted-foreground">
            View and manage all assessment tests across all recruiters
          </p>
        </div>
        <Link href="/admin/tests/new">
          <Button>Create New Test</Button>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by test name, creator name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Filter by Category:</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Tests ({tests.length})
                </Badge>
                {categories.map(category => {
                  const count = tests.filter(t => extractCategory(t.title) === category).length;
                  return (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setSelectedCategory(
                        selectedCategory === category ? null : category
                      )}
                    >
                      {category} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || selectedCategory) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary">
                  Category: {selectedCategory}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredTests && filteredTests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Test Management</CardTitle>
            <CardDescription>
              {filteredTests.length === tests.length 
                ? `All ${tests.length} tests in the system`
                : `Showing ${filteredTests.length} of ${tests.length} tests`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-center"># of Links</TableHead>
                  <TableHead className="text-center"># of Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test: any) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">
                      {test.title || "Untitled Test"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          test.type === "screening" ? "default" : "secondary"
                        }
                      >
                        {test.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{test.users?.name || "Unknown"}</div>
                        <div className="text-muted-foreground">{test.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(test.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {test.test_links?.[0]?.count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {test.submissions?.[0]?.count || 0}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/tests/${test.id}/links`}>
                        <Button variant="outline" size="sm">
                          View Links
                        </Button>
                      </Link>
                      <Link href={`/admin/submissions?testId=${test.id}`}>
                        <Button variant="ghost" size="sm">
                          Submissions
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {tests.length === 0 
                ? "No tests have been created yet"
                : "No tests match your search criteria"}
            </p>
            {tests.length === 0 ? (
              <Link href="/admin/tests/new">
                <Button>Create First Test</Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
