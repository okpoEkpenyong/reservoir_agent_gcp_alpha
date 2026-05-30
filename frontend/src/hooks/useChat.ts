import { useState, useCallback, useRef } from 'react'
/*import { Message, ChatSession } from '../types'
import { streamMessage } from '../services/api' */

function uid() { return Math.random().toString(36).slice(2) }


import { sendChatMessage } from '../services/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage(text, sessionId);
      
      // Update session ID from the first response
      if (!sessionId) setSessionId(data.session_id);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Connection lost. Check if backend is running on :8001');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  return { messages, loading, error, sendMessage, clearChat };
}


/*
export function useChatStream() {
  const [session, setSession] = useState<ChatSession>({isStreaming
    id: uid(), messages: [], createdAt: new Date(),
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | undefined>(undefined)

  const send = useCallback(async (content: string) => {
    if (!content.trim() || loading) return
    setError(null)

    const userMsg: Message = {
      id: uid(), role: 'user', content, timestamp: new Date(),
    }
    const assistantMsg: Message = {
      id: uid(), role: 'assistant', content: '', timestamp: new Date(), : true,
    }

    setSession(s => ({ ...s, messages: [...s.messages, userMsg, assistantMsg] }))
    setLoading(true)

    try {
      let accumulated = ''
      let agentUsed: string | undefined

      for await (const event of streamMessage(content, sessionIdRef.current)) {
        if (event.type === 'start' && event.session_id) {
          sessionIdRef.current = event.session_id
        }
        if (event.type === 'token' && event.text) {
          accumulated += event.text
          if (event.author) agentUsed = event.author
          setSession(s => ({
            ...s,
            messages: s.messages.map(m =>
              m.id === assistantMsg.id
                ? { ...m, content: accumulated, agentUsed, isStreaming: !event.final }
                : m
            ),
          }))
        }
        if (event.type === 'done') {
          setSession(s => ({
            ...s,
            messages: s.messages.map(m =>
              m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
            ),
          }))
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Unknown error')
      setSession(s => ({
        ...s,
        messages: s.messages.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: '⚠️ Error reaching the agent. Check your backend is running.', isStreaming: false }
            : m
        ),
      }))
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clear = useCallback(() => {
    sessionIdRef.current = undefined
    setSession({ id: uid(), messages: [], createdAt: new Date() })
    setError(null)
  }, [])

  return { session, loading, error, send, clear }
}

*/