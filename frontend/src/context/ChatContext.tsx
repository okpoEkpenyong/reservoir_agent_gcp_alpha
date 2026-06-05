import React, { createContext, useContext, useState, useRef } from 'react';
import { sendChatMessage } from '../services/api';
import { Message } from '../types'

// 1. Define a strict interface for the Context state
interface ChatContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  sendMessage: (text: string) => Promise<void>;
  stopGenerating: () => void;
  clearChat: () => void;
  setSessionId: (id: string | undefined) => void; 
}


const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message locally
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      timestamp: new Date() 
    };
    
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
	
    try {
      const data = await sendChatMessage(text, selectedModel, controller.signal, sessionId);
      
      // Safety check: ensure data and response exist before updating state
      if (data && data.response) {
        if (!sessionId && data.session_id) setSessionId(data.session_id);
        
        const assistantMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: data.response,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("Malformed response from server");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Connection error');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  };

  return (
    <ChatContext.Provider value={{
      messages, loading, error, selectedModel, setSelectedModel, 
      sendMessage, stopGenerating, clearChat, setSessionId 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

// 2. Enhanced hook with error checking
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider. Check your main.tsx/App.tsx wrapper.");
  }
  return context;
};