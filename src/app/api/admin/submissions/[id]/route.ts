import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteMultipleFromS3 } from '@/lib/s3';

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

export async function DELETE(
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

  console.log(`🗑️ Admin ${user.id} attempting to delete submission ${id}`);

  try {
    // First, fetch the submission to get S3 URLs
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('audio_recording_url, screen_recording_url, video_recording_url, verbal_question_1_url, verbal_question_2_url, verbal_question_3_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching submission for deletion:', fetchError);
      return NextResponse.json({ 
        error: 'Submission not found',
        details: fetchError.message 
      }, { status: 404 });
    }

    // Collect all S3 URLs to delete
    const s3UrlsToDelete: string[] = [];
    if (submission.audio_recording_url) s3UrlsToDelete.push(submission.audio_recording_url);
    
    // Handle screen recording (can be single URL or array of chunks)
    if (submission.screen_recording_url) {
      if (Array.isArray(submission.screen_recording_url)) {
        s3UrlsToDelete.push(...submission.screen_recording_url);
      } else {
        s3UrlsToDelete.push(submission.screen_recording_url);
      }
    }
    
    if (submission.video_recording_url) s3UrlsToDelete.push(submission.video_recording_url);
    if (submission.verbal_question_1_url) s3UrlsToDelete.push(submission.verbal_question_1_url);
    if (submission.verbal_question_2_url) s3UrlsToDelete.push(submission.verbal_question_2_url);
    if (submission.verbal_question_3_url) s3UrlsToDelete.push(submission.verbal_question_3_url);

    console.log(`📁 Found ${s3UrlsToDelete.length} S3 file(s) to delete`);

    // Delete S3 files first (don't fail if this doesn't work)
    if (s3UrlsToDelete.length > 0) {
      try {
        await deleteMultipleFromS3(s3UrlsToDelete);
      } catch (s3Error: any) {
        console.error('⚠️ Error deleting S3 files (continuing with DB deletion):', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete related records first (due to foreign key constraints)
    
    // 1. Delete submission answers
    const { error: answersError } = await supabase
      .from('submission_answers')
      .delete()
      .eq('submission_id', id);
    
    if (answersError) {
      console.error('Error deleting submission answers:', answersError);
    }

    // 2. Delete submission violations
    const { error: violationsError } = await supabase
      .from('submission_violations')
      .delete()
      .eq('submission_id', id);
    
    if (violationsError) {
      console.error('Error deleting submission violations:', violationsError);
    }

    // 3. Delete submission scores
    const { error: scoresError } = await supabase
      .from('submission_scores')
      .delete()
      .eq('submission_id', id);
    
    if (scoresError) {
      console.error('Error deleting submission scores:', scoresError);
    }

    // 4. Delete submission notes
    const { error: notesError } = await supabase
      .from('submission_notes')
      .delete()
      .eq('submission_id', id);
    
    if (notesError) {
      console.error('Error deleting submission notes:', notesError);
    }

    // 5. Finally, delete the submission itself
    const { error: submissionError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (submissionError) {
      console.error('Error deleting submission:', submissionError);
      return NextResponse.json({ 
        error: 'Failed to delete submission',
        details: submissionError.message 
      }, { status: 500 });
    }

    console.log(`✅ Successfully deleted submission ${id}`);
    return NextResponse.json({ 
      success: true,
      message: 'Submission deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ 
      error: 'Failed to delete submission',
      details: error?.message 
    }, { status: 500 });
  }
}
