import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export default async function AdminTestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/login");
  }

  // Fetch all tests (admin can see all)
  const { data: tests, error } = await supabase
    .from("tests")
    .select(
      `
      *,
      users!tests_created_by_user_id_fkey (
        name,
        email
      ),
      test_links (count),
      submissions (count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tests:", error);
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

      {tests && tests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Test Management</CardTitle>
            <CardDescription>
              All screening and upwork tests in the system
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
                {tests.map((test: any) => (
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
              No tests have been created yet
            </p>
            <Link href="/admin/tests/new">
              <Button>Create First Test</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
