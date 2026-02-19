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

    const {
      written_test_review_notes_by_human,
      audio_review_notes_by_human,
    } = body;

    // Check if notes record exists
    const { data: existingNotes } = await supabase
      .from('submission_notes')
      .select('*')
      .eq('submission_id', id)
      .single();

    let result;
    if (existingNotes) {
      // Update existing notes
      const { data, error } = await supabase
        .from('submission_notes')
        .update({
          written_test_review_notes_by_human,
          audio_review_notes_by_human,
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new notes record
      const { data, error } = await supabase
        .from('submission_notes')
        .insert({
          submission_id: id,
          written_test_review_notes_by_human,
          audio_review_notes_by_human,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ notes: result });
  } catch (error) {
    console.error('Error updating notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
