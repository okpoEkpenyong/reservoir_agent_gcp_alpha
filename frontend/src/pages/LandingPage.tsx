// src/pages/LandingPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Message } from '../types'
import { useChat } from '../context/ChatContext';
import { MessageBubble } from '../components/ui/MessageBubble';
import { Zap, Cpu, Code, BarChart2, FileText, GitMerge, ArrowRight, Shield } from 'lucide-react'

import { PromptSuggestions } from '../components/ui/PromptSuggestions'


const CARDS = [
  {
    icon: Cpu,
    color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    label: 'Simulation QC',
    sub: 'ECLIPSE · OPM',
    path: '/chat?mode=simulator',
    prompt: 'QC this ECLIPSE deck:\n\nRUNSPEC\nDIMENZ\n10 10 3 /\nGRID\nPORO\n300*0.25 /\nPROPS\nSOLUTION\nSCHEDULE\nEND',
  },
  {
    icon: BarChart2,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    iconColor: 'text-amber-400',
    label: 'Asset Intelligence',
    sub: 'DCA · EUR · Reserves',
    path: '/chat?mode=production',
    prompt: 'Run DCA on WELL-A: [4500,4200,3900,3600,3300,3000,2700,2400] STB/D monthly. Economic limit 50 STB/D.',
  },
  {
    icon: FileText,
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    label: 'Reporting Agent',
    sub: 'A2A · Board summaries',
    path: '/chat?mode=reporting',
    prompt: 'Generate a board-ready executive summary for a 3-well Nigerian asset with total EUR of 2.1 MMSTB.',
  },
  {
    icon: GitMerge,
    color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    iconColor: 'text-violet-400',
    label: 'Orchestrator',
    sub: 'Routes all requests',
    path: '/chat',
    prompt: 'What can you help me with?',
  },
]

export function LandingPage_() {
  const navigate = useNavigate()
  const { sendMessage, selectedModel } = useChat()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const modelName = selectedModel ? selectedModel.split(/[-/(]/)[0].toUpperCase() : 'AI'


  function handleCard(card: typeof CARDS[0]) {
    sendMessage(card.prompt)
    navigate('/chat')
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-petroleum-950">
      {/* 3D canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Radial vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,#040D0F_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 gap-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-petroleum-900/80 border border-cyan-500/20 text-xs text-cyan-300 font-mono
          backdrop-blur-sm">
          <Zap size={10} className="text-amber-400" />
          Google ADK · A2A Protocol · {modelName}
        </div>

        {/* Headline */}
        <div className="text-center space-y-3 max-w-2xl">
          <h1 className="font-display text-5xl font-bold tracking-tight leading-none">
            <span className="text-white">Exzing</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Orchestrator
            </span>
          </h1>
          <p className="text-petroleum-400 text-base leading-relaxed">
            Multi-agent reservoir intelligence for African upstream O&G.
            Physics-grounded · Safety-first · A2A enterprise-ready.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
          {CARDS.map(card => {
            const Icon = card.icon
            return (
              <button key={card.label} onClick={() => handleCard(card)}
                className={`group text-left p-4 rounded-xl border bg-gradient-to-br
                  backdrop-blur-sm transition-all duration-200
                  hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]
                  ${card.color}`}>
                <Icon size={18} className={`mb-2 ${card.iconColor}`} />
                <div className="text-sm font-medium text-white">{card.label}</div>
                <div className="text-xs text-petroleum-400 font-mono mt-0.5">{card.sub}</div>
                <ArrowRight size={12}
                  className="mt-2 text-petroleum-600 group-hover:text-petroleum-300
                    group-hover:translate-x-1 transition-all" />
              </button>
            )
          })}
        </div>

        {/* Safety footer */}
        <div className="flex items-center gap-2 text-xs text-petroleum-600 font-mono">
          <Shield size={11} className="text-emerald-500" />
          before_model_callback · before_tool_callback · ZDR active
        </div>
      </div>
    </div>
  )
}


export function LandingPage() {
  const navigate = useNavigate();
    const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    clearChat, 
    selectedModel, 
    stopGenerating 
  } = useChat();


  // Safety check for the model name to prevent "split" crashes
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI'


  return (
    <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-hidden bg-petroleum-900">
      {/* Background Animation: Animated Topographic Mesh */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_50%)] animate-pulse" />
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 50 Q 25 45 50 50 T 100 50" fill="none" stroke="#6366f1" strokeWidth="0.1" className="animate-dash" />
          <path d="M0 60 Q 25 55 50 60 T 100 60" fill="none" stroke="#6366f1" strokeWidth="0.1" className="animate-dash-slow" />
        </svg>
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-4xl">
        <div className="space-y-4">
		  <h1 className="text-5xl font-display font-bold text-white tracking-tight">
            Exzing <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">Orchestrator</span>
          </h1>
		    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
                <Zap size={10} className="text-amber-400" />
                 Powered by Google ADK + {modelDisplayName}
            </div>
            <h1 className="font-display text-3xl font-bold text-white leading-tight">
               Reservoir Intelligence<br />
            <span className="text-petroleum-400">at your fingertips</span>
            </h1>
          <p className="text-petroleum-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Frontier reservoir intelligence. Specialized agents for 
            simulation QC, production optimization, and petrophysics.
          </p>
        </div>

        {/* Suggestions only trigger navigation now */}
        <PromptSuggestions onSelect={(path) => navigate(path)} />
      </div>
    </div>
  )
}