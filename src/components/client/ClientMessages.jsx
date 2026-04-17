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

  useEffect(() => { markMessagesRead(user.clientId, user.id) }, [user.clientId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage({ clientId: user.clientId, senderId: user.id, senderName: user.name, senderRole: 'client', content: text.trim() })
    setText('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Chat</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Private thread with Barry at HCL</p>
      </div>

      <div className="card flex flex-col" style={{ minHeight: '420px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '480px' }}>
          {messages.length===0 && <p className="text-sm text-slate-400 text-center py-8">No messages yet.</p>}
          {messages.map(msg => {
            const isMe = msg.senderRole==='client'
            return (
              <div key={msg.id} className={`flex ${isMe?'justify-end':'justify-start'}`}>
                <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe?'items-end':'items-start'}`}>
                  <span className="text-[11px] text-slate-400 px-1">
                    {msg.senderName} · {format(parseISO(msg.timestamp),'d MMM, HH:mm')}
                  </span>
                  <div className={`px-4 py-3 rounded-[22px] text-sm leading-relaxed ${
                    isMe
                      ? 'bg-btn-primary text-white rounded-tr-sm'
                      : 'bg-[linear-gradient(135deg,#F7D26F22,#C9A84C22)] border border-gold/20 text-slate-900 dark:text-white rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 p-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){e.preventDefault();handleSend(e)} }}
              placeholder="Reply to Barry…"
              rows={1}
              className="flex-1 rounded-[18px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-royal/30 resize-none"
            />
            <button type="submit" disabled={!text.trim()}
              className="grid h-12 w-12 place-items-center rounded-[18px] bg-btn-primary text-white disabled:opacity-50 flex-shrink-0 shadow-btn">
              <Send size={16}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
