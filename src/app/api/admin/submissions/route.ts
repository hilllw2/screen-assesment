import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all submissions with related data
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      disqualified,
      disqualification_reason,
      started_at,
      submitted_at,
      disqualified_at,
      ai_scored,
      exported,
      current_phase,
      audio_recording_url,
      writing_part_1_text,
      writing_part_2_text,
      candidate:candidates (
        id,
        name,
        email
      ),
      test:tests (
        id,
        title,
        type
      ),
      test_link:test_links (
        id,
        token
      ),
      scores:submission_scores (
        intelligence_score,
        personality_score,
        audio_score_by_ai,
        written_test_score_by_ai,
        audio_score_by_human,
        written_test_score_by_human
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { submissionId, action, status } = body;

  if (action === 'export') {
    const { error } = await supabase
      .from('submissions')
      .update({
        exported: true,
        exported_at: new Date().toISOString(),
        exported_by: user.id
      })
      .eq('id', submissionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'updateStatus') {
    if (!status || !['passed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch submission with all details for webhook
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        candidate:candidates (
          id,
          name,
          email
        ),
        test:tests (
          id,
          title,
          type,
          webhook_url
        ),
        scores:submission_scores (
          intelligence_score,
          personality_score,
          audio_score_by_ai,
          written_test_score_by_ai,
          audio_score_by_human,
          written_test_score_by_human
        )
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Update status
    const { error } = await supabase
      .from('submissions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger webhook if status is 'passed'
    if (status === 'passed') {
      const testData = submission.test as any;
      const candidateData = submission.candidate as any;
      const scoresData = submission.scores as any;
      
      const webhookUrl = testData?.webhook_url;
      
      if (webhookUrl) {
        // Calculate total score
        const intelligenceScore = ((scoresData?.intelligence_score || 0) / 20) * 5;
        const personalityScore = ((scoresData?.personality_score || 0) / 20) * 5;
        const verbalScore = scoresData?.audio_score_by_ai || scoresData?.audio_score_by_human || 0;
        const writingScore = scoresData?.written_test_score_by_ai || scoresData?.written_test_score_by_human || 0;
        const totalScore = intelligenceScore + personalityScore + verbalScore + writingScore;

        const webhookPayload = {
          event: 'candidate_passed',
          submission_id: submission.id,
          candidate: {
            id: candidateData?.id,
            name: candidateData?.name,
            email: candidateData?.email
          },
          test: {
            id: testData?.id,
            title: testData?.title,
            type: testData?.type
          },
          scores: {
            intelligence: parseFloat(intelligenceScore.toFixed(1)),
            personality: parseFloat(personalityScore.toFixed(1)),
            verbal: verbalScore,
            writing: writingScore,
            total: parseFloat(totalScore.toFixed(1)),
            total_out_of: 20,
            percentage: parseFloat(((totalScore / 20) * 100).toFixed(1))
          },
          timestamps: {
            started_at: submission.started_at,
            submitted_at: submission.submitted_at,
            passed_at: new Date().toISOString()
          }
        };

        // Send webhook (don't wait for it, fire and forget)
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ScreeningApp-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload)
        }).then(response => {
          console.log(`✅ Webhook sent to ${webhookUrl}:`, response.status);
        }).catch(error => {
          console.error(`❌ Webhook failed to ${webhookUrl}:`, error);
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  // bulk export (export all / selected)
  if (action === 'exportAll') {
    // body may contain an array of ids to update, otherwise update every row
    const { ids } = body;
    let query = supabase.from('submissions').update({
      exported: true,
      exported_at: new Date().toISOString(),
      exported_by: user.id
    });

    if (Array.isArray(ids) && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
