import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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

  // Fetch submission with all related data
  const { data: submission, error } = await supabase
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
        type
      ),
      test_link:test_links (
        id,
        token
      ),
      scores:submission_scores (*),
      notes:submission_notes (*),
      answers:submission_answers (
        id,
        selected_option,
        is_correct,
        score_awarded,
        answered_at,
        question:questions (
          id,
          category,
          prompt,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option,
          difficulty
        )
      ),
      violations:submission_violations (
        id,
        violation_type,
        detected_at,
        metadata
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  return NextResponse.json({ submission });
}
