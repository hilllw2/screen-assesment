import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify submission exists and user has access
    const { data: submission } = await supabase
      .from('submissions')
      .select('test_id')
      .eq('id', id)
      .single();

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (userData.role === 'recruiter') {
      const { data: test } = await supabase
        .from('tests')
        .select('created_by')
        .eq('id', submission.test_id)
        .single();

      if (test?.created_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Validate scores
    const { written_test_score_by_human, audio_score_by_human } = body;

    if (
      written_test_score_by_human !== undefined &&
      (written_test_score_by_human < 0 || written_test_score_by_human > 10)
    ) {
      return NextResponse.json(
        { error: 'Written test score must be between 0 and 10' },
        { status: 400 }
      );
    }

    if (
      audio_score_by_human !== undefined &&
      (audio_score_by_human < 0 || audio_score_by_human > 10)
    ) {
      return NextResponse.json(
        { error: 'Audio score must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Check if scores record exists
    const { data: existingScores } = await supabase
      .from('submission_scores')
      .select('*')
      .eq('submission_id', id)
      .single();

    let result;
    if (existingScores) {
      // Update existing scores
      const { data, error } = await supabase
        .from('submission_scores')
        .update({
          written_test_score_by_human,
          audio_score_by_human,
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new scores record
      const { data, error } = await supabase
        .from('submission_scores')
        .insert({
          submission_id: id,
          written_test_score_by_human,
          audio_score_by_human,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ scores: result });
  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
