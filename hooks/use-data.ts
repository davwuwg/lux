"use client"

import { useCallback, useEffect, useState } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface UseDataOptions<T> {
  initialData?: T | null
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  transformResponse?: (data: any) => T
}

// General purpose data fetching hook
export function useData<T>(
  endpoint: string,
  options: UseDataOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<T> = await apiClient.get<T>(endpoint)
      
      if (response.error) {
        setError(response.error)
        options.onError?.(response.error)
      } else if (response.data) {
        const transformedData = options.transformResponse 
          ? options.transformResponse(response.data)
          : response.data
          
        setData(transformedData)
        options.onSuccess?.(transformedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, isLoading, refetch: fetchData }
}

// Mutation hook for data modifications
export function useDataMutation<T, D = any>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options: UseDataOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (payload?: D) => {
    setIsLoading(true)
    setError(null)
    
    try {
      let response: ApiResponse<T>
      
      if (method === 'delete') {
        response = await apiClient.delete<T>(endpoint)
      } else if (payload) {
        response = await apiClient[method]<T>(endpoint, payload)
      } else {
        throw new Error('Payload is required for this mutation')
      }
      
      if (response.error) {
        setError(response.error)
        options.onError?.(response.error)
        return { success: false, error: response.error }
      }
      
      if (response.data) {
        const transformedData = options.transformResponse 
          ? options.transformResponse(response.data)
          : response.data
          
        setData(transformedData)
        options.onSuccess?.(transformedData)
        return { success: true, data: transformedData }
      }
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, method, options])

  return { mutate, data, error, isLoading }
}

// Infinite loading hook for paginated data
export function useInfiniteData<T>(
  baseEndpoint: string,
  options: UseDataOptions<T[]> & {
    pageParam?: string
    limitParam?: string
    initialPage?: number
    limit?: number
  } = {}
) {
  const {
    pageParam = 'page',
    limitParam = 'limit',
    initialPage = 1,
    limit = 10,
  } = options
  
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(true)
  
  const buildEndpoint = useCallback((pageNumber: number) => {
    const url = new URL(baseEndpoint, window.location.origin)
    url.searchParams.set(pageParam, pageNumber.toString())
    url.searchParams.set(limitParam, limit.toString())
    return url.toString()
  }, [baseEndpoint, pageParam, limitParam, limit])
  
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.get<T[]>(buildEndpoint(page))
      
      if (response.error) {
        setError(response.error)
        options.onError?.(response.error)
      } else if (response.data) {
        const newItems = response.data
        const transformedItems = options.transformResponse 
          ? options.transformResponse(newItems)
          : newItems
        
        if (transformedItems.length === 0 || transformedItems.length < limit) {
          setHasMore(false)
        }
        
        setData(prev => [...prev, ...transformedItems])
        setPage(prev => prev + 1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [buildEndpoint, hasMore, isLoading, limit, options, page])
  
  const reset = useCallback(() => {
    setData([])
    setPage(initialPage)
    setHasMore(true)
    setError(null)
  }, [initialPage])
  
  return { data, error, isLoading, hasMore, loadMore, reset }
}