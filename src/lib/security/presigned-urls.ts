import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Config } from "../env-config";

/**
 * Generate presigned URL for secure, temporary access to S3 objects
 * URL expires after specified duration (default: 1 hour)
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600 // Default: 1 hour
): Promise<string> {
  const config = getS3Config();
  
  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error("AWS S3 credentials not configured");
  }

  const s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });
    
    return presignedUrl;
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Extract S3 key from full S3 URL
 * Supports both path-style and virtual-hosted-style URLs
 */
export function extractS3Key(s3Url: string): string | null {
  try {
    const url = new URL(s3Url);
    
    // Path-style: https://s3.region.amazonaws.com/bucket/key
    if (url.hostname.startsWith('s3.')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      pathParts.shift(); // Remove bucket name
      return pathParts.join('/');
    }
    
    // Virtual-hosted-style: https://bucket.s3.region.amazonaws.com/key
    if (url.hostname.includes('.s3.')) {
      return url.pathname.substring(1); // Remove leading slash
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate presigned URL from existing S3 URL
 */
export async function getPresignedUrlFromS3Url(
  s3Url: string,
  expiresIn: number = 3600
): Promise<string> {
  const key = extractS3Key(s3Url);
  
  if (!key) {
    throw new Error("Invalid S3 URL format");
  }
  
  return generatePresignedUrl(key, expiresIn);
}

/**
 * Batch generate presigned URLs for multiple recordings
 */
export async function generateMultiplePresignedUrls(
  s3Urls: string[],
  expiresIn: number = 3600
): Promise<{ [key: string]: string }> {
  const results: { [key: string]: string } = {};
  
  await Promise.all(
    s3Urls.map(async (url) => {
      try {
        const presignedUrl = await getPresignedUrlFromS3Url(url, expiresIn);
        results[url] = presignedUrl;
      } catch (error) {
        console.error(`Failed to generate presigned URL for ${url}:`, error);
        // Don't include failed URLs in results
      }
    })
  );
  
  return results;
}

/**
 * Verify user has permission to access recording
 * Admin can access all, recruiters can only access their own submissions
 */
export async function canAccessRecording(
  userId: string,
  userRole: string,
  submissionId: string,
  supabase: any
): Promise<boolean> {
  // Admin can access everything
  if (userRole === 'admin') {
    return true;
  }
  
  // For recruiters, check if they own the test
  if (userRole === 'recruiter') {
    const { data: submission } = await supabase
      .from('submissions')
      .select(`
        id,
        test_links!inner(
          tests!inner(
            recruiter_id
          )
        )
      `)
      .eq('id', submissionId)
      .single();
    
    if (!submission) {
      return false;
    }
    
    // Type assertion to access nested data
    const testData = submission.test_links as any;
    const recruiterIdFromTest = testData?.tests?.recruiter_id;
    
    return recruiterIdFromTest === userId;
  }
  
  return false;
}

/**
 * Security headers to prevent hotlinking and embedding
 */
export const SECURITY_HEADERS = {
  // Prevent embedding in iframes
  'X-Frame-Options': 'DENY',
  
  // Only allow same-origin embedding
  'Content-Security-Policy': "frame-ancestors 'self'",
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Prevent referrer leakage
  'Referrer-Policy': 'no-referrer',
} as const;
