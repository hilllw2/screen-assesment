'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAutoDisqualify } from '@/hooks/useAutoDisqualify';

interface AutoDisqualifyButtonProps {
  submissionId: string;
  writtenScore: number | null | undefined;
  audioScore: number | null | undefined;
  isAlreadyDisqualified: boolean;
  onDisqualified?: (reason: string) => void;
}

const SCORE_THRESHOLD = 2.8;

export function AutoDisqualifyButton({
  submissionId,
  writtenScore,
  audioScore,
  isAlreadyDisqualified,
  onDisqualified,
}: AutoDisqualifyButtonProps) {
  const { checkAndDisqualify, loading, error } = useAutoDisqualify();
  const [result, setResult] = useState<any>(null);

  // Check if scores warrant disqualification
  const hasLowScores =
    (writtenScore !== null && writtenScore !== undefined && writtenScore < SCORE_THRESHOLD) ||
    (audioScore !== null && audioScore !== undefined && audioScore < SCORE_THRESHOLD);

  if (!hasLowScores || isAlreadyDisqualified) {
    return null;
  }

  const handleAutoDisqualify = async () => {
    if (!writtenScore || !audioScore) {
      return;
    }

    const response = await checkAndDisqualify(submissionId, writtenScore, audioScore);
    if (response) {
      setResult(response);
      if (response.disqualified && onDisqualified) {
        onDisqualified(response.reason || '');
      }
    }
  };

  if (result?.disqualified) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Auto-Disqualified</h4>
            <p className="text-sm text-red-800 mt-1">{result.reason}</p>
            {result.webhookSent && (
              <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Webhook notification sent to recruiter
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-yellow-900">Low Assessment Scores Detected</h4>
          <p className="text-sm text-yellow-800 mt-1">
            {writtenScore && writtenScore < SCORE_THRESHOLD && `Written: ${writtenScore.toFixed(1)}`}
            {audioScore && audioScore < SCORE_THRESHOLD && writtenScore && writtenScore < SCORE_THRESHOLD && ' | '}
            {audioScore && audioScore < SCORE_THRESHOLD && `Verbal: ${audioScore.toFixed(1)}`}
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Candidate falls below the {SCORE_THRESHOLD} threshold. Auto-disqualify?
          </p>
        </div>
        <Button
          onClick={handleAutoDisqualify}
          disabled={loading}
          variant="destructive"
          size="sm"
          className="flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Auto-Disqualify'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2">Error: {error}</p>
      )}
    </div>
  );
}
