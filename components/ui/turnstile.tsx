"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Define prop types for the Turnstile component
interface TurnstileProps {
  sitekey: string;
  onVerify?: (token: string) => void;
  onError?: (error: any) => void;
  onExpire?: () => void;
  action?: string;
  cData?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  responseFieldName?: string;
  refreshExpired?: "auto" | "manual" | "never";
  containerId?: string;
  className?: string;
}

export const Turnstile = ({
  sitekey,
  onVerify,
  onError,
  onExpire,
  action,
  cData,
  theme = "auto",
  size = "normal",
  responseFieldName = "cf-turnstile-response",
  refreshExpired = "auto",
  containerId,
  className,
}: TurnstileProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = containerId || `cf-turnstile-${Math.random().toString(36).substring(2, 11)}`;

  useEffect(() => {
    // Don't initialize until the script is loaded
    if (!isLoaded || !window.turnstile) return;

    // Reset any existing widget
    if (widgetId) {
      window.turnstile.remove(widgetId);
    }

    // Initialize widget once the script is loaded
    const id = window.turnstile.render(`#${uniqueId}`, {
      sitekey,
      callback: (token: string) => {
        if (onVerify) onVerify(token);
      },
      "error-callback": (error: any) => {
        if (onError) onError(error);
      },
      "expired-callback": () => {
        if (onExpire) onExpire();
      },
      theme,
      size,
      "response-field-name": responseFieldName,
      "refresh-expired": refreshExpired,
      ...(action && { action }),
      ...(cData && { cData }),
    });

    setWidgetId(id);

    // Cleanup
    return () => {
      if (id && window.turnstile) {
        window.turnstile.remove(id);
      }
    };
  }, [isLoaded, sitekey, theme, size, action, cData, responseFieldName, refreshExpired, onVerify, onError, onExpire, uniqueId]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={() => setIsLoaded(true)}
        strategy="afterInteractive"
      />
      <div id={uniqueId} ref={containerRef} className={className} />
    </>
  );
};

// Add type declarations for the Turnstile global object
declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        params: any
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
      isExpired: (widgetId?: string) => boolean;
    };
  }
}

export default Turnstile;