/**
 * Example: Secure Writing Test API Route with all security measures
 * This demonstrates how to use all the security utilities
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateRequest,
  applyRateLimit,
  verifyTestToken,
  errorResponse,
  successResponse,
} from '@/lib/api/middleware';
import { writingSubmissionSchema } from '@/lib/validation/schemas';
import { RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // 1. Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.TEST_SUBMISSION);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Get and verify token
    const { token } = await params;
    const tokenVerification = await verifyTestToken(token);
    if (!tokenVerification.valid) {
      return tokenVerification.error;
    }

    // 3. Validate request body
    const validation = await validateRequest(request, writingSubmissionSchema);
    if (validation.error) {
      return validation.error;
    }

    const { submissionId, taskNumber, text } = validation.data;

    // 4. Additional business logic validation
    const supabase = await createClient();
    
    // Verify submission exists and belongs to this test
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, status, disqualified, test_link_id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return errorResponse('Submission not found', 404);
    }

    // Check if submission is disqualified
    if (submission.disqualified) {
      return errorResponse('This submission has been disqualified', 403);
    }

    // Check if submission is already completed
    if (submission.status === 'submitted') {
      return errorResponse('Test already submitted', 403);
    }

    // Verify submission belongs to this test link
    if (submission.test_link_id !== tokenVerification.testLink.id) {
      return errorResponse('Invalid submission for this test', 403);
    }

    // 5. Map task number to column name
    const columnMap: { [key: number]: string } = {
      1: 'writing_part_1_text',
      2: 'writing_part_2_text',
      3: 'writing_part_3_text',
      4: 'writing_part_4_text',
      5: 'writing_part_5_text',
    };

    const columnName = columnMap[taskNumber];
    if (!columnName) {
      return errorResponse('Invalid task number', 400);
    }

    // 6. Update submission with sanitized text (already sanitized by schema)
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        [columnName]: text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error saving writing response:', updateError);
      return errorResponse('Failed to save response', 500);
    }

    // 7. Return success response
    return successResponse({
      message: 'Writing response saved successfully',
      taskNumber,
    });

  } catch (error) {
    console.error('Unexpected error in writing API:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
