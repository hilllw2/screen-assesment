"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

const TIME_LIMIT = 12 * 60; // 12 minutes in seconds

export default function IntelligenceTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      router.push(`/test/${token}`);
      return;
    }

    fetchQuestions();
  }, [submissionId]);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, timeLeft]);

  const fetchQuestions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/test/${token}/intelligence?submissionId=${submissionId}`
      );
      const text = await response.text();
      if (text.startsWith("<")) {
        setQuestions([]);
        setLoadError(
          "Server returned a page instead of data (e.g. redirect to login). Check that test link is correct and try again."
        );
        return;
      }
      let data: { questions?: unknown[]; error?: string; details?: string; debug?: { totalActive: number; categoriesSeen?: string[] } };
      try {
        data = JSON.parse(text);
      } catch {
        setQuestions([]);
        setLoadError("Invalid response from server. Try again.");
        return;
      }
      const list = Array.isArray(data?.questions) ? (data.questions as Question[]) : [];
      setQuestions(list);
      if (!response.ok) {
        const msg = data?.error || response.statusText;
        setLoadError(msg);
        console.error("Intelligence API error:", msg, data?.details);
      } else if (list.length === 0 && data?.debug) {
        setLoadError(
          `No intelligence questions found. Active questions in DB: ${data.debug.totalActive}. Categories: ${data.debug.categoriesSeen?.join(", ") || "—"}.`
        );
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
      setLoadError("Failed to load questions. Check the browser console.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/test/${token}/intelligence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          answers,
        }),
      });

      await fetch(`/api/test/${token}/update-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          phase: "personality",
        }),
      });

      router.push(`/test/${token}/personality?sid=${submissionId}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Failed to submit answers. Please try again.");
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Intelligence Test</h1>
          <p className="text-muted-foreground">
            No questions are available right now. The question bank may not be loaded in the database.
          </p>
          {loadError && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
              {loadError}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to add intelligence questions, or try again later.
          </p>
          <Button onClick={() => fetchQuestions()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Intelligence Test</h1>
            <p className="text-muted-foreground">
              {answeredCount} of {questions.length} questions answered
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Time Remaining</div>
            <div
              className={`text-3xl font-bold ${
                timeLeft < 120 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}
                  {answers[question.id] && (
                    <span className="ml-2 text-sm font-normal text-green-600">✓</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">{question.prompt}</p>
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [question.id]: value })
                  }
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="a" id={`${question.id}-a`} />
                    <Label
                      htmlFor={`${question.id}-a`}
                      className="flex-1 cursor-pointer"
                    >
                      A. {question.option_a}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="b" id={`${question.id}-b`} />
                    <Label
                      htmlFor={`${question.id}-b`}
                      className="flex-1 cursor-pointer"
                    >
                      B. {question.option_b}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="c" id={`${question.id}-c`} />
                    <Label
                      htmlFor={`${question.id}-c`}
                      className="flex-1 cursor-pointer"
                    >
                      C. {question.option_c}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="d" id={`${question.id}-d`} />
                    <Label
                      htmlFor={`${question.id}-d`}
                      className="flex-1 cursor-pointer"
                    >
                      D. {question.option_d}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
          >
            {submitting
              ? "Submitting..."
              : `Submit Intelligence Test (${answeredCount}/${questions.length})`}
          </Button>
        </div>

        {answeredCount < questions.length && (
          <p className="text-center text-sm text-muted-foreground">
            Please answer all questions before submitting
          </p>
        )}
      </div>
    </div>
  );
}
