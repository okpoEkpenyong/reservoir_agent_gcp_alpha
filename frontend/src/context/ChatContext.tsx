import React, { createContext, useContext, useState, useRef } from 'react';
import { sendChatMessage } from '../services/api';
import { Message } from '../types'

export type PageKey = 'asset' | 'debug' | 'relperm' | 'global';

interface ChatContextType {
  // Replace flat messages with a per-page map
  messagesByPage: Record<PageKey, Message[]>;
  loading: boolean;
  error: string | null;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  sendMessage: (text: string, page: PageKey) => Promise<void>;
  stopGenerating: () => void;
  clearChat: (page?: PageKey) => void; // clears one page or all
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messagesByPage, setMessagesByPage] = useState<Record<PageKey, Message[]>>({
    asset: [], debug: [], relperm: [], global: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [sessionIdsByPage, setSessionIdsByPage] = useState<Partial<Record<PageKey, string>>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (text: string, page: PageKey) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessagesByPage(prev => ({
      ...prev,
      [page]: [...prev[page], userMsg],
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await sendChatMessage(
        text, selectedModel, controller.signal, sessionIdsByPage[page]
      );

      if (data && data.response) {
        if (!sessionIdsByPage[page] && data.session_id) {
          setSessionIdsByPage(prev => ({ ...prev, [page]: data.session_id }));
        }

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessagesByPage(prev => ({
          ...prev,
          [page]: [...prev[page], assistantMsg],
        }));
      } else {
        throw new Error('Malformed response from server');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || 'Connection error');
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

  const clearChat = (page?: PageKey) => {
    if (page) {
      setMessagesByPage(prev => ({ ...prev, [page]: [] }));
      setSessionIdsByPage(prev => ({ ...prev, [page]: undefined }));
    } else {
      setMessagesByPage({ asset: [], debug: [], relperm: [], global: [] });
      setSessionIdsByPage({});
    }
    setError(null);
  };

  return (
    <ChatContext.Provider value={{
      messagesByPage, loading, error, selectedModel,
      setSelectedModel, sendMessage, stopGenerating, clearChat,
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