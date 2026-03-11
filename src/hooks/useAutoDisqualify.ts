import { useState } from 'react';

interface AutoDisqualifyResponse {
  success: boolean;
  message: string;
  disqualified: boolean;
  reason?: string;
  webhookSent?: boolean;
}

export function useAutoDisqualify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAndDisqualify = async (
    submissionId: string,
    writtenScore: number,
    audioScore: number
  ): Promise<AutoDisqualifyResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/submissions/${submissionId}/auto-disqualify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            written_score: writtenScore,
            audio_score: audioScore,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process auto-disqualify');
      }

      const data: AutoDisqualifyResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { checkAndDisqualify, loading, error };
}
