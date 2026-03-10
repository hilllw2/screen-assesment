
"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

// Minimal anti-cheat layer for layout
export default function AntiCheatLayer({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if we're on an admin or recruiter page
  const isAdminOrRecruiter = pathname?.startsWith("/admin") || pathname?.startsWith("/recruiter");

  useEffect(() => {
    // Skip anti-cheat for admin and recruiter pages
    if (isAdminOrRecruiter) {
      return;
    }

    // Disable right-click context menu
    const handleContextMenu = (e: Event) => e.preventDefault();
    // Disable copy, cut, paste
    const handleCopyCutPaste = (e: Event) => e.preventDefault();
    // Attempt to block PrintScreen and common copy shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) ||
        (e.metaKey && (e.key === "c" || e.key === "v" || e.key === "x"))
      ) {
        document.body.style.filter = "blur(8px)";
        setTimeout(() => {
          document.body.style.filter = "";
        }, 1000);
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCutPaste);
    document.addEventListener("cut", handleCopyCutPaste);
    document.addEventListener("paste", handleCopyCutPaste);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCutPaste);
      document.removeEventListener("cut", handleCopyCutPaste);
      document.removeEventListener("paste", handleCopyCutPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAdminOrRecruiter]);
  return <>{children}</>;
}
