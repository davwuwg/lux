"use client"

import { useEffect, useRef, useState } from "react"

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  theme?: "light" | "dark" | "auto"
  size?: "normal" | "compact"
  className?: string
}

export function Turnstile({
  siteKey,
  onVerify,
  theme = "auto",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [widgetId, setWidgetId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load the Turnstile script if not already loaded
    if (!loaded) {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      
      script.onload = () => {
        setLoaded(true)
      }
      
      document.body.appendChild(script)
      
      return () => {
        document.body.removeChild(script)
      }
    }
    
    // Render Turnstile widget when script is loaded
    if (loaded && containerRef.current && window.turnstile) {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token)
        },
        theme: theme,
        size: size,
      })
      
      setWidgetId(id)
      
      return () => {
        if (widgetId) {
          window.turnstile.remove(widgetId)
        }
      }
    }
  }, [siteKey, onVerify, theme, size, loaded])

  return <div ref={containerRef} className={className} />
}

// Extend the global Window interface to include Turnstile
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}