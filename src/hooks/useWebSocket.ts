'use client'
import { useEffect, useRef, useCallback } from 'react'

type WSEvent = { type: string; payload: Record<string, unknown> }

export function useWebSocket(onMessage: (event: WSEvent) => void) {
  const ws = useRef<WebSocket | null>(null)
  const onMsg = useRef(onMessage)
  onMsg.current = onMessage

  const connect = useCallback(() => {
    const url = (process.env.NEXT_PUBLIC_WS_URL || 'wss://photo.parameedev.online/ws')
    ws.current = new WebSocket(url)

    ws.current.onmessage = (e) => {
      try { onMsg.current(JSON.parse(e.data)) } catch {}
    }
    ws.current.onclose = () => {
      setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => ws.current?.close()
  }, [connect])
}
