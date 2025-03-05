import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { ComponentType } from 'react'

/**
 * A utility function to dynamically import components with consistent loading states
 * 
 * @param importFn - The import function returning the component
 * @param LoadingComponent - Optional custom loading component
 * @returns Dynamically imported component with loading state
 */
export function dynamicImport<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  LoadingComponent: ComponentType = () => <Skeleton className="w-full h-[200px]" />
) {
  return dynamic(importFn, {
    loading: LoadingComponent as any, // Type assertion to resolve the type issue
    ssr: false, // Disable SSR for heavy components that aren't needed for initial render
  })
}