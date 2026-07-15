import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(asyncFn, options = {}) {
  const { immediate = true, initialData = null } = options
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
    }
  }, [])

  const execute = useCallback(
    async (...args) => {
      const requestId = ++requestIdRef.current
      if (mountedRef.current) {
        setLoading(true)
        setError(null)
      }

      try {
        const result = await asyncFn(...args)
        if (mountedRef.current && requestId === requestIdRef.current) setData(result)
        return result
      } catch (err) {
        if (mountedRef.current && requestId === requestIdRef.current) setError(err)
        throw err
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) setLoading(false)
      }
    },
    [asyncFn],
  )

  useEffect(() => {
    if (!immediate) {
      requestIdRef.current += 1
      return undefined
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        execute().catch(() => {})
      }
    })

    return () => {
      cancelled = true
      requestIdRef.current += 1
    }
  }, [execute, immediate])

  return { data, error, loading: immediate ? loading : false, execute, setData }
}
