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
            Screening Assessment
          </Badge>
          <h1 className="text-4xl font-bold mb-2">
            Welcome to the Assessment
          </h1>
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
                  <h3 className="font-semibold mb-2">Assessment Outline:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Guidelines & Overview (Video)</li>
                    <li>Writing (7 minutes)</li>
                    <li>Problem Solving (12 minutes)</li>
                    <li>Personality Profile (10 minutes)</li>
                    <li>Verbal (3 minutes)</li>
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
                
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    🚨 Automatic Disqualification - How You Will Be Caught
                  </h3>
                  <p className="text-sm text-red-800 mb-3 font-medium">
                    Our system automatically monitors the following violations. Any violation will result in immediate disqualification:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        1. Tab Switching / Window Switching
                      </div>
                      <p className="text-xs text-red-700">
                        Leaving this browser tab or switching to another application will be detected and recorded. 
                        Do NOT open email, chat apps, search engines, or any other programs.
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        2. Stopping Screen Sharing
                      </div>
                      <p className="text-xs text-red-700">
                        If you stop screen sharing at any point (clicking "Stop Sharing" button), you will be automatically disqualified immediately.
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        3. Opening Developer Tools / Console
                      </div>
                      <p className="text-xs text-red-700">
                        Opening browser developer tools (F12, Inspect Element, etc.) is monitored and will disqualify you.
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        4. Copying / Pasting Text
                      </div>
                      <p className="text-xs text-red-700">
                        Copy-paste actions are tracked. All written responses must be typed by you directly.
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        5. Multiple Monitors Detected
                      </div>
                      <p className="text-xs text-red-700">
                        Using multiple monitors allows viewing answers on another screen. Disable all secondary monitors before starting.
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="font-semibold text-red-900 text-sm mb-1">
                        6. Page Refresh / Browser Back Button
                      </div>
                      <p className="text-xs text-red-700">
                        Refreshing the page or using back/forward buttons will disqualify you. Progress cannot be resumed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
                    <p className="text-xs text-red-900 font-semibold">
                      ⚠️ Your entire screen is recorded. The recruiter will review the full recording if any suspicious activity is detected.
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ Before You Start - Preparation Checklist
                  </h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Close ALL other browser tabs and applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Disconnect all secondary monitors (use only ONE screen)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Close messaging apps (Slack, Teams, WhatsApp, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Turn off phone notifications and place phone away</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Find a quiet location where you won't be interrupted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Ensure stable internet connection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Test your microphone (required for verbal assessment)</span>
                    </li>
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
