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
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');	
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null) 

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
	
	const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const data = await sendChatMessage(text, selectedModel, controller.signal, sessionId)
      
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
	  if (err.name === 'AbortError') {
        setError(null); // Clean up the UI on manual stop
      } else {	  
        setError(err.message || 'Connection lost.');
      }
    } finally {
      setLoading(false);
	  abortControllerRef.current = null
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };
  
   // function to expose to the UI
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
    }
  }

  return { messages, loading, error, sendMessage, clearChat, selectedModel, setSelectedModel, stopGenerating };
}

