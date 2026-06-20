'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  body: string
  created_at: string
  read: boolean
  sender_user_id: string | null
  users?: { name: string; role: string } | null
}

interface Props {
  currentUserId: string
  currentUserName: string
  currentRole: string
}

export function ChatPanel({ currentUserId, currentUserName, currentRole }: Props) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load room + messages
  const loadRoom = useCallback(async () => {
    setLoading(true)
    try {
      const rr = await fetch('/api/chat/room')
      const { room } = await rr.json()
      if (!room) return
      setRoomId(room.id)

      const mr = await fetch(`/api/chat/messages?roomId=${room.id}`)
      const { messages: msgs } = await mr.json()
      setMessages(msgs || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRoom() }, [loadRoom])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${roomId}` },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || !roomId || sending) return
    const body = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      read: false,
      sender_user_id: currentUserId,
      users: { name: currentUserName, role: currentRole },
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, body }),
      })
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const isMyMsg = (msg: Message) =>
    msg.users?.name === currentUserName || msg.sender_user_id === currentUserId

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col" style={{ height: 520 }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Direct Message — Account Manager</p>
            <p className="text-xs text-muted-foreground">Live chat between TPO and Skill Tank AM</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs',
          connected ? 'text-green-600' : 'text-muted-foreground'
        )}>
          <Wifi className="h-3 w-3" />
          {connected ? 'Live' : 'Connecting…'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No messages yet — start the conversation</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = isMyMsg(msg)
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[72%] space-y-1')}>
                <div className={cn('flex items-center gap-2', isMine ? 'flex-row-reverse' : '')}>
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                    isMine ? 'bg-primary' : 'bg-violet-500'
                  )}>
                    {(msg.users?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {msg.users?.name || 'User'}
                    {msg.users?.role && ` · ${msg.users.role.replace(/_/g, ' ')}`}
                  </span>
                </div>
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                )}>
                  {msg.body}
                </div>
                <p className={cn('text-[10px] text-muted-foreground', isMine ? 'text-right' : '')}>
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 flex items-end gap-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground min-h-[40px] max-h-[120px]"
          style={{ height: 'auto' }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
