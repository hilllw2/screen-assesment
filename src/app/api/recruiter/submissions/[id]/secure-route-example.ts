/**
 * Example: Secure Recruiter Submission Details API
 * Demonstrates authentication, authorization, and presigned URLs
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyAuth,
  verifySubmissionAccess,
  errorResponse,
  successResponse,
  applyRateLimit,
} from '@/lib/api/middleware';
import { RATE_LIMITS } from '@/lib/security/rate-limit';
import { generateMultiplePresignedUrls } from '@/lib/security/presigned-urls';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.API);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Verify authentication
    const authResult = await verifyAuth('recruiter'); // Requires recruiter role
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user, role } = authResult;

    // 3. Get submission ID
    const { id: submissionId } = await params;

    // 4. Verify access to submission
    const accessResult = await verifySubmissionAccess(user.id, role, submissionId);
    if (!accessResult.allowed) {
      return accessResult.error;
    }

    // 5. Fetch submission details
    const supabase = await createClient();
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        candidates (
          name,
          email
        ),
        test_links (
          tests (
            id,
            type,
            title
          )
        ),
        submission_answers (
          question_id,
          selected_option,
          points_awarded
        ),
        submission_violations (
          violation_type,
          metadata,
          created_at
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return errorResponse('Submission not found', 404);
    }

    // 6. Generate presigned URLs for recordings (if they exist)
    const recordingUrls: string[] = [];
    
    if (submission.audio_recording_url) {
      recordingUrls.push(submission.audio_recording_url);
    }
    if (submission.screen_recording_url) {
      recordingUrls.push(submission.screen_recording_url);
    }
    if (submission.video_recording_url) {
      recordingUrls.push(submission.video_recording_url);
    }
    if (submission.verbal_assessment_video_url) {
      recordingUrls.push(submission.verbal_assessment_video_url);
    }

    // Generate presigned URLs (1 hour expiry)
    const presignedUrls = await generateMultiplePresignedUrls(recordingUrls, 3600);

    // 7. Build response with presigned URLs
    const response = {
      ...submission,
      // Replace S3 URLs with presigned URLs
      audio_recording_url: submission.audio_recording_url 
        ? presignedUrls[submission.audio_recording_url] 
        : null,
      screen_recording_url: submission.screen_recording_url 
        ? presignedUrls[submission.screen_recording_url] 
        : null,
      video_recording_url: submission.video_recording_url 
        ? presignedUrls[submission.video_recording_url] 
        : null,
      verbal_assessment_video_url: submission.verbal_assessment_video_url 
        ? presignedUrls[submission.verbal_assessment_video_url] 
        : null,
      // Add expiry information
      recording_urls_expire_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    return successResponse(response);

  } catch (error) {
    console.error('Error fetching submission details:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Update scores with validation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.API);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const authResult = await verifyAuth('recruiter');
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user, role } = authResult;
    const { id: submissionId } = await params;

    const accessResult = await verifySubmissionAccess(user.id, role, submissionId);
    if (!accessResult.allowed) {
      return accessResult.error;
    }

    // Validate request body would go here
    const body = await request.json();
    
    const supabase = await createClient();
    
    // Update submission scores
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        written_test_score_by_human: body.writtenTestScore,
        audio_score_by_human: body.audioScore,
        verbal_score_by_human: body.verbalScore,
        written_test_review_notes_by_human: body.writtenReviewNotes,
        audio_review_notes_by_human: body.audioReviewNotes,
        verbal_review_notes_by_human: body.verbalReviewNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return errorResponse('Failed to update scores', 500);
    }

    return successResponse({ message: 'Scores updated successfully' });

  } catch (error) {
    console.error('Error updating scores:', error);
    return errorResponse('Internal server error', 500);
  }
}
