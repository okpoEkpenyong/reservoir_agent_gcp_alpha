// src/components/layout/AgentChatPanel.tsx
import { useLocation, useNavigate } from 'react-router-dom'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Send, Zap, Trash2, Square, Cpu, Download, CheckCircle2, ChevronDown, ChevronUp, History} from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import { MessageBubble } from '../ui/MessageBubble'
import { PromptSuggestions } from '../ui/PromptSuggestions'
import { Message } from '../../types'

export function AgentChatPanel({ isVisible }: { isVisible?: boolean }) {
  const { messages, sendMessage, loading, selectedModel, clearChat, stopGenerating, error } = useChat();
  const [input, setInput] = useState("");
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);
  const [hitlVerified, setHitlVerified] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = !messages || messages.length === 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  // Porting "Strategy 3": Determine which messages are "History"
  const historyMessages = messages.slice(0, -2);
  const activeMessages = messages.slice(-2);

  const exportFix = () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;

    const blob = new Blob([lastAssistantMsg.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exzing_Fix_${new Date().getTime()}.data`;
    a.click();
  };
  
    // Safety check for the model name to prevent "split" crashes
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI'

  return (
    <div className="flex flex-col h-full bg-petroleum-950 border-l border-petroleum-800">
      {/* Chat Header */}
      <div className="p-4 border-b border-petroleum-800 bg-petroleum-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Consultation Thread</h2>
          <p className="text-[10px] text-petroleum-400 font-mono">Session ID: Active</p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono">
          <ShieldCheck size={12} /> ZDR ACTIVE
        </div>
		{!isEmpty && (
			<div className="flex justify-end p-2 border-b border-petroleum-800/50">
			  <button onClick={clearChat} className="flex items-center gap-1 text-[10px] font-mono text-petroleum-500 hover:text-red-400 transition-colors">
				<Trash2 size={12} /> CLEAR_SESSION
			  </button>
			</div>
         )}
	  
       </div>
      

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Strategy 3: Collapsed History */}
        {historyMessages.length > 0 && (
          <div className="space-y-2">
            <button 
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className="w-full flex items-center gap-2 p-2 rounded bg-petroleum-900 hover:bg-petroleum-800 text-petroleum-500 text-[10px] uppercase font-bold tracking-tighter transition-colors"
            >
              <History size={14} />
              {isHistoryCollapsed ? `Show ${historyMessages.length} Previous Steps` : 'Hide History'}
              {isHistoryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            
            {!isHistoryCollapsed && (
              <div className="space-y-4 opacity-70">
                {historyMessages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Consultation */}
        {activeMessages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        
        <div ref={scrollRef} />
      </div>
	  
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

      {/* Engineering Footer (HITL + Export + Input) */}
      <div className="p-4 bg-petroleum-900 border-t border-petroleum-800 space-y-4">
        
        {/* HITL Verification Bar */}
        <div className="flex items-center justify-between gap-4 p-3 bg-petroleum-950 rounded-xl border border-petroleum-800">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
              hitlVerified ? 'bg-emerald-500 border-emerald-500' : 'bg-petroleum-800 border-petroleum-700 group-hover:border-petroleum-500'
            }`}>
              {hitlVerified && <CheckCircle2 size={14} className="text-white" />}
              <input 
                type="checkbox" 
                className="hidden" 
                checked={hitlVerified}
                onChange={(e) => setHitlVerified(e.target.checked)}
              />
            </div>
            <span className="text-[10px] font-medium text-petroleum-300 uppercase tracking-tight">
              I verify the technical integrity of this remediation
            </span>
          </label>
          
          <button 
            onClick={exportFix}
            disabled={!hitlVerified}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-800 hover:bg-petroleum-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all border border-petroleum-700"
          >
            <Download size={14} /> EXPORT FIX
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask follow-up technical questions..."
            className="w-full p-4 pr-16 bg-petroleum-950 border border-petroleum-800 rounded-xl text-sm text-white focus:ring-1 focus:ring-red-500 outline-none resize-none h-14"
          />
		  {!loading ? (
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="absolute right-2 top-2 p-3 bg-red-600 hover:bg-red-500 disabled:bg-petroleum-800 text-white rounded-lg transition-all"
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
        </div>
      </div>
    </div>
  );
}

