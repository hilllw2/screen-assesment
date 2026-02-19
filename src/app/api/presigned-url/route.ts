import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl, extractS3Key } from '@/lib/security/presigned-urls';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { s3Url } = body;

    if (!s3Url) {
      return NextResponse.json({ error: 'S3 URL is required' }, { status: 400 });
    }

    // Extract the S3 key from the URL
    const key = extractS3Key(s3Url);
    
    if (!key) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 });
    }

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await generatePresignedUrl(key, 3600);

    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
