"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Turnstile from "@/components/ui/turnstile"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState<boolean>(false)

  // Detect if we're in development environment to handle local vs domain deployment
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Turnstile site key - use environment variable in production
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAA_nlAnnKt5Uo_bH"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!turnstileToken) {
      setTurnstileError(true)
      toast.error("Please complete the security verification")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Verify the Turnstile token with our API endpoint
      const verificationResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      })
      
      const verificationResult = await verificationResponse.json()
      
      if (!verificationResult.success) {
        setIsLoading(false)
        toast.error("Security verification failed. Please try again.")
        setTurnstileError(true)
        return
      }
      
      // Proceed with actual login process (replace with your real authentication)
      // For demonstration, we'll simulate a successful authentication
      setTimeout(() => {
        setIsLoading(false)
        toast.success("Login successful!")
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      setIsLoading(false)
      toast.error("An error occurred during login. Please try again.")
      console.error("Login error:", error)
    }
  }

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token)
    setTurnstileError(false)
  }

  const handleTurnstileError = () => {
    setTurnstileError(true)
    setTurnstileToken(null)
  }

  const handleTurnstileExpire = () => {
    setTurnstileToken(null)
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      
      {/* Container with max width for larger screens */}
      <div className="container relative flex min-h-screen max-w-screen-xl items-center justify-center">
        <div className="flex w-full flex-col items-center lg:w-1/2 lg:px-8">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access the management suite
              </p>
            </div>
            <Card className="w-full border-border/50">
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label 
                      htmlFor="email" 
                      className="text-sm font-medium text-foreground/90"
                    >
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/50" />
                      <Input
                        id="email"
                        placeholder="name@company.com"
                        type="email"
                        autoComplete="email"
                        required
                        className="h-10 bg-background/50 border-border/40 pl-10 placeholder:text-muted-foreground/30 transition-colors hover:border-border focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label 
                        htmlFor="password" 
                        className="text-sm font-medium text-foreground/90"
                      >
                        Password
                      </Label>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/50" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="h-10 bg-background/50 border-border/40 pl-10 pr-10 placeholder:text-muted-foreground/30 transition-colors hover:border-border focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10 text-muted-foreground/70 hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Cloudflare Turnstile Component */}
                  <div className="py-2">
                    <div className={`flex justify-center ${turnstileError ? 'border border-red-500 rounded-md p-1' : ''}`}>
                      <Turnstile
                        sitekey={TURNSTILE_SITE_KEY}
                        onVerify={handleTurnstileVerify}
                        onError={handleTurnstileError}
                        onExpire={handleTurnstileExpire}
                        theme="auto"
                        size="normal"
                        responseFieldName="cf-turnstile-response"
                        refreshExpired="auto"
                      />
                    </div>
                    {turnstileError && (
                      <div className="flex items-center mt-2 text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Please complete the security verification
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className={"mt-2 w-full relative transition-all duration-200 " + 
                      (isLoading ? 'bg-primary/90 shadow-lg' : '')}
                    disabled={isLoading || !turnstileToken}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="relative h-4 w-4">
                            <div className="absolute inset-0 h-full w-full animate-ping rounded-full bg-white/30 duration-1000" />
                            <Loader2 className="absolute inset-0 h-4 w-4 animate-spin" />
                          </div>
                          <span className="inline-flex animate-pulse">Signing in...</span>
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </div>
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Secure access for authorized personnel only
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                © 2025 Executive Management Suite
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

