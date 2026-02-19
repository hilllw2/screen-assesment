import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadWithRetry,
  validateFile,
  formatFileSize,
  createSafeFileName,
  isOnline,
} from '@/lib/security/upload-utils';

describe('Upload Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFile = new Blob(['test content'], { type: 'audio/webm' });
      const mockUploadFn = vi.fn().mockResolvedValue('https://s3.example.com/file.webm');

      const result = await uploadWithRetry(mockFile, mockUploadFn, {
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://s3.example.com/file.webm');
      expect(result.attempts).toBe(1);
      expect(mockUploadFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFile = new Blob(['test content'], { type: 'audio/webm' });
      let attempts = 0;
      const mockUploadFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve('https://s3.example.com/file.webm');
      });

      const result = await uploadWithRetry(mockFile, mockUploadFn, {
        maxRetries: 3,
        initialDelay: 10, // Short delay for testing
      });

      expect(result.success).toBe(true);
      expect(mockUploadFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFile = new Blob(['test content'], { type: 'audio/webm' });
      const mockUploadFn = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await uploadWithRetry(mockFile, mockUploadFn, {
        maxRetries: 2,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(mockUploadFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const mockFile = new Blob(['test content'], { type: 'audio/webm' });
      const mockUploadFn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce('https://s3.example.com/file.webm');
      
      const onRetrySpy = vi.fn();

      await uploadWithRetry(mockFile, mockUploadFn, {
        maxRetries: 2,
        initialDelay: 10,
        onRetry: onRetrySpy,
      });

      expect(onRetrySpy).toHaveBeenCalledTimes(1);
      expect(onRetrySpy).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('validateFile', () => {
    it('should validate correct file', () => {
      const file = new Blob(['x'.repeat(1024 * 1024)], { type: 'audio/webm' }); // 1MB
      const result = validateFile(file, {
        maxSizeMB: 10,
        allowedTypes: ['audio/webm', 'video/webm'],
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file exceeding size limit', () => {
      const file = new Blob(['x'.repeat(11 * 1024 * 1024)], { type: 'audio/webm' }); // 11MB
      const result = validateFile(file, {
        maxSizeMB: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject file with disallowed type', () => {
      const file = new Blob(['test'], { type: 'application/exe' });
      const result = validateFile(file, {
        allowedTypes: ['audio/webm', 'video/webm'],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('createSafeFileName', () => {
    it('should create safe filename with prefix and extension', () => {
      const fileName = createSafeFileName('audio', 'webm');
      
      expect(fileName).toMatch(/^audio_[\w-]+\.webm$/);
    });

    it('should include submission ID when provided', () => {
      const submissionId = '123e4567-e89b-12d3-a456-426614174000';
      const fileName = createSafeFileName('audio', 'webm', submissionId);
      
      expect(fileName).toContain(submissionId);
      expect(fileName).toMatch(/\.webm$/);
    });
  });

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });
  });
});
