"use client"

import { useCallback, useEffect, useRef } from "react"

interface UseFocusTrapOptions {
  enabled?: boolean
  initialFocus?: boolean
}

/**
 * Hook to trap focus within a container for accessibility
 * 
 * @param options Configuration options for the focus trap
 * @returns An object with a ref to attach to the container and methods to manage focus
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const { enabled = true, initialFocus = true } = options
  const containerRef = useRef<HTMLElement>(null)
  const firstFocusableElementRef = useRef<HTMLElement | null>(null)
  const lastFocusableElementRef = useRef<HTMLElement | null>(null)
  
  // Find focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    return Array.from(focusableElements)
  }, [])
  
  // Set focus to the first focusable element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      firstFocusableElementRef.current = elements[0]
      firstFocusableElementRef.current.focus()
    }
  }, [getFocusableElements])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    if (!containerRef.current) return
    
    const elements = getFocusableElements()
    if (elements.length === 0) return
    
    firstFocusableElementRef.current = elements[0]
    lastFocusableElementRef.current = elements[elements.length - 1]
    
    // Check if Tab key is pressed
    if (event.key === 'Tab') {
      // If Shift + Tab and focus is on first element, move to last element
      if (event.shiftKey && document.activeElement === firstFocusableElementRef.current) {
        event.preventDefault()
        lastFocusableElementRef.current?.focus()
      } 
      // If Tab and focus is on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastFocusableElementRef.current) {
        event.preventDefault()
        firstFocusableElementRef.current?.focus()
      }
    }
    
    // Handle Escape key
    if (event.key === 'Escape') {
      // Close modal or return focus to trigger element, etc.
    }
  }, [enabled, getFocusableElements])
  
  // Set up event listeners
  useEffect(() => {
    if (!enabled) return
    
    const currentContainer = containerRef.current
    if (!currentContainer) return
    
    // Focus the first element when the trap is enabled
    if (initialFocus) {
      requestAnimationFrame(() => {
        focusFirst()
      })
    }
    
    // Add event listener for keyboard navigation
    currentContainer.addEventListener('keydown', handleKeyDown)
    
    return () => {
      currentContainer.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, focusFirst, handleKeyDown, initialFocus])
  
  return {
    ref: containerRef,
    focusFirst,
    getFocusableElements
  }
}