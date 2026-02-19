import { z } from 'zod';

// ============================================================================
// API Input Validation Schemas
// ============================================================================

/**
 * Test Token Validation
 */
export const tokenSchema = z.string().uuid('Invalid token format');

/**
 * Writing Test Submission Schema
 */
export const writingSubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  taskNumber: z.number().int().min(1).max(5),
  text: z.string()
    .min(1, 'Response cannot be empty')
    .max(10000, 'Response exceeds maximum length')
    .transform(sanitizeHtml), // Sanitize to prevent XSS
});

/**
 * Intelligence Test Submission Schema
 */
export const intelligenceSubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  answers: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID'),
      selectedOption: z.enum(['A', 'B', 'C', 'D']).refine(
        (val) => ['A', 'B', 'C', 'D'].includes(val),
        { message: 'Invalid option selected' }
      ),
    })
  ).min(1, 'At least one answer is required')
    .max(50, 'Too many answers provided'),
});

/**
 * Personality Test Submission Schema
 */
export const personalitySubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  answers: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID'),
      selectedOption: z.enum(['A', 'B', 'C', 'D']).refine(
        (val) => ['A', 'B', 'C', 'D'].includes(val),
        { message: 'Invalid option selected' }
      ),
    })
  ).min(1, 'At least one answer is required')
    .max(50, 'Too many answers provided'),
});

/**
 * Violation Logging Schema
 */
export const violationSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  violationType: z.enum([
    'tab_switch',
    'screen_share_stopped',
    'page_refresh',
    'multiple_monitors',
    'devtools_detected',
    'network_failure',
    'browser_closed',
    'timer_exceeded',
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Candidate Creation Schema
 */
export const candidateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .transform(sanitizeHtml),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
});

/**
 * Recruiter Score Update Schema
 */
export const scoreUpdateSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  writtenTestScore: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score cannot exceed 10')
    .optional(),
  audioScore: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score cannot exceed 10')
    .optional(),
  verbalScore: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score cannot exceed 10')
    .optional(),
  writtenReviewNotes: z.string()
    .max(5000, 'Notes are too long')
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : val),
  audioReviewNotes: z.string()
    .max(5000, 'Notes are too long')
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : val),
  verbalReviewNotes: z.string()
    .max(5000, 'Notes are too long')
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : val),
});

/**
 * Status Update Schema
 */
export const statusUpdateSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  status: z.enum(['submitted', 'passed', 'failed'], {
    message: 'Invalid status',
  }),
});

/**
 * Upload Metadata Schema
 */
export const uploadMetadataSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  fileName: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename is too long')
    .regex(/^[\w\-. ]+$/, 'Filename contains invalid characters'),
  contentType: z.string()
    .regex(/^(audio|video)\/[\w\-+.]+$/, 'Invalid content type'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(500 * 1024 * 1024, 'File size exceeds 500MB limit'), // 500MB max
});

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Basic HTML sanitization to prevent XSS
 * Removes potentially dangerous HTML tags and attributes
 */
function sanitizeHtml(input: string): string {
  if (!input) return input;
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Encode potentially dangerous characters
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize file name for S3
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
  
  // Remove any non-alphanumeric characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
  }
  
  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// Type Exports
// ============================================================================

export type WritingSubmission = z.infer<typeof writingSubmissionSchema>;
export type IntelligenceSubmission = z.infer<typeof intelligenceSubmissionSchema>;
export type PersonalitySubmission = z.infer<typeof personalitySubmissionSchema>;
export type ViolationLog = z.infer<typeof violationSchema>;
export type CandidateInput = z.infer<typeof candidateSchema>;
export type ScoreUpdate = z.infer<typeof scoreUpdateSchema>;
export type StatusUpdate = z.infer<typeof statusUpdateSchema>;
export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
