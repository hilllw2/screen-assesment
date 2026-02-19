/**
 * Upload utilities with retry logic and exponential backoff
 */

export interface UploadOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Initial delay in milliseconds
   */
  initialDelay?: number;
  
  /**
   * Backoff multiplier (exponential)
   */
  backoffMultiplier?: number;
  
  /**
   * Maximum delay between retries (cap)
   */
  maxDelay?: number;
  
  /**
   * Callback for progress updates
   */
  onProgress?: (progress: number) => void;
  
  /**
   * Callback for retry attempts
   */
  onRetry?: (attempt: number, error: Error) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  attempts: number;
}

/**
 * Exponential backoff retry wrapper
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: UploadOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Upload with automatic retry and progress tracking
 */
export async function uploadWithRetry(
  file: Blob,
  uploadFn: (file: Blob) => Promise<string>,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress } = options;
  let attempts = 0;
  
  try {
    if (onProgress) {
      onProgress(0);
    }
    
    const url = await withRetry(
      async () => {
        attempts++;
        if (onProgress) {
          onProgress(attempts * 25); // Simulate progress
        }
        return uploadFn(file);
      },
      {
        ...options,
        onRetry: (attempt, error) => {
          if (options.onRetry) {
            options.onRetry(attempt, error);
          }
          console.warn(`Upload attempt ${attempt} failed, retrying...`, error);
        },
      }
    );
    
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      success: true,
      url,
      attempts,
    };
  } catch (error) {
    console.error('Upload failed after all retries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      attempts,
    };
  }
}

/**
 * Chunked upload for large files
 */
export async function uploadInChunks(
  file: Blob,
  chunkSize: number = 5 * 1024 * 1024, // 5MB chunks
  uploadChunkFn: (chunk: Blob, index: number, total: number) => Promise<void>,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, maxRetries = 3 } = options;
  const totalChunks = Math.ceil(file.size / chunkSize);
  let attempts = 0;
  
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // Upload chunk with retry
      await withRetry(
        async () => {
          attempts++;
          await uploadChunkFn(chunk, i, totalChunks);
        },
        {
          maxRetries,
          onRetry: (attempt, error) => {
            console.warn(`Chunk ${i + 1}/${totalChunks} upload attempt ${attempt} failed, retrying...`, error);
          },
        }
      );
      
      // Update progress
      if (onProgress) {
        const progress = ((i + 1) / totalChunks) * 100;
        onProgress(progress);
      }
    }
    
    return {
      success: true,
      attempts,
    };
  } catch (error) {
    console.error('Chunked upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chunked upload failed',
      attempts,
    };
  }
}

/**
 * Check network connectivity before upload
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Estimate upload time based on file size and network speed
 */
export function estimateUploadTime(
  fileSizeBytes: number,
  networkSpeedMbps: number = 10 // Assume 10 Mbps by default
): number {
  const fileSizeMb = fileSizeBytes / (1024 * 1024);
  const timeSeconds = (fileSizeMb * 8) / networkSpeedMbps;
  return Math.ceil(timeSeconds);
}

/**
 * Validate file before upload
 */
export interface FileValidation {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: Blob,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): FileValidation {
  const { maxSizeMB = 500, allowedTypes } = options;
  
  // Check size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  
  // Check type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create a safe filename with timestamp
 */
export function createSafeFileName(
  prefix: string,
  extension: string,
  submissionId?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).substring(7);
  const parts = [prefix, submissionId, timestamp, random].filter(Boolean);
  return `${parts.join('_')}.${extension}`;
}
