import { useEffect, useRef, useState } from 'react'
import { Send, Zap, Trash2, Square } from 'lucide-react'
import { useChat } from '../context/ChatContext'
//import { useChat } from '../hooks/useChat'
import { MessageBubble } from '../components/ui/MessageBubble'
import { PromptSuggestions } from '../components/ui/PromptSuggestions'
import { Message } from '../types'
import { useNavigate } from 'react-router-dom';


export function ChatPage_() {
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


export function ChatPage() {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    clearChat, 
    selectedModel, 
    stopGenerating 
  } = useChat();

  const navigate = useNavigate();
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isEmpty = !messages || messages.length === 0

  // Safety check for the model name to prevent "split" crashes
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI'


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSuggestionSelect = (prompt: string, path: string) => {
    sendMessage(prompt);
    if (path !== '/chat') {
        navigate(path);
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input.trim())
    setInput('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

   // Handle TS Error for keydown
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="flex flex-col h-full bg-petroleum-950">
      {/* Header with Clear Action */}
      {!isEmpty && (
        <div className="flex justify-end p-2 border-b border-petroleum-800/50">
          <button onClick={clearChat} className="flex items-center gap-1 text-[10px] font-mono text-petroleum-500 hover:text-red-400 transition-colors">
            <Trash2 size={12} /> CLEAR_SESSION
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 pb-8">
            <div className="text-center space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
                <Zap size={10} className="text-amber-400" />
                 Powered by Google ADK + {modelDisplayName}
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                Reservoir Intelligence<br />
                <span className="text-petroleum-400">at your fingertips</span>
              </h1>
              <p className="text-sm text-petroleum-400 leading-relaxed">
                Multi-agent AI workstation for upstream O&G engineers.
                ECLIPSE QC · DCA/EUR · RelPerm · Executive Reports via A2A.
              </p>
            </div>
			<PromptSuggestions onSelect={handleSuggestionSelect} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((msg: Message) => ( 
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {/* Thinking Indicator */}
            {loading && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-petroleum-800 flex items-center justify-center">
                  <Zap size={14} className="text-amber-500" />
                </div>
                <div className="bg-petroleum-900/50 border border-petroleum-800 p-3 rounded-xl">
                   <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-petroleum-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-petroleum-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-petroleum-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-mono">
                {error}
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Section */}
      <div className="flex-shrink-0 p-4 border-t border-petroleum-800 bg-petroleum-900/30 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about simulation QC, DCA, or request a report…"
              rows={1}
              className="w-full resize-none px-4 py-3 rounded-xl text-sm
                bg-petroleum-900 border border-petroleum-700 text-petroleum-100
                placeholder:text-petroleum-600 focus:outline-none
                focus:border-petroleum-500 focus:ring-1 focus:ring-petroleum-500
                font-body leading-relaxed min-h-[48px] max-h-[180px] overflow-y-auto"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 180) + 'px'
              }}
            />
          </div>

          {/* Action Button: Swaps between Send and Stop */}
          {!loading ? (
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                bg-petroleum-600 hover:bg-petroleum-500 disabled:opacity-30
                disabled:cursor-not-allowed transition-all text-white shadow-lg active:scale-95"
            >
              <Send size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={stopGenerating}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                bg-red-600/80 hover:bg-red-600 text-white shadow-lg 
                transition-all active:scale-95 animate-in zoom-in-75"
            >
              <Square size={16} fill="currentColor" />
            </button>
          )}
        </form>
        <p className="text-[10px] text-petroleum-600 text-center mt-2 font-mono uppercase tracking-wider">
          {loading ? "Agent is processing engineering data..." : "Enter to send · Shift+Enter for new line · ZDR Policy Active"}
        </p>
      </div>
    </div>
  )
}