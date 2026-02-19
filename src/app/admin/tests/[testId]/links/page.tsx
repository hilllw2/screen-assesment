"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Copy, Link2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface TestLink {
  id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  submissions: { count: number }[];
}

interface Test {
  id: string;
  title: string | null;
  type: string;
  created_at: string;
}

export default function AdminTestLinksPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [links, setLinks] = useState<TestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTestAndLinks();
  }, [testId]);

  const fetchTestAndLinks = async () => {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/links`);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      setTest(data.test);
      setLinks(data.links);
    } catch (error) {
      console.error("Error fetching test links:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewLink = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/admin/tests/${testId}/links`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate link");

      await fetchTestAndLinks();
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/tests/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update link");

      await fetchTestAndLinks();
    } catch (error) {
      console.error("Error updating link:", error);
      alert("Failed to update link status");
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      const response = await fetch(`/api/admin/tests/links/${linkId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete link");

      await fetchTestAndLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      alert("Failed to delete link");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const getTestUrl = (token: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/test/${token}`;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!test) {
    return <div className="p-8">Test not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => router.push("/admin/tests")} className="mb-2">
            ← Back to Tests
          </Button>
          <h1 className="text-3xl font-bold">
            {test.title || "Untitled Test"}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="mr-2">{test.type}</Badge>
            Created {new Date(test.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={generateNewLink} disabled={generating}>
          {generating ? "Generating..." : "Generate New Link"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Links</CardTitle>
          <CardDescription>
            Manage all shareable links for this test
          </CardDescription>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No links created yet</p>
              <Button onClick={generateNewLink}>Generate First Link</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Full URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const fullUrl = getTestUrl(link.token);
                  const submissionCount = link.submissions?.[0]?.count || 0;

                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">
                            {link.token}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm truncate max-w-[300px]"
                          >
                            {fullUrl}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(fullUrl)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={() =>
                              toggleLinkStatus(link.id, link.is_active)
                            }
                          />
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {submissionCount}
                      </TableCell>
                      <TableCell>
                        {new Date(link.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-base">How to share</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>✓ Copy the full URL and share via email, WhatsApp, or any messaging platform</p>
          <p>✓ Toggle inactive to temporarily disable a link</p>
          <p>✓ Each link tracks submissions independently</p>
          <p>✓ Create multiple links to track different candidate sources</p>
        </CardContent>
      </Card>
    </div>
  );
}
