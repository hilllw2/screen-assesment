import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { submissionId, screenRecordingUrl, isChunk, chunkNumber } = body;

    if (!submissionId || !screenRecordingUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('💾 Saving screen recording URL:', { 
      submissionId, 
      screenRecordingUrl,
      isChunk,
      chunkNumber 
    });

    const supabase = createServiceRoleClient();

    // Verify token matches submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, test_link_id, screen_recording_url, test_links!inner(token)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error('❌ Submission not found:', fetchError);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Type assertion for nested data
    const testLinkData = submission.test_links as any;
    if (testLinkData.token !== token) {
      console.error('❌ Token mismatch');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 403 }
      );
    }

    // If this is a chunk, append to existing array
    let finalUrl: string | string[];
    
    if (isChunk) {
      const existingUrl = submission.screen_recording_url;
      
      if (!existingUrl) {
        // First chunk - create array
        finalUrl = [screenRecordingUrl];
      } else if (Array.isArray(existingUrl)) {
        // Add to existing array
        finalUrl = [...existingUrl, screenRecordingUrl];
      } else if (typeof existingUrl === 'string') {
        // Convert single URL to array
        finalUrl = [existingUrl, screenRecordingUrl];
      } else {
        finalUrl = [screenRecordingUrl];
      }
      
      console.log(`📦 Adding chunk #${chunkNumber} to array (total: ${Array.isArray(finalUrl) ? finalUrl.length : 1})`);
    } else {
      // Not a chunk - just save single URL
      finalUrl = screenRecordingUrl;
    }

    // Update submission with screen recording URL
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        screen_recording_url: finalUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('❌ Failed to update submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to save screen recording URL' },
        { status: 500 }
      );
    }

    console.log('✅ Screen recording URL saved successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error saving screen recording:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
