'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Flag } from 'lucide-react'
import Link from 'next/link'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export function ChatView({
  connectionId,
  initialMessages,
  currentUserId,
  otherAlias,
  initialStatus,
  volunteerId,
}: {
  connectionId: string
  initialMessages: Message[]
  currentUserId: string
  otherAlias: string
  initialStatus: 'pending' | 'accepted' | 'rejected'
  volunteerId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [status, setStatus] = useState(initialStatus)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isVolunteer = currentUserId === volunteerId

  // Scroll to bottom on mount and on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Subscribe to connection status changes (so seeker sees accepted in real-time)
  useEffect(() => {
    if (status === 'accepted') return
    const supabase = createClient()
    const channel = supabase
      .channel(`conn-${connectionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'connections', filter: `id=eq.${connectionId}` },
        (payload) => {
          const newStatus = (payload.new as any).status
          if (newStatus) setStatus(newStatus)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [connectionId, status])

  // Real-time subscription — receives messages from the OTHER user
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            // Replace matching temp message (same sender + content) or add if new
            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith('tmp-') &&
                m.sender_id === msg.sender_id &&
                m.content === msg.content,
            )
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = msg
              return next
            }
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [connectionId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return

    setSending(true)
    setSendError(null)
    setContent('')

    // Optimistic: show immediately while server action runs
    const tempId = `tmp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender_id: currentUserId, content: text, created_at: new Date().toISOString() },
    ])

    const result = await sendMessage(connectionId, text)

    if (result.error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setContent(text)
      setSendError(result.error)
      setSending(false)
      return
    }

    // Replace temp with the real message returned by the server action
    if (result.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (result.message as Message) : m)),
      )
    }

    // Volunteer auto-accepts on first reply
    if (isVolunteer && status === 'pending') {
      setStatus('accepted')
    }

    setSending(false)
    inputRef.current?.focus()
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const grouped = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const date = new Date(msg.created_at).toDateString()
    const last = acc[acc.length - 1]
    if (last?.date === date) {
      last.msgs.push(msg)
    } else {
      acc.push({ date, msgs: [msg] })
    }
    return acc
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/dashboard"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <p className="font-semibold">{otherAlias}</p>
          <p className="text-xs text-muted-foreground">Conversación privada</p>
        </div>
        <a
          href={`mailto:juan@bay-apps.com?subject=Reporte de usuario en metoo&body=Quiero reportar al usuario "${otherAlias}" por el siguiente motivo:%0A%0A`}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          title="Reportar usuario"
        >
          <Flag className="size-4" />
        </a>
      </header>

      {/* Pending banner */}
      {status === 'pending' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {isVolunteer
            ? 'Al responder aceptarás esta solicitud automáticamente.'
            : 'Tu solicitud está pendiente de respuesta.'}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {grouped.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <p className="mb-1 text-2xl">👋</p>
              <p className="text-sm">Sé el primero en escribir.</p>
            </div>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs capitalize text-muted-foreground">
                {formatDate(msgs[0].created_at)}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {msgs.map((msg) => {
                const mine = msg.sender_id === currentUserId
                const isTemp = msg.id.startsWith('tmp-')
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm transition-opacity ${
                        mine
                          ? 'rounded-br-sm bg-foreground text-background'
                          : 'rounded-bl-sm bg-muted text-foreground'
                      } ${isTemp ? 'opacity-60' : 'opacity-100'}`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`mt-1 text-xs ${mine ? 'text-background/60' : 'text-muted-foreground'}`}
                      >
                        {isTemp ? 'Enviando…' : formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Rejected state */}
      {status === 'rejected' ? (
        <div className="border-t border-border bg-background px-4 py-5 text-center"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}>
          <p className="mb-3 text-sm text-muted-foreground">Esta conversación ha terminado.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Buscar otro voluntario →
          </Link>
        </div>
      ) : (
        /* Input */
        <form
          onSubmit={handleSend}
          className="pb-safe flex flex-col gap-2 border-t border-border bg-background px-4 pt-3"
        >
          {sendError && <p className="text-xs text-destructive">{sendError}</p>}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe un mensaje..."
              maxLength={2000}
              autoComplete="off"
              className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !content.trim()}
              className="size-11 shrink-0 rounded-full"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
