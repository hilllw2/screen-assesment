# Phase 8: Security Hardening - Implementation Guide

## 📚 Overview

This document provides comprehensive guidance on the security features implemented in Phase 8 of the Screening Assessment System.

## 🔒 Security Features Implemented

### 1. Input Validation & Sanitization

**Location:** `/src/lib/validation/schemas.ts`

#### Features:
- ✅ Zod schema validation for all API inputs
- ✅ XSS prevention through HTML sanitization
- ✅ SQL injection prevention (parameterized queries via Supabase)
- ✅ File name sanitization
- ✅ UUID validation

#### Usage Example:
```typescript
import { writingSubmissionSchema } from '@/lib/validation/schemas';

// Validate request body
const validation = await validateRequest(request, writingSubmissionSchema);
if (validation.error) {
  return validation.error; // Returns 400 with validation errors
}

const { submissionId, taskNumber, text } = validation.data;
// text is already sanitized
```

#### Available Schemas:
- `writingSubmissionSchema` - Writing test submissions
- `intelligenceSubmissionSchema` - Intelligence test answers
- `personalitySubmissionSchema` - Personality test answers
- `violationSchema` - Violation logging
- `candidateSchema` - Candidate registration
- `scoreUpdateSchema` - Recruiter score updates
- `statusUpdateSchema` - Submission status changes
- `uploadMetadataSchema` - File upload validation

---

### 2. Rate Limiting

**Location:** `/src/lib/security/rate-limit.ts`

#### Features:
- ✅ Prevents API abuse
- ✅ Configurable limits per endpoint
- ✅ Automatic cleanup of expired entries
- ✅ Returns retry-after headers

#### Preset Configurations:
```typescript
RATE_LIMITS.AUTH              // 5 requests per 15 minutes
RATE_LIMITS.API               // 100 requests per minute
RATE_LIMITS.TEST_SUBMISSION   // 20 submissions per 5 minutes
RATE_LIMITS.UPLOAD            // 50 uploads per 10 minutes
RATE_LIMITS.PASSWORD_RESET    // 3 attempts per hour
```

#### Usage Example:
```typescript
import { applyRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// In API route
const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.API);
if (!rateLimitResult.allowed) {
  return rateLimitResult.response; // Returns 429 with retry-after
}
```

---

### 3. Session Management

**Location:** `/src/lib/security/session.ts`

#### Features:
- ✅ Session timeout tracking
- ✅ Inactivity detection
- ✅ Automatic session expiry
- ✅ Different configs for candidate/recruiter/admin

#### Session Configurations:
```typescript
SESSION_CONFIGS.CANDIDATE   // 2 hours max, 10 min inactivity
SESSION_CONFIGS.RECRUITER   // 8 hours max, 30 min inactivity
SESSION_CONFIGS.ADMIN       // 12 hours max, 1 hour inactivity
```

#### Client-Side Usage:
```typescript
import { initSession, watchSession, SESSION_CONFIGS } from '@/lib/security/session';

// Initialize session
useEffect(() => {
  initSession({
    userId: user.id,
    userRole: 'candidate',
    submissionId: submission.id,
  });
  
  // Watch for expiry
  const cleanup = watchSession(
    SESSION_CONFIGS.CANDIDATE,
    (reason) => {
      if (reason === 'inactivity') {
        alert('Session expired due to inactivity');
      } else {
        alert('Maximum session duration reached');
      }
      router.push('/test/expired');
    }
  );
  
  return cleanup;
}, []);
```

---

### 4. Presigned URLs for S3

**Location:** `/src/lib/security/presigned-urls.ts`

#### Features:
- ✅ Temporary access to S3 recordings (1-hour expiry)
- ✅ Server-side URL generation
- ✅ Access control verification
- ✅ Prevents hotlinking

#### Usage Example:
```typescript
import { generatePresignedUrl, canAccessRecording } from '@/lib/security/presigned-urls';

// In API route
const canAccess = await canAccessRecording(
  userId,
  userRole,
  submissionId,
  supabase
);

if (!canAccess) {
  return errorResponse('Forbidden', 403);
}

const presignedUrl = await generatePresignedUrl(
  'audio/submission-123-audio.webm',
  3600 // 1 hour expiry
);

// Return presigned URL to client
```

**IMPORTANT:** Never expose raw S3 URLs to clients. Always use presigned URLs.

---

### 5. Anti-Cheat Measures

**Location:** `/src/lib/security/anti-cheat.ts`

#### Features:
- ✅ Tab switch detection
- ✅ Page refresh/close detection
- ✅ Screen share monitoring
- ✅ Multi-monitor detection
- ✅ DevTools blocking
- ✅ Network monitoring
- ✅ Copy/paste detection (optional)

