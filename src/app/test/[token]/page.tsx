import { createServiceRoleClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TestLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  // Fetch test link and test details (candidates are not logged in; service role bypasses RLS)
  const { data: testLink, error } = await supabase
    .from("test_links")
    .select(`
      *,
      tests (
        id,
        type,
        title,
        created_at
      )
    `)
    .eq("token", token)
    .single();

  if (error || !testLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This test link is invalid or has expired. Please contact the recruiter for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if link is active
  if (!testLink.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-orange-600">Link Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This test link has been deactivated. Please contact the recruiter for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if link has expired
  if (testLink.expires_at && new Date(testLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-orange-600">Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This test link expired on {new Date(testLink.expires_at).toLocaleDateString()}. Please contact the recruiter for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const test = (testLink as any).tests;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Badge className="mb-4" variant="secondary">
            {test.type === "screening" ? "Screening Assessment" : "Upwork Video Test"}
          </Badge>
          <h1 className="text-4xl font-bold mb-2">
            Welcome to the Assessment
          </h1>
          {test.title && (
            <p className="text-xl text-muted-foreground">{test.title}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Before You Begin</CardTitle>
            <CardDescription>
              Please read these important instructions carefully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.type === "screening" ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Assessment Structure:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Part 1: Guidelines & Overview (Video)</li>
                    <li>Part 2: Writing Assessment (5 tasks, 7 minutes each)</li>
                    <li>Part 3: Intelligence Test (20 questions, 12 minutes)</li>
                    <li>Part 4: Personality Test (20 questions, 15 minutes)</li>
                    <li>Part 5: Verbal Assessment (3 video questions with audio responses)</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Requirements:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    <li>Screen sharing will be required throughout the test</li>
                    <li>Multiple monitors must be disabled</li>
                    <li>Switching tabs will disqualify your submission</li>
                    <li>Refreshing the page will disqualify your submission</li>
                    <li>Developer tools must remain closed</li>
                    <li>Ensure you have a stable internet connection</li>
                    <li>Complete all parts in one sitting - you cannot pause and resume</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Test Format:</h3>
                  <p className="text-sm">
                    You will record a video introduction (maximum 5 minutes).
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Requirements:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    <li>Ensure your camera and microphone are working</li>
                    <li>Find a quiet, well-lit location</li>
                    <li>You can re-record if needed</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
            <CardDescription>
              Please provide your details to begin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={`/test/${token}/start`} method="POST" className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="john@example.com"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Start Assessment
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>By starting this assessment, you agree to comply with all test rules and requirements.</p>
        </div>
      </div>
    </div>
  );
}
