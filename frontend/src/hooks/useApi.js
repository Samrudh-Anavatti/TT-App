import { useCallback, useEffect, useState } from 'react'

// Small data-fetching hook: runs `fn` on mount / when deps change,
// tracking loading + error, and exposes `reload()` for manual refresh.
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const memoFn = useCallback(fn, deps) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await memoFn())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [memoFn])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await memoFn()
        if (alive) setData(result)
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [memoFn])

  return { data, loading, error, reload, setData }
}
