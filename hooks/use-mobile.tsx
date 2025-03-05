"use client"

import * as React from "react"

// Define standard breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

type Breakpoint = keyof typeof breakpoints

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoints.md - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoints.md)
    }
    
    // Modern approach using addEventListener
    mql.addEventListener("change", onChange)
    
    // Set initial value
    setIsMobile(window.innerWidth < breakpoints.md)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])
  
  return !!isMobile
}

export function useBreakpoint(breakpoint: Breakpoint) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`)
    
    const onChange = () => {
      setMatches(mql.matches)
    }
    
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])
  
  return matches
}

export function useResponsive() {
  const isMobile = useIsMobile()
  const isSm = useBreakpoint("sm")
  const isMd = useBreakpoint("md")
  const isLg = useBreakpoint("lg")
  const isXl = useBreakpoint("xl")
  const is2Xl = useBreakpoint("2xl")
  
  return {
    isMobile,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    // More specific helpers
    isTablet: isSm && !isMd,
    isDesktop: isMd,
    isLargeDesktop: isXl
  }
}
