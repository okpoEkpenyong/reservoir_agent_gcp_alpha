import { useState } from 'react'
import { FileText, ChevronRight, FlaskConical,Cpu, BarChart2, GitMerge, Shield, Info, Trash2, ChevronDown, Lock, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'


const MODELS = [
  { id: 'vertex_ai/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'openrouter/anthropic/claude-sonnet-4.5', name: 'Claude 4.5 Sonnet', provider: 'OpenRouter/Anthropic' },
  { id: 'azure/gpt-5-main', name: 'GPT-5-Main', provider: 'AzureOpenAI' },
  { id: 'groq/openai/gpt-oss-120b', name: 'OPENAI/GPT-OSS-120B', provider: 'Groq/OpenAI' },
]


const AGENTS = [
  { id: 'orchestrator', label: 'Orchestrator', sub: 'Routes all requests', path: '/chat', Icon: GitMerge, color: 'text-violet-400' },
  { id: 'sim_qc', label: 'Simulation QC', sub: 'ECLIPSE / OPM decks', path: '/debug', Icon: Cpu, color: 'text-petroleum-400' },
  { id: 'prod', label: 'Asset Intelligence', sub: 'DCA · EUR · Portfolio', path: '/asset', Icon: BarChart2, color: 'text-amber-400' },
  { id: 'relperm', label: 'RelPerm Agent', sub: 'Corey · SWOF · SGOF', path: '/relperm', Icon: FlaskConical, color: 'text-emerald-400' },
  { id: 'audit', label: 'Governance & Audit', sub: 'ZDR Compliance', path: '/audit', Icon: Lock, color: 'text-slate-400' },
  //{ id: 'reporting', label: 'Reporting Agent', sub: 'A2A · Executive summaries', Icon: FileText, color: 'text-emerald-400' },

]



interface SidebarProps {
 // open: boolean
 // onClose: () => void
  onClear: () => void
  selectedModel: string
  onModelChange: (model: string) => void
}


export function Sidebar({ onClear, selectedModel, onModelChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-red-100 to-red-50 border-r border-petroleum-800 flex flex-col">
      
      {/* Logo Section */}
      <div className="p-5 border-b border-petroleum-800 bg-petroleum-950">
        <div className="font-display font-bold text-xl text-white tracking-tight uppercase">Exzing</div>
        <div className="text-[10px] text-petroleum-400 font-mono mt-0.5">Subsurface Intelligence Agent</div>
      </div>
      {/* Dynamic Model Selector */}
      <div className="p-4">
        <div className="p-3 rounded-lg bg-petroleum-900 border border-petroleum-800 shadow-sm">
          <label className="text-[10px] text-petroleum-500 uppercase tracking-widest font-mono block mb-2">
            Compute Engine
          </label>
          <div className="relative">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full bg-petroleum-800 border border-petroleum-700 text-petroleum-100 
                text-xs font-mono rounded-md pl-2 pr-8 py-2 appearance-none outline-none 
                focus:ring-1 focus:ring-petroleum-500 cursor-pointer"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-petroleum-500 pointer-events-none" />
          </div>
          <div className="mt-2 text-[10px] text-petroleum-600 font-mono flex justify-between">
            <span>Provider:</span>
            <span className="text-petroleum-400">
              {MODELS.find(m => m.id === selectedModel)?.provider}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Menu Bars */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="text-[10px] text-petroleum-500 uppercase tracking-widest font-bold font-mono mb-4 px-2">
          Engineering Workspaces
        </div>
        
        <nav className="space-y-2">
          {AGENTS.map(({ id, label, sub, Icon, color, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                className={`w-full text-left group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-petroleum-900 border border-petroleum-700 shadow-lg' 
                    : 'bg-transparent border border-transparent hover:bg-white/50 hover:border-red-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-petroleum-800' : 'bg-red-50'}`}>
                  <Icon size={18} className={isActive ? color : 'text-petroleum-400'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-petroleum-900'}`}>
                    {label}
                  </div>
                  <div className={`text-[10px] font-mono truncate ${isActive ? 'text-petroleum-400' : 'text-petroleum-500'}`}>
                    {sub}
                  </div>
                </div>
                
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Compute Engine & Footer stays similar ... */}
	  
    </aside>
  )
}

