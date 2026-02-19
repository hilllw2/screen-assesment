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
  const { submissionId, action } = body;

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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
