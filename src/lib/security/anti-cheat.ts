/**
 * Client-side Edge Case Handling
 * Handles browser events, anti-cheat measures, and network failures
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface ViolationHandler {
  onViolation: (type: ViolationType, metadata?: Record<string, unknown>) => void;
}

export type ViolationType =
  | 'tab_switch'
  | 'screen_share_stopped'
  | 'page_refresh'
  | 'multiple_monitors'
  | 'devtools_detected'
  | 'network_failure'
  | 'browser_closed'
  | 'copy_paste_detected';

/**
 * Hook to detect tab switching and page visibility changes
 */
export function useTabSwitchDetection(handler: ViolationHandler) {
  useEffect(() => {
    let violationCount = 0;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        violationCount++;
        handler.onViolation('tab_switch', {
          timestamp: new Date().toISOString(),
          violationCount,
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handler]);
}

/**
 * Hook to detect browser close/refresh attempts
 */
export function usePageUnloadDetection(handler: ViolationHandler, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Log violation
      handler.onViolation('page_refresh', {
        timestamp: new Date().toISOString(),
      });
      
      // Show confirmation dialog
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your test progress will be lost and you will be disqualified.';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handler, enabled]);
}

/**
 * Hook to monitor screen share stream
 */
export function useScreenShareMonitoring(
  stream: MediaStream | null,
  handler: ViolationHandler
) {
  const previousActiveRef = useRef(true);
  
  useEffect(() => {
    if (!stream) return;
    
    const checkStreamActive = () => {
      const isActive = stream.active && stream.getVideoTracks().some(track => track.readyState === 'live');
      
      if (previousActiveRef.current && !isActive) {
        handler.onViolation('screen_share_stopped', {
          timestamp: new Date().toISOString(),
          tracks: stream.getTracks().map(t => ({
            kind: t.kind,
            readyState: t.readyState,
          })),
        });
      }
      
      previousActiveRef.current = isActive;
    };
    
    // Check immediately
    checkStreamActive();
    
    // Monitor track ended events
    const tracks = stream.getTracks();
    const handleTrackEnded = () => {
      handler.onViolation('screen_share_stopped', {
        timestamp: new Date().toISOString(),
        reason: 'track_ended',
      });
    };
    
    tracks.forEach(track => {
      track.addEventListener('ended', handleTrackEnded);
    });
    
    // Poll every 2 seconds
    const intervalId = setInterval(checkStreamActive, 2000);
    
    return () => {
      clearInterval(intervalId);
      tracks.forEach(track => {
        track.removeEventListener('ended', handleTrackEnded);
      });
    };
  }, [stream, handler]);
}

/**
 * Detect multiple monitors
 */
export function useMultiMonitorDetection(
  handler: ViolationHandler,
  gracePeriodMs: number = 10000 // 10 seconds grace period
) {
  useEffect(() => {
    const checkMultiMonitor = () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const availWidth = window.screen.availWidth;
      const availHeight = window.screen.availHeight;
      
      // Check for extended desktop (multiple monitors)
      const hasMultipleMonitors = 
        screenWidth > availWidth * 1.5 || 
        screenHeight > availHeight * 1.5 ||
        window.screenX < 0 ||
        window.screenY < 0 ||
        window.screenX + window.outerWidth > availWidth ||
        window.screenY + window.outerHeight > availHeight;
      
      if (hasMultipleMonitors) {
        handler.onViolation('multiple_monitors', {
          timestamp: new Date().toISOString(),
          screenWidth,
          screenHeight,
          availWidth,
          availHeight,
          windowPosition: {
            x: window.screenX,
            y: window.screenY,
          },
        });
      }
    };
    
    // Give user grace period to fix setup
    const timeoutId = setTimeout(checkMultiMonitor, gracePeriodMs);
    
    return () => clearTimeout(timeoutId);
  }, [handler, gracePeriodMs]);
}

/**
 * Disable right-click and keyboard shortcuts
 */
export function useDisableDevTools() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C (Inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (View source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Cmd+Option+I (Mac)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

/**
 * Detect copy/paste attempts (optional)
 */
export function useCopyPasteDetection(handler: ViolationHandler, detectCopy: boolean = false) {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      handler.onViolation('copy_paste_detected', {
        timestamp: new Date().toISOString(),
        action: 'paste',
        dataLength: e.clipboardData?.getData('text').length || 0,
      });
    };
    
    const handleCopy = (e: ClipboardEvent) => {
      if (detectCopy) {
        handler.onViolation('copy_paste_detected', {
          timestamp: new Date().toISOString(),
          action: 'copy',
        });
      }
    };
    
    document.addEventListener('paste', handlePaste);
    if (detectCopy) {
      document.addEventListener('copy', handleCopy);
    }
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
    };
  }, [handler, detectCopy]);
}

/**
 * Network connectivity monitoring
 */
export function useNetworkMonitoring(handler: ViolationHandler) {
  const wasOfflineRef = useRef(false);
  
  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        // User came back online - this might be acceptable or not depending on policy
        wasOfflineRef.current = false;
      }
    };
    
    const handleOffline = () => {
      wasOfflineRef.current = true;
      handler.onViolation('network_failure', {
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      handleOffline();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handler]);
}

/**
 * Master hook to enable all anti-cheat measures
 */
export function useAntiCheat(options: {
  handler: ViolationHandler;
  screenShareStream?: MediaStream | null;
  enableTabDetection?: boolean;
  enableUnloadDetection?: boolean;
  enableMultiMonitor?: boolean;
  enableDevToolsBlock?: boolean;
  enableCopyPasteDetection?: boolean;
  enableNetworkMonitoring?: boolean;
  multiMonitorGracePeriod?: number;
}) {
  const {
    handler,
    screenShareStream,
    enableTabDetection = true,
    enableUnloadDetection = true,
    enableMultiMonitor = true,
    enableDevToolsBlock = true,
    enableCopyPasteDetection = false,
    enableNetworkMonitoring = true,
    multiMonitorGracePeriod = 10000,
  } = options;
  
  // Enable individual detections
  if (enableTabDetection) {
    useTabSwitchDetection(handler);
  }
  
  if (enableUnloadDetection) {
    usePageUnloadDetection(handler, true);
  }
  
  if (screenShareStream) {
    useScreenShareMonitoring(screenShareStream, handler);
  }
  
  if (enableMultiMonitor) {
    useMultiMonitorDetection(handler, multiMonitorGracePeriod);
  }
  
  if (enableDevToolsBlock) {
    useDisableDevTools();
  }
  
  if (enableCopyPasteDetection) {
    useCopyPasteDetection(handler, false);
  }
  
  if (enableNetworkMonitoring) {
    useNetworkMonitoring(handler);
  }
}

/**
 * Timer with auto-submit functionality
 */
export function useTestTimer(
  durationSeconds: number,
  onTimeUp: () => void,
  onTick?: (remainingSeconds: number) => void
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(durationSeconds);
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    remainingRef.current = durationSeconds;
    
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      
      remainingRef.current = remaining;
      
      if (onTick) {
        onTick(remaining);
      }
      
      if (remaining === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onTimeUp();
      }
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [durationSeconds, onTimeUp, onTick]);
  
  return {
    getRemainingTime: () => remainingRef.current,
  };
}
