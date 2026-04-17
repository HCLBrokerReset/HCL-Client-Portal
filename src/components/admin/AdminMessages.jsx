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

  useEffect(() => { markMessagesRead(clientId, user.id) }, [clientId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage({ clientId, senderId: user.id, senderName: user.name, senderRole: 'admin', content: text.trim() })
    setText('')
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Messages — {client.businessName}</h3>
        <p className="text-xs text-slate-400 mt-0.5">Visible to you and {client.contactName}</p>
      </div>

      <div className="card flex flex-col" style={{ minHeight: '380px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '450px' }}>
          {messages.length===0 && <p className="text-sm text-slate-400 text-center py-8">No messages yet.</p>}
          {messages.map(msg => {
            const isAdmin = msg.senderRole==='admin'
            return (
              <div key={msg.id} className={`flex ${isAdmin?'justify-end':'justify-start'}`}>
                <div className={`max-w-[78%] flex flex-col gap-0.5 ${isAdmin?'items-end':'items-start'}`}>
                  <span className="text-[11px] text-slate-400 px-1">
                    {msg.senderName} · {format(parseISO(msg.timestamp),'d MMM, HH:mm')}
                  </span>
                  <div className={`px-4 py-3 rounded-[22px] text-sm leading-relaxed ${
                    isAdmin
                      ? 'bg-btn-primary text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-tl-sm'
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
            <input type="text" value={text} onChange={e=>setText(e.target.value)}
              placeholder={`Message ${client.contactName}…`}
              className="flex-1 rounded-[18px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-royal/30"
            />
            <button type="submit" disabled={!text.trim()}
              className="grid h-11 w-11 place-items-center rounded-[18px] bg-btn-primary text-white disabled:opacity-50 flex-shrink-0 shadow-btn">
              <Send size={15}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
