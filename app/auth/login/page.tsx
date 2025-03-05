"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Turnstile } from "@/components/ui/turnstile"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Handle Turnstile verification
  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  // Handle login form submission with Turnstile verification
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!turnstileToken) {
      toast({
        title: "Security verification required",
        description: "Please complete the security check before logging in",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      // Verify the Turnstile token on the server
      const verifyResponse = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResult.success) {
        toast({
          title: "Verification failed",
          description: "Security check failed. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Proceed with authentication
      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 800)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Authentication error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }, [router, toast, turnstileToken])

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background">
      {/* Simple background pattern */}
      <div className="fixed inset-0 bg-grid-white/[0.02]" />
      
      <div className="container max-w-md p-4 relative z-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the management suite
          </p>
        </div>

        <Card className="w-full shadow-lg border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button 
                    type="button"
                    variant="link" 
                    className="h-auto p-0 text-xs"
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-10 pl-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              
              {/* Cloudflare Turnstile component */}
              <div className="my-4 flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onVerify={handleTurnstileVerify}
                  theme="auto"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 transition-all duration-200 relative"
                disabled={isLoading || !turnstileToken}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    {/* Enhanced visually appealing loading spinner */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 relative">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-background/20"></div>
                        {/* Spinning gradient ring */}
                        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary-foreground animate-spin"></div>
                        {/* Inner pulse */}
                        <div className="absolute inset-[30%] rounded-full bg-primary-foreground/70 animate-pulse"></div>
                      </div>
                      <span className="ml-2 text-primary-foreground">Signing in...</span>
                    </div>
                  </span>
                ) : !turnstileToken ? (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Complete verification
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm">
          <p className="text-muted-foreground">
            Secure access for authorized personnel only
          </p>
        </div>
      </div>
    </main>
  )
}

