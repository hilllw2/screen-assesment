import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl, extractS3Key } from '@/lib/security/presigned-urls';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Presigned URL: Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { s3Url } = body;

    console.log('📝 Presigned URL request:', { s3Url, userId: user.id });

    if (!s3Url) {
      console.error('❌ Presigned URL: Missing S3 URL');
      return NextResponse.json({ error: 'S3 URL is required' }, { status: 400 });
    }

    // Extract the S3 key from the URL
    const key = extractS3Key(s3Url);
    console.log('🔑 Extracted S3 key:', key);
    
    if (!key) {
      console.error('❌ Presigned URL: Invalid S3 URL format:', s3Url);
      return NextResponse.json({ error: 'Invalid S3 URL', details: s3Url }, { status: 400 });
    }

    // Generate presigned URL (valid for 1 hour)
    console.log('⏳ Generating presigned URL for key:', key);
    const presignedUrl = await generatePresignedUrl(key, 3600);
    console.log('✅ Generated presigned URL:', presignedUrl.substring(0, 100) + '...');

    return NextResponse.json({ presignedUrl });
  } catch (error: any) {
    console.error('❌ Error generating presigned URL:', {
      message: error?.message,
      stack: error?.stack,
      error
    });
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error?.message },
      { status: 500 }
    );
  }
}
