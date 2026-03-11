'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";

export default function TestLandingPage() {
  const params = useParams();
  const token = params?.token as string;
  const [testLink, setTestLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTestLink() {
      try {
        const response = await fetch(`/api/test/${token}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          setError("invalid");
          setLoading(false);
          return;
        }

        const link = data.testLink;

        // Check if link is active
        if (!link.is_active) {
          setError("inactive");
          setTestLink(link);
          setLoading(false);
          return;
        }

        // Check if link has expired
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          setError("expired");
          setTestLink(link);
          setLoading(false);
          return;
        }

        setTestLink(link);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching test link:", err);
        setError("invalid");
        setLoading(false);
      }
    }

    if (token) {
      fetchTestLink();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error === "invalid") {
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

  if (error === "inactive") {
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

  if (error === "expired" && testLink?.expires_at) {
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

  const test = testLink?.tests;
  const isUpworkTest = test?.candidate_info_type === 'upwork';

  // Handler to allow pasting in form fields
  const handlePaste = (e: React.ClipboardEvent) => {
    e.stopPropagation();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/test/${token}/start`, {
        method: 'POST',
        body: formData,
      });

      if (response.redirected) {
        // Successful - follow redirect
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        if (data.code === 'DUPLICATE_SUBMISSION') {
          setSubmitError(data.error || 'You have already completed this test.');
        } else {
          setSubmitError(data.error || 'Failed to start test. Please try again.');
        }
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setSubmitError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
                  <h3 className="font-semibold mb-2">Outline</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
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
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  {submitError}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={submitting}
                  onPaste={handlePaste}
                  className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                  placeholder="John Doe"
                />
              </div>
              {isUpworkTest ? (
                <div>
                  <label htmlFor="upwork_profile_url" className="block text-sm font-medium mb-2">
                    Upwork Profile URL *
                  </label>
                  <input
                    type="url"
                    id="upwork_profile_url"
                    name="upwork_profile_url"
                    required
                    disabled={submitting}
                    onPaste={handlePaste}
                    className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    placeholder="https://www.upwork.com/freelancers/~..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your full Upwork profile URL
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    disabled={submitting}
                    onPaste={handlePaste}
                    className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    placeholder="john@example.com"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Starting...' : 'Start Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
