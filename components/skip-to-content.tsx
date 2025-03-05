"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function SkipToContent() {
  const [isMounted, setIsMounted] = useState(false)

  // Only render on client side to avoid hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      Skip to content
    </a>
  )
}