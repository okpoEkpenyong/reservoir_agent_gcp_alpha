import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '../../types'
import { AgentBadge } from './AgentBadge'
import { User, Cpu } from 'lucide-react'

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-petroleum-400 animate-pulse-slow"
          style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${isUser ? 'bg-amber-700' : 'bg-petroleum-700'}`}>
        {isUser ? <User size={14} className="text-amber-100" /> : <Cpu size={14} className="text-petroleum-100" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isUser && message.agentUsed && <AgentBadge agent={message.agentUsed} />}

        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-petroleum-700 text-petroleum-50 rounded-tr-sm'
            : 'bg-petroleum-900 border border-petroleum-700 text-petroleum-100 rounded-tl-sm'
          }`}>
          {message.isStreaming && !message.content
            ? <TypingDots />
            : isUser
              ? <p className="whitespace-pre-wrap">{message.content}</p>
              : <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && <TypingDots />}
                </div>
          }
        </div>

        <span className="text-xs text-petroleum-500 font-mono">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
