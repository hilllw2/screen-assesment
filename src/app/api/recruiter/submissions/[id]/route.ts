import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Fetch submission with all related data
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        candidates(*),
        tests!submissions_test_id_fkey(*),
        submission_scores(*),
        submission_notes(*)
      `)
      .eq('id', id)
      .single();

    if (submissionError) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check authorization
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

    // Fetch submission answers with questions
    const { data: answers } = await supabase
      .from('submission_answers')
      .select(`
        *,
        questions(*)
      `)
      .eq('submission_id', id);

    // Fetch violations
    const { data: violations } = await supabase
      .from('submission_violations')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      submission,
      answers: answers || [],
      violations: violations || [],
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
