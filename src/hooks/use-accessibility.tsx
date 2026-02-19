"use client"

import { useEffect } from "react"

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        container.dispatchEvent(new Event("close"))
      }
    }

    container.addEventListener("keydown", handleTab as EventListener)
    container.addEventListener("keydown", handleEscape as EventListener)

    // Focus first element on mount
    firstElement?.focus()

    return () => {
      container.removeEventListener("keydown", handleTab as EventListener)
      container.removeEventListener("keydown", handleEscape as EventListener)
    }
  }, [isActive, containerRef])
}

/**
 * Hook to announce screen reader messages
 */
export function useScreenReaderAnnounce() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div")
    announcement.setAttribute("role", "status")
    announcement.setAttribute("aria-live", priority)
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return { announce }
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  items: HTMLElement[],
  options?: {
    onSelect?: (index: number) => void
    loop?: boolean
  }
) {
  const { onSelect, loop = true } = options || {}

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1
        }
        break
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0
        }
        break
      case "Home":
        e.preventDefault()
        nextIndex = 0
        break
      case "End":
        e.preventDefault()
        nextIndex = items.length - 1
        break
      case "Enter":
      case " ":
        e.preventDefault()
        onSelect?.(currentIndex)
        return
    }

    items[nextIndex]?.focus()
  }

  return { handleKeyDown }
}

/**
 * Skip to main content link (accessibility)
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}
