"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function GuidelinesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");
  

  
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoError(null);
    setNeedsManualPlay(false);
    const id = requestAnimationFrame(() => {
      video.play().catch(() => {
        setNeedsManualPlay(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!submissionId) {
    router.push(`/test/${token}`);
    return null;
  }

  const handleBeginAssessment = async () => {
    setLoading(true);
    await fetch(`/api/test/${token}/update-phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        phase: "writing",
      }),
    });
    router.push(`/test/${token}/writing?sid=${submissionId}`);
  };

  const handleManualPlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setNeedsManualPlay(false);
    } catch {
      setNeedsManualPlay(true);
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
            <div className="relative aspect-video min-h-[400px] w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                playsInline
                preload="auto"
                onEnded={() => setVideoEnded(true)}
                onPlay={() => setNeedsManualPlay(false)}
                onError={() =>
                  setVideoError(
                    "Video could not load for this session. Please refresh once and press Play again."
                  )
                }
              >
                <source src="/Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {needsManualPlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Button onClick={handleManualPlay}>Play video</Button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Please watch the entire video before proceeding</h3>
              <p className="text-sm text-blue-800">
                This video contains important instructions for the assessment. You must watch it completely to continue.
              </p>
            </div>



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
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Please watch the complete video to enable the button
                </p>
                {videoError && (
                  <p className="text-center text-sm text-red-600">{videoError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
