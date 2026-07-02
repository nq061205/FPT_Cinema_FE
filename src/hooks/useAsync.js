import { useCallback, useEffect, useState } from 'react'

export function useAsync(asyncFn, options = {}) {
  const { immediate = true, initialData = null } = options
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)

      try {
        const result = await asyncFn(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [asyncFn],
  )

  useEffect(() => {
    if (!immediate) return

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        execute().catch(() => {})
      }
    })

    return () => {
      cancelled = true
    }
  }, [execute, immediate])

  return { data, error, loading, execute, setData }
}
