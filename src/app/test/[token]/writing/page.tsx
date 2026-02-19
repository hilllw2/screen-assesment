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

  const [currentTask, setCurrentTask] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WRITING_TASKS[0].timeLimit);
  const [responses, setResponses] = useState<string[]>(["", "", "", "", ""]);
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
      // Start timer when video ends
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextTask();
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
  }, [videoEnded, currentTask]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  const handleNextTask = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Save current response
    await saveResponse(currentTask, responses[currentTask]);

    if (currentTask < WRITING_TASKS.length - 1) {
      // Move to next task
      setCurrentTask(currentTask + 1);
      setVideoEnded(false);
      setTimeLeft(WRITING_TASKS[currentTask + 1].timeLimit);
    } else {
      // All tasks complete, move to next phase
      await completeWritingAssessment();
    }
  };

  const saveResponse = async (taskIndex: number, text: string) => {
    try {
      await fetch(`/api/test/${token}/writing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          taskNumber: taskIndex + 1,
          text,
        }),
      });
    } catch (error) {
      console.error("Error saving response:", error);
    }
  };

  const completeWritingAssessment = async () => {
    setSubmitting(true);
    try {
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
      console.error("Error completing writing assessment:", error);
    }
  };

  const task = WRITING_TASKS[currentTask];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Writing Assessment</h1>
            <p className="text-muted-foreground">
              Task {currentTask + 1} of {WRITING_TASKS.length}
            </p>
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
              <CardTitle>Task {currentTask + 1} Instructions</CardTitle>
              <Badge>{videoEnded ? "Recording Response" : "Watch Video"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!videoEnded ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  autoPlay
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
                  value={responses[currentTask]}
                  onChange={(e) => {
                    const newResponses = [...responses];
                    newResponses[currentTask] = e.target.value;
                    setResponses(newResponses);
                  }}
                  placeholder="Type your response here..."
                  className="min-h-[300px]"
                  autoFocus
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {responses[currentTask].length} characters
                  </p>
                  <Button onClick={handleNextTask} disabled={submitting}>
                    {currentTask < WRITING_TASKS.length - 1
                      ? "Save & Continue to Next Task"
                      : "Submit Writing Assessment"}
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

        {/* Progress indicator */}
        <div className="flex gap-2 justify-center">
          {WRITING_TASKS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-12 rounded-full ${
                index === currentTask
                  ? "bg-blue-600"
                  : index < currentTask
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
