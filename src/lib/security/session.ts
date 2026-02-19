/**
 * Session Management & Timeout Utilities
 * Handles user session timeouts and inactivity detection
 */

export interface SessionConfig {
  /**
   * Maximum session duration in milliseconds
   */
  maxDuration: number;
  
  /**
   * Maximum inactivity period in milliseconds
   */
  inactivityTimeout: number;
}

/**
 * Default session configurations for different user types
 */
export const SESSION_CONFIGS = {
  /**
   * Candidate sessions during test-taking
   * - Max duration: 2 hours (enough for all tests + breaks)
   * - Inactivity: 10 minutes (if inactive during test, something is wrong)
   */
  CANDIDATE: {
    maxDuration: 2 * 60 * 60 * 1000, // 2 hours
    inactivityTimeout: 10 * 60 * 1000, // 10 minutes
  },
  
  /**
   * Recruiter sessions
   * - Max duration: 8 hours (work day)
   * - Inactivity: 30 minutes
   */
  RECRUITER: {
    maxDuration: 8 * 60 * 60 * 1000, // 8 hours
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  },
  
  /**
   * Admin sessions
   * - Max duration: 12 hours
   * - Inactivity: 1 hour
   */
  ADMIN: {
    maxDuration: 12 * 60 * 60 * 1000, // 12 hours
    inactivityTimeout: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Session data stored in localStorage/sessionStorage
 */
export interface SessionData {
  startTime: number;
  lastActivity: number;
  userId?: string;
  userRole?: string;
  submissionId?: string; // For candidate sessions
}

/**
 * Check if session is expired
 */
export function isSessionExpired(
  sessionData: SessionData,
  config: SessionConfig
): { expired: boolean; reason?: 'max_duration' | 'inactivity' } {
  const now = Date.now();
  
  // Check max duration
  if (now - sessionData.startTime > config.maxDuration) {
    return { expired: true, reason: 'max_duration' };
  }
  
  // Check inactivity
  if (now - sessionData.lastActivity > config.inactivityTimeout) {
    return { expired: true, reason: 'inactivity' };
  }
  
  return { expired: false };
}

/**
 * Update last activity timestamp
 */
export function updateActivity(sessionKey: string = 'session'): void {
  if (typeof window === 'undefined') return;
  
  const sessionDataStr = sessionStorage.getItem(sessionKey);
  if (!sessionDataStr) return;
  
  try {
    const sessionData: SessionData = JSON.parse(sessionDataStr);
    sessionData.lastActivity = Date.now();
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

/**
 * Initialize session tracking
 */
export function initSession(
  data: Partial<SessionData> = {},
  sessionKey: string = 'session'
): void {
  if (typeof window === 'undefined') return;
  
  const sessionData: SessionData = {
    startTime: Date.now(),
    lastActivity: Date.now(),
    ...data,
  };
  
  sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
}

/**
 * Get current session data
 */
export function getSession(sessionKey: string = 'session'): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  const sessionDataStr = sessionStorage.getItem(sessionKey);
  if (!sessionDataStr) return null;
  
  try {
    return JSON.parse(sessionDataStr);
  } catch {
    return null;
  }
}

/**
 * Clear session
 */
export function clearSession(sessionKey: string = 'session'): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(sessionKey);
}

/**
 * Setup activity tracking listeners
 * Call this on mount in your app component
 */
export function setupActivityTracking(sessionKey: string = 'session'): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  
  const handleActivity = () => {
    updateActivity(sessionKey);
  };
  
  // Add listeners
  events.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
  };
}

/**
 * Check session periodically and trigger callback if expired
 */
export function watchSession(
  config: SessionConfig,
  onExpire: (reason: 'max_duration' | 'inactivity') => void,
  sessionKey: string = 'session',
  checkInterval: number = 60000 // Check every minute
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const intervalId = setInterval(() => {
    const sessionData = getSession(sessionKey);
    
    if (!sessionData) {
      clearInterval(intervalId);
      return;
    }
    
    const { expired, reason } = isSessionExpired(sessionData, config);
    
    if (expired && reason) {
      clearInterval(intervalId);
      onExpire(reason);
    }
  }, checkInterval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Candidate-specific: Check if test time limit exceeded
 */
export function isTestTimeExpired(
  submissionStartTime: Date,
  totalTestDurationMinutes: number
): boolean {
  const now = new Date();
  const elapsed = now.getTime() - submissionStartTime.getTime();
  const limit = totalTestDurationMinutes * 60 * 1000;
  return elapsed > limit;
}

/**
 * Calculate remaining time in a session
 */
export function getRemainingTime(
  sessionData: SessionData,
  config: SessionConfig
): {
  remainingDuration: number;
  remainingInactivity: number;
} {
  const now = Date.now();
  
  return {
    remainingDuration: Math.max(0, config.maxDuration - (now - sessionData.startTime)),
    remainingInactivity: Math.max(0, config.inactivityTimeout - (now - sessionData.lastActivity)),
  };
}