#### Client-Side Implementation:
```typescript
import { useAntiCheat } from '@/lib/security/anti-cheat';

function TestPage() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Enable all anti-cheat measures
  useAntiCheat({
    handler: {
      onViolation: async (type, metadata) => {
        // Log violation to API
        await fetch(`/api/test/${token}/violation`, {
          method: 'POST',
          body: JSON.stringify({
            submissionId,
            violationType: type,
            metadata,
          }),
        });
        
        // Disqualify and redirect
        router.push(`/test/${token}/disqualified`);
      },
    },
    screenShareStream: screenStream,
    enableTabDetection: true,
    enableUnloadDetection: true,
    enableMultiMonitor: true,
    enableDevToolsBlock: true,
    enableNetworkMonitoring: true,
    multiMonitorGracePeriod: 10000, // 10 seconds
  });
  
  // ... rest of component
}
```

---

### 6. Upload with Retry Logic

**Location:** `/src/lib/security/upload-utils.ts`

#### Features:
- ✅ Exponential backoff retry
- ✅ Progress tracking
- ✅ File validation
- ✅ Chunked uploads for large files
- ✅ Network connectivity check

#### Usage Example:
```typescript
import { uploadWithRetry, validateFile } from '@/lib/security/upload-utils';

async function uploadRecording(blob: Blob) {
  // Validate file first
  const validation = validateFile(blob, {
    maxSizeMB: 500,
    allowedTypes: ['audio/webm', 'video/webm'],
  });
  
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  // Upload with retry
  const result = await uploadWithRetry(
    blob,
    async (file) => {
      // Your upload function
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.url;
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      onProgress: (progress) => {
        setUploadProgress(progress);
      },
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error);
      },
    }
  );
  
  if (result.success) {
    console.log('Upload successful:', result.url);
  } else {
    console.error('Upload failed:', result.error);
  }
}
```

---

### 7. API Middleware

**Location:** `/src/lib/api/middleware.ts`

#### Features:
- ✅ Request validation
- ✅ Authentication verification
- ✅ Authorization checks
- ✅ Token verification
- ✅ Error handling
- ✅ CORS support

#### Complete API Route Example:
```typescript
import { NextRequest } from 'next/server';
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
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.TEST_SUBMISSION);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Verify token
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

    // 4. Business logic...
    // Save to database, etc.

    // 5. Return success
    return successResponse({ message: 'Saved successfully' });

  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
```

---

### 8. Error Pages

**Location:** `/src/components/test/ErrorPages.tsx`

#### Features:
- ✅ Friendly error messages
- ✅ User guidance
- ✅ Contact support options
- ✅ Consistent UI

#### Error Types:
```typescript
<TestErrorPage type="invalid" />      // Invalid token
<TestErrorPage type="expired" />      // Expired link
<TestErrorPage type="submitted" />    // Already completed
<TestErrorPage type="disqualified" /> // Disqualified
<TestErrorPage type="network" />      // Network error
<TestErrorPage type="generic" />      // Generic error
```

#### Usage in Pages:
```typescript
// In test/[token]/page.tsx
const tokenVerification = await verifyTestToken(token);
if (!tokenVerification.valid) {
  return <TestErrorPage type="invalid" />;
}

if (testLink.expires_at && new Date(testLink.expires_at) < new Date()) {
  return <TestErrorPage type="expired" />;
}
```

---

## 🧪 Testing

### Running Tests:
```bash
npm run test          # Run tests once
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
npm run test:coverage # Coverage report
```

### Test Files:
- `/src/test/security/rate-limit.test.ts` - Rate limiting tests
- `/src/test/validation/schemas.test.ts` - Validation tests
- `/src/test/security/upload-utils.test.ts` - Upload utilities tests

### Add to package.json:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🔐 Security Checklist

### Before Deployment:

- [ ] All API routes use rate limiting
- [ ] All inputs validated with Zod schemas
- [ ] All S3 URLs replaced with presigned URLs
- [ ] Session management implemented on all user flows
- [ ] Anti-cheat measures enabled on test pages
- [ ] Error pages cover all edge cases
- [ ] HTTPS enforced in production
- [ ] Environment variables properly secured
- [ ] RLS policies tested in Supabase
- [ ] CORS configured correctly
- [ ] File upload size limits enforced
- [ ] Authentication checked on all protected routes

### Ongoing Monitoring:

- [ ] Monitor rate limit violations
- [ ] Track disqualification reasons
- [ ] Review S3 access logs
- [ ] Check for unusual API patterns
- [ ] Monitor session expiry rates
- [ ] Review error logs regularly

---

## 🚨 Common Issues & Solutions

### Issue: Rate limit too strict
**Solution:** Adjust limits in RATE_LIMITS configuration

### Issue: Presigned URLs expiring too quickly
**Solution:** Increase `expiresIn` parameter (max 7 days for S3)

### Issue: False positive multi-monitor detection
**Solution:** Increase grace period or adjust detection logic

### Issue: Session expiring during active test
**Solution:** Activity tracking should prevent this; check if events are firing

### Issue: Upload failing despite retry
**Solution:** Check network, file size, and S3 permissions

---

## 📞 Support

For questions or issues:
- Review error logs in browser console
- Check API response details
- Verify environment variables
- Test in isolation with unit tests

---

**Last Updated:** Phase 8 Implementation
**Status:** ✅ Complete
