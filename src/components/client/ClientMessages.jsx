import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Send } from 'lucide-react'

export default function ClientMessages() {
  const { user } = useAuth()
  const { getClient, getMessages, sendMessage, markMessagesRead } = useData()
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  const client = getClient(user.clientId)
  const messages = getMessages(user.clientId)

  useEffect(() => {
    markMessagesRead(user.clientId, user.id)
  }, [user.clientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage({
      clientId: user.clientId,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'client',
      content: text.trim(),
    })
    setText('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">Messages</h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          Your private message thread with Barry at HCL
        </p>
      </div>

      <div
        className="bg-white dark:bg-navy-50 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col"
        style={{ minHeight: '500px' }}
      >
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4"
          style={{ maxHeight: '600px' }}
        >
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No messages yet. Send a message below.
            </p>
          )}
          {messages.map((msg) => {
            const isClient = msg.senderRole === 'client'
            return (
              <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm flex flex-col gap-1 ${isClient ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 dark:text-white/30 px-1">
                    {msg.senderName} · {format(parseISO(msg.timestamp), 'd MMM, HH:mm')}
                  </span>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isClient
                        ? 'bg-navy text-white rounded-tr-sm'
                        : 'bg-gold/10 dark:bg-gold/20 text-navy dark:text-white rounded-tl-sm border border-gold/20'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message Barry at HCL…"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 py-2.5 bg-navy dark:bg-gold dark:text-navy text-white rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
