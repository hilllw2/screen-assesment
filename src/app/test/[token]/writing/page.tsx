"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const WRITING_TASKS = [
  {
    id: 1,
    video: "/Written-Assessment-Videos/Writing-Assessment-Task.mp4",
    timeLimit: 7 * 60, // 7 minutes in seconds
  },
  {
    id: 2,
    video: "/Written-Assessment-Videos/Writing-Assessment-Task-2.mp4",
    timeLimit: 7 * 60,
  },
  {
    id: 3,
    video: "/Written-Assessment-Videos/Writing-Assessment-Task-3.mp4",
    timeLimit: 7 * 60,
  },
  {
    id: 4,
    video: "/Written-Assessment-Videos/Writing-Assessment-Task-4.mp4",
    timeLimit: 7 * 60,
  },
  {
    id: 5,
    video: "/Written-Assessment-Videos/Writing-Assessment-Task-5.mp4",
    timeLimit: 7 * 60,
  },
];

export default function WritingAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  // Pick a random task index on first render
  const [randomTaskIndex] = useState(() => Math.floor(Math.random() * WRITING_TASKS.length));
  const [videoEnded, setVideoEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WRITING_TASKS[randomTaskIndex].timeLimit);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!submissionId) {
      router.push(`/test/${token}`);
    }
  }, [submissionId]);

  useEffect(() => {
    if (videoEnded) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [videoEnded]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  const handleSubmit = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSubmitting(true);
    try {
      await fetch(`/api/test/${token}/writing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          taskNumber: 1, // Always save to writing_part_1_text
          text: response,
        }),
      });
      await fetch(`/api/test/${token}/update-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          phase: "intelligence",
        }),
      });
      router.push(`/test/${token}/intelligence?sid=${submissionId}`);
    } catch (error) {
      console.error("Error submitting writing assessment:", error);
    }
    setSubmitting(false);
  };

  const task = WRITING_TASKS[randomTaskIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Writing Assessment</h1>
            <p className="text-muted-foreground">Random Task</p>
          </div>
          {videoEnded && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Time Remaining</div>
              <div
                className={`text-3xl font-bold ${
                  timeLeft < 60 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Task Instructions</CardTitle>
              <Badge>{videoEnded ? "Recording Response" : "Watch Video"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!videoEnded ? (
              <div className="aspect-video min-h-[400px] w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                  onEnded={handleVideoEnded}
                >
                  <source src={task.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Response
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[300px]"
                  autoFocus
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {response.length} characters
                  </p>
                  <Button onClick={handleSubmit} disabled={submitting || !response}>
                    Submit Writing Assessment
                  </Button>
                </div>
              </div>
            )}

            {!videoEnded && (
              <p className="text-sm text-muted-foreground text-center">
                Please watch the video to see the task instructions. The timer will
                start when the video ends.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
