/**
 * API Middleware Utilities
 * Common middleware functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZodSchema, ZodError } from 'zod';
import { checkRateLimit, getClientIdentifier, RateLimitConfig } from '@/lib/security/rate-limit';

/**
 * Standard API error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Standard API success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: errorResponse(
          'Validation failed',
          400,
          error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }
    
    return {
      data: null,
      error: errorResponse('Invalid request body', 400),
    };
  }
}

/**
 * Apply rate limiting to API route
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const identifier = getClientIdentifier(request);
  const result = checkRateLimit(identifier, config);
  
  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    const response = NextResponse.json(
      {
        error: result.message || 'Rate limit exceeded',
        retryAfter,
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      }
    );
    
    return { allowed: false, response };
  }
  
  // Add rate limit headers to successful responses
  return { allowed: true };
}

/**
 * Verify test token is valid and active
 */
export async function verifyTestToken(
  token: string
): Promise<
  | { valid: true; testLink: any; test: any }
  | { valid: false; error: NextResponse }
> {
  const supabase = await createClient();
  
  // Validate token format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return {
      valid: false,
      error: errorResponse('Invalid token format', 400),
    };
  }
  
  // Fetch test link
  const { data: testLink, error: fetchError } = await supabase
    .from('test_links')
    .select(`
      *,
      tests (
        id,
        type,
        title,
        recruiter_id,
        created_at
      )
    `)
    .eq('token', token)
    .single();
  
  if (fetchError || !testLink) {
    return {
      valid: false,
      error: errorResponse('Invalid or expired test link', 404),
    };
  }
  
  // Check if link is active
  if (!testLink.is_active) {
    return {
      valid: false,
      error: errorResponse('This test link has been deactivated', 403),
    };
  }
  
  // Check if link has expired
  if (testLink.expires_at && new Date(testLink.expires_at) < new Date()) {
    return {
      valid: false,
      error: errorResponse('This test link has expired', 403),
    };
  }
  
  return {
    valid: true,
    testLink,
    test: testLink.tests,
  };
}

/**
 * Verify user authentication and role
 */
export async function verifyAuth(
  requiredRole?: 'admin' | 'recruiter'
): Promise<
  | { authenticated: true; user: any; role: string }
  | { authenticated: false; error: NextResponse }
> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      authenticated: false,
      error: errorResponse('Unauthorized', 401),
    };
  }
  
  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return {
      authenticated: false,
      error: errorResponse('User not found', 404),
    };
  }
  
  // Check role if required
  if (requiredRole && userData.role !== requiredRole) {
    return {
      authenticated: false,
      error: errorResponse('Forbidden', 403),
    };
  }
  
  return {
    authenticated: true,
    user,
    role: userData.role,
  };
}

/**
 * Verify submission ownership (for recruiters accessing their submissions)
 */
export async function verifySubmissionAccess(
  userId: string,
  userRole: string,
  submissionId: string
): Promise<{ allowed: true } | { allowed: false; error: NextResponse }> {
  // Admin can access everything
  if (userRole === 'admin') {
    return { allowed: true };
  }
  
  const supabase = await createClient();
  
  // Check if recruiter owns the test
  const { data: submission, error } = await supabase
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
  
  if (error || !submission) {
    return {
      allowed: false,
      error: errorResponse('Submission not found', 404),
    };
  }
  
  const testData = submission.test_links as any;
  const recruiterIdFromTest = testData?.tests?.recruiter_id;
  
  if (recruiterIdFromTest !== userId) {
    return {
      allowed: false,
      error: errorResponse('Forbidden', 403),
    };
  }
  
  return { allowed: true };
}

/**
 * Log API request for audit trail
 */
export async function logApiRequest(
  request: NextRequest,
  userId?: string,
  action?: string
): Promise<void> {
  // In production, you might want to log to a dedicated logging service
  console.log({
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userId,
    action,
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent'),
  });
}

/**
 * CORS headers for API responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleCORS(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
