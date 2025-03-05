"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="luxury-card max-w-md w-full p-6 rounded-lg border border-border bg-card text-card-foreground shadow-lg">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="w-full rounded bg-muted p-4 text-left">
                <p className="font-mono text-sm">{error.message}</p>
              </div>
            )}
            <Button
              onClick={() => reset()}
              className="mt-4"
              variant="default"
              size="lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}