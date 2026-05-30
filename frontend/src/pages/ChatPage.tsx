import { useEffect, useRef, useState } from 'react'
import { Send, Zap, Trash2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { MessageBubble } from '../components/ui/MessageBubble'
import { PromptSuggestions } from '../components/ui/PromptSuggestions'

export function ChatPage() {
  /*const { session, loading, error, send, clear } = useChat()*/
  const { messages, loading, error, sendMessage, clearChat } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isEmpty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
/* }, [session.messages]) */
}, [messages])

/*
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    send(input.trim())
    setInput('')
  }
 */
  
  const handleSubmit = (e: React.FormEvent) => {
	e.preventDefault()
	if (!input.trim() || loading) return
	sendMessage(input.trim())
	setInput('')
	}

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  function handleSuggestion(prompt: string) {
    sendMessage(prompt)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 pb-8">
            {/* Hero */}
            <div className="text-center space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
                <Zap size={10} className="text-amber-400" />
                Powered by Google ADK + Gemini 2.0 Flash
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                Reservoir Intelligence<br />
                <span className="text-petroleum-400">at your fingertips</span>
              </h1>
              <p className="text-sm text-petroleum-400 leading-relaxed">
                Multi-agent AI workstation for African upstream O&G engineers.
                ECLIPSE QC · DCA/EUR · RelPerm · Executive Reports via A2A.
              </p>
            </div>

            {/* Suggestions */}
            <PromptSuggestions onSelect={handleSuggestion} />

            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['ADK Orchestrator', 'A2A Protocol', 'Safety Callbacks', 'Gemini 2.0', 'Cloud Run'].map(b => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full font-mono
                  bg-petroleum-900 border border-petroleum-700 text-petroleum-400">{b}</span>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {error && (
              <div className="p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm font-mono">
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-petroleum-800 bg-petroleum-950">
        <form onSubmit={handleSubmit}
          className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about simulation QC, DCA, RelPerm, or request an executive report…"
              rows={1}
              disabled={loading}
              className="w-full resize-none px-4 py-3 rounded-xl text-sm
                bg-petroleum-900 border border-petroleum-700 text-petroleum-100
                placeholder:text-petroleum-600 focus:outline-none
                focus:border-petroleum-500 focus:ring-1 focus:ring-petroleum-500
                disabled:opacity-50 font-body leading-relaxed
                min-h-[48px] max-h-[180px] overflow-y-auto"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 180) + 'px'
              }}
            />
          </div>
          <button type="submit" disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
              bg-petroleum-600 hover:bg-petroleum-500 disabled:opacity-40
              disabled:cursor-not-allowed transition-all text-white
              active:scale-95">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} />
            }
          </button>
        </form>
        <p className="text-xs text-petroleum-600 text-center mt-2 font-mono">
          Shift+Enter for new line · Enter to send · ZDR: no data retained
        </p>
      </div>
    </div>
  )
}
