/**
 * Rate Limiting Implementation
 * Prevents API abuse by limiting the number of requests per IP/user
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  
  /**
   * Optional: Custom identifier (defaults to IP address)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

/**
 * Check if request is within rate limit
 * Returns success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${config.windowSeconds}`;
  
  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  const entry = rateLimitStore.get(key);
  
  // If no entry or expired, create new one
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (when behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to user-agent hash as identifier if IP not available
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return hashString(userAgent);
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  /**
   * Strict limit for authentication endpoints
   * 5 attempts per 15 minutes
   */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
  },
  
  /**
   * Standard limit for API endpoints
   * 100 requests per minute
   */
  API: {
    maxRequests: 100,
    windowSeconds: 60,
  },
  
  /**
   * Generous limit for test submission endpoints
   * 20 submissions per 5 minutes (prevents spam)
   */
  TEST_SUBMISSION: {
    maxRequests: 20,
    windowSeconds: 300, // 5 minutes
  },
  
  /**
   * Upload endpoints (chunked uploads may need multiple requests)
   * 50 uploads per 10 minutes
   */
  UPLOAD: {
    maxRequests: 50,
    windowSeconds: 600, // 10 minutes
  },
  
  /**
   * Very strict limit for password reset
   * 3 attempts per hour
   */
  PASSWORD_RESET: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
  },
} as const;

/**
 * Middleware helper to apply rate limiting
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const clientId = identifier || getClientIdentifier(request);
  return checkRateLimit(clientId, config);
}
