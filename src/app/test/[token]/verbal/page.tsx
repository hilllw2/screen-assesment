"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, ArrowRight, Loader2, Volume2 } from "lucide-react";

// Video sequences based on file structure
const VERBAL_QUESTIONS = [
  {
    id: 1,
    preparationVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-8-Question-1-Preparation.mp4",
    questionVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-9-Question-1.mp4",
  },
  {
    id: 2,
    preparationVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-10-Question-2-Preparation.mp4",
    questionVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-11-Question-2.mp4",
  },
  {
    id: 3,
    preparationVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-14-Question-3-Preparation.mp4",
    questionVideo: "/Verbal-Assessment-Videos/Verbal-Assessment-Video-15-Question-3.mp4",
  },
];

type Phase = "instruction" | "mic_check" | "preparation" | "question" | "recording" | "uploading" | "completed";

export default function VerbalAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<Phase>("instruction");
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!submissionId) {
      router.push(`/test/${token}`);
    }
  }, [submissionId, token, router]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoEnded = () => {
    if (phase === "instruction") {
      setPhase("mic_check");
    } else if (phase === "preparation") {
      setPhase("question");
    } else if (phase === "question") {
      startRecordingSegment();
    }
  };

  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      mediaRecorder.pause();
      
      setMicReady(true);
    } catch (error) {
      console.error("Mic access denied:", error);
      alert("Microphone access is required to proceed.");
    }
  };

  const startTest = () => {
    // MediaRecorder is ready but paused, we'll start it when each question begins
    setPhase("preparation");
  };

  const startRecordingSegment = () => {
    // Start recording for this question
    audioChunksRef.current = []; // Clear previous chunks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsRecordingActive(true);
    }
    setPhase("recording");
  };

  const proceedToNext = async () => {
    // Pause recording and upload current question
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsRecordingActive(false);
    }

    // Upload current question's audio
    await uploadQuestionRecording(currentQuestion);

    // Move to next question or finish
    if (currentQuestion < VERBAL_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setPhase("preparation");
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = async () => {
    setPhase("uploading");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Save all URLs to DB
    await saveAllRecordingsToDb();

    // Complete phase
    await fetch(`/api/test/${token}/update-phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        phase: "finish",
      }),
    });

    router.push(`/test/${token}/finish?sid=${submissionId}`);
  };

  const uploadQuestionRecording = async (questionIndex: number) => {
    if (audioChunksRef.current.length === 0) {
      console.warn(`No audio recorded for question ${questionIndex + 1}`);
      return;
    }

    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("type", "audio");
    formData.append("submissionId", submissionId!);
    formData.append("questionNumber", String(questionIndex + 1));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      uploadedUrlsRef.current[questionIndex] = url;
      console.log(`✅ Uploaded question ${questionIndex + 1}:`, url);

    } catch (error) {
      console.error(`Upload failed for question ${questionIndex + 1}:`, error);
      alert(`Upload failed for question ${questionIndex + 1}. Please try again.`);
      throw error;
    }
  };

  const saveAllRecordingsToDb = async () => {
    try {
      await fetch(`/api/test/${token}/verbal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          verbalQuestion1Url: uploadedUrlsRef.current[0] || null,
          verbalQuestion2Url: uploadedUrlsRef.current[1] || null,
          verbalQuestion3Url: uploadedUrlsRef.current[2] || null,
        }),
      });
    } catch (error) {
      console.error("Failed to save recordings to DB:", error);
      throw error;
    }
  };

  const question = VERBAL_QUESTIONS[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Verbal Assessment</h1>
          <p className="text-muted-foreground">
             Step {currentQuestion + 1} of {VERBAL_QUESTIONS.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {phase === "instruction" && "Start Instructions"}
                {phase === "mic_check" && "Microphone Check"}
                {(phase === "preparation" || phase === "question") && `Question ${currentQuestion + 1}`}
                {phase === "recording" && "Recording Answer"}
                {phase === "uploading" && "Uploading..."}
              </CardTitle>
              <Badge variant={isRecordingActive ? "destructive" : "secondary"}>
                {isRecordingActive ? "Recording On" : "Status: " + phase}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {phase === "instruction" && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    src="/Verbal-Assessment-Videos/Verbal-Assessment-Video-7-Start-Instructions.mp4"
                    className="w-full h-full"
                    autoPlay
                    onEnded={handleVideoEnded}
                    controls={false}
                />
                </div>
            )}

            {phase === "mic_check" && (
                <div className="flex flex-col items-center py-10 space-y-6">
                    <div className="p-6 bg-blue-100 rounded-full">
                        <Mic className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold">Microphone Setup</h3>
                        <p className="text-gray-500 mt-2">Please enable your microphone to begin.</p>
                    </div>
                    {!micReady ? (
                        <Button size="lg" onClick={setupMicrophone}>
                            <Volume2 className="mr-2 h-4 w-4" /> Enable Microphone
                        </Button>
                    ) : (
                        <Button size="lg" onClick={startTest}>
                            Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {(phase === "preparation" || phase === "question") && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  key={`${phase}-${currentQuestion}`}
                  src={phase === "preparation" ? question.preparationVideo : question.questionVideo}
                  className="w-full h-full"
                  autoPlay
                  onEnded={handleVideoEnded}
                />
              </div>
            )}

            {phase === "recording" && (
              <div className="flex flex-col items-center py-10 space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                    <div className="bg-red-100 p-6 rounded-full relative z-10 border-2 border-red-500">
                      <Mic className="w-12 h-12 text-red-600" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold">Recording...</h3>
                <Button size="lg" className="px-8" onClick={proceedToNext}>
                  Proceed <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {phase === "uploading" && (
               <div className="flex flex-col items-center py-10 space-y-6">
                 <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                 <p>Uploading responses...</p>
               </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
