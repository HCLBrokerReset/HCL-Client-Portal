import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Send } from 'lucide-react'

export default function AdminMessages({ clientId, client }) {
  const { user } = useAuth()
  const { getMessages, sendMessage, markMessagesRead } = useData()
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  const messages = getMessages(clientId)

  useEffect(() => {
    markMessagesRead(clientId, user.id)
  }, [clientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage({
      clientId,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'admin',
      content: text.trim(),
    })
    setText('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-navy dark:text-white">
          Message thread — {client.businessName}
        </h3>
        <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
          Messages are visible to you and {client.contactName}
        </p>
      </div>

      {/* Thread */}
      <div className="bg-white dark:bg-navy-50 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col" style={{ minHeight: '400px' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '500px' }}>
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No messages yet. Start the conversation below.
            </p>
          )}
          {messages.map((msg) => {
            const isAdmin = msg.senderRole === 'admin'
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-sm ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <span className="text-xs text-gray-400 dark:text-white/30 px-1">
                    {msg.senderName} · {format(parseISO(msg.timestamp), 'd MMM, HH:mm')}
                  </span>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isAdmin
                        ? 'bg-navy text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-white/10 text-navy dark:text-white rounded-tl-sm'
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

        {/* Input */}
        <div className="border-t border-gray-100 dark:border-white/10 p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${client.contactName}…`}
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
