import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SCORE_THRESHOLD = 2.8;

interface WebhookPayload {
  event: string;
  submission_id: string;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  test: {
    id: string;
    title: string;
  };
  disqualification_reason: string;
  scores: {
    written_test_score?: number;
    audio_score?: number;
  };
  timestamp: string;
}

async function sendWebhook(payload: WebhookPayload): Promise<boolean> {
  try {
    const webhookUrl = process.env.RECRUITERFLOW_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ RECRUITERFLOW_WEBHOOK_URL not configured');
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RF-Api-Key': process.env.RECRUITERFLOW_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook failed with status ${response.status}`);
      return false;
    }

    console.log('✅ Webhook sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
    return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { written_score, audio_score } = await request.json();

    if (
      written_score === undefined ||
      audio_score === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required scores' },
        { status: 400 }
      );
    }

    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        candidate:candidates (id, name, email),
        test:tests (id, title)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    let disqualificationReason = '';
    let shouldDisqualify = false;

    if (written_score < SCORE_THRESHOLD && audio_score < SCORE_THRESHOLD) {
      disqualificationReason = 'Failed both written and verbal assessments';
      shouldDisqualify = true;
    } else if (written_score < SCORE_THRESHOLD) {
      disqualificationReason = 'Failed written assessment';
      shouldDisqualify = true;
    } else if (audio_score < SCORE_THRESHOLD) {
      disqualificationReason = 'Failed verbal assessment';
      shouldDisqualify = true;
    }

    if (!shouldDisqualify) {
      return NextResponse.json(
        {
          success: true,
          message: 'Candidate meets minimum score requirements',
          disqualified: false,
        },
        { status: 200 }
      );
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        disqualified: true,
        disqualification_reason: disqualificationReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to disqualify candidate' },
        { status: 500 }
      );
    }

    const payload: WebhookPayload = {
      event: 'candidate_disqualified',
      submission_id: id,
      candidate: {
        id: submission.candidate.id,
        name: submission.candidate.name,
        email: submission.candidate.email,
      },
      test: {
        id: submission.test.id,
        title: submission.test.title,
      },
      disqualification_reason: disqualificationReason,
      scores: {
        written_test_score: written_score,
        audio_score: audio_score,
      },
      timestamp: new Date().toISOString(),
    };

    const webhookSent = await sendWebhook(payload);

    return NextResponse.json(
      {
        success: true,
        message: 'Candidate disqualified successfully',
        disqualified: true,
        reason: disqualificationReason,
        webhookSent: webhookSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in auto-disqualify handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
