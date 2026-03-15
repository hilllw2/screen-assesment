"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAntiCheat } from "@/hooks/useAntiCheat";

interface Question {
  id: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  trait: string;
}

const TRAIT_LABELS: Record<string, string> = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism",
};

const TRAIT_COLORS: Record<string, string> = {
  openness: "border-purple-400 bg-purple-50/40",
  conscientiousness: "border-blue-400 bg-blue-50/40",
  extraversion: "border-emerald-400 bg-emerald-50/40",
  agreeableness: "border-amber-400 bg-amber-50/40",
  neuroticism: "border-rose-400 bg-rose-50/40",
};

const LIKERT_OPTIONS = [
  { value: "a", label: "Strongly Agree" },
  { value: "b", label: "Agree" },
  { value: "c", label: "Neutral" },
  { value: "d", label: "Disagree" },
  { value: "e", label: "Strongly Disagree" },
];

const TIME_LIMIT = 15 * 60; // 15 minutes

export default function PersonalityTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const submissionId = searchParams.get("sid");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useAntiCheat({ submissionId: submissionId || "", token, enabled: !!submissionId });

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
    try {
      const response = await fetch(`/api/test/${token}/personality?submissionId=${submissionId}`);
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
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
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/test/${token}/personality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, answers }),
      });

      await fetch(`/api/test/${token}/update-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, phase: "verbal" }),
      });

      router.push(`/test/${token}/verbal?sid=${submissionId}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Failed to submit answers. Please try again.");
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading personality assessment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border rounded-2xl shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Personality Assessment</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
            <div className={`text-right tabular-nums font-mono ${timeLeft < 120 ? "text-red-600" : "text-purple-700"}`}>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Time Left</div>
              <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Instructions ── */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 text-sm text-purple-900">
          <p className="font-semibold mb-1">How to complete this section:</p>
          <p>For each statement below, select how strongly you agree or disagree. There are no right or wrong answers — choose the option that best reflects your natural tendencies.</p>
        </div>

        {/* ── Questions ── */}
        <div className="space-y-5">
          {questions.map((question, index) => {
            const traitColor = TRAIT_COLORS[question.trait] || "border-gray-200 bg-white";
            const selected = answers[question.id];

            return (
              <Card
                key={question.id}
                className={`border-2 transition-all duration-200 ${traitColor} ${selected ? "shadow-md" : "shadow-sm"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                        {index + 1}
                      </span>
                      <CardTitle className="text-base font-semibold text-gray-800 leading-snug">
                        {question.prompt}
                      </CardTitle>
                    </div>
                    {selected && (
                      <span className="flex-shrink-0 text-green-500 text-lg">✓</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Desktop: horizontal Likert scale */}
                  <div className="hidden sm:grid grid-cols-5 gap-2">
                    {LIKERT_OPTIONS.map((opt) => {
                      const isSelected = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAnswers({ ...answers, [question.id]: opt.value })}
                          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 ${
                            isSelected
                              ? "border-purple-500 bg-purple-100 shadow-md"
                              : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className={`text-xs font-medium text-center leading-tight ${isSelected ? "text-purple-800" : "text-gray-600"}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile: vertical stacked list */}
                  <div className="sm:hidden space-y-2">
                    {LIKERT_OPTIONS.map((opt) => {
                      const isSelected = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAnswers({ ...answers, [question.id]: opt.value })}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 text-left ${
                            isSelected
                              ? "border-purple-500 bg-purple-100"
                              : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? "text-purple-800" : "text-gray-700"}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Submit ── */}
        <div className="pb-10 space-y-3 text-center">
          {!allAnswered && (
            <p className="text-sm text-gray-400">
              Please answer all {questions.length} questions before submitting
              ({questions.length - answeredCount} remaining)
            </p>
          )}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="px-12 py-3 rounded-xl font-semibold text-base bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              `Submit Personality Test (${answeredCount}/${questions.length})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
