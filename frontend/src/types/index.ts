export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentUsed?: string
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  messages: Message[]
  createdAt: Date
}

export interface AgentInfo {
  product: string
  edition: string
  version: string
  model: string
  agents: string[]
}

export type AgentMode = 'simulator' | 'production' | 'relperm' | 'reporting' | 'general'

export interface SafetyBlock {
  blocked: boolean
  reason?: string
}
