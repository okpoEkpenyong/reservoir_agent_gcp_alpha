import { useEffect, useRef, useState } from 'react'
import { Send, Zap, Trash2, Square } from 'lucide-react'
import { useChat } from '../context/ChatContext'
//import { useChat } from '../hooks/useChat'
import { MessageBubble } from '../components/ui/MessageBubble'
import { PromptSuggestions } from '../components/ui/PromptSuggestions'
import { Message } from '../types'


export function RelPermPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-petroleum-900">RelPerm Generator</h1>
      <p className="text-petroleum-500">Corey Correlation Tables (SWOF/SGOF)</p>
      {/* Add your Corey math logic here later */}
    </div>
  )
}