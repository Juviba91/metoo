'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send } from 'lucide-react'
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
}: {
  connectionId: string
  initialMessages: Message[]
  currentUserId: string
  otherAlias: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    if (!content.trim() || sending) return
    setSending(true)
    const text = content.trim()
    setContent('')
    const result = await sendMessage(connectionId, text)
    if (result.error) {
      setContent(text)
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
        <div>
          <p className="font-semibold">{otherAlias}</p>
          <p className="text-xs text-muted-foreground">Conversación privada</p>
        </div>
      </header>

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
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? 'rounded-br-sm bg-foreground text-background'
                          : 'rounded-bl-sm bg-muted text-foreground'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`mt-1 text-xs ${mine ? 'text-background/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
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

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-border bg-background px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !content.trim()}
          className="shrink-0 gap-1.5"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  )
}
