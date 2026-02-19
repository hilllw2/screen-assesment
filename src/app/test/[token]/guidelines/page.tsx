"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTestProctoring } from "@/components/test/AntiCheatLayer";

export default function GuidelinesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");
  
  const { startProctoring, error: proctorError } = useTestProctoring();
  
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!submissionId) {
    router.push(`/test/${token}`);
    return null;
  }

  const handleBeginAssessment = async () => {
    setLoading(true);
    const success = await startProctoring();
    
    if (success) {
      // Update submission phase
      await fetch(`/api/test/${token}/update-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          phase: "writing",
        }),
      });

      // Navigate to writing assessment
      router.push(`/test/${token}/writing?sid=${submissionId}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Assessment Guidelines & Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                onEnded={() => setVideoEnded(true)}
              >
                <source src="/Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Please watch the entire video before proceeding</h3>
              <p className="text-sm text-blue-800">
                This video contains important instructions for the assessment. You must watch it completely to continue.
              </p>
            </div>

            {proctorError && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">{proctorError}</p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleBeginAssessment}
                disabled={!videoEnded || loading}
              >
                {loading ? "Starting..." : "I Understand, Begin Assessment"}
              </Button>
            </div>

            {!videoEnded && (
              <p className="text-center text-sm text-muted-foreground">
                Please watch the complete video to enable the button
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
