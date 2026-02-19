import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/security/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    // Note: In production, you might need to expose a reset function
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const config = RATE_LIMITS.API;

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.success).toBe(true);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      const config = { maxRequests: 3, windowSeconds: 60 };

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.success).toBe(true);
      }

      // 4th request should be blocked
      const blockedResult = checkRateLimit(identifier, config);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.message).toContain('Rate limit exceeded');
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user-3';
      const config = { maxRequests: 2, windowSeconds: 1 }; // 1 second window

      // Use up the limit
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);

      // Should be blocked
      let result = checkRateLimit(identifier, config);
      expect(result.success).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      result = checkRateLimit(identifier, config);
      expect(result.success).toBe(true);
    });

    it('should track different identifiers separately', () => {
      const config = { maxRequests: 2, windowSeconds: 60 };

      const result1 = checkRateLimit('user-1', config);
      const result2 = checkRateLimit('user-2', config);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1);
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBe('192.168.1.2');
    });

    it('should fallback to user-agent hash if no IP', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
      });

      const identifier = getClientIdentifier(mockRequest);
      expect(identifier).toBeTruthy();
      expect(typeof identifier).toBe('string');
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('should have correct AUTH limits', () => {
      expect(RATE_LIMITS.AUTH.maxRequests).toBe(5);
      expect(RATE_LIMITS.AUTH.windowSeconds).toBe(900); // 15 minutes
    });

    it('should have correct API limits', () => {
      expect(RATE_LIMITS.API.maxRequests).toBe(100);
      expect(RATE_LIMITS.API.windowSeconds).toBe(60);
    });

    it('should have correct PASSWORD_RESET limits', () => {
      expect(RATE_LIMITS.PASSWORD_RESET.maxRequests).toBe(3);
      expect(RATE_LIMITS.PASSWORD_RESET.windowSeconds).toBe(3600); // 1 hour
    });
  });
});
