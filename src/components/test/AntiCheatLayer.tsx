"use client";

import { useEffect, useState, useRef, createContext, useContext, useCallback } from "react";
import { usePathname, useSearchParams, useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TestContextType {
  startProctoring: () => Promise<boolean>;
  stopProctoring: () => void;
  isProctoring: boolean;
  error: string | null;
}

const TestContext = createContext<TestContextType | null>(null);

export function useTestProctoring() {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error("useTestProctoring must be used within AntiCheatLayer");
  }
  return context;
}

export function AntiCheatLayer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  const token = params?.token as string;
  const submissionId = searchParams.get("sid");

  const [isProctoring, setIsProctoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active phases to enforce checks
  const isAssessmentPhase = 
    pathname.includes("/writing") || 
    pathname.includes("/intelligence") || 
    pathname.includes("/personality") || 
    pathname.includes("/verbal");

  const stopProctoring = useCallback(async () => {
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsProctoring(false);
    
    // Final upload logic could go here if using big blob, 
    // but we use chunked upload to avoid data loss.
    // However, for S3 multipart valid we'd need complex backend.
    // For now, let's assume we upload the final blob on stop if needed.
    // Given the constraints and existing API, simpler to upload chunks or one final.
    // The previous guidelines page used 10s chunks.
    // We will stick to uploading Final Blob for now as "Screen Recording" usually is one file.
    // But 40 mins video is HUUUGE.
    // Ideally we upload chunks.
    // Let's implement robust "upload on stop" for now to match the Verbal logic.
    // If strict chunking needed, we need a different backend endpoint that appends.
    
    if (chunksRef.current.length > 0 && submissionId) {
       await uploadRecording(new Blob(chunksRef.current, { type: 'video/webm' }), submissionId);
       chunksRef.current = [];
    }

  }, [submissionId]);

  const uploadRecording = async (blob: Blob, sid: string) => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("type", "screen");
      formData.append("submissionId", sid);
      
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
            const data = await res.json();
            if (data.url && token) {
                 await fetch(`/api/test/${token}/screen-recording`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ submissionId: sid, screenUrl: data.url })
                 });
            }
        }
      } catch (e) {
        console.error("Screen upload failed", e);
      }
  };

  const startProctoring = async (): Promise<boolean> => {
    if (!submissionId) return false;
    setError(null);

    try {
      // 1. Check Monitors
      if (window.screen.availWidth && window.screen.width) {
        if (window.screen.availWidth !== window.screen.width) {
             setError("Multiple monitors detected. Please disconnect external monitors.");
             return false;
         }
      }

      // 2. Request Display Media
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any, // Try to force full screen if possible
        audio: false
      });
      
      streamRef.current = stream;

      // Detect stop
      stream.getVideoTracks()[0].onended = () => {
        logViolation("screen_share_stopped");
        stopProctoring();
      };

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' }); // widely supported
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(5000); // Create chunks every 5s
      setIsProctoring(true);

      // Periodically upload? 
      // S3 presigned PUTs are stateless (overwrite). 
      // We need AppendObject or Multipart.
      // Or we just keep them in memory (RISKY for 40mins).
      // Since I cannot rewrite the backend to support true Streaming upload in this turn easily,
      // I will keep in memory but warn user "Do not refresh". 
      // To improve: We could use IndexedDB to store chunks locally.
      
      return true;
    } catch (err) {
      console.error("Screen share error", err);
      setError("Screen share permission is required.");
      return false;
    }
  };

  const logViolation = async (type: string) => {
    if (!token || !submissionId) return;
    try {
        await fetch(`/api/test/${token}/violation`, {
            method: "POST", 
            body: JSON.stringify({ submissionId, violationType: type })
        });
        if (type === "tab_switch" || type === "screen_share_stopped") {
           router.push(`/test/${token}/disqualified`);
        }
    } catch(e) {}
  };

  useEffect(() => {
    if (!isProctoring || !isAssessmentPhase) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("tab_switch");
      }
    };
    
    // Prevent Context Menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Prevent Developer Tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key))
      ) {
        e.preventDefault();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      
      if (token && submissionId) {
          const blob = new Blob([JSON.stringify({ 
              submissionId, 
              violationType: "page_refresh" 
          })], { type: 'application/json' });
          navigator.sendBeacon(`/api/test/${token}/violation`, blob);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProctoring, isAssessmentPhase, token, submissionId]);

  // Ensure proctoring stops if we leave the test flow (e.g. to finish)
  useEffect(() => {
      if (pathname.includes("/finish") || pathname.includes("/disqualified")) {
          stopProctoring();
      }
  }, [pathname, stopProctoring]);

  return (
    <TestContext.Provider value={{ startProctoring, stopProctoring, isProctoring, error }}>
      {children}
    </TestContext.Provider>
  );
}
