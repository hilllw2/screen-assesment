"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpworkTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useState<MediaRecorder | null>(null)[0];
  const streamRef = useState<MediaStream | null>(null)[0];
  const videoChunksRef = useState<Blob[]>([])[0];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      const videoElement = document.getElementById("preview") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef, { type: "video/webm" });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Camera/microphone access is required. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef) {
      mediaRecorderRef.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!videoBlob) {
      alert("Please record your video first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", videoBlob);
      formData.append("type", "video");
      formData.append("submissionId", submissionId!);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const { url } = await uploadResponse.json();

      await fetch(`/api/test/${token}/upwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          videoUrl: url,
        }),
      });

      router.push(`/test/${token}/finish?sid=${submissionId}`);
    } catch (error) {
      console.error("Error submitting video:", error);
      alert("Failed to submit video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Upwork Video Assessment</h1>
          <p className="text-muted-foreground">
            Record a brief introduction video (maximum 5 minutes)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Recording</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!videoUrl ? (
              <>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    id="preview"
                    autoPlay
                    muted
                    className="w-full h-full"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  {!isRecording ? (
                    <Button size="lg" onClick={startRecording}>
                      Start Recording
                    </Button>
                  ) : (
                    <Button size="lg" variant="destructive" onClick={stopRecording}>
                      Stop Recording
                    </Button>
                  )}
                </div>

                {isRecording && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-red-600">
                      <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                      <span className="font-medium">Recording...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video controls className="w-full h-full">
                    <source src={videoUrl} type="video/webm" />
                  </video>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVideoBlob(null);
                      setVideoUrl(null);
                      videoChunksRef.length = 0;
                    }}
                  >
                    Re-record
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? "Uploading..." : "Submit Video"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6 text-sm text-blue-900">
            <p className="font-semibold mb-2">Tips for a great video:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure good lighting and a quiet environment</li>
              <li>Look at the camera and speak clearly</li>
              <li>Introduce yourself and highlight relevant experience</li>
              <li>Keep it concise and professional</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
