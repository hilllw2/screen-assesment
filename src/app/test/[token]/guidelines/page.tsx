"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VIDEO_URLS } from "@/config/video-urls";
import { Monitor, CheckCircle2 } from "lucide-react";


export default function GuidelinesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenSharingEnabled, setScreenSharingEnabled] = useState(false);
  const [screenRecordingError, setScreenRecordingError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!submissionId) {
      router.push(`/test/${token}`);
    }
  }, [submissionId, router, token]);

  // Store MediaRecorder in sessionStorage so other pages can access it
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        // Don't stop here - let the test flow handle it
      }
    };
  }, []);

  const setupScreenRecording = async () => {
    try {
      setScreenRecordingError(null);
      console.log('🖥️ Requesting screen share...');
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor", // Prefer entire screen over window/tab
        } as any,
        audio: false, // Don't capture system audio
      });

      console.log('✅ Screen share granted');

      // Check if user selected entire screen (not just a tab/window)
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('📺 Screen capture settings:', settings);

      // Create MediaRecorder to record the screen
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`🎬 Screen recording chunk: ${event.data.size} bytes`);
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Screen recording stopped, uploading...');
        // Upload immediately when stopped
        const chunks = recordedChunksRef.current;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log(`📤 Uploading screen recording: ${blob.size} bytes from ${chunks.length} chunks`);

          const formData = new FormData();
          formData.append('file', blob);
          formData.append('type', 'screen');
          formData.append('submissionId', submissionId!);

          try {
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }

            const { url } = await response.json();
            console.log('✅ Screen recording uploaded:', url);

            // Save to database
            await fetch(`/api/test/${token}/screen-recording`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submissionId,
                screenRecordingUrl: url,
              }),
            });

            console.log('✅ Screen recording URL saved to database');
          } catch (error) {
            console.error('❌ Failed to upload screen recording:', error);
          }
        }
      };

      // Detect if user stops sharing (clicks "Stop sharing" button)
      videoTrack.onended = () => {
        console.log('⚠️ User stopped screen sharing');
        alert('Screen sharing was stopped. This will result in disqualification.');
        
        // Disqualify the submission
        fetch(`/api/test/${token}/disqualify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            reason: 'tab_switch', // Reuse existing violation type
          }),
        });
        
        // Redirect to finish page
        router.push(`/test/${token}/finish?sid=${submissionId}&disqualified=true`);
      };

      // Start recording with timeslice for periodic chunks
      mediaRecorder.start(10000); // Save chunks every 10 seconds
      setScreenSharingEnabled(true);
      
      console.log('🔴 Screen recording started');
      
      // Store stream reference in window so other pages can check if it's still active
      (window as any).__screenStream = stream;
      (window as any).__screenRecorder = mediaRecorder;
      (window as any).__screenChunks = recordedChunksRef.current;
      (window as any).__submissionId = submissionId;
      (window as any).__token = token;

    } catch (error: any) {
      console.error('❌ Screen sharing error:', error);
      
      if (error.name === 'NotAllowedError') {
        setScreenRecordingError('Screen sharing is required to start the assessment. Please grant permission and try again.');
      } else if (error.name === 'NotSupportedError') {
        setScreenRecordingError('Your browser does not support screen sharing. Please use Chrome, Edge, or Firefox.');
      } else {
        setScreenRecordingError(`Error: ${error.message}`);
      }
    }
  };

  const uploadScreenRecording = async () => {
    // This function is kept for backward compatibility but the actual upload
    // now happens in the onstop handler of the MediaRecorder
    console.log('⚠️ uploadScreenRecording called but upload should happen in onstop handler');
  };

  const handleBeginAssessment = async () => {
    if (!screenSharingEnabled) {
      alert('Please enable screen sharing first');
      return;
    }
    
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

  if (!submissionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Assessment Guidelines & Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video min-h-[400px] w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                playsInline
                onEnded={() => setVideoEnded(true)}
              >
                <source src={VIDEO_URLS.verbalOverview} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Please watch the entire video before proceeding</h3>
              <p className="text-sm text-blue-800">
                This video contains important instructions for the assessment. You must watch it completely to continue.
              </p>
            </div>

            {/* Screen Sharing Setup */}
            {videoEnded && (
              <>
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    🚨 Final Warning - Anti-Cheating Monitoring Active
                  </h3>
                  <p className="text-sm text-red-800 mb-3 font-medium">
                    Once you enable screen sharing and begin, the following actions will result in IMMEDIATE DISQUALIFICATION:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-red-900">
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Switching browser tabs
                    </div>
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Stopping screen sharing
                    </div>
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Opening other applications
                    </div>
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Using developer tools (F12)
                    </div>
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Refreshing the page
                    </div>
                    <div className="bg-white p-2 rounded border border-red-200">
                      ❌ Copy/pasting answers
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                    <p className="text-xs text-red-900 font-bold text-center">
                      Your entire screen is being recorded. Violations are automatically detected AND manually reviewed.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-6 w-6 text-yellow-700 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-2">
                        Screen Sharing Required
                      </h3>
                      <p className="text-sm text-yellow-800 mb-3">
                        Click the button below and select "Your Entire Screen" (not a single tab or window).
                        Ensure all secondary monitors are disconnected before proceeding.
                      </p>
                      
                      {!screenSharingEnabled ? (
                        <Button 
                          onClick={setupScreenRecording}
                          variant="outline"
                          className="bg-white"
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          Enable Screen Sharing
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          <CheckCircle2 className="h-5 w-5" />
                          Screen sharing enabled - Recording in progress
                        </div>
                      )}

                      {screenRecordingError && (
                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                          {screenRecordingError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleBeginAssessment}
                disabled={!videoEnded || !screenSharingEnabled || loading}
              >
                {loading ? "Starting..." : "I Understand, Begin Assessment"}
              </Button>
            </div>

            {!videoEnded && (
              <p className="text-center text-sm text-muted-foreground">
                Please watch the complete video to enable the button
              </p>
            )}
            
            {videoEnded && !screenSharingEnabled && (
              <p className="text-center text-sm text-muted-foreground">
                Please enable screen sharing to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
