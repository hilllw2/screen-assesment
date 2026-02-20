
"use client";
import React, { useEffect } from "react";

// Minimal anti-cheat layer for layout
export default function AntiCheatLayer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
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
  }, []);
  return <>{children}</>;
}
