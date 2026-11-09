import { useEffect, useRef, useState } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    function sync() {
      setOnline(navigator.onLine)
    }
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return online
}

/** Fires once when the browser flips from offline → online. */
export function useJustReconnected() {
  const online = useOnline()
  const prev = useRef(online)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    if (!prev.current && online) setJustReconnected(true)
    prev.current = online
  }, [online])

  function dismissReconnect() {
    setJustReconnected(false)
  }

  return { online, justReconnected, dismissReconnect }
}
