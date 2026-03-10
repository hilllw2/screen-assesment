import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseAntiCheatOptions {
  submissionId: string;
  token: string;
  enabled?: boolean;
}

export function useAntiCheat({ submissionId, token, enabled = true }: UseAntiCheatOptions) {
  const router = useRouter();
  const violationReportedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allowSystemDialogsRef = useRef(true); // Allow dialogs for first 30 seconds

  useEffect(() => {
    if (!enabled || !submissionId) return;

    // Allow system dialogs (mic permission, screen share, etc.) for first 30 seconds
    const allowDialogsTimeout = setTimeout(() => {
      allowSystemDialogsRef.current = false;
      console.log('🔒 Anti-cheat now in strict mode');
    }, 30000);

    const reportViolation = async (violationType: string) => {
      // Only report once to avoid duplicate violations
      if (violationReportedRef.current) return;
      violationReportedRef.current = true;

      console.error(`🚨 VIOLATION DETECTED: ${violationType}`);

      try {
        await fetch(`/api/test/${token}/disqualify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            reason: violationType,
          }),
        });

        // Redirect to disqualification page
        router.push(`/test/${token}/disqualified?sid=${submissionId}&reason=${violationType}`);
      } catch (error) {
        console.error('Failed to report violation:', error);
      }
    };

    // 1. TAB VISIBILITY / WINDOW FOCUS DETECTION
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.error('🚨 Tab became hidden - IMMEDIATE VIOLATION');
        reportViolation('tab_switch');
      }
    };

    const handleBlur = () => {
      // Don't trigger during system dialogs (mic permission, screen share, etc.)
      if (allowSystemDialogsRef.current) {
        console.log('⚠️ Window blur ignored - system dialog allowed');
        return;
      }

      // Clear any existing timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }

      // Wait 2 seconds before reporting - gives time for legitimate browser dialogs
      blurTimeoutRef.current = setTimeout(() => {
        // Only report if tab is actually hidden (not just a temporary dialog)
        if (document.hidden || document.visibilityState === 'hidden') {
          console.error('🚨 Window lost focus and tab is hidden - VIOLATION');
          reportViolation('tab_switch');
        } else {
          console.log('⚠️ Window blur but tab visible - system dialog, ignoring');
        }
      }, 2000);
    };

    const handleFocus = () => {
      // Cancel any pending blur violations when focus returns
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
        console.log('✅ Focus returned - blur violation cancelled');
      }

      // Check if tab was hidden while we had focus
      if (!allowSystemDialogsRef.current && document.hidden) {
        console.error('🚨 Tab was hidden - VIOLATION');
        reportViolation('tab_switch');
      }
    };

    // Additional check using Page Visibility API
    const checkVisibility = () => {
      // Skip during grace period for system dialogs
      if (allowSystemDialogsRef.current) {
        return;
      }
      
      if (document.visibilityState === 'hidden') {
        console.error('🚨 Page visibility hidden - VIOLATION');
        reportViolation('tab_switch');
      }
    };

    // 2. COPY/PASTE DETECTION
    const handleCopy = (e: ClipboardEvent) => {
      console.warn('⚠️ Copy action detected');
      e.preventDefault();
      reportViolation('copy_paste');
    };

    const handlePaste = (e: ClipboardEvent) => {
      console.warn('⚠️ Paste action detected');
      e.preventDefault();
      reportViolation('copy_paste');
    };

    const handleCut = (e: ClipboardEvent) => {
      console.warn('⚠️ Cut action detected');
      e.preventDefault();
      reportViolation('copy_paste');
    };

    // 3. DEVELOPER TOOLS DETECTION
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.warn('⚠️ DevTools likely open - VIOLATION');
        reportViolation('developer_tools');
      }
    };

    // 4. CONTEXT MENU (RIGHT-CLICK) DETECTION
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.warn('⚠️ Right-click blocked');
      return false;
    };

    // 5. KEYBOARD SHORTCUTS DETECTION
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        console.warn('⚠️ F12 pressed - VIOLATION');
        reportViolation('developer_tools');
        return false;
      }

      // Ctrl/Cmd + Shift + I/J/C - DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        console.warn('⚠️ DevTools shortcut - VIOLATION');
        reportViolation('developer_tools');
        return false;
      }

      // Ctrl/Cmd + U - View source
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        console.warn('⚠️ View source blocked');
        return false;
      }

      // Ctrl/Cmd + S - Save page
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.warn('⚠️ Save page blocked');
        return false;
      }

      // Ctrl/Cmd + P - Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        console.warn('⚠️ Print blocked');
        return false;
      }

      // Ctrl/Cmd + C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 0) {
          e.preventDefault();
          console.warn('⚠️ Copy shortcut blocked - VIOLATION');
          reportViolation('copy_paste');
          return false;
        }
      }

      // Ctrl/Cmd + V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        console.warn('⚠️ Paste shortcut blocked - VIOLATION');
        reportViolation('copy_paste');
        return false;
      }

      // Ctrl/Cmd + X - Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 0) {
          e.preventDefault();
          console.warn('⚠️ Cut shortcut blocked - VIOLATION');
          reportViolation('copy_paste');
          return false;
        }
      }
    };

    // 6. PREVENT PAGE REFRESH
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be lost and you will be disqualified.';
      return e.returnValue;
    };

    // 7. MULTIPLE MONITORS DETECTION
    const checkMultipleMonitors = () => {
      // @ts-ignore - isExtended is experimental API
      if (window.screen.isExtended) {
        console.warn('⚠️ Multiple monitors detected - WARNING');
        // Just warn, don't disqualify immediately
      }
    };

    // 8. DETECT SCREEN SHARING STOPPED
    const checkScreenSharing = () => {
      const screenStream = (window as any).__screenStream;
      if (screenStream) {
        const videoTracks = screenStream.getVideoTracks();
        if (videoTracks.length === 0 || !videoTracks[0].enabled) {
          console.warn('⚠️ Screen sharing stopped - VIOLATION');
          reportViolation('tab_switch'); // Using tab_switch as the reason
        }
      }
    };

    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check visibility periodically (aggressive)
    const visibilityInterval = setInterval(checkVisibility, 500);

    // Check DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Check screen sharing periodically
    const screenShareInterval = setInterval(checkScreenSharing, 2000);
    
    // Check multiple monitors on mount
    checkMultipleMonitors();

    console.log('✅ Anti-cheat monitoring active (AGGRESSIVE MODE)');

    // Cleanup
    return () => {
      clearTimeout(allowDialogsTimeout);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(visibilityInterval);
      clearInterval(devToolsInterval);
      clearInterval(screenShareInterval);
      console.log('🛑 Anti-cheat monitoring stopped');
    };
  }, [submissionId, token, enabled, router]);
}
