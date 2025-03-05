"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
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
    <DashboardLayout>
      <div className="flex items-center justify-center h-full">
        <Card className="luxury-card max-w-md w-full">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              An error occurred while loading the dashboard. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              {process.env.NODE_ENV === "development" && (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  {error.message}
                </pre>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={reset}>Try again</Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}